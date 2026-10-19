'use strict';

// This factory is also embedded verbatim in the standalone userscript.
function createCore() {
    const API_PATH = '/xlive/web-room/v2/index/getRoomPlayInfo';
    const DEFAULTS = Object.freeze({ enabled: true, protocol: 'flv', autoRecover: false, preferredHost: 'auto' });

    function preferences(raw) {
        const value = raw && typeof raw === 'object' ? raw : {};
        return {
            enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULTS.enabled,
            protocol: value.protocol === 'native' ? 'native' : 'flv',
            autoRecover: value.autoRecover === true,
            preferredHost: typeof value.preferredHost === 'string' &&
                /^[a-z0-9.-]+$/i.test(value.preferredHost) && value.preferredHost.length <= 253
                ? value.preferredHost.toLowerCase() : 'auto',
        };
    }

    function isPlayInfoUrl(value) {
        try {
            const url = new URL(String(value));
            return url.origin === 'https://api.live.bilibili.com' && !url.username && !url.password && url.pathname === API_PATH;
        } catch (_) { return false; }
    }

    function requestUrl(value, options, pinnedQuality) {
        if (!isPlayInfoUrl(value) || !options.enabled) return value;
        const url = new URL(String(value));
        if (options.protocol === 'flv') {
            for (const key of ['protocol', 'format', 'codec']) {
                const values = new Set((url.searchParams.get(key) || '').split(',').filter(Boolean));
                values.add('0');
                url.searchParams.set(key, [...values].join(','));
            }
        }
        if (Number.isInteger(pinnedQuality) && pinnedQuality > 0) url.searchParams.set('qn', String(pinnedQuality));
        return url.href;
    }

    function codecEntries(streams) {
        if (!Array.isArray(streams)) return [];
        return streams.flatMap(stream => Array.isArray(stream?.format) ? stream.format.flatMap(format =>
            Array.isArray(format?.codec) ? format.codec.map(codec => ({ stream, format, codec })) : []) : []);
    }

    function infoHost(info, codec, nowSeconds = Date.now() / 1000) {
        try {
            if (typeof info?.host !== 'string' || typeof info.extra !== 'string' ||
                typeof codec?.base_url !== 'string' || !codec.base_url.startsWith('/') ||
                codec.base_url.startsWith('//')) return null;
            const host = new URL(info.host);
            if (host.protocol !== 'https:' || host.username || host.password || host.search || host.hash || host.pathname !== '/') return null;
            const url = new URL(info.host + codec.base_url + info.extra);
            if (url.origin !== host.origin) return null;
            const expiry = Number(url.searchParams.get('expires'));
            if (expiry > 0 && expiry <= nowSeconds) return null;
            return host.hostname;
        } catch (_) { return null; }
    }

    function selectPlayInfo(payload, options, nowSeconds = Date.now() / 1000) {
        const playurl = payload?.data?.playurl_info?.playurl;
        const entries = codecEntries(playurl?.stream);
        const result = { payload, changed: false, candidates: [], quality: null, fallbackReason: '' };
        if (!entries.length || (payload.code !== undefined && payload.code !== 0)) return result;
        const qualities = entries.map(({ codec }) => Number(codec?.current_qn));
        if (qualities.some(quality => !Number.isInteger(quality) || quality <= 0)) {
            result.fallbackReason = '画质信息不完整，保留原生方案';
            return result;
        }
        const quality = Math.max(...qualities);
        result.quality = quality || null;
        if (!options.enabled) return result;
        if (entries.some(({ codec }) => codec?.drm)) {
            result.fallbackReason = '受保护直播保持原生播放';
            return result;
        }
        const flv = entries.filter(({ stream, format, codec }) => stream.protocol_name === 'http_stream' &&
            format.format_name === 'flv' && codec?.codec_name === 'avc' &&
            Number(codec.current_qn) === quality && Array.isArray(codec.url_info) &&
            codec.url_info.some(info => infoHost(info, codec, nowSeconds)));
        if (options.protocol === 'flv' && !flv.length) {
            result.fallbackReason = '没有同画质 FLV，保留原生方案';
            return result;
        }
        const allowed = options.protocol === 'flv' ? new Set(flv.map(item => item.codec)) : null;
        const hosts = new Set();
        const streams = playurl.stream.flatMap(stream => {
            if (!Array.isArray(stream?.format)) return allowed ? [] : [stream];
            const formats = stream.format.flatMap(format => {
                if (!Array.isArray(format?.codec)) return allowed ? [] : [format];
                const codecs = format.codec.flatMap(codec => {
                    if (allowed && !allowed.has(codec)) return [];
                    if (Number(codec?.current_qn) !== quality || !Array.isArray(codec?.url_info)) return [codec];
                    const valid = codec.url_info.filter(info => infoHost(info, codec, nowSeconds));
                    for (const info of valid) hosts.add(infoHost(info, codec, nowSeconds));
                    // Native mode leaves invalid/unknown entries intact unless reordering a valid preferred host.
                    const urls = allowed ? valid : codec.url_info.slice();
                    const preferred = urls.findIndex(info => infoHost(info, codec, nowSeconds) === options.preferredHost);
                    if (preferred > 0) urls.unshift(...urls.splice(preferred, 1));
                    return [{ ...codec, url_info: urls }];
                });
                return codecs.length ? [{ ...format, codec: codecs }] : [];
            });
            return formats.length ? [{ ...stream, format: formats }] : [];
        });
        result.candidates = [...hosts];
        if (options.protocol === 'native' && options.preferredHost === 'auto') return result;
        result.changed = true;
        result.payload = { ...payload, data: { ...payload.data, playurl_info: {
            ...payload.data.playurl_info, playurl: { ...playurl, stream: streams },
        } } };
        return result;
    }

    function mediaAddress(value) {
        try {
            const url = new URL(value);
            if (url.protocol !== 'https:') return { host: '', protocol: '未知' };
            return { host: url.hostname, protocol: /\.flv$/i.test(url.pathname) ? 'FLV' :
                /\.m3u8$/i.test(url.pathname) ? 'HLS' : '未知' };
        } catch (_) { return { host: '', protocol: '未知' }; }
    }

    function createRecoveryPolicy() {
        let key;
        let started = 0;
        let last;
        let stallStart = null;
        let counted = false;
        let count = 0;
        let duration = 0;
        let attempts = [];
        let lastRecovery = -Infinity;

        function finish(now) {
            if (counted && stallStart !== null) duration += Math.max(0, now - stallStart);
            stallStart = null;
            counted = false;
        }
        function reset(now = 0, nextKey) {
            finish(last?.now ?? now);
            key = nextKey;
            started = now;
            last = undefined;
        }
        function tick(sample) {
            const now = sample.now;
            if (!Number.isFinite(now)) return { action: null, state: 'unknown' };
            if (key !== sample.key) reset(now, sample.key);
            const previous = last;
            last = sample;
            attempts = attempts.filter(time => now - time < 600000);
            const excluded = !sample.hasVideo || sample.hidden || sample.paused || sample.ended || sample.seeking ||
                !Number.isFinite(sample.currentTime) || !Number.isFinite(sample.playbackRate) ||
                sample.playbackRate <= 0 || sample.live !== true || sample.timeShift ||
                !previous || now - previous.now > 3500 || now - previous.now < 0 || now - started < 15000;
            if (excluded) { finish(previous?.now ?? now); return { action: null, state: 'excluded' }; }
            const advancing = sample.currentTime - previous.currentTime > 0.05;
            const starving = Number.isFinite(sample.buffer) && sample.buffer <= 0.35 && sample.readyState < 3;
            if (advancing || !starving) {
                finish(now);
                return { action: null, state: advancing ? 'playing' : 'not-network-stall' };
            }
            if (stallStart === null) stallStart = previous.now;
            const elapsed = now - stallStart;
            if (elapsed >= 3000 && !counted) { count++; counted = true; }
            const canRecover = sample.enabled && sample.autoRecover && sample.canReconnect &&
                elapsed >= 8000 && now - lastRecovery >= 90000 && attempts.length < 2;
            return { action: canRecover ? 'recover' : null, state: 'starving', elapsed,
                limited: attempts.length >= 2 || now - lastRecovery < 90000 };
        }
        function markRecovery(now) { lastRecovery = now; attempts.push(now); finish(now); started = now; }
        function snapshot(now) {
            return { stallCount: count, stallSeconds: (duration +
                (counted && stallStart !== null ? Math.max(0, (now ?? last?.now ?? stallStart) - stallStart) : 0)) / 1000,
            recoveryCount: attempts.length };
        }
        return { tick, reset, markRecovery, snapshot };
    }

    // Observation is intentionally independent of the conservative recovery policy.
    // It stores only numeric measurements, never media URLs or player objects.
    function createPlaybackMonitor() {
        let last;
        let epoch = 0;
        let pending = null;
        let active = null;
        let queued = [];
        let drops = [];
        let lastDropEvent = -Infinity;
        const counts = { buffering: 0, freeze: 0 };
        const durations = { buffering: 0, freeze: 0 };

        const finite = value => Number.isFinite(value);
        const buffer = sample => finite(sample?.buffer) && sample.buffer >= 0 ? sample.buffer : null;
        const kindFor = sample => buffer(sample) !== null && sample.buffer <= 0.35 &&
            finite(sample.readyState) && sample.readyState < 3 ? 'buffering' : 'freeze';
        const eligible = sample => sample?.hasVideo === true && !sample.hidden && !sample.paused &&
            !sample.ended && !sample.seeking && finite(sample.playbackRate) && sample.playbackRate > 0;
        const counters = sample => finite(sample?.dropped) && finite(sample?.total) &&
            sample.dropped >= 0 && sample.total >= sample.dropped;

        function finish(now, sample, events) {
            if (active) {
                const durationMs = Math.max(0, now - active.start);
                durations[active.kind] += durationMs;
                events.push({ type: active.kind, phase: 'end', at: now, durationMs,
                    bufferSeconds: buffer(sample) });
            }
            active = null;
            pending = null;
        }

        function confirmPending(now, sample, events) {
            if (!pending || now - pending.start < pending.threshold) return;
            const kind = pending.source === 'frame' ? 'freeze' : pending.kind;
            active = { start: pending.start, source: pending.source, kind };
            counts[kind]++;
            events.push({ type: kind, phase: 'start', at: now,
                durationMs: now - active.start, bufferSeconds: pending.bufferSeconds });
            pending = null;
        }

        function clearSegment(now, events) {
            // Do not turn an unobserved gap, a pause or a seek into stall time.
            finish(last?.now ?? now, last, events);
            last = undefined;
            epoch = now;
            drops = [];
        }

        function dropTotals(now) {
            drops = drops.filter(item => item.at > now - 5000 && item.at <= now);
            const value = drops.reduce((sum, item) => ({
                dropped: sum.dropped + item.dropped, total: sum.total + item.total,
            }), { dropped: 0, total: 0 });
            value.percent = value.total > 0 ? value.dropped / value.total * 100 : null;
            return value;
        }

        function observeDrops(sample, previous, events) {
            if (!previous || !counters(previous) || !counters(sample)) { drops = []; return; }
            const dropped = sample.dropped - previous.dropped;
            const total = sample.total - previous.total;
            if (dropped < 0 || total < 0 || dropped > total) { drops = []; return; }
            if (total > 0) drops.push({ at: sample.now, dropped, total });
            const recent = dropTotals(sample.now);
            if (recent.total >= 30 && recent.dropped >= 3 && recent.percent >= 5 &&
                sample.now - lastDropEvent >= 15000) {
                events.push({ type: 'drop', phase: 'sample', at: sample.now,
                    dropped: recent.dropped, total: recent.total, percent: recent.percent });
                lastDropEvent = sample.now;
            }
        }

        function snapshot(now = last?.now ?? 0) {
            const observedNow = last && finite(now) ? Math.min(now, last.now) : last?.now ?? 0;
            const bufferingMs = durations.buffering + (active?.kind === 'buffering'
                ? Math.max(0, observedNow - active.start) : 0);
            const freezeMs = durations.freeze + (active?.kind === 'freeze'
                ? Math.max(0, observedNow - active.start) : 0);
            return {
                stallCount: counts.buffering + counts.freeze,
                stallSeconds: (bufferingMs + freezeMs) / 1000,
                bufferingCount: counts.buffering, bufferingSeconds: bufferingMs / 1000,
                freezeCount: counts.freeze, freezeSeconds: freezeMs / 1000,
                recentDropPercent: dropTotals(finite(now) ? now : observedNow).percent,
            };
        }

        function observe(sample, mediaType) {
            const events = queued;
            queued = [];
            if (!sample || !finite(sample.now)) return { metrics: snapshot(), events };
            const now = sample.now;
            if (!last || last.key !== sample.key || now - last.now > 1500 || now < last.now) {
                clearSegment(now, events);
            }
            if (!eligible(sample)) {
                clearSegment(now, events);
                return { metrics: snapshot(now), events };
            }
            let previous = last;
            if (previous && finite(previous.currentTime) && finite(sample.currentTime) &&
                sample.currentTime < previous.currentTime - 0.05) {
                clearSegment(now, events);
                previous = undefined;
            }
            last = { now, key: sample.key, currentTime: sample.currentTime,
                dropped: sample.dropped, total: sample.total, buffer: buffer(sample) };
            observeDrops(sample, previous, events);
            if (mediaType === 'playing') {
                // The exact end event can confirm a short wait between sampling ticks.
                // Keep its last waiting classification, not the now-replenished buffer.
                if (pending?.source === 'event') confirmPending(now, sample, events);
                finish(now, sample, events);
                return { metrics: snapshot(now), events };
            }

            const clockKnown = previous && finite(previous.currentTime) && finite(sample.currentTime);
            const advancing = clockKnown && sample.currentTime > previous.currentTime + 0.00001;
            const stopped = clockKnown && !advancing;
            const frameStale = advancing && sample.frameMonitorAvailable === true &&
                finite(sample.frameAgeMs) && sample.frameAgeMs >= 1000;

            if (active && !(stopped || frameStale || (!clockKnown && active.source === 'event'))) {
                finish(clockKnown ? now : previous?.now ?? now, sample, events);
            } else if (pending && !(stopped || frameStale || (!clockKnown && pending.source === 'event'))) {
                pending = null;
            }

            if (!active && (mediaType === 'waiting' || mediaType === 'stalled')) {
                pending = { start: pending?.start ?? now, source: 'event', threshold: 250,
                    kind: kindFor(sample), bufferSeconds: buffer(sample) };
            }
            if (!active && !pending && frameStale) {
                pending = { start: Math.max(epoch, now - sample.frameAgeMs), source: 'frame', threshold: 1000,
                    kind: 'freeze', bufferSeconds: buffer(sample) };
            }
            if (!active && !pending && stopped) {
                pending = { start: previous.now, source: 'clock', threshold: 750,
                    kind: kindFor(sample), bufferSeconds: buffer(sample) };
            }
            if (pending) {
                pending.kind = pending.source === 'frame' ? 'freeze' : kindFor(sample);
                pending.bufferSeconds = buffer(sample);
                confirmPending(now, sample, events);
            }
            return { metrics: snapshot(now), events };
        }

        function reset(now = last?.now ?? 0) {
            clearSegment(finite(now) ? now : last?.now ?? 0, queued);
        }
        return { tick: sample => observe(sample), mediaEvent: (type, sample) => observe(sample, type), snapshot, reset };
    }

    // Diagnostics are allowlisted, never a dump of the API or player objects.
    function diagnostic(view) {
        const number = value => Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
        const host = value => typeof value === 'string' && /^[a-z0-9.-]+$/i.test(value) ? value : null;
        const actual = view.actual || {};
        return JSON.stringify({ product: 'Bilibili Live Accelerator', version: String(view.version),
            preferences: preferences({ enabled: view.enabled, protocol: view.protocolPreference,
                autoRecover: view.autoRecover, preferredHost: view.preferredHost }),
            playback: { protocol: ['FLV', 'HLS'].includes(actual.protocol) ? actual.protocol : '未知',
                host: host(actual.host), quality: /^\d+(?:_\d+)?$/.test(String(actual.quality)) ? String(actual.quality) : null,
                resolution: /^\d+x\d+$/.test(actual.resolution || '') ? actual.resolution : null,
                bufferSeconds: number(actual.buffer), droppedFrames: number(actual.dropped), decodedFrames: number(actual.total),
                stallCount: number(actual.stallCount), stallSeconds: number(actual.stallSeconds),
                bufferingCount: number(actual.bufferingCount), bufferingSeconds: number(actual.bufferingSeconds),
                freezeCount: number(actual.freezeCount), freezeSeconds: number(actual.freezeSeconds),
                recentDropPercent: number(actual.recentDropPercent), frameMonitorAvailable: actual.frameMonitorAvailable === true },
            candidateHosts: (view.candidates || []).map(item => host(item.host)).filter(Boolean),
            nativeReconnectAvailable: view.canReconnect === true, conflict: view.conflict === true,
        }, null, 2);
    }
    return { defaults: DEFAULTS, preferences, isPlayInfoUrl, requestUrl, selectPlayInfo,
        mediaAddress, createRecoveryPolicy, createPlaybackMonitor, diagnostic };
}

module.exports = { createCore };
