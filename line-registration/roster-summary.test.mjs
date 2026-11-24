import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import './roster-summary.js';import {createDirectShare} from './direct-share.mjs';
const build=globalThis.TK7RosterSummary.build;
const session=()=>({id:'session',match_date:'2026-11-06',start_time:'20:15:00',is_open:true,preset_teams:['green','red'],roster:{entries:[{id:'private-one',team:'green',slot:2,name:'Bob',owner_id:'secret-owner'},{id:'private-two',team:'green',slot:1,name:'Alice'}]},group_id:'secret-group'});
test('summary groups actual names by shirt colour and slot, including date and current roster link without extra status text',()=>{
 const text=build(session());assert.ok(text.includes('6-11-2026'));assert.ok(text.includes('20:15'));assert.ok(text.includes('https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA'));for(const removed of ['👥','/ players','/ teams','เปิดรับ / Open','/7)','No players','Snapshot'])assert.ok(!text.includes(removed));assert.ok(text.includes('เขียว / Green\n1. Alice'));assert.ok(text.includes('1. Alice\n2. Bob'));assert.ok(text.includes('3.\n4.\n5.\n6.\n7.'));assert.ok(text.includes('แดง / Red\n1.\n2.'));assert.doesNotMatch(text,/liff\.line\.me|Latest roster|ดูรายชื่อล่าสุด/);assert.doesNotMatch(build(session(),{team:'green'}),/liff\.line\.me|Latest roster/);for(const value of ['private-one','private-two','secret-owner','secret-group'])assert.ok(!text.includes(value));
});
test('empty and closed rosters produce explicit summaries, and a full 70-player roster fits LINE',()=>{
 const empty=session();empty.roster.entries=[];empty.is_open=false;assert.ok(!build(empty).includes('Closed'));assert.ok(!build(empty).includes('No players'));assert.ok(build(empty).includes('1.\n2.\n3.\n4.\n5.\n6.\n7.'));assert.ok(!build(empty).includes('?date='));
 const teams=['green','red','white','blue','black','yellow','pink','orange','navy','purple'];const full=session();full.preset_teams=teams;full.roster.entries=teams.flatMap(team=>Array.from({length:7},(_,i)=>({team,slot:i+1,name:'ก'.repeat(40)})));assert.ok(build(full).length<=5000);assert.equal((build(full).match(/ก{40}/g)||[]).length,70);
});
test('summary neutralizes name line breaks, retains literal text and rejects oversized messages',()=>{
 const row=session();row.roster.entries[0].name='Name\nnot a header';assert.ok(build(row).includes('Name not a header'));row.roster.entries[0].name='x'.repeat(6000);assert.throws(()=>build(row),/ยาวเกิน/);
});
test('custom summary shares invoke the LINE picker synchronously, without replacing the normal card share',async()=>{
 const calls=[];const sdk={init:async()=>{},isLoggedIn:()=>true,isApiAvailable:()=>true,getContext:()=>({}),shareTargetPicker:messages=>{calls.push(messages);return Promise.resolve({status:'success'})}};
 const direct=createDirectShare({liffId:'2012278818-Summary',loadSdk:async()=>sdk,redirectUri:'https://example.test'});await direct.ready;const messages=[{type:'text',text:build(session())}];const result=direct.share(messages);assert.equal(calls.length,1);assert.deepEqual(calls[0],messages);await result;await direct.share();assert.equal(calls[1][0].type,'flex');assert.throws(()=>direct.share([]),/Invalid/);
});

function integration(){
 let current=session(),options,permission=true;const notices=[];
 const context={window:{TK7NativeRosterShare:{request:value=>{options=value;return true;}}},canManage:()=>permission,session:()=>current,mutating:false,ORDER:['green','red'],COLORS:{green:'เขียว',red:'แดง'},say:value=>notices.push(value),errText:e=>e.message};
 vm.createContext(context);const source=fs.readFileSync(new URL('admin-integration.js',import.meta.url),'utf8');
 vm.runInContext(source.slice(source.indexOf(' async function openRosterSummary('),source.indexOf(' let teamBusy=')),context);
 return {context,get options(){return options;},changeDate:()=>current={...current,id:'other'},revoke:()=>permission=false};
}
test('web summary delegates directly with selected teams and no preview or refresh',async()=>{
 const h=integration();await h.context.openRosterSummary('team');
 assert.equal(h.options.mode,'team');assert.equal(h.options.teams.length,2);
 assert.equal(h.options.getSnapshot().id,'session');assert.equal(h.options.isCurrent(),true);
});
test('web direct summary guards changed dates and revoked permission',async()=>{
 const h=integration();await h.context.openRosterSummary();h.changeDate();assert.equal(h.options.isCurrent(),false);
 const other=integration();await other.context.openRosterSummary();other.revoke();assert.equal(other.options.isCurrent(),false);
});
