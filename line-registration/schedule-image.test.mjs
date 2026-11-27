import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import './schedule.js';import './schedule-image.js';
const S=globalThis.TK7Schedule,I=globalThis.TK7ScheduleImage;
const schedule=S.normalize({match_date:'2026-11-06',settings:{startTime:'20:15',timePerMatch:8},schedule:Array.from({length:20},()=>({home:'green',away:'red'}))});
const entry={blob:new Blob(['png'],{type:'image/png'}),file:{name:'TK7.png'},url:'blob:image'};
test('image uses the exact web card/export layout with every match',()=>{const html=I.buildDocument(schedule,'.web-style{}');assert.equal((html.match(/class="card match-card"/g)||[]).length,20);assert.match(html,/pitch-export-bg/);assert.match(html,/export-mode-grid/);assert.match(html,/repeat\(10,auto\)/);assert.match(html,/ทีมเขียว/);assert.match(html,/ทีมแดง/);assert.match(html,/20:15/);assert.match(html,/\.web-style\{\}/)});
test('image sharing invokes native file share immediately on mobile',async()=>{const calls=[];const promise=I.deliver(entry,{navigator:{userAgent:'iPhone',canShare:()=>true,share:x=>{calls.push(x);return Promise.resolve()}}});assert.equal(calls.length,1);assert.equal(calls[0].files[0],entry.file);assert.equal(await promise,'shared')});
test('cancelling native image sharing does not download another image',async()=>{assert.equal(await I.deliver(entry,{navigator:{userAgent:'Android',canShare:()=>true,share:()=>Promise.reject({name:'AbortError'})}}),'cancelled')});
test('desktop copies a PNG so it can be pasted into LINE',async()=>{const calls=[];class Item{constructor(x){this.data=x}}const result=await I.deliver(entry,{navigator:{userAgent:'Windows',clipboard:{write:x=>{calls.push(x);return Promise.resolve()}}},ClipboardItem:Item});assert.equal(result,'copied');assert.equal(calls[0][0].data['image/png'],entry.blob)});
test('unsupported clipboard falls back to image download',async()=>{let clicked=false;const env={navigator:{userAgent:'Windows'},document:{body:{append(){}},createElement:()=>({click(){clicked=true},remove(){}})}};assert.equal(await I.deliver(entry,env),'download');assert.equal(clicked,true)});
test('web and LIFF release numbers and source styles stay synchronized',()=>{const root=new URL('../',import.meta.url),version=JSON.parse(fs.readFileSync(new URL('version.json',root))).version;for(const f of ['index.html','line-registration/register.html'])assert.ok(fs.readFileSync(new URL(f,root),'utf8').includes('Ver '+version));assert.equal(fs.readFileSync(new URL('css/app.css',root),'utf8').replace(/\r\n/g,'\n'),fs.readFileSync(new URL('line-registration/schedule-web.css',root),'utf8').replace(/\r\n/g,'\n'))});
test('embedded browser sync exceptions fall back to download',async()=>{let downloads=0;class Item{constructor(){throw Error('unsupported')}}const env={navigator:{userAgent:'iPhone',canShare(){throw Error('blocked')},clipboard:{write(){throw Error('blocked')}}},ClipboardItem:Item,document:{body:{append(){}},createElement:()=>({click(){downloads++},remove(){}})}};assert.equal(await I.deliver(entry,env),'download');assert.equal(downloads,1)});

test('shared images keep column order and clean match/time headers without range banners',()=>{
 for(const count of [20,21,1]){
  const day=S.normalize({match_date:'2026-11-27',settings:{startTime:'20:15',timePerMatch:8},schedule:Array.from({length:count},()=>({home:'green',away:'red'}))});
  const before=JSON.stringify(day);const html=I.buildDocument(day,'');assert.ok(!html.includes('export-reading-order'));assert.ok(!html.includes('tk7-icon-clock'));assert.ok(html.includes('<span>20:15</span>'));assert.ok(html.includes('<span>แมตซ์ที่</span><span class="export-match-index">1</span>'));
  const numbers=[...html.matchAll(/class="export-match-index">(\d+)</g)].map(m=>Number(m[1]));assert.deepEqual(numbers,Array.from({length:count},(_,i)=>i+1));assert.equal(JSON.stringify(day),before);
 }
});
test('export column flow takes priority over responsive screen layout rules',()=>{
 const css=fs.readFileSync(new URL('../css/app.css',import.meta.url),'utf8');const exportRule=css.match(/\.export-mode-grid\s*\{([^}]+)\}/)[1];assert.match(exportRule,/grid-auto-flow:\s*column\s*!important/);
 assert.match(css,/\.temp-export-container \.export-mode-grid \.match-header>span:first-child/);
});

test('exported labels use separate word and number boxes with a physical gap',()=>{
 const css=fs.readFileSync(new URL('../css/app.css',import.meta.url),'utf8');
 const rule=css.match(/\.temp-export-container \.export-match-index\s*\{([^}]+)\}/)[1];assert.match(rule,/margin-left:\s*8px/);
 const html=I.buildDocument(schedule,'');assert.equal((html.match(/class="export-match-index"/g)||[]).length,20);
});
