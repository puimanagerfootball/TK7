import test from 'node:test';import assert from 'node:assert/strict';import '../js/match-stats.js';
const S=globalThis.TK7MatchStats,teams=[{slug:'green',name:'Green'},{slug:'red',name:'Red'}];
const day=schedule=>({settings:{activeTeams:['green','red']},schedule});
test('scores accept whole numbers and legacy numeric strings, never HTML or invalid data',()=>{
 for(const value of [null,undefined,'',true,'<img src=x onerror=alert(1)>',-1,1.2,'2e3',{},Number.MAX_SAFE_INTEGER+1])assert.equal(S.score(value),null);
 for(const value of [0,'0',2,'2'])assert.equal(S.score(value),Number(value));
});
test('leaderboard calculates numeric scores without concatenating strings',()=>{
 const stats=S.calculate(day([{home:'green',away:'red',homeScore:'2',awayScore:'1'},{home:'green',away:'red',homeScore:0,awayScore:0}]),teams);
 assert.deepEqual(stats.green,{name:'Green',slug:'green',p:2,w:1,d:1,l:0,gf:2,ga:1,gd:1,pts:4});assert.equal(stats.red.pts,1);
});
test('unplayed, malformed, same-team and unknown-team matches do not corrupt statistics or prototypes',()=>{
 const stats=S.calculate(day([null,{home:'green',away:'red',homeScore:null,awayScore:1},{home:'green',away:'green',homeScore:2,awayScore:1},{home:'__proto__',away:'red',homeScore:2,awayScore:1},{home:'constructor',away:'red',homeScore:2,awayScore:1}]),teams);
 assert.equal(stats.green.p,0);assert.equal(stats.red.p,0);assert.equal(Object.prototype.p,undefined);assert.deepEqual(S.calculate({},teams),{});
});
