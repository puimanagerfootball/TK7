import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import './browser-safety.js';
const S=globalThis.TK7BrowserSafety;
test('corrupted or unexpected preferences cannot stop registration',()=>{
 for(const value of ['null','{}','"green"','42','[invalid'])assert.deepEqual(S.readCollapsed({getItem:()=>value}),[]);
 assert.deepEqual(S.readCollapsed({getItem:()=>JSON.stringify(['green','<img>',{},'red'])}),['green','red']);
 assert.deepEqual(S.readCollapsed({getItem(){throw Error('storage blocked')}}),[]);
});
test('retiring a worker cannot unregister another app on the same origin',async()=>{
 const called=[];const make=(scope,scriptURL)=>({scope,active:{scriptURL},unregister:async()=>{called.push(scope);return true}});
 const base='https://example.test/TK7/';
 const serviceWorker={getRegistrations:async()=>[make(base,base+'sw.js'),make('https://example.test/Other/','https://example.test/Other/sw.js'),make('https://example.test/','https://example.test/sw.js'),make(base,base+'unrelated.js')]};
 assert.equal(await S.retireOwnWorker(serviceWorker,base+'index.html'),true);assert.deepEqual(called,[base]);
});
test('failed worker retirement never causes a reload loop',async()=>{
 const reg={scope:'https://example.test/TK7/',active:{scriptURL:'https://example.test/TK7/sw.js'},unregister:()=>{throw Error('denied')}};
 assert.equal(await S.retireOwnWorker({getRegistrations:async()=>[reg]},reg.scope),false);
 assert.equal(await S.retireOwnWorker({getRegistrations:async()=>{throw Error('blocked')}},reg.scope),false);
});
test('email redirect errors decode once and accept literal percent characters',()=>{
 const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
 const context={URLSearchParams,window:{location:{hash:'',search:'?error=access_denied&error_description=100%25+invalid+%2520'}}};
 vm.createContext(context);vm.runInContext(app.slice(app.indexOf('        function getAuthRedirectError()'),app.indexOf('        function clearAuthRedirectParamsFromUrl()')),context);
 assert.equal(context.getAuthRedirectError().description,'100% invalid %20');
});
test('privacy notice is accessible from both entry points and mirrored without changes',()=>{
 const root=new URL('../',import.meta.url);for(const file of ['index.html','line-registration/register.html'])assert.match(fs.readFileSync(new URL(file,root),'utf8'),/href="privacy.html"/);
 const a=fs.readFileSync(new URL('privacy.html',root),'utf8').replace(/\r\n/g,'\n'),b=fs.readFileSync(new URL('line-registration/privacy.html',root),'utf8').replace(/\r\n/g,'\n');assert.equal(a,b);
 assert.match(a,/puicuppom@gmail.com/);assert.match(a,/30 days/);assert.match(a,/not restricted to LINE group membership/);
});
test('signed-out signup explains shared access before initiating LINE login',()=>{
 const source=fs.readFileSync(new URL('registration.js',import.meta.url),'utf8');let view,logins=0;
 const context={lang:'en',loginPromptVisible:false,$:()=>({replaceChildren:n=>view=n}),el:(tag,props={},...children)=>({tag,...props,children}),liff:{login:options=>{assert.equal(options.redirectUri,'https://example.test/register.html');logins++}},location:{href:'https://example.test/register.html'}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function showLineLogin(){'),source.indexOf('(async()=>{',source.indexOf('function showLineLogin(){'))),context);
 context.showLineLogin();assert.equal(logins,0);assert.equal(context.loginPromptVisible,true);
 const button=view.children.find(n=>n.tag==='button');assert.equal(button.text,'Sign in with LINE');button.onclick();assert.equal(logins,1);
});
