import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMenuMessage} from './share-menu.mjs';
test('custom signup URL is retained in card CTA',()=>{
 const m=buildMenuMessage('https://example.test/join');
 assert.equal(m.contents.footer.contents[0].action.uri,'https://example.test/join');
});
test('card keeps map separate from signup and contains no recipient or credentials',()=>{
 const m=buildMenuMessage();
 const location=m.contents.body.contents.find(x=>x.action);
 assert.equal(location.action.uri,'https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA');
 assert.ok(!('to' in m));assert.doesNotMatch(JSON.stringify(m),/access_token|Bearer|groupId/);
});
