import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/lineup-path.js',import.meta.url),'utf8');
function harness(){const ctx={document:{getElementById:()=>null}};vm.createContext(ctx);vm.runInContext(source,ctx);return ctx;}

test('unevenly spaced route points produce distance-based, steady movement',()=>{
    const {TK7Path:path}=harness();
    const prepared=path.prepare({x:20,y:50},[{x:21,y:50},{x:80,y:50}]);
    const middle=path.position(prepared,.5);
    assert.ok(Math.abs(middle.x-50)<1e-6);
    assert.equal(path.position(prepared,0).x,20);
    assert.equal(path.position(prepared,1).x,80);
    assert.equal(prepared.at(-1).offset,1);
    assert.ok(prepared.every((p,i)=>!i||p.offset>=prepared[i-1].offset));
});

test('curved paths remain inside the field and empty routes stay still',()=>{
    const {TK7Path:path}=harness();
    const prepared=path.prepare({x:12,y:8},[{x:88,y:8},{x:88,y:92},{x:12,y:92}]);
    for(let i=0;i<=100;i++){
        const point=path.position(prepared,i/100);
        assert.ok(point.x>=12&&point.x<=88&&point.y>=8&&point.y<=92);
    }
    const still=path.position(path.prepare({x:30,y:40},[]),.7);
    assert.equal(still.x,30);assert.equal(still.y,40);
});

test('video interpolation uses exactly the editor shared path',()=>{
    const ctx=harness();
    vm.runInContext(fs.readFileSync(new URL('../js/lineup-video.js',import.meta.url),'utf8'),ctx);
    const player={start:{x:20,y:50},route:[{x:30,y:20},{x:70,y:65}]};
    const prepared=ctx.TK7Path.prepare(player.start,player.route);
    for(const t of [0,.1,.25,.5,.75,.9,1]){
        const actual=ctx.TK7LineupVideo.positionAt(player,t),expected=ctx.TK7Path.position(prepared,t);
        assert.equal(actual.x,expected.x);assert.equal(actual.y,expected.y);
    }
});
