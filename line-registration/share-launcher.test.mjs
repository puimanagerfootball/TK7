import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('share-launcher.js',import.meta.url),'utf8');
function launch(search){
 const context={URLSearchParams,location:{search,origin:'https://puimanagerfootball.github.io'},window:{},document:{createElement:()=>({}),head:{append(){}}}};
 vm.runInNewContext(code,context);return context.window;
}
test('ordinary signup does not enter auto-share mode',()=>assert.equal(launch('?share=1').TK7_SHARE_ONLY,false));
test('share-only mode survives LIFF redirects',()=>{
 const q='?quick=1&returnOrigin=https%3A%2F%2Fpuimanagerfootball.github.io';
 assert.equal(launch(q).TK7_SHARE_ONLY,true);
 assert.equal(launch('?liff.state='+encodeURIComponent('/'+q)).TK7_SHARE_ONLY,true);
});
test('share status can only be returned to known TK7 origins',()=>{
 assert.equal(launch('?quick=1&returnOrigin=https://evil.test').TK7_SHARE_RETURN_ORIGIN,'https://puimanagerfootball.github.io');
 assert.equal(launch('?quick=1&returnOrigin=https://tk7-line-registration-odf.md-8887.chatgpt.site').TK7_SHARE_RETURN_ORIGIN,'https://tk7-line-registration-odf.md-8887.chatgpt.site');
});
