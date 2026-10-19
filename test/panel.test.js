'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { mountPanel } = require('../src/panel');

// A deliberately small DOM fake. These tests verify behavior and node identity,
// not browser layout, native focus semantics, or a real clipboard permission UI.
class FakeTarget {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, callback, options) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Map());
        this.listeners.get(type).set(callback, options || {});
    }
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
    dispatch(type, event = {}) {
        const results = [];
        for (const [callback, options] of [...(this.listeners.get(type) || [])]) {
            if (options.once) this.removeEventListener(type, callback);
            results.push(callback({ type, ...event }));
        }
        return results;
    }
    listenerCount() {
        return [...this.listeners.values()].reduce((sum, handlers) => sum + handlers.size, 0);
    }
}

class FakeElement extends FakeTarget {
    constructor(tag, document) {
        super();
        this.tagName = tag.toUpperCase();
        this.ownerDocument = document;
        this.children = [];
        this.parentNode = null;
        this.style = {};
        this.attributes = {};
        this._text = '';
        this._value = '';
        this.hidden = false;
    }
    set textContent(value) {
        this._text = String(value);
        for (const child of this.children) child.parentNode = null;
        this.children = [];
    }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    appendChild(child) {
        if (child.parentNode) child.parentNode.removeChild(child);
        this.children.push(child);
        child.parentNode = this;
        return child;
    }
    insertBefore(child, before) {
        if (child.parentNode) child.parentNode.removeChild(child);
        const index = this.children.indexOf(before);
        if (index < 0) this.children.push(child);
        else this.children.splice(index, 0, child);
        child.parentNode = this;
        return child;
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) this.children.splice(index, 1);
        child.parentNode = null;
        return child;
    }
    remove() { this.parentNode?.removeChild(this); }
    attachShadow() {
        this.shadowRoot = new FakeElement('shadow-root', this.ownerDocument);
        return this.shadowRoot;
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    get firstChild() { return this.children[0] || null; }
    get childElementCount() { return this.children.length; }
    get isConnected() {
        return this === this.ownerDocument.documentElement || Boolean(this.parentNode?.isConnected);
    }
    set value(value) { this._value = value; }
    get value() { return this._value; }
    focus() { this.ownerDocument.activeElement = this; }
    select() { this.selectedText = true; }
}

class FakeDocument extends FakeTarget {
    constructor(ready = true) {
        super();
        this.documentElement = null;
        this.body = null;
        this.fullscreenElement = null;
        this.webkitFullscreenElement = null;
        this.created = [];
        if (ready) this.makeReady();
    }
    createElement(tag) {
        const element = new FakeElement(tag, this);
        this.created.push(element);
        return element;
    }
    makeReady() {
        this.documentElement = this.createElement('html');
        this.body = this.createElement('body');
        this.documentElement.appendChild(this.body);
    }
}

function find(node, predicate) {
    if (!node) return null;
    if (predicate(node)) return node;
    for (const child of node.children) {
        const result = find(child, predicate);
        if (result) return result;
    }
    return null;
}

function fixture({ ready = true, factory = mountPanel, clipboard } = {}) {
    const document = new FakeDocument(ready);
    const calls = [];
    const copied = [];
    let diagnosticCalls = 0;
    const root = {
        document,
        navigator: { clipboard: clipboard || { writeText: async report => copied.push(report) } },
    };
    const actions = Object.fromEntries(
        ['setEnabled', 'setProtocol', 'setAutoRecover', 'selectHost', 'reconnect', 'restoreDefaults']
            .map(name => [name, value => calls.push([name, value])]),
    );
    actions.getDiagnostic = () => { diagnosticCalls++; return 'safe local diagnostic'; };
    const api = factory(root, actions);
    const host = document.created.find(element => element.id === 'bilibili-live-accelerator-panel');
    const shadow = host.shadowRoot;
    return {
        root, document, actions, api, host, shadow, calls, copied,
        byId: id => find(shadow, node => node.id === id),
        byClass: name => find(shadow, node => node.className === name),
        byText: (tag, content) => find(shadow, node => node.tagName === tag.toUpperCase() && node.textContent === content),
        get diagnosticCalls() { return diagnosticCalls; },
    };
}

