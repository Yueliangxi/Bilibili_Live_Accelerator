'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createCore } = require('../src/core');

const core = createCore();
function sample(now, changes = {}) {
    return { now, key: 'video-one', hasVideo: true, hidden: false, paused: false, ended: false,
        seeking: false, playbackRate: 1, live: true, timeShift: false, currentTime: 10,
        buffer: 0, readyState: 2, enabled: true, autoRecover: false, canReconnect: false,
        dropped: 0, total: 0, frameAgeMs: null, frameMonitorAvailable: false, ...changes };
}
function beginBuffering(monitor, start = 0, changes = {}) {
    monitor.mediaEvent('waiting', sample(start, changes));
    return monitor.tick(sample(start + 250, changes));
}

test('waiting records a short sub-second buffer stall and emits one start and end', () => {
    const monitor = core.createPlaybackMonitor();
    assert.deepEqual(monitor.mediaEvent('waiting', sample(0)).events, []);
    assert.equal(monitor.tick(sample(249)).metrics.stallCount, 0);
    const start = monitor.tick(sample(250));
    assert.equal(start.metrics.bufferingCount, 1);
    assert.equal(start.metrics.stallSeconds, 0.25);
    assert.deepEqual(start.events, [{ type: 'buffering', phase: 'start', at: 250, durationMs: 250, bufferSeconds: 0 }]);
    assert.deepEqual(monitor.mediaEvent('stalled', sample(400)).events, []);
    const end = monitor.mediaEvent('playing', sample(700));
    assert.equal(end.metrics.stallCount, 1);
    assert.equal(end.metrics.bufferingSeconds, 0.7);
    assert.deepEqual(end.events, [{ type: 'buffering', phase: 'end', at: 700, durationMs: 700, bufferSeconds: 0 }]);
    assert.deepEqual(monitor.tick(sample(950, { currentTime: 10.25 })).events, []);
    assert.equal(monitor.snapshot(1000).stallSeconds, 0.7);
});

test('waiting shorter than confirmation threshold is not counted', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.mediaEvent('waiting', sample(0));
    const done = monitor.mediaEvent('playing', sample(200));
    assert.equal(done.metrics.stallCount, 0);
    assert.deepEqual(done.events, []);
});

test('playing confirms a 300ms wait between sample ticks using the waiting buffer classification', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.tick(sample(0, { currentTime: 9.9 }));
    monitor.mediaEvent('waiting', sample(100));
    assert.equal(monitor.tick(sample(250)).metrics.stallCount, 0);
    const done = monitor.mediaEvent('playing', sample(400, { currentTime: 10.01, buffer: 5, readyState: 4 }));
    assert.equal(done.metrics.bufferingCount, 1);
    assert.equal(done.metrics.bufferingSeconds, 0.3);
    assert.equal(done.metrics.freezeCount, 0);
    assert.deepEqual(done.events.map(event => [event.type, event.phase, event.durationMs]), [
        ['buffering', 'start', 300], ['buffering', 'end', 300],
    ]);
    assert.equal(done.events[0].bufferSeconds, 0);
    assert.equal(done.events[1].bufferSeconds, 5);
});

test('playing does not promote a clock-only pending observation before its 750ms threshold', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.tick(sample(0));
    monitor.tick(sample(250));
    const done = monitor.mediaEvent('playing', sample(400, { currentTime: 10.01, buffer: 5, readyState: 4 }));
    assert.equal(done.metrics.stallCount, 0);
    assert.deepEqual(done.events, []);
});

test('recording ignores optimization settings, recovery grace, and unknown live status', () => {
    const monitor = core.createPlaybackMonitor();
    const changes = { enabled: false, autoRecover: false, canReconnect: false, live: undefined,
        recoveryGrace: true, graceUntil: 15000 };
    const started = beginBuffering(monitor, 0, changes);
    assert.equal(started.metrics.stallCount, 1);
    assert.equal(started.events[0].type, 'buffering');
});

test('paused, hidden, seeking, ended, missing video and nonplaying rate cannot create observations', () => {
    for (const excluded of [{ paused: true }, { hidden: true }, { seeking: true }, { ended: true },
        { hasVideo: false }, { playbackRate: 0 }, { playbackRate: NaN }]) {
        const monitor = core.createPlaybackMonitor();
        beginBuffering(monitor, 0, excluded);
        for (let now = 500; now <= 2000; now += 250) monitor.tick(sample(now, excluded));
        assert.equal(monitor.snapshot(2000).stallCount, 0, JSON.stringify(excluded));
    }
});

test('pause and background end existing segments without adding unobserved time', () => {
    for (const excluded of [{ paused: true }, { hidden: true }, { seeking: true }]) {
        const monitor = core.createPlaybackMonitor();
        beginBuffering(monitor);
        const output = monitor.tick(sample(500, excluded));
        assert.equal(output.metrics.stallCount, 1);
        assert.equal(output.metrics.stallSeconds, 0.25);
        assert.equal(output.events[0].phase, 'end');
        assert.equal(output.events[0].durationMs, 250);
    }
});

