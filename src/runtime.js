'use strict';

// This function is embedded verbatim in the userscript. Keep every dependency
// inside its arguments or body; do not close over module-scoped helpers.
function startAccelerator(root, createCore, mountPanel, version) {
    const PUBLIC_KEY = '__BILI_LIVE_ACCELERATOR__';
    const OLD_KEY = '__BILI_LIVE_FLV_STATUS__';
    const STORAGE_KEY = 'bilibili-live-accelerator:v1';
    if (!root || !/^\/[1-9]\d*\/?$/.test(root.location?.pathname || '')) return null;
    if (root[PUBLIC_KEY]) return root[PUBLIC_KEY];

    const core = createCore();
    const document = root.document;
    let preferences = core.preferences();
    try { preferences = core.preferences(JSON.parse(root.localStorage.getItem(STORAGE_KEY))); } catch (_) { /* Optional storage. */ }
    let disposed = false;
    let conflict = Boolean(root[OLD_KEY]);
    let panel;
    let notice = '';
    let candidates = [];
    let candidateQuality = null;
    let bootstrap;
    let pin = null;
    let busy = false;
    let autoBlocked = false;
    let lastManual = -Infinity;
    let graceUntil = 0;
    let lastNow = 0;
    let lastView;
    let interval = null;
    let settingsGeneration = 0;
    let postCheck;
    let watchedVideo;
    let frameCallback = null;
    let lastFrameAt = null;
    let frameMonitorAvailable = false;
    let lastPolicyAt = -Infinity;
    let lastDecision = { state: 'unknown' };
    let nextVideoId = 1;
    const videoIds = new WeakMap();
    const events = [];
    const removers = [];
    const videoRemovers = [];
    const hookRestorers = [];
    const timeouts = new Set();
    const policy = core.createRecoveryPolicy();
    // Measuring interruptions must not inherit the much stricter reconnect gate.
    const playbackMonitor = core.createPlaybackMonitor();

    function now() {
        const value = root.performance?.now ? root.performance.now() : Date.now();
        lastNow = Math.max(lastNow, Number.isFinite(value) ? value : lastNow);
        return lastNow;
    }
    function event(message) {
        events.push({ time: Date.now(), message });
        if (events.length > 12) events.shift();
    }
    function playbackEvents(result) {
        const entries = Array.isArray(result?.events) ? result.events : [];
        let changed = false;
        for (const entry of entries) {
            if (!entry || !['buffering', 'freeze', 'drop'].includes(entry.type)) continue;
            const duration = Number.isFinite(entry.durationMs) ? `：持续 ${(entry.durationMs / 1000).toFixed(2)} 秒` : '';
            const buffer = Number.isFinite(entry.bufferSeconds) ? `（缓冲 ${entry.bufferSeconds.toFixed(2)} 秒）` : '';
            if (entry.type === 'drop' && entry.phase === 'sample' && Number.isFinite(entry.percent)) {
                event(`近期掉帧率 ${entry.percent.toFixed(1)}%；掉帧不等同于网络卡顿。`);
            } else if (entry.type !== 'drop' && entry.phase === 'start') {
                event(`检测到${entry.type === 'buffering' ? '缓冲等待' : '画面停滞'}${buffer}。`);
            } else if (entry.type !== 'drop' && entry.phase === 'end') {
                event(`${entry.type === 'buffering' ? '缓冲等待' : '画面停滞'}结束${duration}。`);
            } else continue;
            changed = true;
        }
        return changed;
    }
    function setNotice(message) { notice = message; }
    function save() {
        preferences = core.preferences(preferences);
        try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
        catch (_) { setNotice('浏览器未允许保存设置；本次页面仍然有效。'); }
    }
    function active() {
        if (!conflict && root[OLD_KEY]) {
            conflict = true;
            candidates = [];
            candidateQuality = null;
            event('检测到旧版 FLV 脚本，已停止重复优化。');
        }
        return !disposed && preferences.enabled && !conflict;
    }
    function options() { return { ...preferences, enabled: active() }; }
    function listen(target, type, handler, list = removers) {
        if (!target?.addEventListener) return;
        target.addEventListener(type, handler);
        list.push(() => target.removeEventListener(type, handler));
    }
    function later(handler, delay) {
        const id = root.setTimeout(() => { timeouts.delete(id); if (!disposed) handler(); }, delay);
        timeouts.add(id);
        return id;
    }
    function cancelLater(id) { root.clearTimeout(id); timeouts.delete(id); }
    function numericQuality(value) {
        const number = Number(String(value ?? '').split('_')[0]);
        return Number.isInteger(number) && number > 0 ? number : null;
    }
    function clone(value) {
        try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
    }
    function allCodecs(payload) {
        const streams = payload?.data?.playurl_info?.playurl?.stream;
        if (!Array.isArray(streams)) return [];
        return streams.flatMap(stream => Array.isArray(stream?.format) ? stream.format.flatMap(format =>
            Array.isArray(format?.codec) ? format.codec : []) : []);
    }
    function rememberCandidates(result) {
        candidateQuality = result.quality;
        const wall = Date.now();
        const expiryByHost = new Map();
        for (const codec of allCodecs(result.payload)) {
            if (Number(codec?.current_qn) !== candidateQuality || !Array.isArray(codec.url_info)) continue;
            for (const info of codec.url_info) {
                try {
                    const address = new URL(info.host + codec.base_url + info.extra);
                    const expiry = Number(address.searchParams.get('expires'));
                    const until = expiry > 0 ? expiry * 1000 - 30000 : wall + 60000;
                    expiryByHost.set(address.hostname, Math.max(expiryByHost.get(address.hostname) || 0, until));
                } catch (_) { /* Only the core's validated host allowlist is exposed. */ }
            }
        }
        candidates = result.candidates.map(host => ({ host, until: expiryByHost.get(host) || wall }));
        if (result.fallbackReason) setNotice(result.fallbackReason);
    }
    function select(payload) {
        if (!active()) return { payload, changed: false };
        const result = core.selectPlayInfo(payload, options(), Date.now() / 1000);
        rememberCandidates(result);
        return result;
    }
    function currentCandidates(quality) {
        if (!active() || numericQuality(quality) !== candidateQuality) return [];
        return candidates.filter(candidate => candidate.until > Date.now()).map(candidate => ({ host: candidate.host }));
    }
    function requestUrl(value) {
        if (!active()) return value;
        let quality;
        if (pin && pin.until >= now() && pin.remaining > 0) {
            quality = pin.quality;
            pin.remaining--;
        }
        return core.requestUrl(value, options(), quality);
    }

    // Retain initial data only in this closure. Never cache network responses.
    function processInitial(value) {
        const payload = value?.roomInitRes;
        const published = payload?.data?.playurl_info?.playurl;
        if (!published || !Array.isArray(published.stream) || !active()) return;
        if (!bootstrap || bootstrap.published !== published) {
            const source = clone(payload);
            bootstrap = source ? { source, published, applied: published.stream, captured: Date.now() } : null;
        }
        const result = select(bootstrap?.source || payload);
        if (result.changed) {
            published.stream = result.payload.data.playurl_info.playurl.stream;
            if (bootstrap) bootstrap.applied = published.stream;
        }
    }
    function bootstrapFresh(source, captured) {
        if (Date.now() - captured > 60000) return false;
        let found = false;
        for (const codec of allCodecs(source)) {
            for (const info of Array.isArray(codec?.url_info) ? codec.url_info : []) {
                try {
                    const url = new URL(info.host + codec.base_url + info.extra);
                    if (url.protocol !== 'https:') continue;
                    const expiry = Number(url.searchParams.get('expires'));
                    if (expiry > 0 && expiry * 1000 <= Date.now() + 30000) return false;
                    found = true;
                } catch (_) { return false; }
            }
        }
        return found;
    }
    function updateBootstrap(quality) {
        if (!active() || !quality || !bootstrap || bootstrap.published.stream !== bootstrap.applied ||
            !bootstrapFresh(bootstrap.source, bootstrap.captured)) return;
        const sourceQuality = Math.max(0, ...allCodecs(bootstrap.source).map(codec => Number(codec?.current_qn) || 0));
        if (sourceQuality !== quality) return;
        const result = core.selectPlayInfo(bootstrap.source, options(), Date.now() / 1000);
        const next = result.payload?.data?.playurl_info?.playurl?.stream;
        if (Array.isArray(next)) {
            bootstrap.published.stream = next;
            bootstrap.applied = next;
        }
    }
    function hookInitial() {
        const key = '__NEPTUNE_IS_MY_WAIFU__';
        const before = Object.getOwnPropertyDescriptor(root, key);
        if (before && (('writable' in before && !before.writable) || (before.get && !before.set))) return;
        let stored = before?.get ? before.get.call(root) : root[key];
        processInitial(stored);
        if (before && (!before.configurable || ('writable' in before && !before.writable) ||
            (before.get && !before.set))) return;
        const get = before?.get ? function () { return before.get.call(root); } : function () { return stored; };
        const set = function (value) {
            if (!disposed) { try { processInitial(value); } catch (_) { event('初始播放信息保持原样。'); } }
            if (before?.set) before.set.call(root, value);
            else stored = value;
        };
        Object.defineProperty(root, key, { configurable: true, enumerable: before?.enumerable ?? true, get, set });
        hookRestorers.push(() => {
            const current = Object.getOwnPropertyDescriptor(root, key);
            if (current?.get !== get || current?.set !== set) return;
            if (before?.get || before?.set) Object.defineProperty(root, key, before);
            else Object.defineProperty(root, key, { ...(before || { configurable: true, enumerable: true, writable: true }), value: stored });
        });
    }
    function hookFetch() {
        const original = root.fetch;
        if (typeof original !== 'function') return;
        const wrapped = async function (...args) {
            const input = args[0];
            const value = input && typeof input === 'object' && 'url' in input ? input.url : input;
            const method = String(args[1]?.method || input?.method || 'GET').toUpperCase();
            const eligible = method === 'GET' && core.isPlayInfoUrl(value);
            if (eligible && active()) {
                const rewritten = requestUrl(value);
                if (String(rewritten) !== String(value)) {
                    args[0] = root.Request && input instanceof root.Request ? new root.Request(rewritten, input) : rewritten;
                }
            }
            const response = await original.apply(this, args);
            if (!eligible || !response.ok || !active()) return response;
            try {
                const result = select(await response.clone().json());
                if (!result.changed) return response;
                const headers = new root.Headers(response.headers);
                headers.delete('content-length');
                headers.delete('content-encoding');
                const replacement = new root.Response(JSON.stringify(result.payload), {
                    status: response.status, statusText: response.statusText, headers,
                });
                for (const key of ['url', 'type', 'redirected']) Object.defineProperty(replacement, key, { value: response[key] });
                return replacement;
            } catch (_) {
                event('播放接口响应保持原样。');
                return response;
            }
        };
        root.fetch = wrapped;
        hookRestorers.push(() => { if (root.fetch === wrapped) root.fetch = original; });
    }
    function hookXhr() {
        const prototype = root.XMLHttpRequest?.prototype;
        if (!prototype || typeof prototype.open !== 'function') return;
        const requests = new WeakMap();
        const beforeOpen = prototype.open;
        const wrappedOpen = function (...args) {
            const eligible = String(args[0]).toUpperCase() === 'GET' && core.isPlayInfoUrl(args[1]);
            requests.set(this, eligible);
            if (eligible && active()) args[1] = requestUrl(args[1]);
            return beforeOpen.apply(this, args);
        };
        prototype.open = wrappedOpen;
        hookRestorers.push(() => { if (prototype.open === wrappedOpen) prototype.open = beforeOpen; });
        function eligible(xhr) {
            return requests.get(xhr) && xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300 &&
                core.isPlayInfoUrl(xhr.responseURL) && active();
        }
        for (const key of ['responseText', 'response']) {
            const before = Object.getOwnPropertyDescriptor(prototype, key);
            if (!before?.get || !before.configurable) continue;
            const get = function () {
                const value = before.get.call(this);
                if (!eligible(this)) return value;
                try {
                    if (key === 'response' && this.responseType === 'json' && value && typeof value === 'object') {
                        return select(value).payload;
                    }
                    if (typeof value !== 'string' || (key === 'response' && this.responseType && this.responseType !== 'text')) return value;
                    const result = select(JSON.parse(value));
                    return result.changed ? JSON.stringify(result.payload) : value;
                } catch (_) { return value; }
            };
            Object.defineProperty(prototype, key, { ...before, get });
            hookRestorers.push(() => {
                if (Object.getOwnPropertyDescriptor(prototype, key)?.get === get) Object.defineProperty(prototype, key, before);
            });
        }
    }

    function nativePlayer() {
        const known = [root.EmbedPlayer?.instance, root.livePlayer];
        return known.find(player => player && typeof player.getPlayerInfo === 'function' && typeof player.reload === 'function') || null;
    }
    function videoLike(value) {
        return value && typeof value === 'object' && typeof value.currentTime === 'number' && typeof value.paused === 'boolean';
    }
    function stopFrameMonitor() {
        if (frameCallback !== null) {
            try { watchedVideo?.cancelVideoFrameCallback?.(frameCallback); } catch (_) { /* Video was replaced. */ }
        }
        frameCallback = null;
        lastFrameAt = null;
        frameMonitorAvailable = false;
    }
    function startFrameMonitor(video) {
        if (typeof video?.requestVideoFrameCallback !== 'function') return;
        frameMonitorAvailable = true;
        const next = () => {
            if (disposed || watchedVideo !== video) return;
            try {
                frameCallback = video.requestVideoFrameCallback(() => {
                    frameCallback = null;
                    if (disposed || watchedVideo !== video) return;
                    lastFrameAt = now();
                    next();
                });
            } catch (_) {
                frameCallback = null;
                lastFrameAt = null;
                frameMonitorAvailable = false;
            }
        };
        next();
    }
    function mediaEvent(video, type) {
        if (disposed || watchedVideo !== video) return;
        if (['pause', 'ended', 'seeking'].includes(type)) stopFrameMonitor();
        if (['playing', 'seeked'].includes(type) && !frameMonitorAvailable &&
            !video.paused && !video.ended && document.visibilityState !== 'hidden') startFrameMonitor(video);
        const observation = observe();
        if (observation.video !== video) return;
        const changed = playbackEvents(playbackMonitor.mediaEvent(type, observation.sample));
        if (changed) render(observation, lastDecision);
    }
    function watch(video) {
        if (watchedVideo === video) return;
        for (const remove of videoRemovers.splice(0)) remove();
        stopFrameMonitor();
        watchedVideo = video;
        graceUntil = now() + 15000;
        policy.reset(now());
        playbackMonitor.reset(now());
        if (!video) return;
        if (!videoIds.has(video)) videoIds.set(video, nextVideoId++);
        const grace = type => {
            graceUntil = now() + 15000;
            policy.reset(now());
            if (type === 'loadedmetadata') {
                playbackMonitor.reset(now());
                // A source change can reuse the media element, but not its old
                // presented-frame timestamp or pending callback.
                stopFrameMonitor();
                startFrameMonitor(video);
            }
            mediaEvent(video, type);
        };
        for (const type of ['seeking', 'seeked', 'loadedmetadata']) {
            listen(video, type, () => grace(type), videoRemovers);
        }
        for (const type of ['waiting', 'stalled', 'playing', 'pause', 'ended']) {
            listen(video, type, () => mediaEvent(video, type), videoRemovers);
        }
        startFrameMonitor(video);
    }
    function bufferRemaining(video, player) {
        try {
            const ranges = video?.buffered;
            const time = video?.currentTime;
            if (ranges && Number.isFinite(time)) {
                for (let index = 0; index < ranges.length; index++) {
                    if (ranges.start(index) <= time + 0.05 && ranges.end(index) >= time) return Math.max(0, ranges.end(index) - time);
                }
                return 0;
            }
        } catch (_) { /* Some media elements throw during replacement. */ }
        try {
            const value = player?.remainBufferLength?.();
            return Number.isFinite(value) && value >= 0 ? value : null;
        } catch (_) { return null; }
    }
    function observe() {
        const player = nativePlayer();
        let info = null;
        let video = null;
        try { info = player?.getPlayerInfo(); } catch (_) { /* Not ready. */ }
        try {
            const value = typeof player?.getVideoEl === 'function' ? player.getVideoEl() : player?.getVideoEl;
            if (videoLike(value)) video = value;
        } catch (_) { /* Not ready. */ }
        const nativeVideo = Boolean(video);
        if (!video) {
            try {
                const nodes = document.querySelectorAll('video');
                if (nodes.length === 1 && videoLike(nodes[0])) video = nodes[0];
            } catch (_) { /* No DOM yet. */ }
        }
        watch(video);
        let address = core.mediaAddress(info?.playurl);
        if (!address.host && video) address = core.mediaAddress(video.currentSrc || video.src);
        const quality = info?.quality == null ? null : String(info.quality);
        let dropped = null;
        let total = null;
        try {
            const metrics = video?.getVideoPlaybackQuality?.();
            if (Number.isFinite(metrics?.droppedVideoFrames)) dropped = metrics.droppedVideoFrames;
            if (Number.isFinite(metrics?.totalVideoFrames)) total = metrics.totalVideoFrames;
        } catch (_) { /* Metrics are optional. */ }
        const width = Number(video?.videoWidth);
        const height = Number(video?.videoHeight);
        let qualityLabel = quality ? `画质 ${quality}` : '画质未知';
        const description = Array.isArray(info?.qualityCandidates) ? info.qualityCandidates.find(item =>
            numericQuality(item?.qn ?? item?.code) === numericQuality(quality))?.desc : null;
        if (typeof description === 'string' && description.length <= 100) qualityLabel = description;
        const timestamp = now();
        const sample = {
            now: timestamp,
            key: `${video ? videoIds.get(video) : 0}|${quality || ''}|${address.host}`,
            hasVideo: Boolean(video), hidden: document.visibilityState === 'hidden',
            paused: !video || video.paused, ended: Boolean(video?.ended),
            seeking: Boolean(video?.seeking), mediaSeeking: Boolean(video?.seeking),
            playbackRate: Number(video?.playbackRate) || 0,
            live: info?.liveStatus === 1, timeShift: Number(info?.timeShift) || 0,
            currentTime: Number(video?.currentTime),
            buffer: bufferRemaining(video, player), readyState: Number(video?.readyState) || 0,
            dropped, total, frameMonitorAvailable,
            frameAgeMs: frameMonitorAvailable && lastFrameAt !== null ? Math.max(0, timestamp - lastFrameAt) : null,
            enabled: active(), autoRecover: preferences.autoRecover && !autoBlocked,
            canReconnect: Boolean(player && nativeVideo && !busy),
        };
        return { player, video, info, sample, actual: {
            ...address, quality, qualityLabel,
            resolution: width > 0 && height > 0 ? `${width}x${height}` : null,
            fps: null, buffer: sample.buffer, dropped, total,
        } };
    }
    function operable(observation) {
        const sample = observation.sample;
        return sample.canReconnect && sample.live && !sample.paused && !sample.ended && !sample.hidden &&
            !observation.video?.seeking && !sample.timeShift;
    }
    function statusText(observation, decision) {
        const sample = observation.sample;
        if (busy) return '正在重新连接；不会同时发起第二次重连。';
        if (!sample.hasVideo) return '等待直播视频。';
        if (sample.hidden) return '后台页面：暂停卡顿判断与自动恢复。';
        if (sample.paused) return '已暂停：不会自动重新连接。';
        if (!sample.live) return '未确认正在直播：仅监测，不自动恢复。';
        if (sample.timeShift) return '时移播放：不会自动重新连接。';
        if (sample.seeking) return '正在定位播放位置：不计入卡顿，也不会自动恢复。';
        if (sample.now < graceUntil) return '播放切换观察期：继续记录卡顿，暂不自动恢复。';
        if (decision.state === 'starving') return '缓冲不足，正在观察网络卡顿。';
        if (decision.state === 'playing') return '播放时间正在推进；短顿与掉帧单独记录。';
        return '正在观察播放状态。';
    }
    function verify(observation) {
        if (!postCheck || now() < postCheck.due) return;
        const actual = observation.actual;
        if (!actual.host && now() < postCheck.expires) return;
        if (!actual.host) {
            setNotice('暂时无法确认重连结果；已停止本页自动恢复。');
            autoBlocked = true;
        } else if (postCheck.quality && numericQuality(actual.quality) !== postCheck.quality) {
            setNotice('重连后画质发生变化，请手动确认原画；已停止本页自动恢复。');
            autoBlocked = true;
            event('重连后的实际画质需要人工确认。');
        } else if (postCheck.host !== 'auto' && actual.host !== postCheck.host) {
            setNotice('播放器未采用所选线路，可能使用了原生回退；不会循环重连。');
            autoBlocked = true;
            event('实际线路与偏好不同，保持当前播放。');
        } else {
            setNotice('已重新连接；请以实际播放状态为准。');
            event('已核对重连后的实际播放状态。');
        }
        postCheck = null;
    }
    function render(observation, decision) {
        if (disposed) return;
        const recoveryMetrics = policy.snapshot(observation.sample.now);
        const metrics = playbackMonitor.snapshot(observation.sample.now);
        lastView = {
            version, enabled: preferences.enabled, protocolPreference: preferences.protocol,
            autoRecover: preferences.autoRecover, preferredHost: preferences.preferredHost,
            actual: { ...observation.actual, frameMonitorAvailable: observation.sample.frameMonitorAvailable,
                networkStallCount: recoveryMetrics.stallCount,
                recoveryCount: recoveryMetrics.recoveryCount, ...metrics },
            candidates: currentCandidates(observation.actual.quality),
            canReconnect: operable(observation) && !busy && now() - lastManual >= 15000,
            conflict, notice,
            statusText: statusText(observation, decision), events: events.slice(),
        };
        panel?.render(lastView);
    }
    function sample() {
        if (disposed) return;
        const observation = observe();
        const recorded = playbackEvents(playbackMonitor.tick(observation.sample));
        const policyDue = observation.sample.now - lastPolicyAt >= 1000;
        if (policyDue) {
            lastPolicyAt = observation.sample.now;
            lastDecision = policy.tick({ ...observation.sample,
                seeking: observation.sample.seeking || observation.sample.now < graceUntil });
            verify(observation);
        }
        if (policyDue || recorded) render(observation, lastDecision);
        if (policyDue && lastDecision.action === 'recover' && !busy) void reconnect(true);
    }
    function updateView() {
        if (disposed) return;
        const observation = observe();
        render(observation, { state: 'unknown' });
    }
    async function reconnect(automatic = false) {
        if (disposed || busy) { if (!disposed) setNotice('正在重连，请等待当前操作结束。'); return false; }
        const observation = observe();
        if (!operable(observation)) {
            setNotice('请在前台正常播放直播后重试；暂停、时移和未知播放器不自动重连。');
            updateView();
            return false;
        }
        if (!automatic && now() - lastManual < 15000) {
            setNotice('手动重连间隔至少 15 秒；偏好已保存，可稍后点击重新连接。');
            updateView();
            return false;
        }
        if (automatic) {
            if (!active() || !preferences.autoRecover || autoBlocked) return false;
            if (!observation.actual.host) {
                autoBlocked = true;
                setNotice('无法确认当前播放线路，已停止本页自动恢复；不会盲目重试。');
                updateView();
                return false;
            }
            const offered = currentCandidates(observation.actual.quality);
            const next = offered.find(candidate => candidate.host !== observation.actual.host);
            if (!next) {
                autoBlocked = true;
                setNotice('当前没有同画质有效备线，已停止本页自动恢复；请手动刷新检查。');
                event('没有有效备线，未发起自动重连。');
                updateView();
                return false;
            }
            preferences.preferredHost = next.host;
            settingsGeneration++;
            save();
            policy.markRecovery(now());
            event('持续网络卡顿，尝试当前画质的官方备线。');
        } else {
            lastManual = now();
            event('用户请求重新连接，保持当前画质。');
        }
        busy = true;
        const quality = numericQuality(observation.actual.quality);
        pin = quality && active() ? { quality, until: now() + 15000, remaining: 1 } : null;
        updateBootstrap(quality);
        const expectedHost = preferences.preferredHost;
        const operationGeneration = settingsGeneration;
        const timeout = later(() => {
            setNotice('重连耗时较长；等待原操作结束，不会叠加重连。');
            if (automatic) autoBlocked = true;
            updateView();
        }, 15000);
        updateView();
        try {
            await observation.player.reload.call(observation.player);
            if (disposed) return false;
            if (operationGeneration !== settingsGeneration) {
                postCheck = null;
                setNotice('设置已变更；当前重连已结束，刷新页面可确保新设置生效。');
                return true;
            }
            postCheck = { quality, host: expectedHost, due: now() + 6000, expires: now() + 20000 };
            setNotice('已重新获取播放地址，正在核对实际线路与画质。');
            return true;
        } catch (_) {
            if (!disposed) {
                autoBlocked = true;
                setNotice('原生播放器重连失败；已停止本页自动恢复，请手动刷新检查。');
                event('原生播放器重连失败。');
            }
            return false;
        } finally {
            cancelLater(timeout);
            pin = null;
            busy = false;
            graceUntil = now() + 15000;
            policy.reset(now());
            updateView();
        }
    }

    const actions = {
        setEnabled(value) {
            preferences.enabled = value === true;
            settingsGeneration++;
            save();
            candidates = [];
            candidateQuality = null;
            setNotice(preferences.enabled ? '优化已启用；点击重新连接或刷新后应用。' : '已停止修改新的播放请求；刷新页面可完全恢复 B 站原生播放。');
            event(preferences.enabled ? '已启用直播优化。' : '已关闭直播优化。');
            updateView();
        },
        setProtocol(value) {
            if (value !== 'flv' && value !== 'native') return false;
            if (busy) { setNotice('正在重连，请等待当前操作结束后再更改协议。'); updateView(); return false; }
            preferences.protocol = value;
            settingsGeneration++;
            candidates = [];
            candidateQuality = null;
            save();
            event(value === 'flv' ? '已选择同画质 FLV 优先。' : '已选择跟随 B 站原生协议。');
            if (!active()) { setNotice('偏好已保存；优化关闭或存在脚本冲突，当前播放未改动。'); updateView(); return false; }
            return reconnect(false);
        },
        setAutoRecover(value) {
            preferences.autoRecover = value === true;
            autoBlocked = false;
            graceUntil = now() + 15000;
            policy.reset(now());
            save();
            event(preferences.autoRecover ? '已启用保守自动恢复。' : '已关闭自动恢复。');
            setNotice(preferences.autoRecover ? '仅持续网络卡顿且有同画质备线时恢复；90 秒冷却，10 分钟最多 2 次。' : '自动恢复已关闭。');
            updateView();
        },
        selectHost(host) {
            if (busy) { setNotice('正在重连，请等待当前操作结束后再更改线路。'); updateView(); return false; }
            const observation = observe();
            if (host !== 'auto' && !currentCandidates(observation.actual.quality).some(candidate => candidate.host === host)) {
                setNotice('该线路已过期或不是当前画质候选；请重新获取播放信息。');
                updateView();
                return false;
            }
            preferences.preferredHost = host;
            settingsGeneration++;
            save();
            event(host === 'auto' ? '已恢复 B 站默认线路顺序。' : '已选择当前画质的官方候选线路。');
            if (!active()) { setNotice('偏好已保存；当前播放未改动。'); updateView(); return false; }
            return reconnect(false);
        },
        reconnect: () => reconnect(false),
        restoreDefaults() {
            preferences = core.preferences({ enabled: false, protocol: 'native', autoRecover: false, preferredHost: 'auto' });
            settingsGeneration++;
            autoBlocked = false;
            candidates = [];
            candidateQuality = null;
            save();
            event('已恢复 B 站原生设置。');
            setNotice('已关闭优化并恢复原生偏好；刷新页面可完全恢复原生播放。');
            updateView();
            return true;
        },
        getDiagnostic() {
            if (!lastView) updateView();
            return core.diagnostic(lastView || { version });
        },
    };
    const api = {
        version: String(version),
        getDiagnostic: actions.getDiagnostic,
        dispose() {
            if (disposed) return;
            disposed = true;
            root.clearInterval(interval);
            stopFrameMonitor();
            for (const id of timeouts) root.clearTimeout(id);
            timeouts.clear();
            for (const remove of videoRemovers.splice(0)) remove();
            for (const remove of removers.splice(0)) remove();
            for (const restore of hookRestorers.reverse()) {
                try { restore(); } catch (_) { /* Another script may now own this hook. */ }
            }
            bootstrap = null;
            candidates = [];
            pin = null;
            panel?.destroy();
            if (root[PUBLIC_KEY] === api) delete root[PUBLIC_KEY];
        },
    };
    root[PUBLIC_KEY] = api;
    if (conflict) event('检测到旧版 FLV 脚本，已停止重复优化。');
    for (const install of [hookInitial, hookFetch, hookXhr]) {
        try { install(); } catch (_) { event('部分播放接口无法接入，保持原生方案。'); }
    }
    listen(document, 'visibilitychange', () => {
        graceUntil = now() + 15000;
        policy.reset(now());
        // End any foreground segment before the browser throttles its timers;
        // cumulative counters are intentionally retained.
        playbackEvents(playbackMonitor.tick(observe().sample));
        playbackMonitor.reset(now());
        stopFrameMonitor();
        if (document.visibilityState !== 'hidden' && watchedVideo && !watchedVideo.paused && !watchedVideo.ended) {
            startFrameMonitor(watchedVideo);
        }
        updateView();
    });
    listen(root, 'pagehide', () => api.dispose());
    try { panel = mountPanel(root, actions); } catch (_) { event('状态面板暂时无法显示。'); }
    interval = root.setInterval(sample, 250);
    event('本地直播优化已就绪；自动恢复默认关闭。');
    sample();
    return api;
}

module.exports = { startAccelerator };
