import './security.js';
import './schedule.js';
import {thaiDate,TEAM_COLORS} from './delivery.mjs';
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const COLOR_SLUGS=TEAM_COLORS.map(c=>c[0]);
export const bangkokToday=()=>new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
const isRegistrationOpen=s=>s.is_open&&Date.now()<Date.parse(s.match_date+'T'+(s.start_time||'20:00')+'+07:00');
export function createHandler(env,fetcher=fetch){
 const get=k=>env[k]||'';
 async function db(path,body){
  const r=await fetcher(get('SUPABASE_URL')+'/rest/v1/'+path,{method:body===undefined?'GET':'POST',signal:AbortSignal.timeout(15000),headers:{apikey:get('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+get('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body)});
  if(!r.ok){const error=await r.json().catch(()=>({}));throw new Error(error.message||'Database unavailable')}
  const text=await r.text();return text?JSON.parse(text):null;
 }
 // Existing group_id is retained only as an internal dataset key; no LINE group API is used.
 async function active(){
  const rows=await db('tk7_line_settings?select=group_id,environment&id=eq.true');
  const settings=rows?.[0];
  if(!settings?.group_id)throw new Error('Registration not configured');
  return {group:settings.group_id,environment:settings.environment||'production'};
 }
 const filterOf=a=>'group_id=eq.'+encodeURIComponent(a.group)+'&environment=eq.'+encodeURIComponent(a.environment);
 return async req=>{
  // อนุญาตทั้งโฮสต์เดิม (TK7_APP_ORIGIN) และ GitHub Pages ของ TK7
  const allowed=[...get('TK7_APP_ORIGIN').split(','),'https://puimanagerfootball.github.io','https://tk7-line-registration-odf.md-8887.chatgpt.site'].map(x=>x.trim()).filter(Boolean);
  const reqOrigin=req.headers.get('Origin')||'';
  const origin=allowed.includes(reqOrigin)?reqOrigin:allowed[0];
  const reply=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type,authorization,apikey','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...extra}});
  const path=new URL(req.url).pathname;
  // Retire both bot ingress and delivery. Never fetch LINE Bot endpoints.
  if(path.endsWith('/webhook')||path.endsWith('/worker'))return reply({error:'Bot integration retired; share cards manually from TK7'},410);
  if(!allowed.includes(reqOrigin))return reply({error:'Origin denied'},403);
  if(req.method==='OPTIONS')return reply({});
  if(req.method!=='POST')return reply({error:'Method denied'},405);
  if(!get('LINE_LOGIN_CHANNEL_ID'))return reply({error:'ยังไม่ได้ตั้งค่า LINE Login'},503);
  let en=false;const L=(th,e)=>en?e:th;
  try{
   const b=await globalThis.TK7Security.readJSON(req);
   en=b.lang==='en';
   if(typeof b.idToken!=='string'||!b.idToken.trim()||b.idToken.length>8192)return reply({error:L('กรุณาเข้าสู่ระบบ LINE','Please log in with LINE')},401);
   if(!globalThis.TK7Security.actions.has(b.action))return reply({error:'Unknown action'},400);
   if(b.accessToken!=null&&(typeof b.accessToken!=='string'||b.accessToken.length>4096))return reply({error:'Invalid access token'},400);
   const verified=await fetcher('https://api.line.me/oauth2/v2.1/verify',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({id_token:b.idToken,client_id:get('LINE_LOGIN_CHANNEL_ID')})});
   if(!verified.ok)return reply({error:L('กรุณาเข้าสู่ระบบ LINE อีกครั้ง','Please log in with LINE again'),relogin:true},401);
   const identity=await verified.json();if(typeof identity.sub!=='string'||!identity.sub.trim())return reply({error:'Invalid identity'},401);
   const quota=await db('rpc/tk7_security_quota',{p_subject:identity.sub,p_mutation:!globalThis.TK7Security.reads.has(b.action)});
   if(!quota?.allowed){const retry=Math.max(1,Number(quota?.retry_after)||60);return reply({error:L('ทำรายการถี่เกินไป กรุณารอ '+retry+' วินาที','Too many requests. Please wait '+retry+' seconds'),retryAfter:retry},429,{'Retry-After':String(retry)});}
   const a=await active();
   // Only accept profile names belonging to the verified LINE identity.
   let actorName=typeof identity.name==='string'?identity.name.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,60):'';
   let profileStatus=actorName?'ready':'missing_access_token';
   if(!['roster','log'].includes(b.action)&&!actorName&&typeof b.accessToken==='string'&&b.accessToken.length<4096){
    try{
     const response=await fetcher('https://api.line.me/v2/profile',{headers:{Authorization:'Bearer '+b.accessToken},signal:AbortSignal.timeout(5000)});
     profileStatus=response.status===403?'profile_permission_required':response.status===401?'expired_access_token':'profile_unavailable';
     if(response.ok){const profile=await response.json();if(profile.userId===identity.sub&&typeof profile.displayName==='string')actorName=profile.displayName.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,60);profileStatus=actorName?'ready':profile.userId!==identity.sub?'identity_mismatch':'profile_name_missing';}
    }catch{profileStatus='profile_unavailable'}
   }
   actorName||='LINE user · '+identity.sub.slice(-6);
   const filter=filterOf(a);
   if(b.action==='dates'){
    const sessions=await db('tk7_signup_sessions?select=id,match_date,is_open,start_time,time_per_match&'+filter+'&is_open=eq.true&match_date=gte.'+bangkokToday()+'&order=match_date');
    const dates=sessions.filter(isRegistrationOpen).map(s=>({id:s.id,date:s.match_date,label:thaiDate(s.match_date),startTime:String(s.start_time||'20:00').slice(0,5),timePerMatch:s.time_per_match||8,isOpen:true}));
    return reply({account:{name:profileStatus==='ready'?actorName:null,status:profileStatus},dates});
   }
   if(!uuid(b.sessionId))return reply({error:L('กรุณาเลือกวันแข่งขัน','Please choose a match date')},400);
   const sessions=await db('tk7_signup_sessions?select=id,match_date,teams,is_open,start_time,revision&'+filter+'&id=eq.'+b.sessionId);const s=sessions[0];
   if(!s)return reply({error:L('ไม่พบวันแข่งขันนี้','Match date not found')},404);
   if(b.action==='roster'){
    const rosterUnchanged=Number.isSafeInteger(b.knownRosterRevision)&&b.knownRosterRevision===s.revision;
    const fixtureFilter='&match_date=eq.'+encodeURIComponent(s.match_date)+'&limit=1';
    const readSchedule=async()=>{
     if(b.knownScheduleVersion===null||typeof b.knownScheduleVersion==='string'){
      const [header]=await db('match_days?select=updated_at'+fixtureFilter);
      const version=header?.updated_at??null;
      if(version===b.knownScheduleVersion)return {scheduleVersion:version};
      if(!header)return {scheduleVersion:null,schedule:null};
     }
     const [day]=await db('match_days?select=match_date,settings,schedule,updated_at'+fixtureFilter);
     return {scheduleVersion:day?.updated_at??null,schedule:globalThis.TK7Schedule.normalize(day)};
    };
    const [roster,fixture]=await Promise.all([
     rosterUnchanged?{rosterUnchanged:true}:db('rpc/tk7_read_roster',{p_session:s.id}),
     readSchedule().catch(()=>({}))
    ]);
    return reply({...roster,isOpen:(roster.isOpen??s.is_open)&&isRegistrationOpen(s),...fixture});
   }
   if(b.action==='log'){
    const rows=await db('tk7_signup_log?select=actor_name,action,detail,created_at&session_id=eq.'+s.id+'&order=created_at.desc&limit='+(b.all===true?200:3));
    return reply({log:rows||[]});
   }
   // ชื่อ/สีก่อนแก้ไข ใช้เขียนประวัติ
   let before=[];
   if(['move','swap','cancel','bulk'].includes(b.action)){try{const r=await db('rpc/tk7_read_roster',{p_session:s.id});before=Array.isArray(r?.entries)?r.entries:[]}catch{}}
   const nm=id=>before.find(e=>e.id===id)?.name||'?';
   const cl=t=>(TEAM_COLORS.find(c=>c[0]===t)||[t,t])[1];
   if(!uuid(b.requestId))return reply({error:'Invalid request'},400);
   let action=b.action,detail='';
   if(b.action==='register')detail='ลงสี'+cl(b.team)+': '+(Array.isArray(b.names)?b.names.join(', '):'');
   else if(b.action==='move')detail=nm(b.entryId)+' → สี'+cl(b.team);
   else if(b.action==='swap')detail=nm(b.entryId)+' ⇄ '+nm(b.otherId);
   else if(b.action==='cancel')detail='ยกเลิก '+nm(b.entryId);
   else if(b.action==='recolor')detail='ทีมสี'+cl(b.from)+' → สี'+cl(b.team);
   else if(b.action==='bulk'){action='bulk_'+b.op;detail=(b.op==='move'?'ย้ายไปสี'+cl(b.team)+': ':'ยกเลิก: ')+(Array.isArray(b.entryIds)?b.entryIds.map(nm).join(', '):'')}
   const mutate=(rpc,args)=>db('rpc/tk7_secure_mutation',{p_rpc:rpc,p_args:args,p_actor:identity.sub,p_name:actorName,p_action:action,p_detail:detail.slice(0,300)});
   let result;
   if(b.action==='register'){
    if(!Array.isArray(b.names)||b.names.length<1||b.names.length>7||b.names.some(n=>typeof n!=='string'||!n.trim()||n.length>40||/[\u0000-\u001f\u007f]/.test(n))||!COLOR_SLUGS.includes(b.team)||!s.teams.includes(b.team))return reply({error:L('กรุณาตรวจสอบชื่อและสี','Please check the names and colour')},400);
    result=await mutate('tk7_signup_batch',{p_session:s.id,p_request:b.requestId,p_owner:identity.sub,p_team:b.team,p_names:b.names});
   }else if(['move','swap','cancel'].includes(b.action)){
    if(!uuid(b.entryId)||!Number.isSafeInteger(b.revision)||(b.action==='swap'&&!uuid(b.otherId))||(b.action==='move'&&!COLOR_SLUGS.includes(b.team)))return reply({error:L('ข้อมูลไม่ถูกต้อง','Invalid data')},400);
    result=await mutate('tk7_change_entry',{p_session:s.id,p_request:b.requestId,p_actor:identity.sub,p_revision:b.revision,p_action:b.action,p_entry:b.entryId,p_team:b.team??null,p_other:b.otherId??null});
   }else if(b.action==='recolor'){
    if(!COLOR_SLUGS.includes(b.from)||!COLOR_SLUGS.includes(b.team)||b.from===b.team||!Number.isSafeInteger(b.revision))return reply({error:L('ข้อมูลไม่ถูกต้อง','Invalid data')},400);
    result=await mutate('tk7_team_action',{p_session:s.id,p_request:b.requestId,p_actor:identity.sub,p_revision:b.revision,p_action:'recolor',p_entries:null,p_team:b.team,p_from:b.from});
   }else if(b.action==='bulk'){
    if(!['cancel','move'].includes(b.op)||!Array.isArray(b.entryIds)||b.entryIds.length<1||b.entryIds.length>70||!b.entryIds.every(uuid)||!Number.isSafeInteger(b.revision)||(b.op==='move'&&!COLOR_SLUGS.includes(b.team)))return reply({error:L('ข้อมูลไม่ถูกต้อง','Invalid data')},400);
    result=await mutate('tk7_team_action',{p_session:s.id,p_request:b.requestId,p_actor:identity.sub,p_revision:b.revision,p_action:'bulk_'+b.op,p_entries:b.entryIds,p_team:b.op==='move'?b.team:null,p_from:null});
   }else return reply({error:'Unknown action'},400);
   return reply({...result,message:L('บันทึกแล้ว ✓','Saved ✓')});
  }catch(e){
   if(e.status)return reply({error:e.message},e.status);
   const messages={'Roster changed; refresh first':['รายชื่อมีการเปลี่ยนแปลง กรุณารีเฟรชแล้วลองใหม่','The list changed, please refresh and try again'],'Not enough seats':['สีนี้ที่ว่างไม่พอ กรุณาเลือกสีอื่น','Not enough spots in this colour'],'Destination full; choose swap':['สีปลายทางเต็ม กรุณาเลือกสลับคน','That colour is full, choose a swap'],'Name already registered':['มีชื่อนี้ลงไว้แล้ว','This name is already registered'],'Duplicate names':['มีชื่อซ้ำในรายการ','Duplicate names in the list'],'Session closed':['ปิดรับลงชื่อแล้ว','Registration closed'],'Registration closed':['ปิดรับลงชื่อแล้ว','Registration closed'],'Request conflict':['รายการนี้เปลี่ยนแปลงแล้ว กรุณาตรวจสอบใหม่','This request changed, please check again'],'Team unavailable':['สีนี้ยังไม่เปิดให้ลง','This colour is not available'],'Invalid destination':['สีปลายทางใช้ไม่ได้','That colour is not available'],'Player not found':['ไม่พบผู้เล่นบางคน กรุณารีเฟรช','Some players were not found, please refresh']};
   const m=messages[e.message]||['ระบบยังไม่สามารถทำรายการได้ กรุณารีเฟรชแล้วลองอีกครั้ง','Something went wrong, please refresh and try again'];
   return reply({error:L(m[0],m[1])},messages[e.message]?409:500);
  }
 };
}