test('unknown media clocks are not mistaken for a clock freeze, but waiting evidence is retained', () => {
    const monitor = core.createPlaybackMonitor();
    for (let now = 0; now <= 2000; now += 250) monitor.tick(sample(now, { currentTime: NaN }));
    assert.equal(monitor.snapshot(2000).stallCount, 0);
    monitor.mediaEvent('waiting', sample(2250, { currentTime: null }));
    const output = monitor.tick(sample(2500, { currentTime: null }));
    assert.equal(output.metrics.bufferingCount, 1);
});

test('clock-only starvation requires 750ms and does not need media events', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.tick(sample(0));
    monitor.tick(sample(250));
    assert.equal(monitor.tick(sample(500)).metrics.stallCount, 0);
    const output = monitor.tick(sample(750));
    assert.equal(output.metrics.bufferingCount, 1);
    assert.equal(output.events[0].durationMs, 750);
    assert.equal(monitor.tick(sample(1000)).metrics.stallCount, 1);
});

test('healthy buffer clock stalls are suspicious freezes, not network buffering', () => {
    const monitor = core.createPlaybackMonitor();
    for (let now = 0; now <= 750; now += 250) monitor.tick(sample(now, { buffer: 5, readyState: 4 }));
    assert.equal(monitor.snapshot(750).freezeCount, 1);
    assert.equal(monitor.snapshot(750).bufferingCount, 0);
    const end = monitor.tick(sample(1000, { currentTime: 10.25, buffer: 5, readyState: 4 }));
    assert.equal(end.events[0].type, 'freeze');
    assert.equal(end.metrics.freezeSeconds, 1);
});

test('waiting with healthy buffer does not claim a network buffering problem', () => {
    const monitor = core.createPlaybackMonitor();
    const result = beginBuffering(monitor, 0, { buffer: 5, readyState: 4 });
    assert.equal(result.metrics.freezeCount, 1);
    assert.equal(result.metrics.bufferingCount, 0);
});

test('missing recent rendered frames with an advancing clock records a suspicious freeze', () => {
    const monitor = core.createPlaybackMonitor();
    let last;
    for (let now = 0; now <= 1000; now += 250) last = monitor.tick(sample(now, {
        currentTime: 10 + now / 1000, buffer: 5, readyState: 4,
        frameMonitorAvailable: true, frameAgeMs: now,
    }));
    assert.equal(last.metrics.freezeCount, 1);
    assert.equal(last.metrics.freezeSeconds, 1);
    assert.equal(last.events[0].type, 'freeze');
    assert.equal(monitor.tick(sample(1250, { currentTime: 11.25, buffer: 5, readyState: 4,
        frameMonitorAvailable: true, frameAgeMs: 1250 })).metrics.freezeCount, 1);
    const end = monitor.tick(sample(1500, { currentTime: 11.5, buffer: 5, readyState: 4,
        frameMonitorAvailable: true, frameAgeMs: 0 }));
    assert.equal(end.events[0].phase, 'end');
    assert.equal(end.metrics.freezeSeconds, 1.5);
});

test('stale frame ages are ignored if frame observation is unavailable', () => {
    const monitor = core.createPlaybackMonitor();
    for (let now = 0; now <= 2000; now += 250) monitor.tick(sample(now, {
        currentTime: 10 + now / 1000, frameMonitorAvailable: false, frameAgeMs: 10000,
    }));
    assert.equal(monitor.snapshot(2000).stallCount, 0);
});

test('a new stream preserves totals but does not inherit prior pending waits or frames', () => {
    const monitor = core.createPlaybackMonitor();
    beginBuffering(monitor);
    const switched = monitor.tick(sample(500, { key: 'video-two', currentTime: 0,
        frameMonitorAvailable: true, frameAgeMs: 10000 }));
    assert.equal(switched.metrics.stallCount, 1);
    assert.equal(switched.metrics.stallSeconds, 0.25);
    assert.equal(switched.events[0].phase, 'end');
    monitor.mediaEvent('waiting', sample(750, { key: 'video-two', currentTime: 0 }));
    const next = monitor.tick(sample(1000, { key: 'video-two', currentTime: 0 }));
    assert.equal(next.metrics.bufferingCount, 2);
    assert.equal(next.metrics.bufferingSeconds, 0.5);
});

test('explicit reset preserves cumulative time and delivers its end event once on the next observation', () => {
    const monitor = core.createPlaybackMonitor();
    beginBuffering(monitor);
    assert.equal(monitor.reset(500), undefined);
    assert.equal(monitor.snapshot(500).stallCount, 1);
    assert.equal(monitor.snapshot(500).stallSeconds, 0.25);
    const result = monitor.tick(sample(750, { currentTime: 11 }));
    assert.equal(result.events.length, 1);
    assert.equal(result.events[0].phase, 'end');
    assert.deepEqual(monitor.tick(sample(1000, { currentTime: 11.25 })).events, []);
});

