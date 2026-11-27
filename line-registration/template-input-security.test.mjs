import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
function form(){
 const inputs={'.h-n':{},'.a-n':{},'.remove-row-btn':{}},rows=[];
 const row={querySelector:selector=>inputs[selector],remove(){this.removed=true;}};
 const context={TEAMS:Array(10).fill({}),document:{getElementById:()=>({appendChild:value=>rows.push(value)}),createElement:()=>row}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('        function addMatchInputRow('),source.indexOf('        async function saveTemplate()')),context);return {context,row,inputs,rows};
}
test('saved template values cannot escape numeric inputs into executable markup',()=>{
 const h=form();const payload='"><img src=x onerror=alert(1)>';
 h.context.addMatchInputRow(payload,payload);
 assert.ok(!h.row.innerHTML.includes(payload));assert.ok(!h.row.innerHTML.includes('<img'));
 assert.equal(h.inputs['.h-n'].value,'');assert.equal(h.inputs['.a-n'].value,'');assert.equal(h.rows.length,1);
});
test('template input validation preserves valid team numbers and rejects invalid stored values',()=>{
 const h=form();h.context.addMatchInputRow('2',10);assert.equal(h.inputs['.h-n'].value,2);assert.equal(h.inputs['.a-n'].value,10);
 for(const invalid of [null,true,{},[],0,-1,11,2.5,'Infinity','2junk']){h.context.addMatchInputRow(invalid,invalid);assert.equal(h.inputs['.h-n'].value,'');assert.equal(h.inputs['.a-n'].value,'');}
 h.inputs['.remove-row-btn'].onclick();assert.equal(h.row.removed,true);
});
