'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createCore } = require('../src/core');
const { startAccelerator } = require('../src/runtime');

const API = 'https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=123&qn=10000&protocol=1&format=2&codec=1';
const MEDIA = 'https://a.bilivideo.com/live-bvc/stream.flv?sign=PRIVATE_SIGNATURE&expires=4102444800';
function payload() {
    const codec = name => ({ codec_name: 'avc', current_qn: 10000, accept_qn: [400, 10000], base_url: `/live-bvc/stream.${name}`,
        url_info: ['a.bilivideo.com', 'b.bilivideo.com'].map(host => ({ host: `https://${host}`, extra: '?sign=PRIVATE_SIGNATURE&expires=4102444800' })) });
    return { code: 0, data: { playurl_info: { playurl: { stream: [
        { protocol_name: 'http_hls', format: [{ format_name: 'fmp4', codec: [codec('m3u8')] }] },
        { protocol_name: 'http_stream', format: [{ format_name: 'flv', codec: [codec('flv')] }] },
    ] } } } };
}
function emitter(target = {}) {
    const handlers = new Map();
    target.addEventListener = (type, handler) => {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type).add(handler);
    };
    target.removeEventListener = (type, handler) => handlers.get(type)?.delete(handler);
    target.dispatch = type => { for (const handler of handlers.get(type) || []) handler({ type }); };
    target.listenerCount = () => [...handlers.values()].reduce((sum, list) => sum + list.size, 0);
    return target;
}
function fixture({ path = '/123', prefs, legacy = false, native = true, frames = false } = {}) {
    let clock = 0;
    let nextId = 1;
    const intervals = new Map();
    const timers = new Map();
    const frameCallbacks = new Map();
    let cancelledFrames = 0;
    const storage = new Map(prefs ? [['bilibili-live-accelerator:v1', JSON.stringify(prefs)]] : []);
    const video = emitter({ currentTime: 15, paused: false, ended: false, seeking: false, readyState: 4,
        playbackRate: 1, videoWidth: 1920, videoHeight: 1080, src: '', currentSrc: '', buffer: 3,
        dropped: 8, total: 8000,
        buffered: { length: 1, start: () => video.currentTime - 1, end: () => video.currentTime + video.buffer },
        getVideoPlaybackQuality: () => ({ droppedVideoFrames: video.dropped, totalVideoFrames: video.total }) });
    if (frames) {
        video.requestVideoFrameCallback = handler => { const id = nextId++; frameCallbacks.set(id, handler); return id; };
        video.cancelVideoFrameCallback = id => { if (frameCallbacks.delete(id)) cancelledFrames++; };
    }
    let activeVideo = video;
    const document = emitter({ visibilityState: 'visible', querySelectorAll: () => activeVideo ? [activeVideo] : [] });
    const requests = [];
    const root = emitter({ location: { pathname: path }, document,
        performance: { now: () => clock }, Request, Response, Headers,
        localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
        setInterval: (handler, delay) => { const id = nextId++; intervals.set(id, { handler, delay, due: clock + delay }); return id; },
        clearInterval: id => intervals.delete(id),
        setTimeout: (handler, delay) => { const id = nextId++; timers.set(id, { handler, due: clock + delay }); return id; },
        clearTimeout: id => timers.delete(id),
    });
    let responseFactory = () => new Response(JSON.stringify(payload()), { headers: { 'content-length': '900', 'content-encoding': 'gzip', 'x-kept': 'yes' } });
    const originalFetch = async (...args) => {
        requests.push(args);
        const response = responseFactory();
        Object.defineProperty(response, 'url', { value: API });
        return response;
    };
    root.fetch = originalFetch;
    class Xhr {
        open(...args) { this.openArgs = args; this.responseURL = String(args[1]); }
    }
    Object.defineProperty(Xhr.prototype, 'responseText', { configurable: true, enumerable: true, get() {
        if (this.responseType === 'json') throw new Error('InvalidStateError');
        return this.body;
    } });
    Object.defineProperty(Xhr.prototype, 'response', { configurable: true, enumerable: true, get() { return this.responseType === 'json' ? this.json : this.body; } });
    root.XMLHttpRequest = Xhr;
    const playerInfo = { liveStatus: 1, quality: '10000', playurl: MEDIA, timeShift: 0,
        qualityCandidates: [{ qn: '10000', desc: '1080P 原画' }], playingStatus: true };
    let reloads = 0;
    let reload = () => Promise.resolve();
    const player = { getPlayerInfo: () => ({ ...playerInfo }), getVideoEl: () => activeVideo,
        reload() { reloads++; return reload(); }, remainBufferLength: () => 9 };
    if (native) root.EmbedPlayer = { instance: player };
    if (legacy) root.__BILI_LIVE_FLV_STATUS__ = { version: 'old' };
    let actions;
    let view;
    let renders = 0;
    let destroyed = false;
    const mount = (_root, value) => {
        actions = value;
        return { render: value => { view = value; renders++; }, destroy: () => { destroyed = true; } };
    };
    function advance(ms, progress = false) {
        const end = clock + ms;
        while (clock < end) {
            const due = Math.min(end, ...[...timers.values()].map(timer => timer.due),
                ...[...intervals.values()].map(timer => timer.due));
            const delta = Math.max(0, due - clock);
            clock += delta;
            if (progress) video.currentTime += delta / 1000;
            for (const [id, timer] of [...timers]) {
                if (timer.due <= clock) { timers.delete(id); timer.handler(); }
            }
            for (const timer of intervals.values()) {
                if (timer.due <= clock) { timer.due += timer.delay; timer.handler(); }
            }
        }
    }
    return { root, player, playerInfo, video, document, requests, storage, originalFetch, Xhr,
        start: () => startAccelerator(root, createCore, mount, '0.1.0'), advance,
        get actions() { return actions; }, get view() { return view; }, get reloads() { return reloads; },
        get destroyed() { return destroyed; }, get timers() { return timers; }, get intervals() { return intervals; },
        get renders() { return renders; }, get frameCallbacks() { return frameCallbacks; },
        get cancelledFrames() { return cancelledFrames; },
        presentFrame() {
            for (const [id, handler] of [...frameCallbacks]) { frameCallbacks.delete(id); handler(clock, {}); }
        },
        setVideo: value => { activeVideo = value; },
        setReload: value => { reload = value; }, setResponse: value => { responseFactory = value; } };
}

