'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { version } = require('../package.json');

test('built userscript starts without module dependencies and cleans up its waiting state', () => {
    const directory = path.join(__dirname, '..');
    execFileSync(process.execPath, ['scripts/build.js'], { cwd: directory });
    const source = fs.readFileSync(path.join(directory, 'bilibili-live-accelerator.user.js'), 'utf8');
    assert.equal(source.includes('// @version      ' + version), true);
    assert.equal(source.includes('GNU GENERAL PUBLIC LICENSE'), true);
    assert.equal(/@(?:require|resource|connect)\b/.test(source), false);
    const metadata = fs.readFileSync(path.join(directory, 'bilibili-live-accelerator.meta.js'), 'utf8');
    assert.equal(metadata, source.slice(0, source.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length) + '\n');
    assert.match(metadata, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/Yueliangxi\/Bilibili_Live_Accelerator\/main\/bilibili-live-accelerator\.meta\.js/);
    assert.match(metadata, /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/Yueliangxi\/Bilibili_Live_Accelerator\/main\/bilibili-live-accelerator\.user\.js/);
    assert.equal(/\brequire\s*\(/.test(source), false);
    const intervals = new Map();
    let intervalId = 0;
    const originalFetch = async () => new Response('{}');
    const window = {
        location: { pathname: '/123' },
        document: {
            visibilityState: 'visible', querySelectorAll: () => [],
            // Simulate a document where the optional panel cannot mount yet.
            createElement() { throw new Error('DOM unavailable'); },
            addEventListener() {}, removeEventListener() {},
        },
        performance: { now: () => 0 },
        fetch: originalFetch, Request, Response, Headers,
        localStorage: { getItem: () => null, setItem() {} },
        setInterval(callback) { intervals.set(++intervalId, callback); return intervalId; },
        clearInterval(id) { intervals.delete(id); },
        setTimeout() { return 1; }, clearTimeout() {},
        addEventListener() {}, removeEventListener() {},
    };
    const context = vm.createContext({ window, URL });
    vm.runInContext(source, context, { timeout: 1000 });
    const api = window.__BILI_LIVE_ACCELERATOR__;
    assert.equal(api.version, version);
    const report = JSON.parse(api.getDiagnostic());
    assert.equal(report.preferences.autoRecover, false);
    assert.equal(report.playback.host, null);
    assert.equal(report.nativeReconnectAvailable, false);
    assert.equal(intervals.size, 1);
    vm.runInContext(source, context, { timeout: 1000 });
    assert.equal(intervals.size, 1, 'duplicate userscript execution must not stack timers');
    api.dispose();
    assert.equal(window.fetch, originalFetch);
    assert.equal(window.__BILI_LIVE_ACCELERATOR__, undefined);
    assert.equal(intervals.size, 0);
    window.location.pathname = '/';
    vm.runInContext(source, context, { timeout: 1000 });
    assert.equal(window.__BILI_LIVE_ACCELERATOR__, undefined, 'non-room pages stay untouched');
});
