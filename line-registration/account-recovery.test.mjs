import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('registration.js',import.meta.url),'utf8').split('// TK7 LIFF:')[0];
const context={URL};vm.runInNewContext(source,context);
function setup({inClient=false,href='https://example.test/register.html?date=2026-11-06',blocked=false}={}){
 const calls=[],values=new Map();return {calls,options:{liffId:'2012278818-W0pIi2y0',sdk:{isInClient:()=>inClient,logout:()=>calls.push('logout'),login:x=>calls.push(x)},location:{href,replace:x=>calls.push(x)},storage:{getItem:k=>{if(blocked)throw Error();return values.get(k)},setItem:(k,v)=>{if(blocked)throw Error();values.set(k,v)}}}};
}
test('missing profile triggers one login only and keeps selected date',()=>{const {calls,options}=setup();assert.equal(context.tk7RecoverLineAccount({status:'profile_permission_required'},options),true);assert.equal(calls[0],'logout');assert.match(calls[1].redirectUri,/date=2026-11-06/);assert.equal(context.tk7RecoverLineAccount({status:'profile_permission_required'},options),false)});
test('URL guard stops retry loops even when storage is blocked',()=>{const {calls,options}=setup({blocked:true,href:'https://example.test/register.html?tk7_login_retry=1'});assert.equal(context.tk7RecoverLineAccount({status:'profile_name_missing'},options),false);assert.equal(calls.length,0)});
test('LIFF client reopens its LIFF URL without calling external login APIs',()=>{const {calls,options}=setup({inClient:true});context.tk7RecoverLineAccount({status:'expired_access_token'},options);assert.equal(calls.length,1);assert.ok(calls[0].startsWith('https://liff.line.me/'));assert.match(calls[0],/tk7_login_retry=1/)});
test('complete profiles and temporary network failures do not log users out',()=>{for(const a of [{name:'Pui',status:'ready'},{status:'profile_unavailable'}]){const {calls,options}=setup();assert.equal(context.tk7RecoverLineAccount(a,options),false);assert.equal(calls.length,0)}});
test('manual retry remains possible after automatic attempt',()=>{const {calls,options}=setup({href:'https://example.test/?tk7_login_retry=1'});assert.equal(context.tk7RecoverLineAccount({status:'identity_mismatch'},{...options,manual:true}),true);assert.equal(calls.length,2)});
