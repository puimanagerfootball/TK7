import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
async function render(data){
 const list={innerHTML:'',querySelectorAll:()=>[]};
 const context={document:{getElementById:()=>list},currentUser:{id:'owner'},escapeHtml:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),db:{from:()=>({select:()=>({order:async()=>({data,error:null})})})}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('        async function renderMembersList()'),source.indexOf('        async function updateMemberStatus(')),context);await context.renderMembersList();return list.innerHTML;
}
test('member panel puts pending requests first and retains status-specific actions',async()=>{
 const html=await render([{id:'a',display_name:'ApprovedUser',role:'admin',status:'approved'},{id:'p',display_name:'PendingUser',role:'admin',status:'pending'},{id:'r',display_name:'RejectedUser',role:'admin',status:'rejected'}]);
 assert.ok(html.indexOf('PendingUser')<html.indexOf('ApprovedUser'));assert.ok(html.indexOf('ApprovedUser')<html.indexOf('RejectedUser'));assert.ok(html.includes('รออนุมัติ 1 คน'));assert.ok(html.includes('member-pending-btn'));assert.ok(html.includes('member-approve-btn'));
});
test('member cards escape user fields and never offer status actions for a superadmin',async()=>{
 const html=await render([{id:'owner',display_name:'<img src=x onerror=alert(1)>',email:'<script>unsafe</script>',role:'superadmin',status:'approved'}]);
 assert.ok(html.includes('&lt;img'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('member-actions'));assert.ok(html.includes('<small>คุณ</small>'));
});
