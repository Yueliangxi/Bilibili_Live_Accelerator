'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createCore } = require('../src/core');
const { mountPanel } = require('../src/panel');
const { startAccelerator } = require('../src/runtime');
const { version } = require('../package.json');
const license = fs.readFileSync(path.join(__dirname, '..', 'LICENSE'), 'utf8');
const repository = 'https://github.com/Yueliangxi/Bilibili_Live_Accelerator';
const distribution = 'https://raw.githubusercontent.com/Yueliangxi/Bilibili_Live_Accelerator/main';

const header = `// ==UserScript==
// @name         Bilibili Live Accelerator
// @name:zh-CN   B站直播加速器
// @namespace    local.bilibili-live-accelerator
// @version      ${version}
// @author       Yueliangxi
// @description  Same-quality FLV preference, official CDN choices and classified playback diagnostics. No telemetry.
// @description:zh-CN 同画质 FLV 优先、官方线路选择、短暂停顿与掉帧分类记录。无测速抢带宽、无诊断上报。
// @homepageURL  ${repository}
// @supportURL   ${repository}/issues
// @source       ${repository}
// @updateURL    ${distribution}/bilibili-live-accelerator.meta.js
// @downloadURL  ${distribution}/bilibili-live-accelerator.user.js
// @match        https://live.bilibili.com/*
// @run-at       document-start
// @noframes
// @grant        none
// @sandbox      raw
// @license      GPL-3.0-only
// ==/UserScript==
`;
const script = `${header}\n/*\n${license.trimEnd()}\n*/\n\n(() => {\n'use strict';\nconst createCore = ${createCore.toString()};\nconst mountPanel = ${mountPanel.toString()};\nconst startAccelerator = ${startAccelerator.toString()};\nstartAccelerator(window, createCore, mountPanel, ${JSON.stringify(version)});\n})();\n`;
const destination = path.join(__dirname, '..', 'bilibili-live-accelerator.user.js');
fs.writeFileSync(destination, script);
fs.writeFileSync(path.join(__dirname, '..', 'bilibili-live-accelerator.meta.js'), header);
process.stdout.write(`Built bilibili-live-accelerator.user.js v${version} (${Buffer.byteLength(script)} bytes)\n`);
