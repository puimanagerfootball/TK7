import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHandler} from './server.mjs';
import {buildMenuMessage} from './share-menu.mjs';

// Intentionally no LINE Bot access token, secret or group environment variable.
const env={TK7_APP_ORIGIN:'https://example.test',LINE_LOGIN_CHANNEL_ID:'2012278818',SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'test-key'};
const sid=crypto.randomUUID(),entry=crypto.randomUUID();
const req=(body,path='',origin=env.TK7_APP_ORIGIN)=>new Request('https://edge.test/'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const ok=data=>new Response(JSON.stringify(data));
function harness({identity={sub:'Uverified',name:'Pui'},verifyStatus=200,replayed=false,settings=[{group_id:'legacy-dataset',environment:'production'}],missingSession=false,dbError=false,profile={userId:"Uabc123",displayName:"Pui Profile"},profileStatus=200,scheduleDay=null,readGate=null}={}){
 const calls=[],writes=[];
 const handler=createHandler(env,async(url,options={})=>{
  calls.push(url);assert.ok(!url.includes('/v2/bot/'),'must never call a LINE Bot API');
  if(url.endsWith('/oauth2/v2.1/verify')){
   assert.equal(options.body.get('client_id'),env.LINE_LOGIN_CHANNEL_ID);
   return verifyStatus===200?ok(identity):new Response('',{status:verifyStatus});
  }
  if(url==='https://api.line.me/v2/profile')return profileStatus===200?ok(profile):new Response('',{status:profileStatus});
  if(dbError)return new Response('{"message":"Database unavailable"}',{status:503});
  if(url.includes('tk7_line_settings?'))return ok(settings);
  if(url.includes('tk7_signup_sessions?')){
   assert.match(url,/group_id=eq.legacy-dataset&environment=eq.production/);
   if(missingSession)return ok([]);
   return ok([{id:sid,match_date:'2099-11-06',is_open:true,start_time:'20:15:00',time_per_match:8,teams:['green','red','purple']}]);
  }
  if(url.includes('match_days?')){if(readGate)await readGate('schedule');assert.match(url,/match_date=eq.2099-11-06&limit=1$/);return ok(scheduleDay?[scheduleDay]:[]);}
  if(url.endsWith('rpc/tk7_read_roster')){if(readGate)await readGate('roster');return ok({revision:1,entries:[{id:entry,name:'Alex',team:'green',slot:1}]});}
  if(url.includes('tk7_signup_log?'))return ok([{actor_name:'Pui',action:'move',detail:'Alex → สีแดง',created_at:'2026-11-03T02:00:00Z'}]);
  if(url.endsWith('tk7_signup_log')){writes.push(JSON.parse(options.body));return ok([]);}
  if(/rpc\/tk7_(signup_batch|change_entry|team_action)$/.test(url)){
   writes.push({rpc:url.split('/').pop(),...JSON.parse(options.body)});return ok({count:1,revision:2,replayed});
  }
  throw Error('Unexpected URL '+url);
 });
 return {handler,calls,writes};
}
test('all retired bot routes return 410 without network requests',async()=>{
 const {handler,calls}=harness();
 for(const path of ['webhook','worker'])assert.equal((await handler(req({events:[],jobId:crypto.randomUUID(),lease:crypto.randomUUID()},path))).status,410);
 assert.equal(calls.length,0);
});
test('invalid origin and absent ID token cannot touch database',async()=>{
 const {handler,calls}=harness();
 assert.equal((await handler(req({},'','https://evil.test'))).status,403);
 assert.equal((await handler(req({}))).status,401);
 assert.equal(calls.length,0);
});
test('invalid or empty verified identity cannot access dates',async()=>{
 for(const config of [{verifyStatus:400},{identity:{}},{identity:{sub:''}}]){
  const {handler,calls}=harness(config);
  assert.equal((await handler(req({action:'dates',idToken:'bad'}))).status,401);
  assert.equal(calls.length,1);
 }
});
test('LINE login alone can list configured dates without Bot secrets or membership',async()=>{
 const {handler,calls}=harness();
 const response=await handler(req({action:'dates',idToken:'valid'}));assert.equal(response.status,200);
 const {dates}=await response.json();assert.equal(dates[0].startTime,'20:15');assert.equal(dates[0].timePerMatch,8);
 assert.equal(calls.length,3);
});
test('missing settings and database failure fail closed instead of exposing all datasets',async()=>{
 for(const config of [{settings:[]},{dbError:true}]){
  const {handler,calls}=harness(config);const response=await handler(req({action:'dates',idToken:'valid'}));
  assert.notEqual(response.status,200);assert.equal(calls.length,2);
 }
});
test('session lookup stays within dataset, including history reads',async()=>{
 const {handler,calls}=harness({missingSession:true});
 assert.equal((await handler(req({action:'log',sessionId:sid,idToken:'valid'}))).status,404);
 assert.ok(!calls.some(u=>u.includes('tk7_signup_log')));
});
test('registration preserves server-verified actor, names and activity history',async()=>{
 const {handler,writes}=harness();
 const response=await handler(req({action:'register',team:'green',names:['Alex'],idToken:'valid',sessionId:sid,requestId:crypto.randomUUID(),owner:'spoofed',actorName:'Spoofed'}));
 assert.equal(response.status,200);assert.equal(writes[0].p_owner,'Uverified');
 assert.equal(writes[1].actor_name,'Pui');assert.equal(writes[1].actor_id,'Uverified');assert.match(writes[1].detail,/Alex/);
});
test('replayed mutations do not duplicate history',async()=>{
 const {handler,writes}=harness({replayed:true});
 assert.equal((await handler(req({action:'register',team:'green',names:['Alex'],idToken:'valid',sessionId:sid,requestId:crypto.randomUUID()}))).status,200);
 assert.equal(writes.length,1);
});
test('missing profile name uses a stable account suffix, never a client name',async()=>{
 const {handler,writes}=harness({identity:{sub:'Uabc123'}});
 await handler(req({action:'register',team:'green',names:['Alex'],idToken:'valid',sessionId:sid,requestId:crypto.randomUUID(),actorName:'Spoofed'}));
 assert.equal(writes[1].actor_name,'LINE user · abc123');
});
test('move, swap, cancel, recolor and bulk keep audit and verified actor',async()=>{
 for(const action of ['move','swap','cancel','recolor','bulk']){
  const {handler,writes}=harness();
  const response=await handler(req({action,op:'move',from:'green',team:'red',entryId:entry,otherId:crypto.randomUUID(),entryIds:[entry],revision:1,idToken:'valid',sessionId:sid,requestId:crypto.randomUUID()}));
  assert.equal(response.status,200,action);assert.equal(writes[0].p_actor,'Uverified');assert.equal(writes[1].actor_name,'Pui');
 }
});
test('latest-three and expanded history remain available',async()=>{
 for(const all of [false,true]){
  const {handler,calls}=harness();const response=await handler(req({action:'log',all,sessionId:sid,idToken:'valid'}));
  assert.equal(response.status,200);assert.equal((await response.json()).log[0].actor_name,'Pui');
  assert.match(calls.at(-1),new RegExp('limit='+(all?200:3)+'$'));
 }
});
test('invalid colour never reaches write RPC',async()=>{
 const {handler,writes}=harness();
 assert.equal((await handler(req({action:'register',team:'invalid',names:['Alex'],idToken:'valid',sessionId:sid,requestId:crypto.randomUUID()}))).status,400);
 assert.equal(writes.length,0);
});
test('shared Flex is evergreen, bilingual and uses URI actions only',()=>{
 const message=buildMenuMessage();assert.equal(message.type,'flex');assert.ok(!JSON.stringify(message).includes('20:15'));
 assert.match(JSON.stringify(message),/JOIN THE GAME/);assert.ok(Buffer.byteLength(JSON.stringify(message.contents))<30000);
 const visit=o=>{if(o&&typeof o==='object'){if(o.action){assert.equal(o.action.type,'uri');assert.ok(o.action.uri.startsWith('https://'));}for(const x of Object.values(o))visit(x);}};
 visit(message);assert.equal(message.contents.footer.contents[0].action.uri,'https://liff.line.me/2012278818-W0pIi2y0');
});
test('runtime code and migration contain no delivery requests and keep audit table',()=>{
 const server=fs.readFileSync(new URL('server.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(server,/\/v2\/bot\/|LINE_CHANNEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET/);
 const migration=fs.readFileSync(new URL('022_pause_bot_delivery.sql',import.meta.url),'utf8');
 assert.doesNotMatch(migration,/\b(delete\s+from|drop\s+table)\s+(public\.)?tk7_signup_(entries|sessions|log)/i);
 assert.match(migration,/cron\.alter_job/);assert.doesNotMatch(migration,/\brevoke\b|\bdrop\s+trigger\b/i);
});
test('generated Edge Function is self-contained and retires worker without fetching',async()=>{
 let handler;
 const context={Request,Response,URL,URLSearchParams,AbortSignal,TextEncoder,crypto,Date,
  fetch:()=>{throw Error('must not fetch')},Deno:{env:{toObject:()=>env},serve:h=>{handler=h}}};
 vm.runInNewContext(fs.readFileSync(new URL('index.ts',import.meta.url),'utf8'),context);
 assert.equal(typeof handler,'function');assert.equal((await handler(req({},'worker'))).status,410);
});

test('profile fallback checks matching LINE user and handles denied access',async()=>{
 for(const config of [{},{profile:{userId:'Uother',displayName:'Wrong'}},{profileStatus:401}]){
  const {handler,writes}=harness({identity:{sub:'Uabc123'},...config});
  await handler(req({action:'register',team:'green',names:['Alex'],idToken:'valid',accessToken:'profile-token',sessionId:sid,requestId:crypto.randomUUID()}));
  assert.equal(writes[1].actor_name,Object.keys(config).length?'LINE user · abc123':'Pui Profile');
 }
});

test('account status distinguishes missing token, permission and mismatched profile without exposing tokens',async()=>{
 for(const [config,accessToken,status,name] of [[{},undefined,'missing_access_token',null],[{profileStatus:403},'token','profile_permission_required',null],[{profileStatus:401},'token','expired_access_token',null],[{profile:{userId:'Uother',displayName:'Spoof'}},'token','identity_mismatch',null],[{},'token','ready','Pui Profile']]){
  const {handler}=harness({identity:{sub:'Uabc123'},...config});
  const result=await (await handler(req({action:'dates',idToken:'valid',accessToken}))).json();
  assert.deepEqual(result.account,{name,status});assert.ok(!JSON.stringify(result).includes('Uabc123'));
 }
});

test('roster exposes only the selected date schedule and no raw settings or scores',async()=>{
 const day={match_date:'2099-11-06',settings:{startTime:'20:15',timePerMatch:8,private:'hidden'},schedule:[{home:'green',away:'red',homeScore:2}]};
 for(const scheduleDay of [null,day]){const {handler}=harness({scheduleDay});const result=await (await handler(req({action:'roster',idToken:'valid',sessionId:sid}))).json();assert.equal(result.schedule?.date||null,scheduleDay?.match_date||null);assert.ok(!JSON.stringify(result).includes('private'));assert.ok(!JSON.stringify(result).includes('homeScore'));}
});

test('authorized roster and schedule reads start together without fetching profile again',{timeout:2000},async()=>{
 let release,ready;const held=new Promise(r=>release=r),both=new Promise(r=>ready=r),started=[];
 const {handler,calls}=harness({identity:{sub:'Uabc123'},readGate:kind=>{started.push(kind);if(started.length===2)ready();return held}});
 const response=handler(req({action:'roster',idToken:'valid',accessToken:'profile-token',sessionId:sid}));
 await both;assert.deepEqual(started.sort(),['roster','schedule']);assert.ok(!calls.includes('https://api.line.me/v2/profile'));release();assert.equal((await response).status,200);
});
