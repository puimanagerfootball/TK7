import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const ctx={};vm.runInNewContext(fs.readFileSync(new URL('backdrop-guard.js',import.meta.url),'utf8'),ctx);
const surface={},input={};
const event=(target,x=10,y=10,id=1)=>({target,clientX:x,clientY:y,pointerId:id,button:0});
function setup(){let count=0;const guard=ctx.createTK7BackdropGuard(e=>e.target===surface,()=>count++);return {guard,count:()=>count}}
test('a real backdrop tap dismisses once',()=>{const {guard:g,count}=setup();g.pointerdown(event(surface));g.pointerup(event(surface,12,12));g.click(event(surface));g.click(event(surface));assert.equal(count(),1)});
test('selecting text then releasing outside never dismisses',()=>{const {guard:g,count}=setup();g.pointerdown(event(input));g.pointerup(event(surface));g.click(event(surface));assert.equal(count(),0)});
test('a drag starting on the backdrop is not a click',()=>{const {guard:g,count}=setup();g.pointerdown(event(surface));g.pointerup(event(surface,70,10));g.click(event(surface));assert.equal(count(),0)});
test('release inside a field and pointer cancellation do not dismiss',()=>{const {guard:g,count}=setup();g.pointerdown(event(surface));g.pointerup(event(input));g.click(event(surface));g.pointerdown(event(surface));g.pointercancel();g.pointerup(event(surface));g.click(event(surface));assert.equal(count(),0)});
test('a new press inside the field clears an unfinished backdrop press',()=>{const {guard:g,count}=setup();g.pointerdown(event(surface));g.pointerdown(event(input));g.pointerup(event(surface));g.click(event(surface));assert.equal(count(),0)});
test('a different pointer cannot finish the backdrop tap',()=>{const {guard:g,count}=setup();g.pointerdown(event(surface));g.pointerup(event(surface,10,10,2));g.click(event(surface));assert.equal(count(),0)});
