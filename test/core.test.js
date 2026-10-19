'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createCore } = require('../src/core');

const core = createCore();
const API = 'https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo';
const NOW = 1900000000;
const FIRST_HOST = 'd1--ov-gotcha07.bilivideo.com';
const SECOND_HOST = 'd1--ov-gotcha05.bilivideo.com';
const FIRST_EXTRA = '?expires=1900003600&deadline=1900003600&sign=first-private-signature&uipk=private-user-key';
const SECOND_EXTRA = '?expires=1900003601&sign=second-private-signature&other=a%2Bb';

function opts(raw = {}) {
    return core.preferences(raw);
}

function codec(quality = 10000, overrides = {}) {
    return {
        codec_name: 'avc', current_qn: quality, accept_qn: [10000, 400, 250],
        base_url: '/live-bvc/stream_original.flv',
        url_info: [
            { host: `https://${FIRST_HOST}`, extra: FIRST_EXTRA, stream_ttl: 3600 },
            { host: `https://${SECOND_HOST}`, extra: SECOND_EXTRA, stream_ttl: 3601 },
        ], ...overrides,
    };
}

function fixture({ flv = codec(), hls = codec(10000, {
    base_url: '/live-bvc/stream_original/index.m3u8',
    url_info: [{ host: 'https://d1--ov-gotcha207.bilivideo.com', extra: FIRST_EXTRA }],
}), code = 0 } = {}) {
    return {
        code, message: 'ok', ttl: 1, otherTopLevel: { kept: true },
        data: {
            live_status: 1, unrelated: { untouched: true },
            playurl_info: {
                conf_json: '{"unchanged":true}',
                playurl: {
                    g_qn_desc: [{ qn: 10000, desc: '原画' }],
                    stream: [
                        ...(hls ? [{ protocol_name: 'http_hls', format: [{ format_name: 'fmp4', codec: [hls] }] }] : []),
                        ...(flv ? [{ protocol_name: 'http_stream', format: [{ format_name: 'flv', codec: [flv] }] }] : []),
                    ],
                },
            },
        },
    };
}

function freezeDeep(value) {
    if (value && typeof value === 'object') {
        Object.freeze(value);
        Object.values(value).forEach(freezeDeep);
    }
    return value;
}

function selectedCodec(result) {
    return result.payload.data.playurl_info.playurl.stream[0].format[0].codec[0];
}

test('preferences default safely and accept only explicit supported values', () => {
    assert.deepEqual(core.preferences(), {
        enabled: true, protocol: 'flv', autoRecover: false, preferredHost: 'auto',
    });
    assert.deepEqual(opts({ enabled: false, protocol: 'native', autoRecover: true, preferredHost: FIRST_HOST.toUpperCase() }), {
        enabled: false, protocol: 'native', autoRecover: true, preferredHost: FIRST_HOST,
    });
    assert.deepEqual(opts({ enabled: 'false', protocol: 'anything', autoRecover: 1, preferredHost: 'https://attacker.example/path' }), core.defaults);
});

test('only the exact HTTPS play-info endpoint is intercepted', () => {
    assert.equal(core.isPlayInfoUrl(`${API}?room_id=123456&qn=10000`), true);
    assert.equal(core.isPlayInfoUrl(API.replace('https:', 'HTTPS:')), true);
    for (const value of [
        API.replace('https:', 'http:'), API.replace('api.live.bilibili.com', 'api.live.bilibili.com.evil.example'),
        API.replace('api.live.bilibili.com', 'evil.example'), API.replace('api.live.bilibili.com', 'api.live.bilibili.com:444'),
        API.replace('api.live.bilibili.com', 'user:password@api.live.bilibili.com'),
        `${API}/extra`, API.replace('getRoomPlayInfo', 'getRoomPlayInfoOther'), '/xlive/web-room/v2/index/getRoomPlayInfo',
        'not a URL', null,
    ]) assert.equal(core.isPlayInfoUrl(value), false, String(value));
});

