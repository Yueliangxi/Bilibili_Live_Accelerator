'use strict';

/**
 * Mount a dependency-free, isolated status panel.
 * Keep this function self-contained: the build embeds its source in a userscript.
 */
function mountPanel(root, actions) {
  const registryKey = '__BILI_LIVE_ACCELERATOR_PANEL__';
  if (root[registryKey] && typeof root[registryKey].render === 'function') {
    return root[registryKey];
  }

  const document = root.document;
  let destroyed = false;
  let expanded = false;
  let latestView = {};
  let eventSignature = '';
  let copyGeneration = 0;
  const removers = [];
  const optionNodes = new Map();

  const host = document.createElement('div');
  host.id = 'bilibili-live-accelerator-panel';
  host.style.cssText = 'all:initial;position:fixed;right:16px;bottom:72px;z-index:2147483000;display:block;color-scheme:light dark;font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { --bg:#fff; --fg:#202832; --muted:#647184; --line:#e3e8ee;
      --soft:#f3f6f9; --accent:#087fa3; --warn:#825b12; font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    [hidden] { display:none !important; }
    button,select,textarea,input { font:inherit; }
    button,select { color:var(--fg); background:var(--bg); border:1px solid var(--line); border-radius:7px; }
    button { cursor:pointer; padding:7px 10px; }
    button:hover:not(:disabled) { background:var(--soft); }
    button:disabled { opacity:.5; cursor:default; }
    button:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
    .launcher { width:44px; height:44px; padding:0; border-radius:50%; color:#fff; background:#087fa3; border:1px solid #087fa3;
      box-shadow:0 3px 15px #0003; display:grid; place-items:center; font-size:11px; font-weight:700; line-height:1.1; white-space:pre-line; }
    .launcher:hover:not(:disabled) { background:#066c8a; }
    .panel { width:340px; max-width:calc(100vw - 24px); max-height:min(680px,calc(100dvh - 104px));
      overflow:auto; border:1px solid var(--line); border-radius:12px; background:var(--bg); color:var(--fg); box-shadow:0 6px 28px #0003; }
    header { display:flex; align-items:center; gap:8px; padding:12px 14px 8px; }
    h2 { font-size:14px; line-height:1.3; margin:0; flex:1; }
    .version { font-size:10px; color:var(--muted); font-weight:400; }
    .close { border:0; padding:4px 8px; font-size:18px; line-height:1; }
    section { padding:10px 14px; border-top:1px solid var(--line); }
    h3 { margin:0 0 7px; font-size:12px; color:var(--muted); font-weight:600; }
    .quality { margin:0 0 6px; font-size:15px; font-weight:650; }
    dl { margin:0; display:grid; grid-template-columns:62px minmax(0,1fr); gap:5px 9px; }
    dt { color:var(--muted); }
    dd { margin:0; overflow-wrap:anywhere; font-variant-numeric:tabular-nums; }
    .status { margin:8px 0 0; color:var(--muted); overflow-wrap:anywhere; }
    .notice { background:var(--soft); border-radius:6px; padding:7px 8px; margin-top:8px; color:var(--warn); overflow-wrap:anywhere; }
    .setting { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:8px 0; }
    .setting:first-child { margin-top:0; }
    .setting label { cursor:pointer; }
    .setting input { width:16px; height:16px; margin:0; accent-color:var(--accent); flex:none; }
    .setting select { width:142px; padding:5px 6px; }
    .line-label { display:block; margin-bottom:5px; }
    .line-select { display:block; width:100%; padding:6px 7px; }
    .hint { color:var(--muted); font-size:11px; margin:6px 0 0; }
    .buttons { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; }
    .buttons button { flex:1; white-space:nowrap; }
    .copy-result { color:var(--muted); margin:7px 0 0; font-size:12px; }
    textarea { display:block; width:100%; height:132px; resize:vertical; margin-top:7px; padding:7px; border:1px solid var(--line);
      border-radius:6px; color:var(--fg); background:var(--soft); font-size:11px; }
    ol { padding-left:0; list-style:none; margin:0; max-height:132px; overflow:auto; }
    li { margin:4px 0; overflow-wrap:anywhere; font-size:11px; }
    time { color:var(--muted); margin-right:7px; font-variant-numeric:tabular-nums; }
    .empty { color:var(--muted); font-size:11px; margin:0; }
    @media (prefers-color-scheme:dark) { :host { --bg:#19212b; --fg:#e7edf5; --muted:#a7b5c6; --line:#35404e; --soft:#242e3a; --accent:#51c7ed; --warn:#ebc36b; } }
    @media (max-width:420px) { .panel { width:calc(100vw - 24px); } section { padding:9px 12px; } }
    @media (prefers-reduced-motion:no-preference) { button { transition:background .12s ease; } }
  `;
  shadow.appendChild(style);

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    removers.push(() => target.removeEventListener(type, listener, options));
  }

  function text(node, value) {
    const next = value == null || value === '' ? '未知' : String(value);
    if (node.textContent !== next) node.textContent = next;
  }

  function number(value, digits) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value.toFixed(digits) : null;
  }

  function invoke(name, value) {
    if (!actions || typeof actions[name] !== 'function') return;
    try {
      const result = actions[name](value);
      if (result && typeof result.catch === 'function') {
        result.catch(() => showCopyMessage('操作未完成，请稍后重试。'));
      }
    } catch (_) {
      showCopyMessage('操作未完成，请稍后重试。');
    }
  }

  const launcher = element('button', 'launcher', '直播\n加速');
  launcher.type = 'button';
  launcher.setAttribute('aria-label', '打开 Bilibili 直播加速面板');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'bla-details');
  launcher.title = 'Bilibili 直播加速：查看实际播放状态';
  shadow.appendChild(launcher);

  const panel = element('aside', 'panel');
  panel.id = 'bla-details';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Bilibili 直播加速设置和实际播放状态');
  const header = element('header');
  const heading = element('h2', '', 'Bilibili Live Accelerator ');
  const version = element('span', 'version');
  heading.appendChild(version);
  header.appendChild(heading);
  const closeButton = element('button', 'close', '×');
  closeButton.type = 'button';
  closeButton.title = '折叠面板';
  closeButton.setAttribute('aria-label', '折叠面板');
  header.appendChild(closeButton);
  panel.appendChild(header);

  const observed = element('section');
  observed.appendChild(element('h3', '', '实际播放 · 由播放器观测'));
  const quality = element('p', 'quality', '画质未知');
  observed.appendChild(quality);
  const details = element('dl');
  const metrics = {};
  [['protocol', '协议'], ['host', 'CDN'], ['video', '画面'], ['buffer', '缓冲'],
    ['stall', '总停顿'], ['buffering', '缓冲等待'], ['freeze', '疑似冻结'],
    ['recentDropped', '近期掉帧'], ['dropped', '累计掉帧']].forEach(([key, label]) => {
    details.appendChild(element('dt', '', label));
    metrics[key] = element('dd', '', '未知');
    details.appendChild(metrics[key]);
  });
  observed.appendChild(details);
  observed.appendChild(element('p', 'hint', '记录本页可观测的短暂停顿；0 次不等于完全流畅。掉帧单列，不计入停顿次数。分类是状态观测，不是原因确诊。'));
  observed.appendChild(element('p', 'hint', '近期掉帧取近 5 秒；累计掉帧由播放器提供，切换流后可能重置。'));
  const status = element('p', 'status');
  const notice = element('div', 'notice');
  notice.hidden = true;
  const conflict = element('div', 'notice');
  conflict.hidden = true;
  observed.appendChild(status);
  observed.appendChild(notice);
  observed.appendChild(conflict);
  panel.appendChild(observed);

  const settings = element('section');
  settings.appendChild(element('h3', '', '播放偏好 · 不代表当前状态'));
  function checkbox(id, label, action) {
    const row = element('div', 'setting');
    const labelNode = element('label', '', label);
    labelNode.htmlFor = id;
    const input = element('input');
    input.id = id;
    input.type = 'checkbox';
    row.appendChild(labelNode);
    row.appendChild(input);
    settings.appendChild(row);
    listen(input, 'change', () => invoke(action, input.checked));
    return input;
  }
  const enabled = checkbox('bla-enabled', '启用直播优化', 'setEnabled');
  const protocolRow = element('div', 'setting');
  const protocolLabel = element('label', '', '协议偏好');
  protocolLabel.htmlFor = 'bla-protocol';
  const protocol = element('select');
  protocol.id = 'bla-protocol';
  [['flv', '同画质 FLV 优先'], ['native', 'B 站默认']].forEach(([value, label]) => {
    const option = element('option', '', label);
    option.value = value;
    protocol.appendChild(option);
  });
  protocolRow.appendChild(protocolLabel);
  protocolRow.appendChild(protocol);
  settings.appendChild(protocolRow);
  listen(protocol, 'change', () => invoke('setProtocol', protocol.value));
  const autoRecover = checkbox('bla-recover', '持续卡住时自动恢复', 'setAutoRecover');
  settings.appendChild(element('p', 'hint', '自动恢复默认关闭。切流保护期只限制自动恢复，不屏蔽可观测的等待记录。'));
  const lineLabel = element('label', 'line-label', '线路偏好');
  lineLabel.htmlFor = 'bla-host';
  const line = element('select', 'line-select');
  line.id = 'bla-host';
  settings.appendChild(lineLabel);
  settings.appendChild(line);
  settings.appendChild(element('p', 'hint', '只选 B 站返回的有效线路。换线可能短暂重新加载；不自动降低画质。'));
  listen(line, 'change', () => invoke('selectHost', line.value));
  const buttons = element('div', 'buttons');
  const reconnect = element('button', '', '重新连接');
  reconnect.type = 'button';
  const defaults = element('button', '', '恢复默认');
  defaults.type = 'button';
  buttons.appendChild(reconnect);
  buttons.appendChild(defaults);
  settings.appendChild(buttons);
  listen(reconnect, 'click', () => invoke('reconnect'));
  listen(defaults, 'click', () => invoke('restoreDefaults'));
  panel.appendChild(settings);

  const diagnostics = element('section');
  diagnostics.appendChild(element('h3', '', '诊断 · 仅本地，不上报'));
  const copy = element('button', '', '复制诊断报告');
  copy.type = 'button';
  diagnostics.appendChild(copy);
  const copyMessage = element('p', 'copy-result');
  copyMessage.hidden = true;
  copyMessage.setAttribute('role', 'status');
  const manualCopyLabel = element('label', 'hint', '诊断报告（只读，可手动复制）');
  manualCopyLabel.htmlFor = 'bla-diagnostic';
  manualCopyLabel.hidden = true;
  const manualCopy = element('textarea');
  manualCopy.id = 'bla-diagnostic';
  manualCopy.readOnly = true;
  manualCopy.hidden = true;
  manualCopy.spellcheck = false;
  diagnostics.appendChild(copyMessage);
  diagnostics.appendChild(manualCopyLabel);
  diagnostics.appendChild(manualCopy);
  panel.appendChild(diagnostics);

  function showCopyMessage(message) {
    if (destroyed) return;
    text(copyMessage, message);
    copyMessage.hidden = false;
  }

  listen(copy, 'click', async () => {
    const generation = ++copyGeneration;
    let report;
    try {
      report = actions && typeof actions.getDiagnostic === 'function' ? actions.getDiagnostic() : '';
      if (typeof report !== 'string' || !report.trim()) throw new Error('No report');
    } catch (_) {
      showCopyMessage('暂时无法生成报告，请稍后重试。');
      return;
    }
    manualCopy.value = report;
    try {
      if (!root.navigator.clipboard || typeof root.navigator.clipboard.writeText !== 'function') throw new Error('No clipboard');
      await root.navigator.clipboard.writeText(report);
      if (destroyed || generation !== copyGeneration) return;
      manualCopy.hidden = true;
      manualCopyLabel.hidden = true;
      showCopyMessage('已复制。报告仅包含诊断信息，不会自动发送。');
    } catch (_) {
      if (destroyed || generation !== copyGeneration) return;
      manualCopy.hidden = false;
      manualCopyLabel.hidden = false;
      showCopyMessage('浏览器未允许复制，请选中下面的报告手动复制。');
      manualCopy.focus();
      manualCopy.select();
    }
  });

  const history = element('section');
  history.appendChild(element('h3', '', '最近事件'));
  const events = element('ol');
  const emptyEvents = element('p', 'empty', '暂无事件');
  history.appendChild(events);
  history.appendChild(emptyEvents);
  panel.appendChild(history);
  shadow.appendChild(panel);

  function setExpanded(value, restoreFocus) {
    if (destroyed) return;
    expanded = Boolean(value);
    panel.hidden = !expanded;
    launcher.hidden = expanded;
    launcher.setAttribute('aria-expanded', String(expanded));
    if (restoreFocus) (expanded ? closeButton : launcher).focus();
  }
  listen(launcher, 'click', () => setExpanded(true, true));
  listen(closeButton, 'click', () => setExpanded(false, true));
  listen(shadow, 'keydown', (event) => {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false, true);
    }
  });

  function fullscreenChanged() {
    const full = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    host.style.display = full ? 'none' : 'block';
  }
  listen(document, 'fullscreenchange', fullscreenChanged);
  listen(document, 'webkitfullscreenchange', fullscreenChanged);

  function renderOptions(view) {
    const preferred = typeof view.preferredHost === 'string' && view.preferredHost ? view.preferredHost : 'auto';
    const candidates = Array.isArray(view.candidates) ? view.candidates : [];
    const labels = new Map([['auto', '自动（B 站默认顺序）']]);
    for (const candidate of candidates) {
      if (!candidate || typeof candidate.host !== 'string' || !candidate.host || candidate.host === 'auto') continue;
      // An offered or preferred candidate is not proof that it is playing.
      const selected = Boolean(view.actual && view.actual.host === candidate.host);
      labels.set(candidate.host, candidate.host + (selected ? '（当前播放）' : ''));
    }
    if (preferred !== 'auto' && !labels.has(preferred)) labels.set(preferred, preferred + '（当前未提供）');
    for (const [value, node] of optionNodes) {
      if (!labels.has(value)) {
        node.remove();
        optionNodes.delete(value);
      }
    }
    let position = 0;
    for (const [value, label] of labels) {
      let option = optionNodes.get(value);
      if (!option) {
        option = element('option', '', label);
        option.value = value;
        optionNodes.set(value, option);
      }
      text(option, label);
      if (line.children[position] !== option) line.insertBefore(option, line.children[position] || null);
      position += 1;
    }
    if (line.value !== preferred) line.value = preferred;
  }

  function render(view) {
    if (destroyed) return;
    latestView = view && typeof view === 'object' ? view : {};
    const actual = latestView.actual && typeof latestView.actual === 'object' ? latestView.actual : {};
    version.textContent = latestView.version ? 'v' + latestView.version : '';
    text(quality, actual.qualityLabel || '画质未知');
    const protocolName = actual.protocol;
    text(metrics.protocol, protocolName === 'flv' ? 'HTTP-FLV' : protocolName === 'hls' ? 'HLS' : protocolName);
    text(metrics.host, actual.host);
    let resolution = actual.resolution;
    if (resolution && typeof resolution === 'object') {
      resolution = resolution.width && resolution.height ? resolution.width + ' × ' + resolution.height : null;
    }
    const fps = number(actual.fps, 0);
    text(metrics.video, (resolution || '分辨率未知') + ' · ' + (fps === null ? '帧率未知' : fps + ' FPS'));
    const buffer = number(actual.buffer, 2);
    text(metrics.buffer, buffer === null ? null : buffer + ' 秒');
    for (const [key, countKey, secondsKey] of [
      ['stall', 'stallCount', 'stallSeconds'],
      ['buffering', 'bufferingCount', 'bufferingSeconds'],
      ['freeze', 'freezeCount', 'freezeSeconds'],
    ]) {
      const count = number(actual[countKey], 0);
      const seconds = number(actual[secondsKey], 1);
      text(metrics[key], (count === null ? '次数未知' : count + ' 次') + ' · ' + (seconds === null ? '时长未知' : seconds + ' 秒'));
    }
    const recentDropPercent = number(actual.recentDropPercent, 1);
    text(metrics.recentDropped, recentDropPercent === null ? '未知（近 5 秒）' : recentDropPercent + '%（近 5 秒）');
    const dropped = number(actual.dropped, 0);
    const total = number(actual.total, 0);
    const ratio = typeof actual.total === 'number' && Number.isFinite(actual.total) && actual.total > 0 && typeof actual.dropped === 'number' && Number.isFinite(actual.dropped) && actual.dropped >= 0
      ? (actual.dropped / actual.total * 100).toFixed(1) : null;
    text(metrics.dropped, dropped === null ? null : dropped + ' / ' + (total === null ? '未知' : total) + (ratio === null ? '' : '（' + ratio + '%）'));
    text(status, latestView.statusText || '等待播放状态');
    notice.hidden = !latestView.notice;
    if (latestView.notice) text(notice, latestView.notice);
    conflict.hidden = !latestView.conflict;
    if (latestView.conflict) text(conflict, typeof latestView.conflict === 'string' ? latestView.conflict : '检测到其他播放优化脚本；建议关闭以避免冲突。');
    enabled.checked = latestView.enabled !== false;
    protocol.value = latestView.protocolPreference === 'native' ? 'native' : 'flv';
    autoRecover.checked = latestView.autoRecover === true;
    reconnect.disabled = latestView.canReconnect !== true;
    reconnect.title = reconnect.disabled ? '播放器尚未准备好，暂时无法重连' : '保持当前画质重新获取有效播放地址';
    renderOptions(latestView);
    const recent = (Array.isArray(latestView.events) ? latestView.events : []).slice(-8);
    const signature = JSON.stringify(recent.map((item) => [item && item.time, item && item.message]));
    if (signature !== eventSignature) {
      eventSignature = signature;
      while (events.firstChild) events.removeChild(events.firstChild);
      for (const item of recent) {
        if (!item) continue;
        const row = element('li');
        if (item.time != null) {
          let timestamp = String(item.time);
          if (typeof item.time === 'number' && Number.isFinite(item.time)) timestamp = new Date(item.time).toLocaleTimeString([], { hour12: false });
          row.appendChild(element('time', '', timestamp));
        }
        row.appendChild(element('span', '', item.message == null ? '' : String(item.message)));
        events.appendChild(row);
      }
      emptyEvents.hidden = events.childElementCount > 0;
    }
    launcher.title = '直播加速：' + (latestView.enabled === false ? '已关闭' : '已启用') + '；' + (actual.qualityLabel || '画质未知');
  }

  let pendingMount = false;
  function attach() {
    if (destroyed || host.isConnected) return;
    const parent = document.body || document.documentElement;
    if (parent) parent.appendChild(host);
  }
  const api = {
    render,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      copyGeneration += 1;
      for (const remove of removers.splice(0)) remove();
      host.remove();
      optionNodes.clear();
      if (root[registryKey] === api) delete root[registryKey];
    },
  };
  root[registryKey] = api;
  attach();
  if (!host.isConnected) {
    pendingMount = true;
    listen(document, 'DOMContentLoaded', () => {
      if (pendingMount) attach();
      pendingMount = false;
    }, { once: true });
  }
  fullscreenChanged();
  render({});
  return api;
}

module.exports = { mountPanel };
