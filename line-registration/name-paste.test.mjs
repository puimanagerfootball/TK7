import test from 'node:test';
import assert from 'node:assert/strict';
import './name-paste.js';

function setup(capacity){
 const el=(tag,props,...children)=>({tag,...props,children,append(child){children.push(child)}});
 const applied=[];
 const panel=globalThis.TK7NamePaste.create({el,capacity,apply:names=>applied.push(names)});
 const [,input,notice,use]=panel.children;
 return {panel,input,notice,use,applied};
}
test('pasting preserves repeated names and only fills the draft after applying',()=>{
 const {panel,input,use,applied}=setup(4);
 input.value='  เก็ต \r\n\r\n แมน \n  เก็ต\nA   B ';
 input.oninput();
 assert.equal(applied.length,0);
 use.onclick();
 assert.deepEqual(applied,[['เก็ต','แมน','เก็ต','A B']]);
 assert.equal(panel.open,false);
});
test('an oversized batch or name stays in the textarea for correction',()=>{
 const {input,notice,use,applied}=setup(2);
 for(const text of ['A\nB\nC','x'.repeat(41)]){
  input.value=text;use.onclick();
  assert.equal(applied.length,0);
  assert.equal(input.value,text);
  assert.ok(notice.textContent);
 }
});
