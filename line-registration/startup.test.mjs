import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script id="tk7-startup-script">([\s\S]*?)<\/script>/)[1];
function setup({standalone=true,reduced=false,ios=false}={}){
 const timers=new Map(),listeners=new Map(),nodes=[];let next=0;
 const events={addEventListener:(event,callback)=>listeners.set(event,callback),removeEventListener:event=>listeners.delete(event)};
 const window={...events,matchMedia:query=>({matches:query.includes('reduced')?reduced:standalone})};
 const document={...events,body:{append:node=>nodes.push(node)},createElement:()=>({setAttribute(){},classList:{values:[],add(value){this.values.push(value);}},remove(){this.removed=true;}})};
 const context={window,document,navigator:{standalone:ios},setTimeout:(callback,delay)=>{const id=++next;timers.set(id,{callback,delay});return id;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(context);vm.runInContext(script,context);return {window,nodes,timers,listeners};
}
test('startup decoration stays absent in normal tabs and with reduced motion',()=>{
 assert.equal(setup({standalone:false}).nodes.length,0);assert.equal(setup({reduced:true}).nodes.length,0);
 assert.equal(setup({standalone:false,ios:true}).nodes.length,1);
});
test('ready immediately dismisses startup without a minimum viewing delay',()=>{
 const h=setup();h.window.TK7Startup.finish();assert.ok(h.nodes[0].classList.values.includes('is-leaving'));
 assert.equal([...h.timers.values()].some(t=>t.delay===1000),false);
 const removal=[...h.timers.values()].find(t=>t.delay===180);assert.ok(removal);removal.callback();assert.equal(h.nodes[0].removed,true);
});
test('startup has a short safety expiry and interaction dismisses it only once',()=>{
 const h=setup();const fallback=[...h.timers.values()].find(t=>t.delay===1000);assert.ok(fallback);fallback.callback();
 h.window.TK7Startup.finish();assert.equal(h.nodes[0].classList.values.length,1);assert.equal(h.listeners.size,0);
 const interactive=setup();interactive.listeners.get('pointerdown')();assert.ok(interactive.nodes[0].classList.values.includes('is-leaving'));
});
test('native launch color matches the decorative transition and initialization releases it',()=>{
 const m=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));assert.equal(m.background_color,'#103d2b');assert.equal(m.theme_color,m.background_color);
 assert.ok(html.includes('pointer-events:none;background:#103d2b'));assert.ok(html.includes('prefers-reduced-motion:reduce'));
 assert.ok(fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8').includes('initializeApp().finally(() => window.TK7Startup?.finish())'));
});
