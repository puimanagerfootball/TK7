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
function setup({refresh=async()=>true,fail=false}={}){
 const body=new Node('body'),calls=[];
 const session={id:'chosen',match_date:'2026-11-06',is_open:true,revision:7,teams:['green','red'],roster:{entries:[{team:'green',slot:1,name:'Previous'}]}};
 const context=vm.createContext({window:{TK7Backdrop:{install(){}},TK7RosterText:globalThis.TK7RosterText},document:{body,addEventListener(){}},crypto:{randomUUID}});
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
 return {modal,input,review,apply,dateCheck,calls};
}
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