function playingView() {
    return {
        version: '0.1.0', enabled: true, protocolPreference: 'flv', autoRecover: false,
        actual: {
            protocol: 'hls', host: 'a.bilivideo.com', qualityLabel: '1080P 原画',
            resolution: { width: 1920, height: 1080 }, fps: 60, buffer: 2.512,
            dropped: 10, total: 100, stallCount: 3, stallSeconds: 5.8,
            bufferingCount: 2, bufferingSeconds: 4.6, freezeCount: 1, freezeSeconds: 1.2,
            recentDropPercent: 6.25,
        },
        candidates: [{ host: 'a.bilivideo.com' }, { host: 'b.bilivideo.com', selected: true }],
        preferredHost: 'b.bilivideo.com', statusText: '正常播放', canReconnect: true,
        events: [{ time: 0, message: 'ready' }],
    };
}

test('panel can be embedded from toString without module-scope dependencies', () => {
    const embeddedFactory = vm.runInNewContext('(' + mountPanel.toString() + ')');
    const f = fixture({ factory: embeddedFactory });
    f.api.render(playingView());
    assert.equal(f.byClass('quality').textContent, '1080P 原画');
    assert.equal(f.document.body.childElementCount, 1);
    f.api.destroy();
    assert.equal(f.document.body.childElementCount, 0);
});

test('actual protocol and host are never inferred from preferences or candidate selection', () => {
    const f = fixture();
    f.api.render(playingView());
    const metrics = find(f.shadow, node => node.tagName === 'DL').children.filter(node => node.tagName === 'DD');
    assert.equal(metrics[0].textContent, 'HLS');
    assert.equal(metrics[1].textContent, 'a.bilivideo.com');
    assert.equal(metrics[2].textContent, '1920 × 1080 · 60 FPS');
    assert.equal(metrics[3].textContent, '2.51 秒');
    assert.equal(metrics[4].textContent, '3 次 · 5.8 秒');
    assert.equal(metrics[5].textContent, '2 次 · 4.6 秒');
    assert.equal(metrics[6].textContent, '1 次 · 1.2 秒');
    assert.equal(metrics[7].textContent, '6.3%（近 5 秒）');
    assert.equal(metrics[8].textContent, '10 / 100（10.0%）');
    const line = f.byId('bla-host');
    assert.equal(f.byId('bla-protocol').value, 'flv');
    assert.equal(line.value, 'b.bilivideo.com');
    assert.match(line.children[1].textContent, /当前播放/);
    assert.doesNotMatch(line.children[2].textContent, /当前播放/);
    f.api.render({ ...playingView(), actual: {} });
    assert.equal(metrics[0].textContent, '未知');
    assert.equal(metrics[1].textContent, '未知');
    assert.equal(metrics[2].textContent, '分辨率未知 · 帧率未知');
    assert.equal(metrics[4].textContent, '次数未知 · 时长未知');
    assert.equal(metrics[5].textContent, '次数未知 · 时长未知');
    assert.equal(metrics[6].textContent, '次数未知 · 时长未知');
    assert.equal(metrics[7].textContent, '未知（近 5 秒）');
    assert.equal(metrics[8].textContent, '未知');
    assert.equal(f.byClass('quality').textContent, '画质未知');
    assert.ok(line.children.every(option => !option.textContent.includes('当前播放')));
    f.api.destroy();
});

test('observed stalls and drop metrics stay separate without treating zero as a smoothness guarantee', () => {
    const f = fixture();
    f.api.render({ ...playingView(), actual: {
        stallCount: 0, stallSeconds: 0, bufferingCount: 0, bufferingSeconds: 0,
        freezeCount: 0, freezeSeconds: 0, dropped: 25, total: 200, recentDropPercent: 12.5,
    } });
    const list = find(f.shadow, node => node.tagName === 'DL').children;
    const metric = label => list[list.findIndex(node => node.tagName === 'DT' && node.textContent === label) + 1].textContent;
    assert.equal(metric('总停顿'), '0 次 · 0.0 秒');
    assert.equal(metric('缓冲等待'), '0 次 · 0.0 秒');
    assert.equal(metric('疑似冻结'), '0 次 · 0.0 秒');
    assert.equal(metric('近期掉帧'), '12.5%（近 5 秒）');
    assert.equal(metric('累计掉帧'), '25 / 200（12.5%）');
    assert.match(f.shadow.textContent, /0 次不等于完全流畅/);
    assert.match(f.shadow.textContent, /掉帧单列，不计入停顿次数/);
    assert.match(f.shadow.textContent, /不是原因确诊/);
    assert.match(f.shadow.textContent, /累计掉帧由播放器提供，切换流后可能重置/);
    assert.match(f.shadow.textContent, /保护期只限制自动恢复，不屏蔽可观测的等待记录/);
    assert.equal(f.byId('bla-recover').checked, false);
    f.api.destroy();
});