test('FLV request expansion preserves quality and unrelated query values', () => {
    const input = `${API}?room_id=123456&qn=10000&protocol=1&format=1,2&codec=1&token=a%2Bb&flag=one&flag=two`;
    const output = new URL(core.requestUrl(input, opts()));
    assert.equal(output.searchParams.get('qn'), '10000');
    assert.equal(output.searchParams.get('room_id'), '123456');
    assert.equal(output.searchParams.get('token'), 'a+b');
    assert.deepEqual(output.searchParams.getAll('flag'), ['one', 'two']);
    assert.deepEqual(output.searchParams.get('protocol').split(','), ['1', '0']);
    assert.deepEqual(output.searchParams.get('format').split(','), ['1', '2', '0']);
    assert.deepEqual(output.searchParams.get('codec').split(','), ['1', '0']);
    assert.equal(core.requestUrl(output.href, opts()), output.href, 'expansion must be idempotent');
});

test('request rewriting pins quality only when explicitly supplied as a positive integer', () => {
    const input = `${API}?qn=400&room_id=123456`;
    assert.equal(new URL(core.requestUrl(input, opts())).searchParams.get('qn'), '400');
    assert.equal(new URL(core.requestUrl(input, opts(), 10000)).searchParams.get('qn'), '10000');
    for (const pin of [null, undefined, 0, -1, 400.5, '10000', NaN, Infinity]) {
        assert.equal(new URL(core.requestUrl(input, opts(), pin)).searchParams.get('qn'), '400');
    }
    assert.equal(core.requestUrl(input, opts({ enabled: false }), 10000), input);
    assert.equal(core.requestUrl(input, opts({ protocol: 'native' })), input);
    assert.equal(core.requestUrl('https://example.com/unrelated?qn=400', opts(), 10000), 'https://example.com/unrelated?qn=400');
});

test('same-quality FLV/AVC is selected without mutating the original or signed addresses', () => {
    const original = freezeDeep(fixture());
    const snapshot = structuredClone(original);
    const result = core.selectPlayInfo(original, opts(), NOW);
    assert.equal(result.changed, true);
    assert.equal(result.quality, 10000);
    assert.equal(result.fallbackReason, '');
    assert.deepEqual(result.candidates, [FIRST_HOST, SECOND_HOST]);
    assert.equal(result.payload.data.playurl_info.playurl.stream.length, 1);
    assert.equal(result.payload.data.playurl_info.playurl.stream[0].protocol_name, 'http_stream');
    assert.equal(result.payload.data.playurl_info.playurl.stream[0].format[0].format_name, 'flv');
    const actualCodec = selectedCodec(result);
    const originalCodec = original.data.playurl_info.playurl.stream[1].format[0].codec[0];
    assert.equal(actualCodec.current_qn, 10000);
    assert.equal(actualCodec.base_url, originalCodec.base_url);
    assert.equal(actualCodec.url_info[0], originalCodec.url_info[0]);
    assert.equal(actualCodec.url_info[1], originalCodec.url_info[1]);
    assert.equal(actualCodec.url_info[0].extra, FIRST_EXTRA);
    assert.equal(actualCodec.url_info[1].extra, SECOND_EXTRA);
    assert.equal(result.payload.otherTopLevel, original.otherTopLevel);
    assert.equal(result.payload.data.unrelated, original.data.unrelated);
    assert.deepEqual(original, snapshot);
});

test('a lower-quality FLV never replaces a higher-quality HLS stream', () => {
    const original = fixture({ flv: codec(400) });
    const result = core.selectPlayInfo(original, opts(), NOW);
    assert.equal(result.changed, false);
    assert.equal(result.payload, original);
    assert.equal(result.quality, 10000);
    assert.equal(result.candidates.length, 0);
    assert.match(result.fallbackReason, /同画质/);
});

test('unknown or malformed quality cannot establish a same-quality FLV guarantee', () => {
    for (const quality of [0, null, undefined, NaN, Infinity, -1, 400.5, 'not-a-quality']) {
        const original = fixture({ flv: codec(10000, { current_qn: quality }), hls: null });
        const result = core.selectPlayInfo(original, opts(), NOW);
        assert.equal(result.changed, false, String(quality));
        assert.equal(result.payload, original, String(quality));
    }
});

