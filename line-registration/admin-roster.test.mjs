import './name-paste.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const src=fs.readFileSync(new URL('admin-integration.js',import.meta.url),'utf8');
const code=src.slice(src.indexOf(' function openTeam(slug,'),src.indexOf('\n async function recolor'));
class Node{
 constructor(tag,props={},kids=[]){this.tag=tag;this.props=props;Object.assign(this,props);this.textContent=props.text||'';this.children=kids.flat().filter(Boolean);this.hidden=false;for(const c of this.children)c.parent=this;}
 append(...kids){for(const c of kids.flat()){c.parent=this;this.children.push(c)}}remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)}replaceChildren(...kids){this.children=kids}setAttribute(k,v){this.props[k]=v}focus(){}
 querySelectorAll(selector){const found=[];const match=n=>selector.split(',').some(s=>{s=s.trim();if(s==='[role="status"]')return n.props.role==='status';return n.tag===s.split(':')[0]&&(!s.includes(':not(:disabled)')||!n.disabled)});const walk=n=>{for(const c of n.children){if(match(c))found.push(c);walk(c)}};walk(this);return found}
 querySelector(s){return this.querySelectorAll(s)[0]||null}
}
function setup({closed=false,missing=false,fail=false,view="join",displayName=""}={}){
 const s={id:'session',revision:4,is_open:!closed,teams:['green','red','blue'],roster:{entries:[{id:'p1',name:'Alex',team:'green',slot:1},{id:'p2',name:'Pui',team:'green',slot:2}]}};
 const calls=[],modal=new Node('div'),colors={green:'เขียว',red:'แดง',blue:'ฟ้า'};
 const ctx={window:{TK7NamePaste:globalThis.TK7NamePaste},getDisplayName:()=>displayName,teamBackdrop:null,activeJoinSlug:null,canManage:()=>true,teamBusy:false,teamTrigger:null,mutating:false,document:{activeElement:null},session:()=>missing?null:s,playersOf:(x,t)=>(x?.roster.entries||[]).filter(e=>e.team===t),COLORS:colors,ORDER:Object.keys(colors),el:(t,p,...kids)=>new Node(t,p,kids),modal,closeTeam:()=>{modal.hidden=true},main:{click:()=>calls.push('open')},date:()=> '2026-11-06',crypto:webcrypto,confirm:()=>true,refreshOverview:{invalidate(){}},rpc:async(n,a)=>{calls.push({n,a});if(fail)throw Error('offline')},load:async()=>true,errText:e=>e.message,say(){},recolor(){}};
 vm.createContext(ctx);vm.runInContext(code,ctx);ctx.openTeam('green',{view});return {ctx,modal,calls};
}
const button=(m,text)=>m.querySelectorAll('button').find(n=>text.startsWith('＋ ลงชื่อทีม')?n.class?.split(' ').includes('tk7l-add'):n.textContent===text);
const nameInput=m=>m.querySelectorAll('input').find(n=>n.type==='text');
const checks=m=>m.querySelectorAll('input').filter(n=>n.type==='checkbox');
test('adding names sends admin RPC and uses each line as one player',async()=>{const {modal,calls}=setup();nameInput(modal).value=' Alex ';button(modal,'＋ เพิ่มชื่อเพื่อน').onclick();modal.querySelectorAll('input').filter(n=>n.type==='text')[1].value='Pui';await button(modal,'＋ ลงชื่อทีมเขียว').onclick();assert.equal(calls[0].n,'tk7_admin_roster_edit');assert.deepEqual(Array.from(calls[0].a.p_names),['Alex','Pui']);assert.equal(calls[0].a.p_action,'add')});
test('selected deletion sends only ticked IDs',async()=>{const {modal,calls}=setup({view:'roster'});const chosen=checks(modal);chosen[0].checked=true;chosen[0].onchange();await button(modal,'ลบชื่อที่เลือก').onclick();assert.deepEqual(Array.from(calls[0].a.p_entries),['p1']);assert.equal(calls[0].a.p_action,'delete')});
test('select-all can be cleared and moving submits selected people and target',async()=>{const {modal,calls}=setup({view:'roster'});const all=checks(modal).find(n=>n.props['aria-label']==='เลือกทุกชื่อในทีม');all.checked=true;all.onchange();assert.equal(button(modal,'ย้ายชื่อที่เลือก').disabled,false);all.checked=false;all.onchange();assert.equal(button(modal,'ย้ายชื่อที่เลือก').disabled,true);all.checked=true;all.onchange();modal.querySelector('select').value='red';await button(modal,'ย้ายชื่อที่เลือก').onclick();assert.equal(calls[0].a.p_target,'red');assert.equal(calls[0].a.p_entries.length,2)});
test('clear is scoped to the opened team',async()=>{const {modal,calls}=setup({view:'roster'});await button(modal,'ลบหมดในทีมนี้').onclick();assert.equal(calls[0].a.p_action,'clear');assert.equal(calls[0].a.p_team,'green');assert.equal(calls[0].a.p_entries,null)});
test('network retry reuses request ID and retains names',async()=>{const {modal,calls}=setup({fail:true});const names=nameInput(modal);names.value='Alex';names.oninput();const add=button(modal,'＋ ลงชื่อทีมเขียว');await add.onclick();await add.onclick();assert.equal(calls[0].a.p_request,calls[1].a.p_request);assert.equal(names.value,'Alex');assert.equal(add.disabled,false)});
test('closed days disable editing and invalid empty names cannot submit',async()=>{const closed=setup({closed:true});assert.equal(button(closed.modal,'＋ ลงชื่อทีมเขียว').disabled,true);const {modal,calls}=setup();await button(modal,'＋ ลงชื่อทีมเขียว').onclick();assert.equal(calls.length,0)});
test('a date with no session offers opening registration',()=>{const {modal,calls}=setup({missing:true});button(modal,'เปิดลงทะเบียน').onclick();assert.deepEqual(calls,['open'])});
test('stale roster reload preserves unsaved names and resets busy state',async()=>{const {ctx,modal}=setup();nameInput(modal).value='Draft player';ctx.rpc=async()=>{throw Error('Roster changed; refresh first')};await button(modal,'＋ ลงชื่อทีมเขียว').onclick();assert.equal(nameInput(modal).value,'Draft player');assert.equal(ctx.teamBusy,false);assert.equal(ctx.mutating,false);assert.match(modal.querySelector('[role="status"]').textContent,/รายชื่อเปลี่ยน/)});
test('switching dates before saving cannot edit the previous day',async()=>{const {ctx,modal,calls}=setup();nameInput(modal).value='Alex';ctx.session=()=>({id:'different-session'});await button(modal,'＋ ลงชื่อทีมเขียว').onclick();assert.equal(calls.length,0)});