test('room guard, idempotence, known public surface and safe diagnostics', () => {
    const home = fixture({ path: '/' });
    assert.equal(home.start(), null);
    assert.equal(home.root.fetch, home.originalFetch);
    const room = fixture();
    const api = room.start();
    assert.equal(room.start(), api);
    assert.deepEqual(Object.keys(api).sort(), ['dispose', 'getDiagnostic', 'version']);
    const report = api.getDiagnostic();
    assert.equal(report.includes('PRIVATE_SIGNATURE'), false);
    assert.equal(report.includes('room_id'), false);
    assert.equal(report.includes('stream.flv'), false);
    assert.equal(JSON.parse(report).playback.host, 'a.bilivideo.com');
    assert.equal(room.view.actual.resolution, '1920x1080');
    assert.equal(room.view.actual.fps, null);
    assert.equal(room.view.actual.buffer, 3);
    assert.equal(room.view.autoRecover, false);
    api.dispose();
    assert.equal(room.root.fetch, room.originalFetch);
    assert.equal(room.intervals.size, 0);
    assert.equal(room.document.listenerCount(), 0);
    assert.equal(room.video.listenerCount(), 0);
    assert.equal(room.destroyed, true);
});

test('fetch selects same quality FLV, keeps signatures, request credentials and response metadata', async () => {
    const room = fixture();
    room.start();
    const request = new Request(API, { credentials: 'include', headers: { 'x-request': 'kept' } });
    const response = await room.root.fetch(request);
    const sent = room.requests[0][0];
    assert.equal(sent instanceof Request, true);
    assert.equal(sent.credentials, 'include');
    assert.equal(sent.headers.get('x-request'), 'kept');
    assert.equal(new URL(sent.url).searchParams.get('qn'), '10000');
    assert.equal(new URL(sent.url).searchParams.get('protocol'), '1,0');
    const body = await response.json();
    assert.equal(body.data.playurl_info.playurl.stream.length, 1);
    const codec = body.data.playurl_info.playurl.stream[0].format[0].codec[0];
    assert.equal(codec.current_qn, 10000);
    assert.equal(codec.url_info[0].extra, '?sign=PRIVATE_SIGNATURE&expires=4102444800');
    assert.equal(response.url, API);
    assert.equal(response.headers.get('content-length'), null);
    assert.equal(response.headers.get('content-encoding'), null);
    assert.equal(response.headers.get('x-kept'), 'yes');
    room.advance(1000);
    assert.deepEqual(room.view.candidates, [{ host: 'a.bilivideo.com' }, { host: 'b.bilivideo.com' }]);
    room.playerInfo.quality = '400';
    room.advance(1000);
    assert.deepEqual(room.view.candidates, []);
});