test('invalid classification and drop samples remain unknown instead of appearing as zero', () => {
    const f = fixture();
    f.api.render({ ...playingView(), actual: {
        stallCount: null, stallSeconds: NaN, bufferingCount: -1, bufferingSeconds: Infinity,
        freezeCount: undefined, freezeSeconds: -1, recentDropPercent: NaN, dropped: null, total: 0,
        resolution: { width: 1920, height: 1080 }, fps: null,
    } });
    const metrics = find(f.shadow, node => node.tagName === 'DL').children.filter(node => node.tagName === 'DD');
    assert.equal(metrics[2].textContent, '1920 × 1080 · 帧率未知');
    assert.equal(metrics[4].textContent, '次数未知 · 时长未知');
    assert.equal(metrics[5].textContent, '次数未知 · 时长未知');
    assert.equal(metrics[6].textContent, '次数未知 · 时长未知');
    assert.equal(metrics[7].textContent, '未知（近 5 秒）');
    assert.equal(metrics[8].textContent, '未知');
    f.api.destroy();
});

test('collapsed launcher opens, Escape closes, and controls keep identity during metric updates', () => {
    const f = fixture();
    const launcher = f.byClass('launcher');
    const panel = f.byId('bla-details');
    assert.equal(panel.hidden, true);
    assert.equal(launcher.hidden, false);
    launcher.dispatch('click');
    assert.equal(panel.hidden, false);
    assert.equal(launcher.attributes['aria-expanded'], 'true');
    let prevented = false;
    f.shadow.dispatch('keydown', { key: 'Escape', preventDefault() { prevented = true; }, stopPropagation() {} });
    assert.equal(prevented, true);
    assert.equal(panel.hidden, true);
    assert.equal(f.document.activeElement, launcher);
    assert.equal(launcher.attributes['aria-expanded'], 'false');
    const view = playingView();
    f.api.render(view);
    const line = f.byId('bla-host');
    const option = line.children[1];
    const eventNode = find(f.shadow, node => node.tagName === 'OL').firstChild;
    line.focus();
    f.api.render({ ...view, actual: { ...view.actual, buffer: 3 } });
    assert.equal(f.byId('bla-host'), line);
    assert.equal(line.children[1], option);
    assert.equal(f.document.activeElement, line);
    assert.equal(find(f.shadow, node => node.tagName === 'OL').firstChild, eventNode);
    f.api.destroy();
});

test('settings delegate user actions without reconstructing the controls', () => {
    const f = fixture();
    f.api.render(playingView());
    f.byId('bla-enabled').checked = false;
    f.byId('bla-enabled').dispatch('change');
    f.byId('bla-protocol').value = 'native';
    f.byId('bla-protocol').dispatch('change');
    f.byId('bla-recover').checked = true;
    f.byId('bla-recover').dispatch('change');
    f.byId('bla-host').value = 'auto';
    f.byId('bla-host').dispatch('change');
    f.byText('button', '重新连接').dispatch('click');
    f.byText('button', '恢复默认').dispatch('click');
    assert.deepEqual(f.calls, [
        ['setEnabled', false], ['setProtocol', 'native'], ['setAutoRecover', true],
        ['selectHost', 'auto'], ['reconnect', undefined], ['restoreDefaults', undefined],
    ]);
    f.api.render({ ...playingView(), canReconnect: false });
    assert.equal(f.byText('button', '重新连接').disabled, true);
    f.api.destroy();
});

test('diagnostic generation and clipboard access occur only after a click, with manual-copy fallback', async () => {
    const f = fixture();
    f.api.render(playingView());
    assert.equal(f.diagnosticCalls, 0);
    assert.equal(f.copied.length, 0);
    const copy = f.byText('button', '复制诊断报告');
    await Promise.all(copy.dispatch('click'));
    assert.equal(f.diagnosticCalls, 1);
    assert.deepEqual(f.copied, ['safe local diagnostic']);
    assert.equal(f.byId('bla-diagnostic').hidden, true);
    f.root.navigator.clipboard.writeText = async () => { throw new Error('denied'); };
    await Promise.all(copy.dispatch('click'));
    const report = f.byId('bla-diagnostic');
    assert.equal(report.hidden, false);
    assert.equal(report.readOnly, true);
    assert.equal(report.value, 'safe local diagnostic');
    assert.equal(report.selectedText, true);
    f.api.destroy();
});

