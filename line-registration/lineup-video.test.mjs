import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/lineup-video.js', import.meta.url), 'utf8');
function shareHarness(mobile){
    const nodes=[],calls={upload:0,line:0,native:0,closed:0};
    const make=tag=>({tag,children:[],hidden:false,disabled:false,append(...items){this.children.push(...items);},setAttribute(){},addEventListener(){},showModal(){},close(){calls.closed++;},getContext:()=>({}),toBlob:fn=>fn(new Blob(['poster'])),pause(){}});
    const document={body:{append:node=>nodes.push(node)},createElement:make};
    const context={document,AbortController,Blob,File,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},
        navigator:{canShare:()=>true,share:()=>{calls.native++;return Promise.resolve();}},
        TK7NativeRosterShare:{available:()=>mobile},
        TK7UploadTactics:async()=>{calls.upload++;return {type:'video',originalContentUrl:'https://fixture/video.mp4'};},
        TK7LineupMedia:{remember(){},forget(){}},TK7DirectShare:{share:()=>{calls.line++;return Promise.resolve({status:'success'});}},
        record:async()=>new Blob(['video'],{type:'video/mp4'}),draw(){}};
    vm.createContext(context);
    vm.runInContext(source.slice(source.indexOf('    let current = null;'),source.indexOf("    document.getElementById('lineup-video')")),context);
    return {context,nodes,calls};
}
test('mobile video has one send button, opens native file sharing and never uploads first',async()=>{
    const {context,nodes,calls}=shareHarness(true);await context.open({duration:4000});
    const actions=nodes[0].children[3],send=actions.children[0];
    assert.equal(actions.children.length,3);assert.equal(send.textContent,'ส่ง LINE');
    assert.equal(send.disabled,false);assert.equal(calls.upload,0);
    const result=send.onclick();assert.equal(calls.native,1);assert.equal(calls.line,0);
    await result;assert.equal(calls.closed,1);
});
test('desktop prepares video once then opens LINE in one click',async()=>{
    const {context,nodes,calls}=shareHarness(false);await context.open({duration:4000});
    const send=nodes[0].children[3].children[0];
    assert.equal(calls.upload,1);assert.equal(send.disabled,false);assert.equal(calls.line,0);
    const result=send.onclick();assert.equal(calls.line,1);
    await result;assert.equal(calls.closed,1);assert.equal(calls.upload,1);assert.equal(calls.native,0);
});

test('video interpolation follows the same waypoints and end points as the preview', () => {
    const context = { document: { getElementById: () => null } };
    vm.createContext(context);
    vm.runInContext(source, context);
    const player = { start: { x: 20, y: 40 }, route: [{ x: 60, y: 40 }, { x: 60, y: 80 }] };
    const at = context.TK7LineupVideo.positionAt;
    assert.equal(at(player, 0).x, 20);
    assert.equal(at(player, .25).x, 40);
    assert.equal(at(player, .5).y, 40);
    assert.equal(at(player, 1).y, 80);
    assert.equal(at({ start: { x: 30, y: 50 }, route: [] }, .5).x, 30);
});

function recorderHarness({ supported = true } = {}) {
    const frames = new Map(), timers = new Map();
    let stopped = 0;
    const document = new EventTarget();
    const track = { stop: () => stopped++ };
    class Recorder {
        static isTypeSupported() { return supported; }
        constructor() { this.state = 'inactive'; }
        start() { this.state = 'recording'; }
        stop() {
            this.state = 'inactive';
            this.ondataavailable?.({ data: new Blob(['MP4 fixture']) });
            this.onstop?.();
        }
    }
    const context = {
        MediaRecorder: Recorder, document, Blob, DOMException, performance: { now: () => 0 },
        draw() {},
        requestAnimationFrame: fn => { const id = Symbol(); frames.set(id, fn); return id; },
        cancelAnimationFrame: id => frames.delete(id),
        setTimeout: fn => { const id = Symbol(); timers.set(id, fn); return id; },
        clearTimeout: id => timers.delete(id)
    };
    vm.createContext(context);
    vm.runInContext(source.slice(source.indexOf('    function record('), source.indexOf('    let current = null;')), context);
    const canvas = { getContext: () => ({}), captureStream: () => ({ getTracks: () => [track] }) };
    return { context, canvas, frames, timers, get stopped() { return stopped; } };
}

test('MP4 recording releases tracks and frame callbacks after finishing', async () => {
    const h = recorderHarness();
    const status = {};
    const result = h.context.record(h.canvas, { duration: 4000 }, new AbortController().signal, status);
    [...h.frames.values()][0](5300);
    const blob = await result;
    assert.equal(blob.type, 'video/mp4');
    assert.ok(blob.size > 0);
    assert.equal(h.stopped, 1);
    assert.equal(h.frames.size, 0);
    assert.equal(h.timers.size, 0);
});

test('closing a recording stops its tracks and unsupported codecs do not start capture', async () => {
    const h = recorderHarness();
    const controller = new AbortController();
    const result = h.context.record(h.canvas, { duration: 4000 }, controller.signal, {});
    controller.abort();
    await assert.rejects(result, { name: 'AbortError' });
    assert.equal(h.stopped, 1);
    assert.equal(h.frames.size, 0);
    assert.equal(h.timers.size, 0);
    const unavailable = recorderHarness({ supported: false });
    await assert.rejects(unavailable.context.record(unavailable.canvas, {}, new AbortController().signal, {}), /MP4/);
    assert.equal(unavailable.frames.size, 0);
});