test('unrelated HTTP/POST requests, HTTP failures and network errors are untouched', async () => {
    const room = fixture();
    room.start();
    for (const [url, init] of [[API.replace('https:', 'http:'), undefined], [API.replace('api.live.bilibili.com', 'example.com'), undefined], [API, { method: 'POST' }]]) {
        const response = await room.root.fetch(url, init);
        assert.equal(room.requests.at(-1)[0], url);
        assert.equal((await response.json()).data.playurl_info.playurl.stream.length, 2);
    }
    room.setResponse(() => new Response('Forbidden', { status: 403 }));
    const response = await room.root.fetch(API);
    assert.equal(response.status, 403);
    assert.equal(await response.text(), 'Forbidden');
    room.setResponse(() => { throw new Error('network failed'); });
    await assert.rejects(room.root.fetch(API), /network failed/);
});

test('disabled, native automatic order, legacy conflict and read-only bootstrap stay pass-through', async () => {
    for (const settings of [{ prefs: { enabled: false } }, { prefs: { enabled: true, protocol: 'native', preferredHost: 'auto' } }, { legacy: true }]) {
        const room = fixture(settings);
        room.start();
        const response = await room.root.fetch(API);
        assert.equal(room.requests[0][0], API);
        assert.equal((await response.json()).data.playurl_info.playurl.stream.length, 2);
        if (settings.legacy) {
            assert.equal(room.view.conflict, true);
            room.root.__BILI_LIVE_ACCELERATOR__.dispose();
            assert.deepEqual(room.root.__BILI_LIVE_FLV_STATUS__, { version: 'old' });
        }
    }
    const room = fixture();
    const initial = { roomInitRes: payload() };
    Object.defineProperty(room.root, '__NEPTUNE_IS_MY_WAIFU__', { configurable: true, writable: false, value: initial });
    room.start();
    assert.equal(initial.roomInitRes.data.playurl_info.playurl.stream.length, 2);
    assert.equal(Object.getOwnPropertyDescriptor(room.root, '__NEPTUNE_IS_MY_WAIFU__').writable, false);
});

test('bootstrap hook chains accessors, does not expose originals, and restores the descriptor', () => {
    const room = fixture();
    let stored;
    let writes = 0;
    const get = () => stored;
    const set = value => { stored = value; writes++; };
    Object.defineProperty(room.root, '__NEPTUNE_IS_MY_WAIFU__', { configurable: true, enumerable: true, get, set });
    const api = room.start();
    const initial = { roomInitRes: payload() };
    room.root.__NEPTUNE_IS_MY_WAIFU__ = initial;
    assert.equal(writes, 1);
    assert.equal(stored, initial);
    assert.equal(initial.roomInitRes.data.playurl_info.playurl.stream[0].protocol_name, 'http_stream');
    assert.equal(api.getDiagnostic().includes('PRIVATE_SIGNATURE'), false);
    api.dispose();
    const restored = Object.getOwnPropertyDescriptor(room.root, '__NEPTUNE_IS_MY_WAIFU__');
    assert.equal(restored.get, get);
    assert.equal(restored.set, set);
});

test('XHR completion-only text/JSON behavior, native getter exceptions and safe restoration', () => {
    const room = fixture();
    const beforeOpen = room.Xhr.prototype.open;
    const beforeText = Object.getOwnPropertyDescriptor(room.Xhr.prototype, 'responseText');
    const api = room.start();
    const xhr = new room.Xhr();
    xhr.open('GET', API, true, 'user', 'password');
    xhr.status = 200;
    xhr.readyState = 3;
    xhr.body = JSON.stringify(payload());
    assert.equal(JSON.parse(xhr.responseText).data.playurl_info.playurl.stream.length, 2);
    assert.deepEqual(xhr.openArgs.slice(2), [true, 'user', 'password']);
    xhr.readyState = 4;
    assert.equal(JSON.parse(xhr.responseText).data.playurl_info.playurl.stream.length, 1);
    assert.equal(JSON.parse(xhr.response).data.playurl_info.playurl.stream.length, 1);
    xhr.responseType = 'json';
    xhr.json = payload();
    assert.equal(xhr.response.data.playurl_info.playurl.stream.length, 1);
    assert.equal(xhr.json.data.playurl_info.playurl.stream.length, 2);
    assert.throws(() => xhr.responseText, /InvalidStateError/);
    xhr.status = 403;
    assert.equal(xhr.response, xhr.json);
    api.dispose();
    assert.equal(room.Xhr.prototype.open, beforeOpen);
    assert.equal(Object.getOwnPropertyDescriptor(room.Xhr.prototype, 'responseText').get, beforeText.get);
});

