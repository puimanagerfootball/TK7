import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
await import('../js/score-writer.js');
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return {promise, resolve}; };
const setupSource = app.slice(app.indexOf('        const setupDayFlights'), app.indexOf('        async function prepareSetupFormForDate'));
const initialSource = app.slice(app.indexOf('        let initialDataLoadSeq'), app.indexOf('        function formatAuthError'));

function setupHarness() {
    const reads = [];
    const ctx = {appData: {}, console, db: {from: () => ({select: () => ({eq: () => ({maybeSingle: () => {
        const d = deferred(); reads.push(d); return d.promise;
    }})})})}};
    vm.createContext(ctx); vm.runInContext(setupSource, ctx);
    return {ctx, reads};
}
test('overlapping setup reads share one request and preserve a newer cached day', async () => {
    const {ctx, reads} = setupHarness();
    const first = ctx.ensureDateLoaded('a'), second = ctx.ensureDateLoaded('a');
    assert.equal(reads.length, 1);
    const newer = {updated_at: 'new', schedule: [{homeScore: 3, awayScore: 2}]};
    ctx.appData.a = newer;
    reads[0].resolve({data: {updated_at: 'old', schedule: []}});
    assert.equal(await first, newer); assert.equal(await second, newer);
    assert.equal(ctx.appData.a, newer);
});
test('failed setup reads can be retried without retaining a rejected flight', async () => {
    const {ctx, reads} = setupHarness(); ctx.console = {error() {}};
    const first = ctx.ensureDateLoaded('a'); reads[0].resolve({error: {message: 'offline'}});
    await assert.rejects(first, /โหลดการตั้งค่า/);
    const retry = ctx.ensureDateLoaded('a'); assert.equal(reads.length, 2);
    reads[1].resolve({data: {updated_at: 'ok'}}); assert.equal((await retry).updated_at, 'ok');
});
function initialHarness() {
    const reads = [], views = [], setups = [], input = {value: 'a'};
    const ctx = {matchDayLoadSeq: 0, currentDateKey: 'a', setupDateChosen: false,
        document: {getElementById: () => input}, console, activePage: 'page-schedule',
        db: {from: () => ({select: () => ({order: () => {const d = deferred(); reads.push(d); return d.promise;}})})},
        todayDateKey: () => 'today', updateDateSelectorsUI() {}, datePreference: () => null,
        loadDataForDate: async date => {ctx.matchDayLoadSeq++; ctx.currentDateKey = date; views.push(date);},
        prepareSetupFormForDate: async date => setups.push(date), canManage: () => true, setActivePage() {}};
    vm.createContext(ctx); vm.runInContext(initialSource, ctx);
    return {ctx, reads, views, setups, input};
}
test('a late date-list refresh cannot return the user to an older date', async () => {
    const {ctx, reads, views, setups} = initialHarness();
    const refresh = ctx.loadInitialData();
    ctx.matchDayLoadSeq++; ctx.currentDateKey = 'b';
    reads[0].resolve({data: [{match_date: 'a'}]}); await refresh;
    assert.deepEqual(views, []); assert.deepEqual(setups, []); assert.equal(ctx.currentDateKey, 'b');
});
test('only the latest overlapping date-list refresh applies its response', async () => {
    const {ctx, reads, views} = initialHarness();
    const old = ctx.loadInitialData(), latest = ctx.loadInitialData();
    reads[1].resolve({data: [{match_date: 'b'}]}); await latest;
    reads[0].resolve({data: [{match_date: 'a'}]}); await old;
    assert.deepEqual(views, ['b']); assert.equal(ctx.currentDateKey, 'b');
});
test('a setup date chosen while a refresh is loading is not replaced', async () => {
    const {ctx, reads, setups, input} = initialHarness();
    const refresh = ctx.loadInitialData(); input.value = 'new-selection';
    reads[0].resolve({data: [{match_date: 'a'}]}); await refresh;
    assert.deepEqual(setups, []); assert.equal(input.value, 'new-selection');
});

test('deleting a fixture compares the displayed revision and rejects conflicts', async () => {
    const calls = []; let result = null;
    const query = {delete() {return this;}, eq(k,v) {calls.push([k,v]); return this;},
        select() {return this;}, maybeSingle: async () => ({data: result})};
    const db = {from: () => query};
    await assert.rejects(globalThis.TK7ScoreWriter.deleteFixture(db, {date:'a', version:'v1'}), /ตารางเปลี่ยน/);
    assert.deepEqual(calls, [['match_date','a'], ['updated_at','v1']]);
    result = {match_date:'a'};
    assert.equal((await globalThis.TK7ScoreWriter.deleteFixture(db, {date:'a', version:'v2'})).match_date, 'a');
    await assert.rejects(globalThis.TK7ScoreWriter.deleteFixture(db, {date:'a'}), /ไม่พบรุ่น/);
});
test('day deletion waits for score writes, blocks duplicate clicks and uses the saved revision', async () => {
    const pending = deferred(), calls = [], drafts = new Map([['a#0',{}], ['b#0',{}]]);
    const ctx = {canManage: () => true, confirm: () => true, alert: assert.fail,
        document: {getElementById: () => ({value:'a'})}, db:{}, appData:{a:{updated_at:'v1'}}, scoreEdits:drafts,
        flushScoreSave: async () => {await pending.promise; ctx.appData.a.updated_at='v2'; return true;},
        window:{TK7ScoreWriter:{deleteFixture: async (_, args) => calls.push(args)}}, showToast() {}, loadInitialData: async () => {}};
    vm.createContext(ctx);
    const start = app.indexOf('        let deletingDay = false;');
    vm.runInContext(app.slice(start, app.indexOf('\n        }', start)+10), ctx);
    const first = ctx.deleteDay(); await ctx.deleteDay(); assert.equal(calls.length, 0);
    pending.resolve(); await first;
    assert.equal(calls.length, 1); assert.equal(calls[0].version, 'v2');
    assert.equal(ctx.appData.a, undefined); assert.equal(drafts.has('a#0'), false); assert.equal(drafts.has('b#0'), true);
});

test('invalid score input never silently becomes a different score', () => {
    const values = [], notices = [];
    const ctx = {updateScore: (_,team,n) => values.push([team,n]), patchMatchScoreCardUI() {}, showToast: m => notices.push(m)};
    vm.createContext(ctx);
    vm.runInContext(app.slice(app.indexOf('        function updateScoreFromInput('), app.indexOf('        function resetScore(')), ctx);
    const input = {dataset: {index:'0',team:'away'}};
    for (const value of ['1e2','3.5','-1','9007199254740993']) {input.value=value; ctx.updateScoreFromInput(input);}
    assert.deepEqual(values, []); assert.equal(notices.length, 4);
    for (const value of ['0','12','']) {input.value=value; ctx.updateScoreFromInput(input);}
    assert.deepEqual(values, [['away',0],['away',12],['away',null]]);
});
