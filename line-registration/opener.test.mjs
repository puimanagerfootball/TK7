import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('        function openerPairKey('),source.indexOf('        function setOpenerReelTeam('));
const pair=(home,away)=>({home,away});
function context(){const c={};vm.createContext(c);vm.runInContext(functions,c);return c}
test('reversed home and away counts as the same opening match',()=>{const c=context();for(let n=0;n<100;n++){const result=c.pickRandomOpenerPair(['green','red','blue'],pair('green','red'),[],()=>n/100);assert.notEqual(c.openerPairKey(result),c.openerPairKey(pair('red','green')))}});
test('unused pairs are preferred over previous saved openers',()=>{const c=context(),history=[pair('red','green'),pair('blue','green')];for(let n=0;n<100;n++){const result=c.pickRandomOpenerPair(['green','red','blue'],null,history,()=>n/100);assert.equal(c.openerPairKey(result),'blue|red')}});
test('when every pair was used the least recently used available pair wins',()=>{const c=context(),history=[pair('green','red'),pair('blue','red'),pair('blue','green')];const result=c.pickRandomOpenerPair(['green','red','blue'],null,history,()=>0);assert.equal(c.openerPairKey(result),'blue|green')});
test('only two distinct teams may necessarily repeat; invalid or duplicate pools are safe',()=>{const c=context();assert.equal(c.pickRandomOpenerPair(['green','green']),null);const result=c.pickRandomOpenerPair(['green','red','green'],pair('red','green'),[pair('green','red')],()=>0);assert.equal(c.openerPairKey(result),'green|red')});
test('every eligible matchup can be selected instead of retrying the same ordered pair',()=>{const c=context(),keys=new Set();for(const random of [0,.34,.67])keys.add(c.openerPairKey(c.pickRandomOpenerPair(['green','red','blue'],null,[],()=>random)));assert.equal(keys.size,3)});
function spinning({failure=false,current=true}={}){
 const saved={schedule:[pair('green','red'),pair('blue','green')]};
 for(const match of saved.schedule)Object.freeze(match);Object.freeze(saved.schedule);Object.freeze(saved);
 const calls=[],done=[],errors=[],machine={classList:{add(){},remove(){}}},lever={disabled:false,classList:{add(){},remove(){}}};
 const query={select(columns){calls.push(['select','match_days',columns]);return this},lt(field,date){calls.push(['lt',field,date]);return this},order(){return this},async limit(n){calls.push(['limit',n]);return {data:[{schedule:[pair('green','red')]}],error:failure?{message:'offline'}:null}}};
 const ctx={appData:{'2026-11-06':saved},db:{from:()=>query},openerSpinning:false,sleep:async()=>{},setOpenerReelTeam(){},showToast:e=>errors.push(e),renderSchedulePreview(){},renderScheduleOpenerCard(){},currentDateKey:'2026-11-13',alert(){}};
 vm.createContext(ctx);vm.runInContext(functions,ctx);
 vm.runInContext(source.slice(source.indexOf('        async function spinOpenerSlotMachine('),source.indexOf('        async function updateScheduleFromOpenerCard(')),ctx);
 const root={querySelector:s=>s==='.opener-slot-machine'?machine:s==='.opener-lever'?lever:{}};
 return {ctx,saved,calls,done,errors,lever,run:()=>ctx.spinOpenerSlotMachine({root,teamPool:['green','red','blue'],currentPair:pair('green','red'),matchDate:'2026-11-06',isCurrent:()=>current,onDone:r=>done.push(r)})};
}
test('spinning reads only prior days and never writes or reorders an existing schedule',async()=>{const h=spinning(),before=JSON.stringify(h.saved);await h.run();assert.equal(JSON.stringify(h.saved),before);assert.equal(h.done.length,1);assert.notEqual(h.ctx.openerPairKey(h.done[0]),'green|red');assert.ok(h.calls.some(c=>c[0]==='lt'&&c[2]==='2026-11-06'));assert.equal(h.calls.filter(c=>c[0]==='select').length,1);assert.equal(h.ctx.openerSpinning,false)});
test('changing date mid-spin discards the draft and releases the lever',async()=>{const h=spinning({current:false});await h.run();assert.equal(h.done.length,0);assert.equal(h.lever.disabled,false);assert.equal(h.ctx.openerSpinning,false)});
test('history errors preserve the saved schedule and do not secretly select a new pair',async()=>{const h=spinning({failure:true}),before=JSON.stringify(h.saved);await h.run();assert.equal(h.done.length,0);assert.equal(h.errors.length,1);assert.equal(h.lever.disabled,false);assert.equal(JSON.stringify(h.saved),before)});
