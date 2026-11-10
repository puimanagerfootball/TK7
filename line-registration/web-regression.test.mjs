import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
test('score controls stage 3–1 and commit only the confirmed 3–2',()=>{
 const date='2026-11-13',writes=[];
 const day={schedule:[{home:'green',away:'blue',homeScore:3,awayScore:0}]};
 const context={currentDateKey:date,appData:{[date]:day},canManage:()=>true,pendingPasswordRecovery:false,
  patchMatchScoreCardUI(){},scheduleLeaderboardRefresh(){},queueScoreSave:()=>writes.push(day.schedule[0].awayScore)};
 vm.createContext(context);
 vm.runInContext(between('        const scoreEdits =','        const SCORE_SAVE_DEBOUNCE_MS')+between('        function updateScore(index','        function calculateLeaderboard('),context);
 const plus={dataset:{index:'0',team:'away',op:'1'}};
 context.updateScoreFromButton(plus);
 assert.equal(context.scoreEditFor(date,0,day.schedule[0]).awayScore,1);
 context.updateScoreFromButton(plus);
 assert.equal(context.scoreEditFor(date,0,day.schedule[0]).awayScore,2);
 assert.equal(day.schedule[0].awayScore,0);
 assert.deepEqual(writes,[]);
 context.commitScore(0);
 assert.deepEqual(writes,[2]);
});
test('refreshing the date list preserves the independent setup and schedule selections',async()=>{
 const scheduleDay='2026-11-06',setupDay='2026-11-13',today='2026-11-09';
 const dates=[setupDay,today,scheduleDay];
 const input={value:''},calls=[];
 const context={
  db:{from:()=>({select:()=>({order:async()=>({data:dates.map(match_date=>({match_date}))})})})},
  matchDayLoadSeq:0,currentDateKey:today,datePreference:kind=>({view:scheduleDay,setup:setupDay})[kind],
  todayDateKey:()=>today,updateDateSelectorsUI(){},loadDataForDate:async d=>calls.push(['view',d]),
  document:{getElementById:()=>input},prepareSetupFormForDate:async d=>calls.push(['setup',d]),
  activePage:'page-schedule',canManage:()=>true,setActivePage(){}
 };
 vm.runInNewContext(between('        async function loadInitialData(','        function formatAuthError('),context);
 await context.loadInitialData();
 assert.deepEqual(calls,[['view',scheduleDay],['setup',setupDay]]);
 calls.length=0;
 Object.assign(context,{matchDayLoadSeq:1,currentDateKey:setupDay});
 input.value=scheduleDay;
 await context.loadInitialData();
 assert.deepEqual(calls,[['view',setupDay],['setup',scheduleDay]]);
});
test('a failed date switch cannot leave the previous day’s score controls on screen',async()=>{
 let finish;
 const rendered=[];
 const context={currentDateKey:'old',appData:{old:{schedule:[{homeScore:4}]}},document:{getElementById:()=>null},
  db:{from:()=>({select:()=>({eq:()=>new Promise(resolve=>{finish=resolve;})})})},
  renderVisiblePage:date=>rendered.push([date,context.appData[date]]),console:{error(){}},alert(){}};
 vm.createContext(context);
 vm.runInContext(between('        let matchDayLoadSeq=0;','        function loadSettingsFromData('),context);
 const pending=context.loadDataForDate('new',{syncSetupDate:false});
 assert.deepEqual(rendered,[['new',undefined]]);
 finish({error:{message:'offline'}});
 await pending;
 assert.equal(context.currentDateKey,'new');
 assert.deepEqual(rendered,[['new',undefined]]);
});
test('rendering a date builds only the visible page and preserves unsaved setup settings',()=>{
 const calls=[];const context={activePage:'page-scores',appData:{a:{settings:{}}},setupPageSetup:()=>{},document:{getElementById:()=>({value:'a'})},loadSettingsFromData:()=>calls.push('settings'),canManage:()=>true,resetSettingsForm:()=>{},updateGenerateButtonForDate:()=>{},renderSchedulePage:()=>calls.push('schedule'),renderScoresPage:()=>calls.push('scores'),renderLeaderboardPage:()=>calls.push('leaderboard'),renderLineupPage:()=>calls.push('lineup')};
 vm.createContext(context);vm.runInContext(between('        function renderVisiblePage(', '        function updateTemplateSelector('),context);context.renderAllPagesForDate('a');assert.deepEqual(calls,['scores']);
 calls.length=0;context.activePage='page-schedule';context.renderVisiblePage('a');assert.deepEqual(calls,['schedule']);
});
test('a server response cannot replace a score draft created while the read was pending',async()=>{
 let resolve;const day={schedule:[{homeScore:5}]};const context={currentDateKey:'a',appData:{a:day},document:{getElementById:()=>({options:[]})},db:{from:()=>({select:()=>({eq:()=>new Promise(r=>resolve=r)})})},scoreWriter:{hasPending:()=>true},deferredScoreRefresh:new Set(),renderAllPagesForDate(){},updateGenerateButtonForDate(){},restoreScrollPosition(){},console,alert(){}};
 vm.createContext(context);vm.runInContext(between('        let matchDayLoadSeq=0;','        function loadSettingsFromData('),context);const read=context.loadDataForDate('a',{syncSetupDate:false});resolve({data:[{schedule:[{homeScore:0}]}]});await read;assert.equal(context.appData.a,day);assert.equal(context.deferredScoreRefresh.has('a'),true);
});
test('a late profile response cannot restore the previous account after sign out',async()=>{
 let resolve;const context={currentUser:{id:'one'},userProfile:null,db:{from:()=>({select:()=>({eq:()=>({maybeSingle:()=>new Promise(r=>resolve=r)})})})},console,showToast(){},sanitizeDisplayName:x=>x};vm.createContext(context);vm.runInContext(between('        let profileLoadSequence = 0;','        async function refreshSuperadminFlag('),context);
 const old=context.loadUserProfile();context.currentUser=null;await context.loadUserProfile();resolve({data:{id:'one',role:'superadmin',status:'approved'}});await old;assert.equal(context.userProfile,null);
});
test('Auth callback returns before starting any database refresh',async()=>{
 let callback;const timers=[],reads=[];const context={db:{auth:{onAuthStateChange:fn=>callback=fn}},currentUser:null,userProfile:null,pendingPasswordRecovery:false,loginModal:{style:{}},refreshAuthUI(){},openResetPasswordModal(){},refreshUserAccess:async()=>reads.push('profile'),loadInitialData:async()=>reads.push('data'),showToast(){},setTimeout:fn=>timers.push(fn)};
 vm.createContext(context);vm.runInContext(between('            let authRefreshSequence = 0;','            listenToRealtimeChanges();'),context);assert.equal(callback('SIGNED_IN',{user:{id:'one'}}),undefined);assert.equal(reads.length,0);await timers[0]();assert.deepEqual(reads,['profile','data']);
});
test('retired preview and legacy signup modals are absent',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');for(const id of ['team-select-modal','share-image-modal'])assert.ok(!html.includes('id="'+id+'"'),id);
 for(const id of ['share-reg-modal','copy-reg-template-btn'])assert.ok(!html.includes('id="'+id+'"'),id);
 for(const name of ['isPhoneLikeDevice','desiredOrientationForPage'])assert.ok(source.includes('function '+name+'('));
});
test('root image sharing cancels without download and releases fallback object URLs',async()=>{
 const code=between('        async function shareImageBlob(', '        async function shareElementToLine(');let created=0,revoked=0,clicked=0;const timers=[];
 const context={purgeCaptureStages(){},ensurePngBlob:async x=>x,isMobileShareDevice:()=>true,navigator:{canShare:()=>true,share:async()=>{throw {name:'AbortError'}}},window:{},File:class{},showToast(){},URL:{createObjectURL:()=>{created++;return 'blob:test'},revokeObjectURL:()=>revoked++},document:{createElement:()=>({click:()=>clicked++,remove(){}}),body:{appendChild(){}}},setTimeout:fn=>timers.push(fn)};
 vm.createContext(context);vm.runInContext(code,context);assert.equal(await context.shareImageBlob({},'a.png'), 'aborted');assert.equal(created,0);assert.equal(clicked,0);
 context.isMobileShareDevice=()=>false;assert.equal(await context.shareImageBlob({},'a.png'),'download');assert.equal(clicked,1);timers[0]();assert.equal(revoked,1);
});
test('PNG conversion frees canvas and decoded image resources',async()=>{
 let closed=0;const canvas={width:1,height:1,getContext:()=>({drawImage(){}})};const context={createImageBitmap:async()=>({width:10,height:20,close:()=>closed++}),document:{createElement:()=>canvas},canvasToBlob:async()=>({type:'image/png'}),console};vm.createContext(context);vm.runInContext(between('        async function ensurePngBlob(', '        async function shareImageBlob('),context);await context.ensurePngBlob({type:'image/jpeg'});assert.equal(closed,1);assert.equal(canvas.width,0);assert.equal(canvas.height,0);
});