test('missing, protected, unsupported and malformed play-info stays untouched', () => {
    const cases = [
        null, {}, { data: {} }, { data: { playurl_info: { playurl: { stream: 'invalid' } } } },
        { data: { playurl_info: { playurl: { stream: [null, {}, { format: [null, { codec: [null, 'bad'] }] }] } } } },
        fixture({ flv: null }), fixture({ flv: codec(10000, { codec_name: 'hevc' }) }),
        fixture({ flv: codec(10000, { drm: true }) }), fixture({ code: -400 }),
        fixture({ flv: codec(10000, { url_info: [] }) }),
        fixture({ flv: codec(10000, { base_url: '//evil.example/stream.flv' }) }),
        fixture({ flv: codec(10000, { url_info: [{ host: 'http://unsafe.example', extra: FIRST_EXTRA }] }) }),
    ];
    for (const original of cases) {
        const result = core.selectPlayInfo(original, opts(), NOW);
        assert.equal(result.changed, false);
        assert.equal(result.payload, original);
    }
});

test('any DRM candidate makes optimization fall back, including a protected HLS alternative', () => {
    const original = fixture({ hls: codec(10000, { drm: true }) });
    const result = core.selectPlayInfo(original, opts(), NOW);
    assert.equal(result.changed, false);
    assert.equal(result.payload, original);
    assert.match(result.fallbackReason, /受保护/);
});

test('only a present, valid official response candidate may be promoted', () => {
    const original = freezeDeep(fixture());
    const result = core.selectPlayInfo(original, opts({ preferredHost: SECOND_HOST }), NOW);
    const source = original.data.playurl_info.playurl.stream[1].format[0].codec[0];
    assert.deepEqual(selectedCodec(result).url_info, [source.url_info[1], source.url_info[0]]);
    assert.equal(selectedCodec(result).url_info[0], source.url_info[1]);
    assert.equal(selectedCodec(result).url_info[0].extra, SECOND_EXTRA);
    const absent = core.selectPlayInfo(original, opts({ preferredHost: 'not-returned.bilivideo.com' }), NOW);
    assert.deepEqual(selectedCodec(absent).url_info, source.url_info);
    assert.deepEqual(absent.candidates, [FIRST_HOST, SECOND_HOST]);
});

test('expired or unsafe FLV addresses are not candidates; valid siblings remain exact', () => {
    const valid = codec().url_info[1];
    const original = fixture({ flv: codec(10000, { url_info: [
        { host: `https://${FIRST_HOST}`, extra: `?expires=${NOW}&sign=expired` },
        { host: 'https://user:password@unsafe.example', extra: FIRST_EXTRA },
        { host: 'https://unsafe.example/path', extra: FIRST_EXTRA },
        { host: 'https://unsafe.example?query=wrong', extra: FIRST_EXTRA },
        valid,
    ] }) });
    const result = core.selectPlayInfo(original, opts({ preferredHost: FIRST_HOST }), NOW);
    assert.equal(result.changed, true);
    assert.deepEqual(result.candidates, [SECOND_HOST]);
    assert.deepEqual(selectedCodec(result).url_info, [valid]);
    assert.equal(selectedCodec(result).url_info[0], valid);
    const expiredOnly = fixture({ flv: codec(10000, {
        url_info: [{ host: `https://${FIRST_HOST}`, extra: `?expires=${NOW - 1}&sign=expired` }],
    }) });
    const fallback = core.selectPlayInfo(expiredOnly, opts(), NOW);
    assert.equal(fallback.payload, expiredOnly);
    assert.equal(fallback.changed, false);
});