test('manual reconnect pins only its next API GET quality and rate-limits subsequent clicks', async () => {
    const room = fixture();
    room.start();
    room.setReload(async () => { await room.root.fetch(API.replace('qn=10000', 'qn=400')); });
    const time = room.video.currentTime;
    const rate = room.video.playbackRate;
    assert.equal(await room.actions.reconnect(), true);
    assert.equal(new URL(room.requests[0][0]).searchParams.get('qn'), '10000');
    assert.equal(room.video.currentTime, time);
    assert.equal(room.video.playbackRate, rate);
    assert.equal(await room.actions.reconnect(), false);
    assert.equal(room.reloads, 1);
    await room.root.fetch(API.replace('qn=10000', 'qn=400'));
    assert.equal(new URL(room.requests[1][0]).searchParams.get('qn'), '400');
    room.advance(16000, true);
    assert.equal(await room.actions.reconnect(), true);
    assert.equal(room.reloads, 2);
});

test('a timed-out reload stays mutex-locked until its original promise settles', async () => {
    const room = fixture();
    room.start();
    let finish;
    room.setReload(() => new Promise(resolve => { finish = resolve; }));
    const pending = room.actions.reconnect();
    room.advance(16000, true);
    assert.match(room.view.notice, /不会叠加重连/);
    assert.equal(await room.actions.reconnect(), false);
    assert.equal(room.reloads, 1);
    finish();
    assert.equal(await pending, true);
    room.advance(16000, true);
    room.setReload(() => Promise.resolve());
    assert.equal(await room.actions.reconnect(), true);
    assert.equal(room.reloads, 2);
});

test('only current-quality offered hosts can be selected; native protocol can reorder explicitly', async () => {
    const room = fixture({ prefs: { enabled: true, protocol: 'native', preferredHost: 'auto' } });
    room.start();
    await room.root.fetch(API);
    assert.equal(room.actions.selectHost('evil.example.com'), false);
    assert.equal(room.reloads, 0);
    assert.equal(await room.actions.selectHost('b.bilivideo.com'), true);
    const response = await room.root.fetch(API);
    const body = await response.json();
    assert.equal(body.data.playurl_info.playurl.stream.length, 2);
    assert.equal(body.data.playurl_info.playurl.stream[0].format[0].codec[0].url_info[0].host, 'https://b.bilivideo.com');
    assert.equal(room.requests.at(-1)[0], API);
    assert.equal(room.view.actual.host, 'a.bilivideo.com');
    assert.equal(room.view.preferredHost, 'b.bilivideo.com');
    const stored = JSON.parse(room.storage.get('bilibili-live-accelerator:v1'));
    assert.deepEqual(Object.keys(stored).sort(), ['autoRecover', 'enabled', 'preferredHost', 'protocol']);
    assert.equal(JSON.stringify(stored).includes('PRIVATE_SIGNATURE'), false);
    room.actions.restoreDefaults();
    assert.equal(room.view.enabled, false);
    assert.equal(room.view.protocolPreference, 'native');
    assert.equal(room.view.preferredHost, 'auto');
    assert.match(room.view.notice, /刷新页面/);
});

