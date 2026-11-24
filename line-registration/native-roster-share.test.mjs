import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('native-roster-share.js',import.meta.url),'utf8');
function harness({mobile=true,cancel=false}={}){
    const ctx={};vm.createContext(ctx);vm.runInContext(source,ctx);
    const calls=[];
    class Element{
        children=[];listeners={};open=false;style={};
        constructor(tag){this.tag=tag;}
        append(...nodes){this.children.push(...nodes);}
        setAttribute(){}
        addEventListener(event,callback){this.listeners[event]=callback;}
        querySelectorAll(){const result=[];const walk=node=>{for(const child of node.children){if(child.tag==='button')result.push(child);walk(child);}};walk(this);return result;}
        showModal(){this.open=true;}
        close(){this.open=false;this.listeners.close?.();}
        remove(){this.removed=true;}
    }
    const env={navigator:{share:payload=>{calls.push(payload);return cancel?Promise.reject(Object.assign(Error('cancelled'),{name:'AbortError'})):Promise.resolve();}},
        matchMedia:()=>({matches:mobile}),TK7RosterSummary:{build:(snapshot,{team})=>snapshot.text+(team?' '+team:'')},
        document:{body:new Element('body'),createElement:tag=>new Element(tag)}};
    return {api:ctx.TK7NativeRosterShare,env,calls};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('all-team mobile summary invokes system sharing in the original click, without a preview',async()=>{
    const {api,env,calls}=harness();let sent=0;
    assert.equal(api.request({getSnapshot:()=>({text:'Roster'}),onSent:()=>sent++},env),true);
    assert.equal(calls.length,1);assert.equal(calls[0].text,'Roster');
    assert.deepEqual(Object.keys(calls[0]),['text']);
    assert.equal(env.document.body.children.length,0);
    await settle();assert.equal(sent,1);
});

test('desktop without a LINE transport leaves the fallback available',()=>{
    const {api,env,calls}=harness({mobile:false});
    assert.equal(api.request({getSnapshot:()=>({text:'Roster'})},env),false);
    assert.equal(calls.length,0);
});
test('desktop opens LINE directly in the click without creating a preview',async()=>{
    const {api,env}=harness({mobile:false});const messages=[];let sent=0;
    env.TK7DirectShare={configured:true,share:value=>{messages.push(value);return Promise.resolve({status:'success'});}};
    api.request({getSnapshot:()=>({text:'Desktop roster'}),onSent:()=>sent++},env);
    assert.equal(messages[0][0].text,'Desktop roster');
    assert.equal(env.document.body.children.length,0);
    await settle();assert.equal(sent,1);
});
test('LIFF desktop team selection sends directly and cancellation keeps choices',async()=>{
    const {api,env}=harness({mobile:false});let text='Current';const messages=[];
    api.request({mode:'team',teams:[{slug:'blue',label:'Blue'}],getSnapshot:()=>({text}),sendText:value=>{messages.push(value);return Promise.resolve();}},env);
    const dialog=env.document.body.children[0];text='Latest';
    dialog.children[1].children[0].onclick();assert.equal(messages[0],'Latest blue');
    await settle();assert.equal(dialog.open,true);
    assert.equal(dialog.children[1].children[0].disabled,false);
});

test('iPad with a trackpad still uses mobile sharing while Windows touch keeps desktop flow',()=>{
    const {api,env}=harness({mobile:false});
    env.navigator.maxTouchPoints=5;env.navigator.userAgent='Macintosh';
    assert.equal(api.available(env),true);
    env.navigator.platform='Win32';env.matchMedia=()=>({matches:true});
    assert.equal(api.available(env),false);
});

test('cancelling the phone share sheet does not retry or fall back to LINE login',async()=>{
    const {api,env,calls}=harness({cancel:true});let sent=0,errors=0;
    api.request({getSnapshot:()=>({text:'Roster'}),onSent:()=>sent++,onError:()=>errors++},env);
    await settle();assert.equal(calls.length,1);assert.equal(sent,0);assert.equal(errors,0);
    api.request({getSnapshot:()=>({text:'Roster'})},env);await settle();assert.equal(calls.length,2);
});

test('team choice opens the system sheet directly using the current selected-day snapshot',async()=>{
    const {api,env,calls}=harness();let text='Old';
    api.request({mode:'team',getSnapshot:()=>({text}),teams:[{slug:'green',label:'Green'},{slug:'red',label:'Red'}]},env);
    assert.equal(calls.length,0);
    const dialog=env.document.body.children[0];text='Latest';
    dialog.children[1].children[1].onclick();
    assert.equal(calls[0].text,'Latest red');
    await settle();assert.equal(dialog.removed,true);
});

test('changed day or lost permission blocks a mobile summary before opening system sharing',()=>{
    const {api,env,calls}=harness();let errors=0;
    api.request({getSnapshot:()=>({text:'Roster'}),isCurrent:()=>false,onError:()=>errors++},env);
    assert.equal(calls.length,0);assert.equal(errors,1);
});
