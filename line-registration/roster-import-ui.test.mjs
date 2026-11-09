import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import './roster-text.js';

const source=fs.readFileSync(new URL('../js/roster-import-ui.js',import.meta.url),'utf8');
const paste=name=>'🟢 เขียว / Green\n1. '+name+'\n2.\n3.\n4.\n5.\n6.\n7.';
class Node {
 constructor(tag,props={},...children){this.tag=tag;Object.assign(this,props);this.children=children;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 focus(){}
 find(predicate){return predicate(this)?this:this.children.map(node=>node.find(predicate)).find(Boolean);}
}
function setup({refresh=async()=>true,fail=false,entries=[{team:'green',slot:1,name:'Previous'}]}={}){
 const body=new Node('body'),calls=[];
 const timers=new Map();
 const session={id:'chosen',match_date:'2026-11-06',is_open:true,revision:7,teams:['green','red'],roster:{entries}};
 const context=vm.createContext({window:{TK7Backdrop:{install(){}},TK7RosterText:globalThis.TK7RosterText},document:{body,addEventListener(){}},crypto:{randomUUID},
  setTimeout:fn=>{const id=Symbol();timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source,context);
 context.TK7RosterImportUI.create({
  el:(...args)=>new Node(...args),getSession:()=>session,canManage:()=>true,refresh,
  rpc:async (name,params)=>{calls.push({name,params});if(fail&&calls.length===1)throw Error('Offline');return {added:0,changed:1,deleted:0};}
 }).open();
 const modal=body.children[0];
 const input=modal.find(node=>node.tag==='textarea');
 const review=modal.find(node=>node.text==='ตรวจสอบก่อนนำเข้า');
 const apply=modal.find(node=>node.text==='ยืนยันนำเข้า');
 const dateCheck=modal.find(node=>node.type==='checkbox');
 return {modal,input,review,apply,dateCheck,calls,timers,runQueued:()=>[...timers.values()][0]?.()};
}
test('a lone team name offers an optional seven-slot booking without changing the default import',async()=>{
 for(const expanded of [false,true]){
  const h=setup({entries:[]});
  h.input.value='📅 6-11-2026\n'+paste('ทีมเก็ตแมน').replace('1. ทีมเก็ตแมน','1.').replace('4.','4.ทีมเก็ตแมน');
  await h.review.onclick();
  const suggestion=h.modal.find(node=>node.class==='tk7l-import-suggestions');
  const checkbox=suggestion.find(node=>node.type==='checkbox');
  assert.ok(checkbox);
  assert.equal(h.calls.length,0);
  checkbox.checked=expanded;checkbox.onchange();
  assert.equal(h.calls.length,0);
  await h.apply.onclick();
  const slots=h.calls[0].params.p_blocks[0].slots;
  assert.deepEqual(Array.from(slots),expanded?Array(7).fill('ทีมเก็ตแมน'):[null,null,null,'ทีมเก็ตแมน',null,null,null]);
 }
});
test('a lone name in slot six offers seven places with an explicit warning about the two existing names',async()=>{
 const h=setup({entries:[{team:'green',slot:1,name:'เดิมหนึ่ง'},{team:'green',slot:2,name:'เดิมสอง'}]});
 h.input.value='📅 6-11-2026\n'+paste('ทีมเขียว').replace('1. ทีมเขียว','1.').replace('6.','6.ทีมเขียว');
 await h.review.onclick();
 const suggestion=h.modal.find(node=>node.class==='tk7l-import-suggestions');
 const checkbox=suggestion.find(node=>node.type==='checkbox');
 assert.ok(checkbox);
 assert.equal(Boolean(checkbox.checked),false);
 assert.match(suggestion.find(node=>node.class==='tk7l-import-replace').text,/2 ชื่อเดิม/);
 checkbox.checked=true;checkbox.onchange();
 assert.equal(h.calls.length,0);
 await h.apply.onclick();
 assert.deepEqual(Array.from(h.calls[0].params.p_blocks[0].slots),Array(7).fill('ทีมเขียว'));
});
test('one name in slots 2–7 suggests a whole team without needing a prefix',async()=>{
 for(const slot of [1,2,6,7]){
  const h=setup({entries:[]});
  h.input.value='📅 6-11-2026\n'+paste('เก็ตแมน').replace('1. เก็ตแมน','1.').replace(slot+'.',slot+'.เก็ตแมน');
  await h.review.onclick();
  const checkbox=h.modal.find(node=>node.class==='tk7l-import-suggestions').find(node=>node.type==='checkbox');
  assert.equal(Boolean(checkbox),slot!==1);
  if(checkbox){checkbox.checked=true;checkbox.onchange();}
  assert.equal(h.calls.length,0);
  await h.apply.onclick();
  assert.deepEqual(Array.from(h.calls[0].params.p_blocks[0].slots),slot===1?['เก็ตแมน',null,null,null,null,null,null]:Array(7).fill('เก็ตแมน'));
 }
});
test('an existing whole team can use the same name with a team prefix',async()=>{
 const h=setup({entries:Array.from({length:7},(_,slot)=>({team:'green',slot:slot+1,name:'เก็ตแมน'}))});
 h.input.value='📅 6-11-2026\n'+paste('ทีมเก็ตแมน').replace('1. ทีมเก็ตแมน','1.').replace('4.','4.ทีมเก็ตแมน');
 await h.review.onclick();
 const checkbox=h.modal.find(node=>node.class==='tk7l-import-suggestions').find(node=>node.type==='checkbox');
 assert.ok(checkbox);
 assert.equal(h.calls.length,0);
 checkbox.checked=true;checkbox.onchange();
 await h.apply.onclick();
 assert.deepEqual(Array.from(h.calls[0].params.p_blocks[0].slots),Array(7).fill('ทีมเก็ตแมน'));
});
test('undated LINE text needs explicit date confirmation and keeps the request ID for a retry',async()=>{
 const h=setup({fail:true});
 h.input.value=paste('Updated');h.input.oninput();
 await h.review.onclick();
 assert.equal(h.calls.length,0);
 assert.equal(h.apply.disabled,true);
 await h.apply.onclick();
 assert.equal(h.calls.length,0);
 h.dateCheck.checked=true;h.dateCheck.onchange();
 await h.apply.onclick();
 assert.equal(h.modal.hidden,false);
 await h.apply.onclick();
 assert.equal(h.modal.hidden,true);
 assert.equal(h.calls[0].name,'tk7_admin_import_roster');
 assert.equal(h.calls[0].params.p_request,h.calls[1].params.p_request);
 assert.equal(h.calls[1].params.p_revision,7);
 assert.equal(h.calls[1].params.p_blocks[0].slots[0],'Updated');
});
test('editing pasted text during a pending roster read invalidates the preview',async()=>{
 let finish;
 const h=setup({refresh:()=>new Promise(resolve=>{finish=resolve;})});
 h.input.value='📅 6-11-2026\n'+paste('First');
 const pending=h.review.onclick();
 h.input.value='📅 6-11-2026\n'+paste('Second');h.input.oninput();
 finish(true);
 await pending;
 assert.equal(h.apply.disabled,true);
 await h.apply.onclick();
 assert.equal(h.calls.length,0);
});
test('pasting or editing queues one automatic preview and groups changes by team without writing',async()=>{
 let reads=0;
 const h=setup({refresh:async()=>{reads++;return true;}});
 h.input.value='📅 6-11-2026\n'+paste('First');h.input.oninput();
 h.input.value='📅 6-11-2026\n'+paste('Updated');h.input.oninput();
 assert.equal(h.timers.size,1);
 assert.equal(h.apply.disabled,true);
 await h.runQueued();
 assert.equal(reads,1);
 assert.equal(h.calls.length,0);
 assert.ok(h.modal.find(node=>node.class==='tk7l-import-team').find(node=>node.text==='ทีมเขียว'));
 assert.equal(h.apply.disabled,false);
 h.input.value='';h.input.oninput();
 assert.equal(h.timers.size,0);
 assert.equal(h.apply.disabled,true);
 assert.equal(h.modal.find(node=>node.class==='tk7l-import-team'),undefined);
});