test('auto recovery needs an offered same-quality backup and does not run paused, hidden or DOM-only', async () => {
    for (const state of ['paused', 'hidden', 'dom-only', 'no-backup']) {
        const room = fixture({ native: state !== 'dom-only', prefs: { autoRecover: true } });
        room.start();
        if (state !== 'no-backup') await room.root.fetch(API);
        room.video.buffer = 0;
        room.video.readyState = 1;
        if (state === 'paused') room.video.paused = true;
        if (state === 'hidden') room.document.visibilityState = 'hidden';
        room.advance(30000);
        await Promise.resolve();
        assert.equal(room.reloads, 0, state);
        if (state === 'no-backup') assert.match(room.view.notice, /没有同画质有效备线/);
        if (state === 'dom-only') assert.equal(room.view.canReconnect, false);
    }
    const room = fixture({ prefs: { autoRecover: true } });
    room.start();
    await room.root.fetch(API);
    room.video.buffer = 0;
    room.video.readyState = 1;
    room.advance(25000);
    await Promise.resolve();
    assert.equal(room.reloads, 1);
    assert.equal(room.view.preferredHost, 'b.bilivideo.com');
    room.advance(30000);
    await Promise.resolve();
    assert.equal(room.reloads, 1);
});

test('dispose never removes another script wrapper and the retained inner wrapper becomes pass-through', async () => {
    const room = fixture();
    const api = room.start();
    const ours = room.root.fetch;
    const newer = (...args) => ours(...args);
    room.root.fetch = newer;
    api.dispose();
    assert.equal(room.root.fetch, newer);
    const response = await room.root.fetch(API);
    assert.equal(room.requests[0][0], API);
    assert.equal((await response.json()).data.playurl_info.playurl.stream.length, 2);
});

test('late fetch responses are not optimized after disabling or disposal', async () => {
    for (const mode of ['disable', 'dispose']) {
        const room = fixture();
        let complete;
        const original = new Response(JSON.stringify(payload()));
        room.root.fetch = () => new Promise(resolve => { complete = resolve; });
        const api = room.start();
        const pending = room.root.fetch(API);
        if (mode === 'disable') room.actions.setEnabled(false);
        else api.dispose();
        complete(original);
        const response = await pending;
        assert.equal(response, original);
        assert.equal((await response.json()).data.playurl_info.playurl.stream.length, 2);
    }
});

test('unknown video clocks never trigger auto recovery even with a starving buffer fallback', async () => {
    const room = fixture({ prefs: { autoRecover: true } });
    room.start();
    await room.root.fetch(API);
    room.player.remainBufferLength = () => 0;
    room.video.currentTime = NaN;
    room.video.readyState = 1;
    room.advance(60000);
    await Promise.resolve();
    assert.equal(room.reloads, 0);
    assert.equal(room.view.actual.stallCount, 0);
});

test('bootstrap cache with near-expiry signatures is not replayed when changing protocol', async () => {
    const room = fixture();
    const initial = { roomInitRes: payload() };
    const soon = Math.floor(Date.now() / 1000) + 10;
    for (const stream of initial.roomInitRes.data.playurl_info.playurl.stream) {
        for (const format of stream.format) for (const codec of format.codec) {
            for (const info of codec.url_info) info.extra = `?sign=OLD_SIGNATURE&expires=${soon}`;
        }
    }
    room.root.__NEPTUNE_IS_MY_WAIFU__ = initial;
    room.start();
    assert.equal(initial.roomInitRes.data.playurl_info.playurl.stream.length, 1);
    await room.actions.setProtocol('native');
    // Reconnect may fetch fresh data, but it must not restore this expiring cache.
    assert.equal(initial.roomInitRes.data.playurl_info.playurl.stream.length, 1);
});

test('auto recovery stops for this page if native player does not adopt the requested backup', async () => {
    const room = fixture({ prefs: { autoRecover: true } });
    room.start();
    await room.root.fetch(API);
    room.video.buffer = 0;
    room.video.readyState = 1;
    room.advance(25000);
    await Promise.resolve();
    room.advance(10000);
    await Promise.resolve();
    assert.match(room.view.notice, /不会循环重连/);
    room.advance(90000);
    await Promise.resolve();
    assert.equal(room.reloads, 1);
});

test('successful automatic backup switches respect 90-second cooldown and 2-per-10-minute limit', async () => {
    const room = fixture({ prefs: { autoRecover: true } });
    room.start();
    await room.root.fetch(API);
    room.video.buffer = 0;
    room.video.readyState = 1;
    room.setReload(() => {
        room.playerInfo.playurl = MEDIA.replace('a.bilivideo.com', room.view.preferredHost);
        return Promise.resolve();
    });
    async function advance(ms) {
        for (let count = 0; count < ms / 1000; count++) { room.advance(1000); await Promise.resolve(); }
    }
    await advance(25000);
    assert.equal(room.reloads, 1);
    await advance(80000);
    assert.equal(room.reloads, 1);
    await advance(20000);
    assert.equal(room.reloads, 2);
    await advance(300000);
    assert.equal(room.reloads, 2);
});

