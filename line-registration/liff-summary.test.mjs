import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import './roster-summary.js';
const source=fs.readFileSync(new URL('registration.js',import.meta.url),'utf8'),code=source.slice(source.indexOf('async function openRosterSummary('),source.indexOf('function shareSchedule(){'));
function setup({available=true}={}){
 const calls=[];let options;
 const data={matchDate:'2026-11-06',startTime:'20:15',isOpen:true,presetTeams:['green'],entries:[{team:'green',slot:1,name:'Alice'}]};
 const context={sessionId:'one',busy:false,lang:'th',roster:data,COLORS:[['green']],label:()=> 'Green',window:{TK7NativeRosterShare:{request:value=>{options=value;return true;}}},toast(){},liff:{isLoggedIn:()=>true,isApiAvailable:()=>available,shareTargetPicker:messages=>{calls.push(messages);return Promise.resolve({status:'success'});}}};
 vm.createContext(context);vm.runInContext(code,context);return {context,calls,data,get options(){return options;}};
}
test('LIFF shares the current roster through the common direct flow',async()=>{
 const h=setup();await h.context.openRosterSummary('team');assert.equal(h.options.mode,'team');assert.equal(h.options.teams[0].slug,'green');
 const text=globalThis.TK7RosterSummary.build(h.options.getSnapshot());const pending=h.options.sendText(text);assert.equal(h.calls[0][0].text,text);await pending;
});
test('changed LIFF day or busy state blocks stale summaries',async()=>{
 const h=setup();await h.context.openRosterSummary();assert.equal(h.options.isCurrent(),true);h.context.sessionId='other';assert.equal(h.options.isCurrent(),false);
 h.context.sessionId='one';h.context.busy=true;assert.equal(h.options.isCurrent(),false);
});
test('unavailable LINE sharing does not invoke the picker',async()=>{
 const h=setup({available:false});await h.context.openRosterSummary();assert.throws(()=>h.options.sendText('Roster'));assert.equal(h.calls.length,0);
});
test('the participant page and mirror include the common direct summary helper',()=>{
 const html=fs.readFileSync(new URL('register.html',import.meta.url),'utf8');assert.ok(html.includes('native-roster-share.js?v='));assert.ok(fs.readFileSync(new URL('../scripts/sync-liff-site.mjs',import.meta.url),'utf8').includes("'native-roster-share.js'"));
});