test('disabled is full pass-through; native/auto leaves all protocols and the response intact', () => {
    const original = freezeDeep(fixture());
    for (const preferences of [opts({ enabled: false, preferredHost: SECOND_HOST }), opts({ protocol: 'native' })]) {
        const result = core.selectPlayInfo(original, preferences, NOW);
        assert.equal(result.payload, original);
        assert.equal(result.changed, false);
    }
    const native = core.selectPlayInfo(original, opts({ protocol: 'native' }), NOW);
    assert.ok(native.candidates.includes(FIRST_HOST));
    assert.ok(native.candidates.includes('d1--ov-gotcha207.bilivideo.com'));
});

test('native with an explicit preferred host may reorder but never filters the native protocols', () => {
    const original = freezeDeep(fixture());
    const result = core.selectPlayInfo(original, opts({ protocol: 'native', preferredHost: SECOND_HOST }), NOW);
    assert.equal(result.changed, true);
    assert.deepEqual(result.payload.data.playurl_info.playurl.stream.map(stream => stream.protocol_name), ['http_hls', 'http_stream']);
    const flv = result.payload.data.playurl_info.playurl.stream[1].format[0].codec[0];
    assert.equal(flv.url_info[0].host, `https://${SECOND_HOST}`);
    assert.equal(flv.url_info[0].extra, SECOND_EXTRA);
    assert.equal(original.data.playurl_info.playurl.stream[1].format[0].codec[0].url_info[0].host, `https://${FIRST_HOST}`);
});

test('media address identification exposes only host and protocol', () => {
    assert.deepEqual(core.mediaAddress(`https://${FIRST_HOST}/live-bvc/stream.flv${FIRST_EXTRA}`), { host: FIRST_HOST, protocol: 'FLV' });
    assert.deepEqual(core.mediaAddress(`https://${FIRST_HOST}/live-bvc/index.m3u8?token=secret`), { host: FIRST_HOST, protocol: 'HLS' });
    for (const url of ['http://unsafe.example/live.flv', 'file:///secret.flv', 'not a URL']) {
        assert.deepEqual(core.mediaAddress(url), { host: '', protocol: '未知' });
    }
});

function sample(now, overrides = {}) {
    return {
        key: 'room-123456', now, hasVideo: true, hidden: false, paused: false, ended: false,
        seeking: false, playbackRate: 1, live: true, timeShift: false,
        currentTime: now / 1000, buffer: 2, readyState: 4,
        enabled: true, autoRecover: true, canReconnect: true, ...overrides,
    };
}

function primedPolicy() {
    const policy = core.createRecoveryPolicy();
    for (let now = 0; now <= 15000; now += 1000) policy.tick(sample(now));
    return policy;
}

function starving(now, overrides = {}) {
    return sample(now, { currentTime: 15, buffer: 0, readyState: 2, ...overrides });
}

test('recovery needs eight seconds of actual time stagnation and an empty low-readiness buffer', () => {
    const policy = primedPolicy();
    for (let now = 16000; now <= 22000; now += 1000) assert.equal(policy.tick(starving(now)).action, null);
    const almost = policy.tick(starving(22999));
    assert.equal(almost.elapsed, 7999);
    assert.equal(almost.action, null);
    const ready = policy.tick(starving(23000));
    assert.equal(ready.elapsed, 8000);
    assert.equal(ready.action, 'recover');
    assert.deepEqual(policy.snapshot(23000), { stallCount: 1, stallSeconds: 8, recoveryCount: 0 });
    policy.markRecovery(23000);
    assert.deepEqual(policy.snapshot(23000), { stallCount: 1, stallSeconds: 8, recoveryCount: 1 });
});

test('initial startup is protected for fifteen seconds', () => {
    const policy = core.createRecoveryPolicy();
    for (let now = 0; now < 15000; now += 1000) {
        const result = policy.tick(starving(now));
        assert.equal(result.action, null);
        assert.equal(result.state, 'excluded');
    }
    assert.equal(policy.snapshot(14000).stallCount, 0);
    assert.equal(policy.tick(starving(15000)).action, null);
});

