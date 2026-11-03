import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMenuMessage,shareAvailability,shareErrorText} from './share-menu.mjs';
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
test('card keeps map separate from signup and contains no recipient or credentials',()=>{
 const m=buildMenuMessage();
 const location=m.contents.body.contents.find(x=>x.action);
 assert.equal(location.action.uri,'https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA');
 assert.ok(!('to' in m));assert.doesNotMatch(JSON.stringify(m),/access_token|Bearer|groupId/);
});
