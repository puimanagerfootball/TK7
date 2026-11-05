import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../js/legacy-registration-loader.js',import.meta.url),'utf8');
function setup(){
 let click,opens=0,mounts=0;const appended=[],alerts=[],button={disabled:false,textContent:'Copy',addEventListener:(_,fn)=>click=fn};
 const context={URL,window:{TK7LegacyRegistration:{create:()=>({mount:options=>{assert.equal(options.bindTrigger,false);mounts++},open:()=>opens++})}},document:{currentScript:{src:'https://example.test/TK7/js/legacy-registration-loader.js?v=5.1.2'},getElementById:()=>button,createElement:tag=>({tag,remove(){}}),head:{append:el=>appended.push(el)}},alert:value=>alerts.push(value)};
 vm.createContext(context);vm.runInContext(code,context);context.TK7LegacyRegistrationLoader.bind({});return {get click(){return click},get opens(){return opens},get mounts(){return mounts},button,appended,alerts};
}
test('legacy tools load only after click, once, with the current release cache key',async()=>{
 const h=setup();assert.equal(h.appended.length,0);const first=h.click();assert.equal(h.appended.length,2);assert.ok(h.appended[0].src.endsWith('legacy-registration.js?v=5.1.2'));assert.ok(h.appended[1].href.endsWith('legacy-registration.css?v=5.1.2'));for(const el of h.appended)el.onload();await first;await h.click();assert.equal(h.appended.length,2);assert.equal(h.mounts,1);assert.equal(h.opens,2);assert.equal(h.button.disabled,false);
});
test('failed legacy resource loads restore the button and permit a fresh retry',async()=>{
 const h=setup();const failed=h.click();h.appended[0].onerror();await failed;assert.equal(h.button.disabled,false);assert.equal(h.alerts.length,1);const retry=h.click();assert.equal(h.appended.length,4);for(const el of h.appended.slice(2))el.onload();await retry;assert.equal(h.opens,1);
});