test('short buffering is recorded during startup protection without triggering automatic recovery', async () => {
    const room = fixture({ prefs: { autoRecover: true } });
    room.start();
    await room.root.fetch(API);
    room.video.buffer = 0;
    room.video.readyState = 2;
    room.video.dispatch('waiting');
    room.advance(1000);
    assert.equal(room.view.actual.bufferingCount, 1);
    assert.equal(room.view.actual.stallCount, 1);
    assert.match(room.view.events.map(item => item.message).join('\n'), /检测到缓冲等待/);
    room.video.buffer = 3;
    room.video.readyState = 4;
    room.video.currentTime += 0.1;
    room.video.dispatch('playing');
    assert.match(room.view.events.map(item => item.message).join('\n'), /缓冲等待结束.*持续/);
    assert.ok(room.view.actual.bufferingSeconds >= 0.75);
    assert.equal(room.reloads, 0);
    assert.equal(room.view.actual.networkStallCount, 0);
});

test('playing events between periodic samples finalize a confirmed 300ms wait', () => {
    const room = fixture();
    room.start();
    room.advance(100, true);
    room.video.buffer = 0;
    room.video.readyState = 2;
    room.video.dispatch('waiting');
    room.advance(300);
    room.video.buffer = 3;
    room.video.readyState = 4;
    room.video.currentTime += 0.1;
    room.video.dispatch('playing');
    assert.equal(room.view.actual.bufferingCount, 1);
    assert.ok(Math.abs(room.view.actual.bufferingSeconds - 0.3) < 0.001);
    assert.match(room.view.events.map(item => item.message).join('\n'), /缓冲等待结束：持续 0.30 秒/);
});

test('waiting remains measurable after metadata changes and while optimization or live status is unknown', async () => {
    const room = fixture({ prefs: { enabled: false, autoRecover: true } });
    room.start();
    room.advance(20000, true);
    room.playerInfo.liveStatus = undefined;
    room.video.dispatch('loadedmetadata');
    room.video.buffer = 0;
    room.video.readyState = 2;
    room.video.dispatch('waiting');
    room.advance(1500);
    room.video.buffer = 3;
    room.video.currentTime += 0.1;
    room.video.dispatch('playing');
    assert.equal(room.view.actual.bufferingCount, 1);
    assert.ok(room.view.actual.bufferingSeconds >= 1);
    assert.equal(room.reloads, 0);
    assert.match(room.view.events.map(item => item.message).join('\n'), /缓冲等待结束/);
});

test('metadata protection records a ten-second interruption but still forbids automatic reconnect', async () => {
    const room = fixture({ prefs: { autoRecover: true } });
    room.start();
    await room.root.fetch(API);
    room.advance(20000, true);
    room.video.dispatch('loadedmetadata');
    room.video.buffer = 0;
    room.video.readyState = 2;
    room.video.dispatch('waiting');
    room.advance(10000);
    await Promise.resolve();
    assert.equal(room.view.actual.bufferingCount, 1);
    assert.ok(room.view.actual.bufferingSeconds >= 9.5);
    assert.equal(room.reloads, 0);
    assert.match(room.view.statusText, /继续记录卡顿，暂不自动恢复/);
});

test('real pauses, seeks and background time are excluded without clearing earlier totals', () => {
    const room = fixture();
    room.start();
    room.video.buffer = 0;
    room.video.readyState = 2;
    room.video.dispatch('waiting');
    room.advance(1000);
    room.video.currentTime += 0.1;
    room.video.buffer = 3;
    room.video.dispatch('playing');
    const count = room.view.actual.stallCount;
    const seconds = room.view.actual.stallSeconds;
    assert.equal(count, 1);
    for (const kind of ['pause', 'seek', 'hidden']) {
        room.video.buffer = 0;
        room.video.readyState = 2;
        if (kind === 'pause') { room.video.paused = true; room.video.dispatch('pause'); }
        if (kind === 'seek') { room.video.seeking = true; room.video.dispatch('seeking'); }
        if (kind === 'hidden') { room.document.visibilityState = 'hidden'; room.document.dispatch('visibilitychange'); }
        room.video.dispatch('waiting');
        room.advance(2000);
        room.video.paused = false;
        room.video.seeking = false;
        room.video.buffer = 3;
        room.video.readyState = 4;
        room.video.currentTime += 1;
        room.document.visibilityState = 'visible';
        if (kind === 'hidden') room.document.dispatch('visibilitychange');
        room.video.dispatch('playing');
        room.advance(1000, true);
    }
    assert.equal(room.view.actual.stallCount, count);
    assert.equal(room.view.actual.stallSeconds, seconds);
    assert.equal(room.reloads, 0);
});

