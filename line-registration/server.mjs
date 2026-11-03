import {deliverSummary,buildSignupCard,buildSignupCards,thaiDate,TEAM_COLORS,DEFAULT_LIFF_URL} from './delivery.mjs';
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const COLOR_SLUGS=TEAM_COLORS.map(c=>c[0]);
// คำที่พิมพ์ในกลุ่มแล้วบอทตอบปุ่มลงชื่อ (ข้อความสั้นเท่านั้น กันตอบมั่วตอนคุยเล่น)
const KEYWORDS=['ลงชื่อ','ลงทะเบียน','ลงทีม','เลือกสี','รายชื่อ','สมัคร','ปุ่ม','เมนู','tk7','register','sign up','signup','join','list','roster','team'];
export function isKeyword(text){
 const t=String(text||'').trim().toLowerCase().replace(/^[\/!#]/,'');
 // ไทย: ขึ้นต้นด้วยคำนี้ · อังกฤษ: ต้องพิมพ์ตรงคำ (กันตอบตอนคุยภาษาอังกฤษ)
 return t.length>0&&t.length<=15&&KEYWORDS.some(k=>/^[a-z0-9 ]+$/.test(k)?t===k:t.startsWith(k));
}
export const bangkokToday=()=>new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
export async function verifySignature(raw,signature,secret){
 if(!signature||!secret)return false;
 try{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(signature),c=>c.charCodeAt(0)),new TextEncoder().encode(raw));}catch{return false}
}
export function createHandler(env,fetcher=fetch){
 const get=k=>env[k]||'';
 const liffUrl=get('TK7_LIFF_URL')||DEFAULT_LIFF_URL;
 async function db(path,body){
  const r=await fetcher(get('SUPABASE_URL')+'/rest/v1/'+path,{method:body===undefined?'GET':'POST',signal:AbortSignal.timeout(15000),headers:{apikey:get('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+get('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body)});
  if(!r.ok){const error=await r.json().catch(()=>({}));throw new Error(error.message||'Database unavailable')}
  const text=await r.text();return text?JSON.parse(text):null;
 }
 // กลุ่มที่ใช้งาน: ตั้งจากเว็บ (tk7_line_settings) — ถ้ายังไม่มีตาราง ใช้ค่าจาก Secrets เดิม
 async function active(){
  try{const rows=await db('tk7_line_settings?select=group_id,environment&id=eq.true');if(rows?.[0]?.group_id)return {group:rows[0].group_id,environment:rows[0].environment||'test'}}catch{}
  return {group:get('TK7_GROUP_ID'),environment:get('TK7_ENVIRONMENT')||'test'};
 }
 const filterOf=a=>'group_id=eq.'+encodeURIComponent(a.group)+'&environment=eq.'+encodeURIComponent(a.environment);
 const send=job=>deliverSummary(job,job.snapshot.session,job.snapshot.entries,get('LINE_CHANNEL_ACCESS_TOKEN'),()=>db('rpc/tk7_finish_summary',{p_id:job.id,p_lease:job.lease_token,p_ok:true}),fetcher,liffUrl);
 async function drain(){
  for(let i=0;i<5;i++){
   const jobs=await db('rpc/tk7_claim_summary',{});const job=jobs?.[0];if(!job)return;
   try{await send(job)}
   catch{await db('rpc/tk7_finish_summary',{p_id:job.id,p_lease:job.lease_token,p_ok:false,p_error:'LINE delivery pending'});return}
  }
 }
 async function lineReply(replyToken,messages){
  await fetcher('https://api.line.me/v2/bot/message/reply',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+get('LINE_CHANNEL_ACCESS_TOKEN'),'Content-Type':'application/json'},body:JSON.stringify({replyToken,messages})});
 }
 async function rosterCard(a){
  const sessions=await db('tk7_signup_sessions?select=*&'+filterOf(a)+'&is_open=eq.true&match_date=gte.'+bangkokToday()+'&order=match_date.asc&limit=10');
  if(!sessions?.length)return [{type:'text',text:'No match open for sign-up yet / ยังไม่มีวันเปิดรับลงชื่อ'}];
  return [buildSignupCards(sessions,liffUrl)];
 }
 return async req=>{
  // อนุญาตทั้งโฮสต์เดิม (TK7_APP_ORIGIN) และ GitHub Pages ของ TK7
  const allowed=[...get('TK7_APP_ORIGIN').split(','),'https://puimanagerfootball.github.io'].map(x=>x.trim()).filter(Boolean);
  const reqOrigin=req.headers.get('Origin')||'';
  const origin=allowed.includes(reqOrigin)?reqOrigin:allowed[0];
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type,authorization,apikey','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store'}});
  const path=new URL(req.url).pathname;
  if(req.method==='POST'&&path.endsWith('/webhook')){
   const raw=await req.text();if(raw.length>1000000)return reply({error:'Too large'},413);
   if(!await verifySignature(raw,req.headers.get('x-line-signature'),get('LINE_CHANNEL_SECRET')))return reply({error:'Invalid signature'},401);
   try{
    const eventBody=JSON.parse(raw);
    for(const event of eventBody.events||[]){
     const group=event.source?.type==='group'&&event.source.groupId;if(!group)continue;
     if(event.type!=='message')console.log('LINE_EVENT',JSON.stringify({type:event.type,group,src:event.source?.userId||'',members:event.joined?.members?.length||event.left?.members?.length||0,ts:event.timestamp}));
     const keyword=event.type==='message'&&event.message?.type==='text'&&isKeyword(event.message.text);
     if(event.type!=='join'&&!keyword)continue; // ข้อความคุยทั่วไป: ไม่ทำอะไร
     let name='';
     const r=await fetcher('https://api.line.me/v2/bot/group/'+encodeURIComponent(group)+'/summary',{headers:{Authorization:'Bearer '+get('LINE_CHANNEL_ACCESS_TOKEN')},signal:AbortSignal.timeout(10000)});
     if(r.ok){name=(await r.json()).groupName||'';await db('tk7_line_groups?on_conflict=group_id',{group_id:group,group_name:name,seen_at:new Date().toISOString()})}
     if(!event.replyToken)continue;
     const a=await active();
     if(a.group!==group){
      await lineReply(event.replyToken,[{type:'text',text:'⚽ "'+(name||'This group')+'" is not linked to TK7 yet / กลุ่มนี้ยังไม่ได้เชื่อมกับ TK7\nAdmin / ผู้ดูแล: TK7 web → จัดการทีม → LINE → 👥 เลือกกลุ่มนี้ → ใช้กลุ่มนี้'}]);
     }else{
      await lineReply(event.replyToken,await rosterCard(a));
     }
    }
    return reply({ok:true});
   }catch{return reply({error:'Webhook temporarily unavailable'},503)}
  }
  if(req.method==='POST'&&path.endsWith('/worker')){
   try{
    const body=await req.json();if(!uuid(body.jobId)||!uuid(body.lease))return reply({error:'Unauthorized'},401);
    const jobs=await db('rpc/tk7_leased_summary',{p_id:body.jobId,p_lease:body.lease});const job=jobs?.[0];
    if(!job)return reply({error:'Unauthorized'},401);
    try{await send(job)}
    catch{await db('rpc/tk7_finish_summary',{p_id:job.id,p_lease:job.lease_token,p_ok:false,p_error:'LINE delivery pending'});return reply({error:'Delivery pending'},503)}
    return reply({ok:true});
   }catch{return reply({error:'Delivery unavailable'},503)}
  }
  if(!allowed.includes(reqOrigin))return reply({error:'Origin denied'},403);
  if(req.method==='OPTIONS')return reply({});
  if(req.method!=='POST')return reply({error:'Method denied'},405);
  if(!get('LINE_LOGIN_CHANNEL_ID'))return reply({error:'ยังไม่ได้ตั้งค่า LINE Login'},503);
  let en=false;const L=(th,e)=>en?e:th;
  try{
   const raw=await req.text();if(raw.length>20000)return reply({error:L('ข้อมูลยาวเกินไป','Request too large')},413);
   let b;try{b=JSON.parse(raw)}catch{return reply({error:'Invalid JSON'},400)}
   en=b?.lang==='en';
   if(!b||typeof b.idToken!=='string')return reply({error:L('กรุณาเข้าสู่ระบบ LINE','Please log in with LINE')},401);
   const verified=await fetcher('https://api.line.me/oauth2/v2.1/verify',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({id_token:b.idToken,client_id:get('LINE_LOGIN_CHANNEL_ID')})});
   if(!verified.ok)return reply({error:L('กรุณาเข้าสู่ระบบ LINE อีกครั้ง','Please log in with LINE again'),relogin:true},401);
   const identity=await verified.json();if(typeof identity.sub!=='string')return reply({error:'Invalid identity'},401);
   const a=await active();
   if(!a.group)return reply({error:L('ผู้ดูแลยังไม่ได้เลือกกลุ่ม LINE','The admin has not selected a LINE group yet')},503);
   const member=await fetcher('https://api.line.me/v2/bot/group/'+encodeURIComponent(a.group)+'/member/'+encodeURIComponent(identity.sub),{signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+get('LINE_CHANNEL_ACCESS_TOKEN')}});
   if(!member.ok)return reply({error:L('คุณไม่ได้อยู่ในกลุ่ม LINE ของ TK7','You are not a member of the TK7 LINE group')},403);
   let actorName='';try{actorName=String((await member.json())?.displayName||'').slice(0,60)}catch{}
   const filter=filterOf(a);
   if(b.action==='dates'){
    const sessions=await db('tk7_signup_sessions?select=id,match_date,is_open,start_time,time_per_match&'+filter+'&is_open=eq.true&match_date=gte.'+bangkokToday()+'&order=match_date');
    return reply({dates:sessions.map(s=>({id:s.id,date:s.match_date,label:thaiDate(s.match_date),startTime:String(s.start_time||'20:00').slice(0,5),timePerMatch:s.time_per_match||8,isOpen:s.is_open}))});
   }
   if(!uuid(b.sessionId))return reply({error:L('กรุณาเลือกวันแข่งขัน','Please choose a match date')},400);
   const sessions=await db('tk7_signup_sessions?select=id,match_date,teams,is_open&'+filter+'&id=eq.'+b.sessionId);const s=sessions[0];
   if(!s)return reply({error:L('ไม่พบวันแข่งขันของกลุ่มนี้','Match date not found')},404);
   if(b.action==='roster')return reply(await db('rpc/tk7_read_roster',{p_session:s.id}));
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
   let result;
   if(b.action==='register'){
    if(!Array.isArray(b.names)||b.names.length<1||b.names.length>7||b.names.some(n=>typeof n!=='string'||!n.trim()||n.length>40)||!COLOR_SLUGS.includes(b.team)||!s.teams.includes(b.team))return reply({error:L('กรุณาตรวจสอบชื่อและสี','Please check the names and colour')},400);
    result=await db('rpc/tk7_signup_batch',{p_session:s.id,p_request:b.requestId,p_owner:identity.sub,p_team:b.team,p_names:b.names});
   }else if(['move','swap','cancel'].includes(b.action)){
    if(!uuid(b.entryId)||!Number.isSafeInteger(b.revision)||(b.action==='swap'&&!uuid(b.otherId))||(b.action==='move'&&!COLOR_SLUGS.includes(b.team)))return reply({error:L('ข้อมูลไม่ถูกต้อง','Invalid data')},400);
    result=await db('rpc/tk7_change_entry',{p_session:s.id,p_request:b.requestId,p_actor:identity.sub,p_revision:b.revision,p_action:b.action,p_entry:b.entryId,p_team:b.team??null,p_other:b.otherId??null});
   }else if(b.action==='recolor'){
    if(!COLOR_SLUGS.includes(b.from)||!COLOR_SLUGS.includes(b.team)||b.from===b.team||!Number.isSafeInteger(b.revision))return reply({error:L('ข้อมูลไม่ถูกต้อง','Invalid data')},400);
    result=await db('rpc/tk7_team_action',{p_session:s.id,p_request:b.requestId,p_actor:identity.sub,p_revision:b.revision,p_action:'recolor',p_entries:null,p_team:b.team,p_from:b.from});
   }else if(b.action==='bulk'){
    if(!['cancel','move'].includes(b.op)||!Array.isArray(b.entryIds)||b.entryIds.length<1||b.entryIds.length>70||!b.entryIds.every(uuid)||!Number.isSafeInteger(b.revision)||(b.op==='move'&&!COLOR_SLUGS.includes(b.team)))return reply({error:L('ข้อมูลไม่ถูกต้อง','Invalid data')},400);
    result=await db('rpc/tk7_team_action',{p_session:s.id,p_request:b.requestId,p_actor:identity.sub,p_revision:b.revision,p_action:'bulk_'+b.op,p_entries:b.entryIds,p_team:b.op==='move'?b.team:null,p_from:null});
   }else return reply({error:'Unknown action'},400);
   if(!result?.replayed){
    let action=b.action,detail='';
    if(b.action==='register')detail='ลงสี'+cl(b.team)+': '+b.names.join(', ');
    else if(b.action==='move')detail=nm(b.entryId)+' → สี'+cl(b.team);
    else if(b.action==='swap')detail=nm(b.entryId)+' ⇄ '+nm(b.otherId);
    else if(b.action==='cancel')detail='ยกเลิก '+nm(b.entryId);
    else if(b.action==='recolor')detail='ทีมสี'+cl(b.from)+' → สี'+cl(b.team);
    else if(b.action==='bulk'){action='bulk_'+b.op;detail=(b.op==='move'?'ย้ายไปสี'+cl(b.team)+': ':'ยกเลิก: ')+b.entryIds.map(nm).join(', ')}
    try{await db('tk7_signup_log',{session_id:s.id,actor_id:identity.sub,actor_name:actorName||'LINE',source:'line',action,detail:detail.slice(0,300)})}catch{}
   }
   return reply({...result,message:L('บันทึกแล้ว ✓','Saved ✓')});
  }catch(e){
   const messages={'Roster changed; refresh first':['รายชื่อมีการเปลี่ยนแปลง กรุณารีเฟรชแล้วลองใหม่','The list changed, please refresh and try again'],'Not enough seats':['สีนี้ที่ว่างไม่พอ กรุณาเลือกสีอื่น','Not enough spots in this colour'],'Destination full; choose swap':['สีปลายทางเต็ม กรุณาเลือกสลับคน','That colour is full, choose a swap'],'Name already registered':['มีชื่อนี้ลงไว้แล้ว','This name is already registered'],'Duplicate names':['มีชื่อซ้ำในรายการ','Duplicate names in the list'],'Session closed':['ปิดรับลงชื่อแล้ว','Registration closed'],'Registration closed':['ปิดรับลงชื่อแล้ว','Registration closed'],'Request conflict':['รายการนี้เปลี่ยนแปลงแล้ว กรุณาตรวจสอบใหม่','This request changed, please check again'],'Team unavailable':['สีนี้ยังไม่เปิดให้ลง','This colour is not available'],'Invalid destination':['สีปลายทางใช้ไม่ได้','That colour is not available'],'Player not found':['ไม่พบผู้เล่นบางคน กรุณารีเฟรช','Some players were not found, please refresh']};
   const m=messages[e.message]||['ระบบยังไม่สามารถทำรายการได้ กรุณารีเฟรชแล้วลองอีกครั้ง','Something went wrong, please refresh and try again'];
   return reply({error:L(m[0],m[1])},409);
  }
 };
}
