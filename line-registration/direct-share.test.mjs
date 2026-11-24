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

test('text and video shares reuse the initialized SDK and keep the original click',async()=>{
 const calls=[];
 const sdk={init:async()=>calls.push('init'),isLoggedIn:()=>true,isApiAvailable:()=>true,
  getContext:()=>({availability:{shareTargetPicker:{permission:true}}}),
  shareTargetPicker:messages=>{calls.push(messages[0].type);return Promise.resolve({status:'success'});}};
 const direct=createDirectShare({liffId:'2012278818-NewRootApp',loadSdk:async()=>sdk,redirectUri:'https://example.com/'});
 await direct.ready;
 const text=direct.share([{type:'text',text:'Roster'}]);
 assert.deepEqual(calls,['init','text']);await text;
 const video=direct.share([{type:'video',originalContentUrl:'https://example.com/video.mp4',previewImageUrl:'https://example.com/preview.jpg'}]);
 assert.deepEqual(calls,['init','text','video']);await video;
});
test('first login does not send a card or silently auto-share',async()=>{
 const {direct,events}=setup({loggedIn:false});await direct.ready;
 assert.deepEqual(await direct.share(),{login:true});assert.deepEqual(events,['init','login']);
});

test('repeated clicks while login redirects never issue duplicate login requests',async()=>{
 const {direct,events}=setup({loggedIn:false});await direct.ready;
 await direct.share();await direct.share();
 assert.deepEqual(events,['init','login']);
 assert.equal(direct.liffUrl,'https://liff.line.me/2012278818-NewRootApp');
});

test('cancelled login can be retried after the duplicate-click cooldown',async()=>{
 let clock=1000,logins=0;
 const sdk={init:async()=>{},isLoggedIn:()=>false,login:()=>logins++};
 const direct=createDirectShare({liffId:'2012278818-NewRootApp',loadSdk:async()=>sdk,redirectUri:'https://example.com/',now:()=>clock});
 await direct.ready;
 await direct.share();await direct.share();assert.equal(logins,1);
 clock+=15000;
 await direct.share();assert.equal(logins,2);
});

test('LIFF browser does not run the external-browser login flow',async()=>{
 let logins=0;
 const sdk={init:async()=>{},isLoggedIn:()=>false,isInClient:()=>true,login:()=>logins++};
 const direct=createDirectShare({liffId:'2012278818-NewRootApp',loadSdk:async()=>sdk,redirectUri:'https://example.com/'});
 await direct.ready;
 assert.equal(direct.isInClient,true);
 assert.throws(()=>direct.share(),/เซสชัน LINE/);
 assert.equal(logins,0);
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
