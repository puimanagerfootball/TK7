import test from 'node:test';import assert from 'node:assert/strict';import '../js/score-writer.js';
const make=options=>globalThis.TK7ScoreWriter.create({setTimer:()=>1,clearTimer(){},...options});
const scores=n=>[{home:'green',away:'red',homeScore:n,awayScore:null}];
test('idle flushes never write, while a burst of 100 edits produces one write',async()=>{
 const writes=[];const writer=make({save:async value=>{writes.push(value);return {updated_at:'v2'}}});await writer.flush();assert.equal(writes.length,0);
 for(let n=1;n<=100;n++)writer.mark('a',scores(n),'v1',scores(0));await writer.flush();assert.equal(writes.length,1);assert.equal(writes[0].schedule[0].homeScore,100);assert.equal(writes[0].baseline[0].homeScore,0);
});
test('switching dates preserves and writes both drafts with their original dates',async()=>{
 const writes=[];const writer=make({save:async value=>{writes.push(value);return {updated_at:'v2'}}});writer.mark('a',scores(1),'a1',scores(0));writer.mark('b',scores(2),'b1',scores(0));await writer.flush();assert.deepEqual(writes.map(x=>x.date),['a','b']);
});
test('edits made during a save are serialized and use the returned revision',async()=>{
 let finish;const writes=[];const writer=make({save:async value=>{writes.push(value);if(writes.length===1)return new Promise(r=>finish=r);return {updated_at:'v3'}}});
 writer.mark('a',scores(1),'v1',scores(0));const saving=writer.flush();await Promise.resolve();writer.mark('a',scores(2),'v1',scores(1));finish({updated_at:'v2'});await saving;
 assert.equal(writes.length,2);assert.equal(writes[1].version,'v2');assert.equal(writes[1].schedule[0].homeScore,2);assert.equal(writer.hasPending(),false);
});
test('failed writes retain the draft and retry without an automatic request loop',async()=>{
 let fail=true;const writes=[];const writer=make({save:async value=>{writes.push(value);if(fail)throw Error('offline');return {updated_at:'v2'}}});writer.mark('a',scores(1),'v1',scores(0));assert.equal(await writer.flush(),false);assert.equal(writer.hasPending('a'),true);assert.equal(writes.length,1);fail=false;assert.equal(await writer.flush(),true);assert.equal(writes.length,2);
});
test('a saved date is not written a second time on navigation or pagehide',async()=>{
 let writes=0;const writer=make({save:async()=>{writes++;return {updated_at:'v2'}}});writer.mark('a',scores(1),'v1',scores(0));await writer.flush();await writer.flush();await writer.flush('a');assert.equal(writes,1);
});
test('explicitly discarded drafts cannot be saved by a later timer or navigation',async()=>{
 let writes=0;const writer=make({save:async()=>{writes++;return {updated_at:'v2'}}});writer.mark('a',scores(1),'v1',scores(0));writer.discard();await writer.flush();assert.equal(writer.hasPending(),false);assert.equal(writes,0);
});
function database({row={updated_at:'v2'},read={schedule:scores(0),updated_at:'v1'},error=null}={}){
 const calls=[];let mode;
 const query={select(value){calls.push(['select',value]);return this},eq(key,value){calls.push(['eq',key,value]);return this},maybeSingle:async()=>({data:mode==='update'?row:read,error})};
 return {calls,from:()=>({select:value=>{mode='read';return query.select(value)},update:input=>{mode='update';calls.push(['update',input]);return query}})};
}
test('database saves compare the expected revision and refuse a concurrent overwrite',async()=>{
 const db=database({row:null});await assert.rejects(()=>globalThis.TK7ScoreWriter.persist(db,{date:'a',schedule:scores(2),version:'v1'}),/ตารางเปลี่ยน/);assert.ok(db.calls.some(x=>x[0]==='eq'&&x[1]==='updated_at'&&x[2]==='v1'));
});
test('missing revisions are loaded only after checking the original schedule baseline',async()=>{
 const db=database();await globalThis.TK7ScoreWriter.persist(db,{date:'a',schedule:scores(2),baseline:scores(0)});assert.ok(db.calls.some(x=>x[0]==='eq'&&x[1]==='updated_at'&&x[2]==='v1'));
 const conflict=database({read:{schedule:scores(9),updated_at:'other'}});await assert.rejects(()=>globalThis.TK7ScoreWriter.persist(conflict,{date:'a',schedule:scores(2),baseline:scores(0)}),/ตารางบนเซิร์ฟเวอร์เปลี่ยน/);assert.equal(conflict.calls.some(x=>x[0]==='update'),false);
});
