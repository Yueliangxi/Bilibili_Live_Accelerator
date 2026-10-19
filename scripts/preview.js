'use strict';

// Local UI fixture only: no Bilibili login, video requests, or real signed URLs.
const http = require('node:http');
const path = require('node:path');
const panelPath = path.join(__dirname, '..', 'src', 'panel.js');
const corePath = path.join(__dirname, '..', 'src', 'core.js');
const { version } = require('../package.json');
const server = http.createServer((request, response) => {
    if (request.url !== '/') { response.writeHead(404).end(); return; }
    delete require.cache[require.resolve(panelPath)];
    delete require.cache[require.resolve(corePath)];
    const { mountPanel } = require(panelPath);
    const { createCore } = require(corePath);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Live Accelerator · 本地面板预览</title><style>
body{margin:0;background:#edf2f6;color:#26394c;font:16px/1.7 system-ui,sans-serif}main{max-width:920px;margin:8vh auto;padding:24px}h1{font-size:28px}.screen{height:45vh;border-radius:18px;background:linear-gradient(135deg,#163343,#36646e);display:grid;place-items:center;color:#c5e6ec;font-size:22px}p{max-width:650px}small{color:#637386}@media(prefers-color-scheme:dark){body{background:#101923;color:#d9e7f2}}
</style><main><small>开发预览 · 模拟数据 · 没有直播请求</small><h1>Bilibili Live Accelerator</h1><p>右下角打开面板。这里仅检验界面、键盘操作和设置反馈，不代表真实直播测速结果。</p><p><button id="simulate-wait">模拟 0.4 秒缓冲等待</button> <button id="simulate-freeze">模拟疑似冻结</button> <button id="simulate-drop">模拟较高掉帧</button></p><div class="screen">原生直播播放器区域（示意）</div></main>
<script>(()=>{'use strict';const mountPanel=${mountPanel.toString()};const createCore=${createCore.toString()};
const core=createCore();const monitor=core.createPlaybackMonitor();
const view={version:${JSON.stringify(version)},enabled:true,protocolPreference:'flv',autoRecover:false,preferredHost:'auto',canReconnect:true,notice:'',statusText:'模拟观测；自动恢复未开启',conflict:false,actual:{protocol:'FLV',host:'d1--ov-gotcha07.bilivideo.com',qualityLabel:'1080P 原画',resolution:'1920x1080',fps:null,buffer:3,dropped:0,total:0,...monitor.snapshot(0)},candidates:[{host:'d1--ov-gotcha07.bilivideo.com'},{host:'d1--ov-gotcha07b.bilivideo.com'}],events:[{time:Date.now(),message:'本地预览已就绪；所有数值均为模拟数据'}]};
let panel;const render=()=>panel.render(view);const update=(message)=>{view.events.push({time:Date.now(),message});render()};
const actions={setEnabled(value){view.enabled=value;update(value?'已启用（预览）':'已关闭（预览）')},setProtocol(value){view.protocolPreference=value;view.notice='已更新偏好，实际协议需要重新加载后观测';update('协议偏好已更新（预览）')},setAutoRecover(value){view.autoRecover=value;update('自动恢复偏好已更新（预览）')},selectHost(value){view.preferredHost=value;view.notice='已更新线路偏好；不将偏好冒充实际播放';update('线路偏好已更新（预览）')},reconnect(){if(view.preferredHost!=='auto')view.actual.host=view.preferredHost;view.notice='模拟重连完成；这不是实际直播验证';update('模拟重连')},restoreDefaults(){Object.assign(view,{enabled:false,protocolPreference:'native',autoRecover:false,preferredHost:'auto'});view.notice='恢复原生播放（预览）';update('恢复默认（预览）')},getDiagnostic(){return core.diagnostic(view)}};
panel=mountPanel(window,actions);render();
let clock=0,mediaTime=10,total=0,dropped=0;
function feed(extra={},type){const sample={now:clock,key:'fixture',hasVideo:true,hidden:false,paused:false,ended:false,seeking:false,playbackRate:1,currentTime:mediaTime,buffer:3,readyState:4,dropped,total,frameMonitorAvailable:false,...extra};const result=type?monitor.mediaEvent(type,sample):monitor.tick(sample);Object.assign(view.actual,result.metrics,{buffer:sample.buffer,dropped,total});for(const entry of result.events){const name=entry.type==='buffering'?'缓冲等待':entry.type==='freeze'?'疑似冻结':'掉帧';view.events.push({time:Date.now(),message:'模拟'+name+' '+entry.phase+(Number.isFinite(entry.durationMs)?' '+(entry.durationMs/1000).toFixed(2)+' 秒':'')})}view.events=view.events.slice(-12);render()}
function healthy(ms,withDrops=false){for(let elapsed=0;elapsed<ms;elapsed+=250){clock+=250;mediaTime+=0.25;total+=15;if(withDrops)dropped+=2;feed()}}
feed();
document.getElementById('simulate-wait').addEventListener('click',()=>{healthy(1000);clock+=100;feed({buffer:0,readyState:1},'waiting');clock+=250;feed({buffer:0,readyState:1});clock+=150;mediaTime+=0.15;feed({},'playing')});
document.getElementById('simulate-freeze').addEventListener('click',()=>{healthy(1000);for(let step=0;step<4;step++){clock+=250;feed()}healthy(250)});
document.getElementById('simulate-drop').addEventListener('click',()=>healthy(5000,true));
})();</script></html>`);
});
server.listen(42371, '127.0.0.1', () => process.stdout.write('Panel preview: http://127.0.0.1:42371/ (simulation only)\n'));
