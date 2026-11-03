import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMenuMessage,shareAvailability,shareErrorText,closeSharedView} from './share-menu.mjs';
test('custom signup URL is retained in card CTA',()=>{
 const m=buildMenuMessage('https://example.test/join');
 assert.equal(m.contents.footer.contents[0].action.uri,'https://example.test/join');
});
test('share diagnostics distinguish permission and browser without exposing identity or tokens',()=>{
 const d=shareAvailability({id:'public-id',getContext:()=>({liffId:'public-id',userId:'private-user',accessTokenHash:'private-token',availability:{shareTargetPicker:{permission:false}}}),isApiAvailable:()=>false,getLineVersion:()=>null,getOS:()=>'web',isInClient:()=>false});
 assert.equal(d.permission,false);assert.equal(d.available,false);assert.equal(d.line,'external');
 assert.doesNotMatch(JSON.stringify(d),/private-user|private-token|userId|accessTokenHash/);
});
test('LINE errors without a message still show a usable code',()=>{
 assert.match(shareErrorText({code:'EXCEPTION_IN_SUBWINDOW'}),/Allow pop-ups/);
 assert.match(shareErrorText({code:'FORBIDDEN'}),/FORBIDDEN/);
 assert.match(shareErrorText(undefined),/UNKNOWN/);
});
test('mobile LIFF closes after successful sharing without an opener',()=>{
 let closed=0;
 assert.equal(closeSharedView({status:'success'},{isInClient:()=>true,closeWindow:()=>closed++},{opener:null},true),true);
 assert.equal(closed,1);
});
test('desktop share notifies parent and closes the popup',()=>{
 let closed=0;const messages=[];
 closeSharedView({status:'success'},{isInClient:()=>false},{opener:{postMessage:(...args)=>messages.push(args)},TK7_SHARE_RETURN_ORIGIN:'https://puimanagerfootball.github.io',close:()=>closed++},true);
 assert.equal(closed,1);assert.deepEqual(messages,[[{type:'tk7-card-shared'},'https://puimanagerfootball.github.io']]);
});
test('cancelled shares and the ordinary signup page never close',()=>{
 const liff={isInClient:()=>true,closeWindow:()=>{throw Error('must not close')}};
 assert.equal(closeSharedView(undefined,liff,{},true),false);
 assert.equal(closeSharedView({status:'success'},liff,{},false),false);
});
test('close failures do not turn a completed share into a send error',()=>{
 assert.equal(closeSharedView({status:'success'},{isInClient:()=>true,closeWindow:()=>{throw Error('cannot close')}},{},true),false);
});
test('desktop popup still closes if LINE login cleared its opener',()=>{
 let closed=0;
 assert.equal(closeSharedView({status:'success'},{isInClient:()=>false},{opener:null,close:()=>closed++},true),true);
 assert.equal(closed,1);
});
test('card keeps map separate from signup and contains no recipient or credentials',()=>{
 const m=buildMenuMessage();
 const location=m.contents.body.contents.find(x=>x.action);
 assert.equal(location.action.uri,'https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA');
 assert.ok(!('to' in m));assert.doesNotMatch(JSON.stringify(m),/access_token|Bearer|groupId/);
});