test('dynamic content stays text and recent events remain bounded', () => {
    const f = fixture();
    f.api.render({
        ...playingView(), notice: '<img src=x onerror=alert(1)>',
        events: Array.from({ length: 10 }, (_, index) => ({ time: index, message: '<script>' + index + '</script>' })),
    });
    assert.equal(find(f.shadow, node => node.tagName === 'IMG'), null);
    assert.equal(find(f.shadow, node => node.tagName === 'SCRIPT'), null);
    assert.match(f.byClass('notice').textContent, /<img/);
    const history = find(f.shadow, node => node.tagName === 'OL');
    assert.equal(history.childElementCount, 8);
    assert.match(history.firstChild.textContent, /<script>2<\/script>/);
    f.api.destroy();
});

test('native and WebKit fullscreen hide the panel and restore it after exit', () => {
    const f = fixture();
    f.document.fullscreenElement = {};
    f.document.dispatch('fullscreenchange');
    assert.equal(f.host.style.display, 'none');
    f.document.fullscreenElement = null;
    f.document.dispatch('fullscreenchange');
    assert.equal(f.host.style.display, 'block');
    f.document.webkitFullscreenElement = {};
    f.document.dispatch('webkitfullscreenchange');
    assert.equal(f.host.style.display, 'none');
    f.document.webkitFullscreenElement = null;
    f.document.dispatch('webkitfullscreenchange');
    assert.equal(f.host.style.display, 'block');
    f.api.destroy();
});

test('repeated mount reuses one instance; destroy removes nodes and every listener', () => {
    const f = fixture();
    assert.equal(mountPanel(f.root, f.actions), f.api);
    assert.equal(f.document.body.childElementCount, 1);
    assert.ok(f.document.listenerCount() > 0);
    f.api.destroy();
    f.api.destroy();
    assert.equal(f.document.body.childElementCount, 0);
    assert.equal(f.document.listenerCount(), 0);
    assert.equal(f.document.created.reduce((sum, element) => sum + element.listenerCount(), 0), 0);
    assert.equal(f.shadow.listenerCount(), 0);
    assert.equal(f.root.__BILI_LIVE_ACCELERATOR_PANEL__, undefined);
    f.api.render(playingView());
    assert.equal(f.document.body.childElementCount, 0);
    const replacement = mountPanel(f.root, f.actions);
    assert.notEqual(replacement, f.api);
    assert.equal(f.document.body.childElementCount, 1);
    replacement.destroy();
});

test('document-start without a document root mounts once on DOMContentLoaded', () => {
    const f = fixture({ ready: false });
    assert.equal(f.host.isConnected, false);
    assert.equal(mountPanel(f.root, f.actions), f.api);
    f.document.makeReady();
    f.document.dispatch('DOMContentLoaded');
    assert.equal(f.host.isConnected, true);
    assert.equal(f.document.body.childElementCount, 1);
    f.document.dispatch('DOMContentLoaded');
    assert.equal(f.document.body.childElementCount, 1);
    f.api.destroy();
    assert.equal(f.document.listenerCount(), 0);
});

test('destroy before DOMContentLoaded prevents a delayed remount', () => {
    const f = fixture({ ready: false });
    f.api.destroy();
    assert.equal(f.document.listenerCount(), 0);
    f.document.makeReady();
    f.document.dispatch('DOMContentLoaded');
    assert.equal(f.document.body.childElementCount, 0);
    assert.equal(f.host.isConnected, false);
});

test('an in-flight clipboard rejection cannot reopen a destroyed panel', async () => {
    let rejectCopy;
    const f = fixture({ clipboard: { writeText: () => new Promise((_resolve, reject) => { rejectCopy = reject; }) } });
    const pending = f.byText('button', '复制诊断报告').dispatch('click');
    f.api.destroy();
    rejectCopy(new Error('permission denied'));
    await Promise.all(pending);
    assert.equal(f.byId('bla-diagnostic').hidden, true);
    assert.equal(f.document.body.childElementCount, 0);
});
