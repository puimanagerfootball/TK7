import test from 'node:test';
import assert from 'node:assert/strict';
import {createDirectShare} from './direct-share.mjs';
function setup({loggedIn=true,available=true}={}){
 const events=[];
 const sdk={init:async()=>events.push('init'),isLoggedIn:()=>loggedIn,isApiAvailable:()=>available,getContext:()=>({availability:{shareTargetPicker:{permission:available}}}),login:()=>events.push('login'),shareTargetPicker:messages=>{events.push('picker');assert.equal(messages[0].type,'flex');return Promise.resolve({status:'success'});}};
 const direct=createDirectShare({liffId:'2012278818-NewRootApp',loadSdk:async()=>sdk,redirectUri:'https://puimanagerfootball.github.io/TK7/'});
 return {direct,events};
}
test('ready root share invokes picker in the original click before yielding',async()=>{
 const {direct,events}=setup();await direct.ready;assert.deepEqual(events,['init']);
 events.push('click');const result=direct.share();events.push('after-click');
 assert.deepEqual(events,['init','click','picker','after-click']);assert.equal((await result).status,'success');
});
test('first login does not send a card or silently auto-share',async()=>{
 const {direct,events}=setup({loggedIn:false});await direct.ready;
 assert.deepEqual(await direct.share(),{login:true});assert.deepEqual(events,['init','login']);
});
test('missing or legacy signup ID never initializes the root app',async()=>{
 for(const liffId of ['', '2012278818-W0pIi2y0']){
  const direct=createDirectShare({liffId,loadSdk:()=>{throw Error('must not initialize')},redirectUri:''});
  await direct.ready;assert.equal(direct.configured,false);assert.throws(()=>direct.share(),/not configured/);
 }
});
test('unavailable picker fails before any sending',async()=>{
 const {direct,events}=setup({available:false});await direct.ready;assert.throws(()=>direct.share(),/unavailable/);assert.deepEqual(events,['init']);
});