test('friend fields stop at team capacity and removing a field enables adding another',()=>{const {modal}=setup();const add=button(modal,'＋ เพิ่มชื่อเพื่อน');for(let i=0;i<8;i++)add.onclick();assert.equal(modal.querySelectorAll('input').filter(n=>n.type==='text').length,5);assert.equal(add.hidden,true);modal.querySelectorAll('button').find(n=>n.props['aria-label']==='ลบช่องชื่อนี้').onclick();assert.equal(modal.querySelectorAll('input').filter(n=>n.type==='text').length,4);assert.equal(add.hidden,false)});

test('clicking a colour opens exactly seven slots before the signup form',()=>{const {modal}=setup({view:'roster'});assert.equal(modal.querySelectorAll('input').filter(n=>n.type==='text').length,0);const slots=modal.querySelectorAll('button,label').filter(n=>n.class?.split(' ').includes('prow'));assert.equal(slots.length,7);const cta=modal.querySelectorAll('button').find(n=>n.class==='cta');assert.match(cta.textContent,/ว่าง 5/);cta.onclick();assert.equal(modal.querySelectorAll('input').filter(n=>n.type==='text').length,1)});

test('join sheet contains only name fields and prefills the current account',()=>{const {modal}=setup({displayName:'puicuppom'});assert.equal(nameInput(modal).value,'puicuppom');assert.equal(modal.querySelectorAll('input').filter(n=>n.type==='checkbox').length,0);assert.equal(modal.querySelectorAll('button,label').filter(n=>n.class?.split(' ').includes('prow')).length,0);assert.equal(button(modal,'ยกเลิก').textContent,'ยกเลิก');assert.equal(button(modal,'＋ ลงชื่อทีมเขียว').disabled,false)});
