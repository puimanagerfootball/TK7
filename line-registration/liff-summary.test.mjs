import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import './roster-summary.js';
const source=fs.readFileSync(new URL('registration.js',import.meta.url),'utf8'),code=source.slice(source.indexOf('async function openRosterSummary(){'),source.indexOf('function shareSchedule(){'));
class Node{constructor(tag,props={},children=[]){this.tag=tag;Object.assign(this,props);this.children=children.flat().filter(Boolean)}get firstElementChild(){return this.children[0]}all(tag){return this.children.flatMap(n=>[...(n.tag===tag?[n]:[]),...n.all(tag)])}}
function setup({fail=false,available=true,shareStatus='success',shareError=false}={}){
 const calls=[],content=new Node('div');let visible=false;
 const data={matchDate:'2026-11-06',startTime:'20:15',isOpen:true,presetTeams:['green'],entries:[{team:'green',slot:1,name:'Alice'},{team:'green',slot:6,name:'Bob'}]};
 const context={sessionId:'one',busy:false,lang:'th',window:{TK7RosterSummary:globalThis.TK7RosterSummary},el:(tag,props,...children)=>new Node(tag,props,children),$:id=>id==='sheet'?{classList:{contains:()=>visible}}:content,openSheet:n=>{content.children=[n];visible=true},closeSheet:()=>visible=false,toast(){},api:async(action,input)=>{calls.push(['read',action,input]);if(fail)throw Error('offline');return data},liff:{isLoggedIn:()=>true,isApiAvailable:()=>available,shareTargetPicker:messages=>{calls.push(['picker',messages]);return shareError?Promise.reject(Error('share failed')):Promise.resolve({status:shareStatus})}}};vm.createContext(context);vm.runInContext(code,context);return {context,content,calls,data,get visible(){return visible}};
}
test('LIFF prepares the same seven-slot text as web and presents only send and close',async()=>{
 const h=setup();await h.context.openRosterSummary();const box=h.content.firstElementChild;assert.equal(box.all('button').length,2);
 assert.equal(box.all('textarea')[0].value,globalThis.TK7RosterSummary.build({match_date:h.data.matchDate,start_time:h.data.startTime,is_open:h.data.isOpen,preset_teams:h.data.presetTeams,roster:h.data}));
 assert.equal(h.calls.filter(x=>x[0]==='picker').length,0);const send=box.all('button').find(n=>n.class==='primary');const sending=send.onclick();assert.equal(h.calls.filter(x=>x[0]==='picker').length,1);await sending;assert.equal(h.visible,false);
 const text=h.calls.find(x=>x[0]==='picker')[1][0].text;assert.match(text,/1\. Alice\n2\.\n3\.\n4\.\n5\.\n6\. Bob\n7\./);
});
test('failed LIFF reads keep sending disabled, and changed dates cannot send a stale summary',async()=>{
 const failed=setup({fail:true});await failed.context.openRosterSummary();assert.equal(failed.content.firstElementChild.all('button').find(n=>n.class==='primary').disabled,true);
 const h=setup();await h.context.openRosterSummary();h.context.sessionId='other';await h.content.firstElementChild.all('button').find(n=>n.class==='primary').onclick();assert.equal(h.calls.filter(x=>x[0]==='picker').length,0);
});
test('unavailable LINE sharing does not send or create a replacement message',async()=>{
 const h=setup({available:false});await h.context.openRosterSummary();await h.content.firstElementChild.all('button').find(n=>n.class==='primary').onclick();assert.equal(h.calls.filter(x=>x[0]==='picker').length,0);
});
test('the participant page loads the summary formatter and the mirror includes it',()=>{
 const html=fs.readFileSync(new URL('register.html',import.meta.url),'utf8');assert.match(html,/src="roster-summary\.js\?v=/);assert.match(source,/onclick:openRosterSummary/);assert.match(fs.readFileSync(new URL('../scripts/sync-liff-site.mjs',import.meta.url),'utf8'),/'roster-summary.js'/);
});

test('LIFF cancellation and share failure keep the summary form open',async()=>{for(const options of [{shareStatus:'cancelled'},{shareError:true}]){const h=setup(options);await h.context.openRosterSummary();await h.content.firstElementChild.all('button').find(n=>n.class==='primary').onclick();assert.equal(h.visible,true)}});