test('sampling stays at 250ms but healthy playback renders only once per second', () => {
    const room = fixture();
    room.start();
    const count = room.renders;
    room.advance(3000, true);
    assert.equal(room.renders - count, 3);
    assert.equal([...room.intervals.values()][0].delay, 250);
    assert.equal(room.view.actual.stallCount, 0);
});

test('presented-frame observation detects a frame freeze without inventing source FPS and is cancelled on replacement', () => {
    const room = fixture({ frames: true });
    const api = room.start();
    assert.equal(room.frameCallbacks.size, 1);
    room.presentFrame();
    room.advance(1750, true);
    assert.equal(room.view.actual.freezeCount, 1);
    assert.equal(room.view.actual.fps, null);
    assert.match(room.view.events.map(item => item.message).join('\n'), /画面停滞/);
    room.presentFrame();
    room.advance(250, true);
    assert.match(room.view.events.map(item => item.message).join('\n'), /画面停滞结束/);
    room.video.dispatch('loadedmetadata');
    assert.equal(room.cancelledFrames, 1);
    assert.equal(room.frameCallbacks.size, 1);
    room.setVideo(null);
    room.advance(250);
    assert.equal(room.frameCallbacks.size, 0);
    assert.equal(room.cancelledFrames, 2);
    assert.equal(room.video.listenerCount(), 0);
    api.dispose();
});

test('dispose cancels its presented-frame callback and bounded event history contains no media URL', () => {
    const room = fixture({ frames: true });
    const api = room.start();
    for (let count = 0; count < 8; count++) {
        room.video.buffer = 0;
        room.video.readyState = 2;
        room.video.dispatch('waiting');
        room.advance(750);
        room.video.buffer = 3;
        room.video.currentTime += 0.1;
        room.video.dispatch('playing');
        room.presentFrame();
        room.advance(250, true);
    }
    assert.ok(room.view.events.length <= 12);
    const history = JSON.stringify(room.view.events);
    assert.equal(history.includes('PRIVATE_SIGNATURE'), false);
    assert.equal(history.includes('stream.flv'), false);
    api.dispose();
    assert.equal(room.frameCallbacks.size, 0);
    assert.equal(room.cancelledFrames, 1);
});

test('paused and background frame gaps are not reused as foreground freezes', () => {
    const room = fixture({ frames: true });
    room.start();
    room.presentFrame();
    room.video.paused = true;
    room.video.dispatch('pause');
    assert.equal(room.frameCallbacks.size, 0);
    room.advance(10000);
    room.video.paused = false;
    room.video.dispatch('playing');
    room.advance(1000, true);
    assert.equal(room.view.actual.freezeCount, 0);
    room.presentFrame();
    room.document.visibilityState = 'hidden';
    room.document.dispatch('visibilitychange');
    assert.equal(room.frameCallbacks.size, 0);
    room.advance(10000);
    room.document.visibilityState = 'visible';
    room.document.dispatch('visibilitychange');
    room.advance(1000, true);
    assert.equal(room.view.actual.freezeCount, 0);
    assert.equal(room.cancelledFrames, 2);
});

test('recent frame drops are classified separately and ordinary samples reach the event log', () => {
    const room = fixture();
    room.start();
    for (let count = 0; count < 7; count++) {
        room.video.dropped += 12;
        room.video.total += 60;
        room.advance(1000, true);
    }
    assert.ok(room.view.actual.recentDropPercent >= 19);
    assert.equal(room.view.actual.bufferingCount, 0);
    assert.equal(room.view.actual.freezeCount, 0);
    assert.match(room.view.events.map(item => item.message).join('\n'), /近期掉帧率.*掉帧不等同于网络卡顿/);
    assert.equal(room.reloads, 0);
});