test('brief starvation is not recorded as a stall and recovery of playback ends the measured duration', () => {
    const policy = primedPolicy();
    policy.tick(starving(16000));
    policy.tick(starving(17000));
    policy.tick(sample(17500));
    assert.deepEqual(policy.snapshot(17500), { stallCount: 0, stallSeconds: 0, recoveryCount: 0 });
    for (let now = 18500; now <= 22500; now += 1000) {
        policy.tick(starving(now, { currentTime: 17.5 }));
    }
    policy.tick(sample(23500));
    assert.deepEqual(policy.snapshot(100000), { stallCount: 1, stallSeconds: 6, recoveryCount: 0 });
});

test('normal user and playback states never trigger automatic recovery', () => {
    const exclusions = [
        { hasVideo: false }, { hidden: true }, { paused: true }, { ended: true }, { seeking: true },
        { playbackRate: 0 }, { live: false }, { live: undefined }, { timeShift: true },
    ];
    for (const reason of exclusions) {
        const policy = primedPolicy();
        for (let now = 16000; now <= 30000; now += 1000) {
            const result = policy.tick(starving(now, reason));
            assert.equal(result.action, null, JSON.stringify(reason));
            assert.equal(result.state, 'excluded', JSON.stringify(reason));
        }
        assert.equal(policy.snapshot(30000).stallCount, 0);
    }
});

test('healthy buffers, decode drops and an advancing clock are not network stalls', () => {
    for (const reason of [
        { buffer: 2, readyState: 4, droppedFrames: 500, decodedFrames: 1000 },
        { buffer: 1, readyState: 2 }, { buffer: 0, readyState: 3 }, { buffer: NaN, readyState: 2 },
    ]) {
        const policy = primedPolicy();
        for (let now = 16000; now <= 30000; now += 1000) {
            assert.equal(policy.tick(starving(now, reason)).action, null);
        }
        assert.equal(policy.snapshot(30000).stallCount, 0);
    }
    const policy = primedPolicy();
    for (let now = 16000; now <= 30000; now += 1000) {
        assert.equal(policy.tick(starving(now, { currentTime: now / 1000 })).state, 'playing');
    }
    assert.equal(policy.snapshot(30000).stallCount, 0);
});

test('a long sampling gap cannot be counted as uninterrupted stalling', () => {
    const policy = primedPolicy();
    policy.tick(starving(16000));
    policy.tick(starving(17000));
    const resumed = policy.tick(starving(25000));
    assert.equal(resumed.action, null);
    assert.equal(resumed.state, 'excluded');
    assert.equal(policy.snapshot(25000).stallCount, 0);
    for (let now = 26000; now <= 32000; now += 1000) assert.equal(policy.tick(starving(now)).action, null);
    assert.equal(policy.tick(starving(33000)).action, 'recover');
});

test('recovery remains opt-in and requires a native reconnect capability', () => {
    for (const blocker of [{ enabled: false }, { autoRecover: false }, { canReconnect: false }]) {
        const policy = primedPolicy();
        for (let now = 16000; now <= 30000; now += 1000) {
            assert.equal(policy.tick(starving(now, blocker)).action, null);
        }
        assert.equal(policy.snapshot(30000).recoveryCount, 0);
    }
});

test('recovery cools down for ninety seconds and is capped at two attempts per ten minutes', () => {
    const policy = primedPolicy();
    for (let now = 16000; now <= 23000; now += 1000) policy.tick(starving(now));
    policy.markRecovery(23000);
    for (let now = 24000; now < 113000; now += 1000) assert.equal(policy.tick(starving(now)).action, null);
    assert.equal(policy.tick(starving(113000)).action, 'recover');
    policy.markRecovery(113000);
    for (let now = 114000; now < 623000; now += 1000) assert.equal(policy.tick(starving(now)).action, null);
    assert.equal(policy.snapshot(622000).recoveryCount, 2);
    assert.equal(policy.tick(starving(623000)).action, 'recover', 'the oldest attempt expires exactly after ten minutes');
});

test('invalid or backwards clocks cannot trigger recovery', () => {
    const policy = primedPolicy();
    assert.equal(policy.tick(starving(NaN)).action, null);
    assert.equal(policy.tick(starving(14000)).state, 'excluded');
    assert.equal(policy.tick(starving(Infinity)).action, null);
});