test('long sampling gaps and backwards time do not grow or create stalls', () => {
    const monitor = core.createPlaybackMonitor();
    beginBuffering(monitor);
    const afterGap = monitor.tick(sample(5000));
    assert.equal(afterGap.metrics.stallCount, 1);
    assert.equal(afterGap.metrics.stallSeconds, 0.25);
    assert.equal(afterGap.events[0].durationMs, 250);
    const backwards = monitor.tick(sample(4000));
    assert.equal(backwards.metrics.stallCount, 1);
    assert.equal(backwards.metrics.stallSeconds, 0.25);
    assert.equal(monitor.snapshot(999999).stallSeconds, 0.25);
});

test('a backwards playback jump resets a pending clock observation', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.tick(sample(0));
    monitor.tick(sample(250));
    monitor.tick(sample(500, { currentTime: 0 }));
    assert.equal(monitor.tick(sample(750, { currentTime: 0 })).metrics.stallCount, 0);
});

test('recent drop rate uses interval deltas, has minimum evidence, and is not a stall', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.tick(sample(0, { currentTime: 0, dropped: 100, total: 1000 }));
    const tooSmall = monitor.tick(sample(250, { currentTime: 0.25, dropped: 102, total: 1020 }));
    assert.equal(tooSmall.metrics.recentDropPercent, 10);
    assert.deepEqual(tooSmall.events, []);
    const enough = monitor.tick(sample(500, { currentTime: 0.5, dropped: 103, total: 1040 }));
    assert.deepEqual(enough.events, [{ type: 'drop', phase: 'sample', at: 500,
        dropped: 3, total: 40, percent: 7.5 }]);
    assert.equal(enough.metrics.stallCount, 0);
    assert.equal(enough.metrics.recentDropPercent, 7.5);
});

test('drop events are throttled to once per 15 seconds while the five-second window rolls', () => {
    const monitor = core.createPlaybackMonitor();
    let events = [];
    let result;
    for (let now = 0; now <= 15500; now += 250) {
        result = monitor.tick(sample(now, { currentTime: now / 1000, dropped: now / 250 * 3,
            total: now / 250 * 30 }));
        events.push(...result.events.filter(event => event.type === 'drop'));
    }
    assert.deepEqual(events.map(event => event.at), [250, 15250]);
    assert.equal(result.metrics.recentDropPercent, 10);
    assert.equal(monitor.snapshot(21000).recentDropPercent, null);
});

test('drop counter resets, stream changes and invalid counters never yield negative rates', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.tick(sample(0, { currentTime: 0, dropped: 10, total: 100 }));
    monitor.tick(sample(250, { currentTime: 0.25, dropped: 15, total: 150 }));
    assert.equal(monitor.tick(sample(500, { currentTime: 0.5, dropped: 0, total: 0 })).metrics.recentDropPercent, null);
    const afterReset = monitor.tick(sample(750, { currentTime: 0.75, dropped: 0, total: 30 }));
    assert.equal(afterReset.metrics.recentDropPercent, 0);
    assert.equal(monitor.tick(sample(1000, { key: 'new', currentTime: 0, dropped: 0, total: 1000 })).metrics.recentDropPercent, null);
    assert.equal(monitor.tick(sample(1250, { key: 'new', currentTime: 0.25, dropped: 5, total: 1001 })).metrics.recentDropPercent, null);
    assert.equal(monitor.tick(sample(1500, { key: 'new', currentTime: 0.5, dropped: null, total: null })).metrics.recentDropPercent, null);
});

test('long gaps and inactive intervals cannot supply evidence for drop-rate events', () => {
    const monitor = core.createPlaybackMonitor();
    monitor.tick(sample(0));
    const gap = monitor.tick(sample(5000, { currentTime: 5, dropped: 500, total: 1000 }));
    assert.equal(gap.metrics.recentDropPercent, null);
    assert.deepEqual(gap.events, []);
    monitor.tick(sample(5250, { paused: true, dropped: 550, total: 1100 }));
    const resume = monitor.tick(sample(5500, { currentTime: 5.5, dropped: 600, total: 1200 }));
    assert.equal(resume.metrics.recentDropPercent, null);
    assert.deepEqual(resume.events, []);
});

test('all exported monitor events contain only allowlisted numeric measurements', () => {
    const monitor = core.createPlaybackMonitor();
    const unsafe = { room: 'private room', url: 'https://secret.example/token=secret', player: { account: 'private' } };
    const events = beginBuffering(monitor, 0, unsafe).events;
    events.push(...monitor.mediaEvent('playing', sample(500, unsafe)).events);
    const allowed = new Set(['type', 'phase', 'at', 'durationMs', 'bufferSeconds', 'dropped', 'total', 'percent']);
    for (const event of events) {
        assert.equal(Object.keys(event).every(key => allowed.has(key)), true);
        assert.equal(Object.entries(event).filter(([key]) => !['type', 'phase'].includes(key))
            .every(([, value]) => value === null || Number.isFinite(value)), true);
    }
    assert.equal(JSON.stringify(events).includes('secret'), false);
});

test('the core factory remains self-contained for standalone userscript embedding', () => {
    const embedded = Function(`return (${createCore.toString()})();`)();
    const monitor = embedded.createPlaybackMonitor();
    assert.equal(beginBuffering(monitor).metrics.stallCount, 1);
});
