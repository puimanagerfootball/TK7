import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('admin-integration.js',import.meta.url),'utf8');
const factoryContext={};vm.runInNewContext(source.slice(0,source.indexOf('window.TK7Admin=')),factoryContext);
const createLoader=factoryContext.createTK7OverviewLoader;
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('a mutation refresh discards an earlier poll and waits for a fresh snapshot',async()=>{
 const requests=[],applied=[];
 const refresh=createLoader(()=>{const d=deferred();requests.push(d);return d.promise;},value=>applied.push(value),()=>{});
 const poll=refresh();await Promise.resolve();
 refresh.invalidate();const afterDelete=refresh(true);
 requests[0].resolve('before-delete');await poll;await Promise.resolve();
 assert.equal(requests.length,2);assert.deepEqual(applied,[]);
 requests[1].resolve('after-delete');await afterDelete;assert.deepEqual(applied,['after-delete']);
});
test('overlapping background refreshes reuse one read',async()=>{
 const d=deferred();let calls=0;
 const refresh=createLoader(()=>{calls++;return d.promise;},()=>{},()=>{});
 const first=refresh(),second=refresh();await Promise.resolve();assert.equal(calls,1);
 d.resolve({});await Promise.all([first,second]);
});
test('failed refresh does not leave subsequent reads stuck',async()=>{
 let calls=0;const errors=[],applied=[];
 const refresh=createLoader(()=>++calls===1?Promise.reject(Error('offline')):Promise.resolve('new'),x=>applied.push(x),e=>errors.push(e.message));
 assert.equal(await refresh(),false);assert.equal(await refresh(true),true);
 assert.deepEqual(errors,['offline']);assert.deepEqual(applied,['new']);
});
function deletionHarness(selected,sessions){
 const context={data:{settings:{group_id:'dataset',environment:'production'},sessions},lastSig:'old',pulledFor:'old',refreshOverview:{invalidate(){}},renderCalls:0,Event:class{}};
 const input={value:selected,dispatchEvent(){}};
 context.$=()=>input;context.date=()=>input.value;context.cfg=()=>context.data.settings;context.render=()=>context.renderCalls++;
 const begin=source.indexOf(' function removeDeletedSession('),end=source.indexOf('\n // หลายวันเปิดรับ:',begin);
 vm.runInNewContext(source.slice(begin,end),context);return {context,input};
}
const row=(id,date)=>({id,match_date:date,group_id:'dataset',environment:'production'});
test('confirmed delete removes the card and selects a remaining day immediately',()=>{
 const a=row('a','2099-11-06'),b=row('b','2099-11-13');const {context,input}=deletionHarness(a.match_date,[a,b]);
 context.removeDeletedSession(a);
 assert.equal(context.data.sessions.length,1);assert.equal(input.value,b.match_date);assert.equal(context.renderCalls,1);
});
test('deleting the last day clears selection; switching during deletion keeps the new day',()=>{
 const a=row('a','2099-11-06'),b=row('b','2099-11-13');
 const last=deletionHarness(a.match_date,[a]);last.context.removeDeletedSession(a);assert.equal(last.input.value,'');
 const changed=deletionHarness(b.match_date,[a,b]);changed.context.removeDeletedSession(a);assert.equal(changed.input.value,b.match_date);
});
test('date switching renders synchronously and cancels pending time/colour writes',()=>{
 let handler,renders=0;const cleared=[];
 const context={$:()=>({addEventListener:(_,h)=>{handler=h;}}),clearTimeout:x=>cleared.push(x),syncTimer:1,presetTimer:2,pulledFor:'old',lastSig:'old',data:{},render:()=>renders++,load:()=>{throw Error('cached switch must not fetch');}};
 const begin=source.indexOf(" $('match-date')?.addEventListener('change',"),end=source.indexOf(" document.addEventListener('tk7:setup-date-ready'",begin);
 vm.runInNewContext(source.slice(begin,end),context);handler();assert.equal(renders,1);assert.deepEqual(cleared,[1,2]);
});
test('a late match-day request cannot overwrite the most recently selected day',async()=>{
 const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
 const begin=app.indexOf('        async function prepareSetupFormForDate('),end=app.indexOf('        async function loadInitialData(',begin);
 const pending=new Map(),applied=[];const input={value:''};
 const context={document:{getElementById:()=>input,dispatchEvent(){}},CustomEvent:class{},ensureDateLoaded:date=>{const d=deferred();pending.set(date,d);return d.promise;},updateGenerateButtonForDate(){},canManage:()=>true,appData:{a:{settings:{id:'a'}},b:{settings:{id:'b'}}},loadSettingsFromData:s=>applied.push(s.id),resetSettingsForm(){}};
 vm.runInNewContext(app.slice(begin,end),context);
 const a=context.prepareSetupFormForDate('a'),b=context.prepareSetupFormForDate('b');
 pending.get('b').resolve();await b;pending.get('a').resolve();await a;assert.deepEqual(applied,['b']);
});