test('unknown video timestamps cannot prove a network stall', () => {
    for (const currentTime of [NaN, Infinity, undefined, null, '15']) {
        const policy = primedPolicy();
        for (let now = 16000; now <= 30000; now += 1000) {
            assert.equal(policy.tick(starving(now, { currentTime })).action, null, String(currentTime));
        }
        assert.equal(policy.snapshot(30000).stallCount, 0, String(currentTime));
    }
});

test('diagnostics contain only allowlisted fields and never raw signed URLs or user data', () => {
    const secret = 'USER_TOKEN_DO_NOT_EXPORT';
    const signedUrl = `https://${FIRST_HOST}/stream.flv?sign=${secret}&uid=12345`;
    const report = core.diagnostic({
        version: '0.1.0', enabled: true, protocolPreference: 'flv', autoRecover: false,
        preferredHost: FIRST_HOST, canReconnect: true, conflict: false,
        token: secret, roomId: 123456, userId: 12345, fullApiResponse: fixture(),
        actual: {
            protocol: 'FLV', host: FIRST_HOST, quality: 10000, resolution: '1920x1080',
            buffer: 2.456, dropped: 10, total: 500, stallCount: 1, stallSeconds: 8,
            bufferingCount: 1, bufferingSeconds: 8, freezeCount: 0, freezeSeconds: 0,
            recentDropPercent: 6.234, frameMonitorAvailable: true,
            url: signedUrl, signedUrl, sign: secret, user: { token: secret },
        },
        candidates: [{ host: FIRST_HOST, url: signedUrl, extra: secret }, { host: signedUrl }],
    });
    const data = JSON.parse(report);
    assert.deepEqual(Object.keys(data).sort(), ['candidateHosts', 'conflict', 'nativeReconnectAvailable', 'playback', 'preferences', 'product', 'version'].sort());
    assert.deepEqual(Object.keys(data.playback).sort(), ['protocol', 'host', 'quality', 'resolution', 'bufferSeconds', 'droppedFrames', 'decodedFrames', 'stallCount', 'stallSeconds', 'bufferingCount', 'bufferingSeconds', 'freezeCount', 'freezeSeconds', 'recentDropPercent', 'frameMonitorAvailable'].sort());
    assert.deepEqual(Object.keys(data.preferences).sort(), ['enabled', 'protocol', 'autoRecover', 'preferredHost'].sort());
    assert.deepEqual(data.candidateHosts, [FIRST_HOST]);
    assert.equal(data.playback.bufferSeconds, 2.46);
    assert.equal(data.playback.quality, '10000');
    assert.equal(data.playback.recentDropPercent, 6.23);
    assert.equal(data.playback.bufferingCount, 1);
    assert.equal(data.playback.frameMonitorAvailable, true);
    for (const forbidden of [secret, signedUrl, FIRST_EXTRA, SECOND_EXTRA, '123456', '12345', 'sign=', 'https://', 'uipk']) {
        assert.equal(report.includes(forbidden), false, forbidden);
    }
});

test('diagnostics reject malformed values in allowed playback fields', () => {
    const data = JSON.parse(core.diagnostic({
        version: '0.1.0', candidates: [], actual: {
            protocol: 'https://secret.example?token=secret', host: 'https://secret.example?token=secret',
            quality: '10000&token=secret', resolution: '1920x1080?sign=secret',
            buffer: Infinity, dropped: NaN, total: '123', stallCount: null, stallSeconds: undefined,
            bufferingCount: 'secret', bufferingSeconds: Infinity, freezeCount: null, freezeSeconds: undefined,
            recentDropPercent: NaN, frameMonitorAvailable: 'secret',
        },
    }));
    assert.deepEqual(data.playback, {
        protocol: '未知', host: null, quality: null, resolution: null, bufferSeconds: null,
        droppedFrames: null, decodedFrames: null, stallCount: null, stallSeconds: null,
        bufferingCount: null, bufferingSeconds: null, freezeCount: null, freezeSeconds: null,
        recentDropPercent: null, frameMonitorAvailable: false,
    });
});
