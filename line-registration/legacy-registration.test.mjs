import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/legacy-registration.js',import.meta.url),'utf8');
function setup(){
 const nodes=new Map(),copies=[];const node=()=>({value:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){this[type]=fn}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};get('match-date').value='2026-11-06';
 const context={document:{getElementById:get,querySelector:()=>get('close'),querySelectorAll:selector=>selector==='.team-switch:checked'?[{dataset:{teamSlug:'green'}}]:[]},window:{addEventListener(){}},navigator:{userAgent:'Windows',clipboard:{writeText:async value=>copies.push(value)}},alert:message=>assert.fail(message),showToast(){}};
 vm.createContext(context);vm.runInContext(source,context);
 const api=context.TK7LegacyRegistration.create({getCurrentDate:()=> '2026-11-06',teamInfo:{green:{emoji:'🟢',label:'Green Shirt (สีเขียว)'}},teams:[{slug:'green',name:'ทีมเขียว'}],showToast(){}});
 return {api,get,copies};
}
const block=name=>'🟢 Green Shirt (สีเขียว)\n'+Array.from({length:7},(_,i)=>(i+1)+'. '+(i===0?name:'')).join('\n');
test('legacy seven-slot group text remains valid and a first signup still builds the main message',()=>{
 const {api}=setup();assert.equal(api.validate(block('Alice'),'small').ok,true);const merged=api.merge('',block('Alice'));assert.equal(merged.ok,true);assert.ok(merged.text.includes('Alice'));assert.ok(merged.text.includes('6-11-2026'));
});
test('legacy copy button retains the old clipboard workflow and match details',async()=>{
 const {api,get,copies}=setup();api.mount();get('share-reg-line-btn').click();await Promise.resolve();assert.equal(copies.length,1);assert.ok(copies[0].includes('Green Shirt'));assert.ok(copies[0].includes('6-11-2026'));assert.ok(copies[0].includes('7.'));
});
