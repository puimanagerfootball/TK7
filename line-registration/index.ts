// @ts-nocheck
// Generated from delivery.mjs + server.mjs; no LINE Bot integration.
// Server-only: สร้างการ์ดสรุป (Flex) และส่งเข้ากลุ่ม
// ใช้การ์ดเดียวที่มีทั้งรายชื่อ + ปุ่มลงชื่อ จึงไม่มีปุ่มแยกที่หลุดหาย
const DEFAULT_LIFF_URL = "https://liff.line.me/2012278818-W0pIi2y0";
const TEAM_COLORS = [
 ["green","เขียว","#43a047"],["red","แดง","#e53935"],["white","ขาว","#f5f5f5"],["blue","ฟ้า","#1e88e5"],["black","ดำ","#212121"],
 ["yellow","เหลือง","#fdd835"],["pink","ชมพู","#ec407a"],["orange","ส้ม","#fb8c00"],["navy","น้ำเงิน","#1a237e"],["purple","ม่วง","#8e24aa"]
];

// รูปแบบเดียวกับปุ่ม "แชร์รูปแบบลงทะเบียน LINE" ในเว็บ TK7
const REG_LABELS={green:["🟢","Green Shirt (สีเขียว)"],red:["🔴","Red Shirt (สีแดง)"],white:["⚪️","White Shirt (สีขาว)"],blue:["🔵","Blue Shirt (สีน้ำเงิน)"],black:["⚫","Black Shirt (สีดำ)"],yellow:["🟡","Yellow Shirt (สีเหลือง)"],pink:["🩷","Pink Shirt (สีชมพู)"],orange:["🟠","Orange Shirt (สีส้ม)"],navy:["🔵","Navy Shirt (สีน้ำเงินเข้ม)"],purple:["🟣","Purple Shirt (สีม่วง)"]};
function longThaiDate(date){
 if(!date)return "";
 try{return new Date(date+"T00:00:00+07:00").toLocaleDateString("th-TH",{weekday:"long",year:"numeric",month:"long",day:"numeric",timeZone:"Asia/Bangkok"})}catch{return date}
}
function summaryTeams(session,entries){
 const preset=session.preset_teams||session.presetTeams||[];
 return TEAM_COLORS.map(c=>c[0]).filter(t=>preset.includes(t)||entries.some(e=>e.team===t));
}
function buildSummaryText(session,entries,liffUrl=DEFAULT_LIFF_URL){
 const start=String(session.start_time||session.startTime||"20:00").slice(0,5);
 const date=longThaiDate(session.match_date||session.matchDate);
 let t="⚽️ FOOTBALL MATCH @ TK7 Stadium\n📍 Location: https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA\n";
 if(date)t+="📅 Date / วันที่: "+date+"\n";
 t+="🕗 Kick-off: "+start+" | เวลาเตะ: "+start+" น.\n";
 if(session.environment==="test")t+="🧪 Test group / กลุ่มทดสอบ\n";
 if(session.is_open===false||session.isOpen===false)t+="🔒 Registration closed / ปิดรับลงชื่อแล้ว\n";
 t+="\n";
 let n=1;
 for(const team of summaryTeams(session,entries)){
  const [emoji,label]=REG_LABELS[team];
  t+=emoji+" "+label+"\n";
  for(let slot=1;slot<=7;slot++)t+=(n+slot-1)+"."+(entries.find(e=>e.team===team&&e.slot===slot)?.name||"")+"\n";
  n+=7;
 }
 if(n===1)t+="(No teams yet — pick a colour to start / ยังไม่มีทีม เลือกสีเปิดทีมแรกได้เลย)\n";
 t+="\n⏱️ Match Duration / เวลาเล่น:\n• 4 Teams = 2 Hours (เล่น 2 ชม.)\n• 5 Teams = 3 Hours (เล่น 3 ชม.)\n\n";
 t+="👇 Please add your name / ลงชื่อต่อลำดับได้เลยครับ\n"+liffUrl;
 return t;
}

// หลายวันเปิดรับพร้อมกัน → ส่งเป็นการ์ดเลื่อนได้ (carousel) วันละใบ
function buildSignupCards(sessions,liffUrl=DEFAULT_LIFF_URL){
 if(sessions.length===1)return buildSignupCard(sessions[0],liffUrl);
 const cards=sessions.slice(0,10).map(s=>buildSignupCard(s,liffUrl));
 return {type:"flex",altText:"⚽ TK7 · เปิดรับลงชื่อ "+sessions.length+" วัน: "+sessions.map(s=>dmy(s.match_date)).join(", "),contents:{type:"carousel",contents:cards.map(c=>c.contents)}};
}
// การ์ดสั้นในกลุ่ม: หัวข้อ + ปุ่มลงชื่อ (ไม่โชว์รายชื่อ กันคนพิมพ์ต่อในไลน์)
function dmy(date){const [y,m,d]=String(date||"").split("-").map(Number);return y?d+"-"+m+"-"+y:""}
function headerText(session){
 const start=String(session.start_time||session.startTime||"20:00").slice(0,5);
 return "⚽️ FOOTBALL MATCH @ TK7 Stadium\n📅 Date / วันที่ : "+dmy(session.match_date||session.matchDate)+"\n🕗 Kick-off / เวลาเตะ : "+start+"\n📍 Location: https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA";
}
function buildSignupCard(session,liffUrl=DEFAULT_LIFF_URL){
 const start=String(session.start_time||session.startTime||"20:00").slice(0,5);
 const open=session.is_open!==false;
 const MAP="https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA";
 const row=(icon,label,value,extra={})=>({type:"box",layout:"horizontal",spacing:"md",alignItems:"center",paddingAll:"10px",backgroundColor:"#F3F7F4",cornerRadius:"10px",...extra,contents:[
  {type:"text",text:icon,size:"xl",flex:0,gravity:"center"},
  {type:"box",layout:"vertical",flex:1,contents:[
   {type:"text",text:label,size:"xxs",color:"#6B7D71"},
   {type:"text",text:value,size:"md",weight:"bold",color:extra.action?"#1F6FD1":"#1D2B22",wrap:true}
  ]}
 ]});
 const badges=[];
 if(session.environment==="test")badges.push({type:"text",text:"🧪 Test group / กลุ่มทดสอบ",size:"xxs",color:"#D9F2DF",margin:"sm"});
 if(!open)badges.push({type:"text",text:"🔒 Registration closed / ปิดรับลงชื่อแล้ว",size:"xs",color:"#FFE08A",weight:"bold",margin:"sm"});
 return {type:"flex",altText:headerText(session).slice(0,390),contents:{type:"bubble",size:"kilo",
  header:{type:"box",layout:"vertical",backgroundColor:"#1F6B3A",paddingAll:"16px",paddingBottom:"14px",contents:[
   {type:"text",text:"⚽ FOOTBALL MATCH",color:"#FFFFFF",weight:"bold",size:"lg"},
   {type:"text",text:"@ TK7 Stadium",color:"#B9EE82",size:"sm",weight:"bold"},
   ...badges
  ]},
  body:{type:"box",layout:"vertical",spacing:"sm",paddingAll:"12px",contents:[
   row("📅","Date / วันที่",dmy(session.match_date||session.matchDate)),
   row("🕗","Kick-off / เวลาเตะ",start+" น."),
   row("📍","Location / สถานที่","Google Maps ›",{action:{type:"uri",label:"Map",uri:MAP}})
  ]},
  footer:{type:"box",layout:"vertical",paddingAll:"12px",paddingTop:"4px",contents:[
   {type:"button",style:"primary",color:"#247A43",height:"md",action:{type:"uri",label:open?"✍️ ลงชื่อ / Sign up":"👀 ดูรายชื่อ / View",uri:liffUrl+"?date="+(session.match_date||session.matchDate||"")}}
  ]}}};
}

function thaiDate(date){
 if(!date)return "";
 try{return new Date(date+"T00:00:00+07:00").toLocaleDateString("th-TH",{weekday:"short",day:"numeric",month:"short",timeZone:"Asia/Bangkok"})}catch{return date}
}
const hhmm=t=>String(t||"20:00").slice(0,5);

function summarize(session,entries){
 const teams=TEAM_COLORS.filter(([slug])=>entries.some(e=>e.team===slug)).map(([slug,label,hex])=>({slug,label,hex,players:entries.filter(e=>e.team===slug).sort((a,b)=>a.slot-b.slot)}));
 return {teams,players:entries.length,dateLabel:thaiDate(session.match_date),start:hhmm(session.start_time),minutes:session.time_per_match||8};
}

function buildRosterFlex(session,entries,liffUrl=DEFAULT_LIFF_URL,{title}={}){
 const s=summarize(session,entries);
 const open=session.is_open!==false;
 const rows=s.teams.map(t=>({type:"box",layout:"horizontal",spacing:"md",paddingTop:"8px",contents:[
  {type:"box",layout:"vertical",width:"14px",height:"14px",cornerRadius:"7px",backgroundColor:t.hex,borderWidth:"1px",borderColor:"#9aa59c",offsetTop:"3px",contents:[]},
  {type:"box",layout:"vertical",flex:1,contents:[
   {type:"text",text:t.label+"  "+t.players.length+"/7"+(t.players.length>=7?" · เต็ม":""),weight:"bold",size:"sm",color:"#1d2b22"},
   {type:"text",text:t.players.map(p=>p.name).join(" · "),size:"xs",color:"#5b6b60",wrap:true}
  ]}
 ]}));
 if(!rows.length)rows.push({type:"text",text:"ยังไม่มีคนลงชื่อ — กดปุ่มด้านล่างเพื่อเลือกสีเป็นคนแรก",size:"sm",color:"#5b6b60",wrap:true});
 const head=title||"⚽ TK7 ลงชื่อเตะบอล";
 return {
  type:"flex",
  altText:(head+" · "+s.dateLabel+" "+s.start+" · "+s.teams.length+" ทีม "+s.players+" คน").slice(0,390),
  contents:{type:"bubble",size:"mega",
   header:{type:"box",layout:"vertical",backgroundColor:"#1f6b3a",paddingAll:"16px",contents:[
    {type:"text",text:head,color:"#ffffff",weight:"bold",size:"md"},
    {type:"text",text:"📅 "+s.dateLabel+"  🕗 "+s.start+" น.  ⏱️ "+s.minutes+" นาที/แมตช์",color:"#d9f2df",size:"xs",wrap:true,margin:"sm"},
    {type:"text",text:(open?"🟢 เปิดรับลงชื่อ":"🔒 ปิดรับลงชื่อแล้ว")+" · "+s.teams.length+" ทีม · "+s.players+" คน"+(session.environment==="test"?" · 🧪 ทดสอบ":""),color:"#ffffff",size:"xs",margin:"sm"}
   ]},
   body:{type:"box",layout:"vertical",paddingAll:"16px",paddingTop:"8px",contents:rows},
   footer:{type:"box",layout:"vertical",paddingAll:"12px",contents:[
    {type:"button",style:"primary",color:"#247a43",height:"sm",action:{type:"uri",label:open?"ลงชื่อ / เลือกสี":"ดูรายชื่อ",uri:liffUrl}},
    {type:"text",text:"แตะปุ่มเพื่อเปิดหน้าลงชื่อ / Tap to sign up",size:"xxs",color:"#8a978e",align:"center",margin:"sm",wrap:true}
   ]}
  }
 };
}


const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const COLOR_SLUGS=TEAM_COLORS.map(c=>c[0]);
const bangkokToday=()=>new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
function createHandler(env,fetcher=fetch){
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
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type,authorization,apikey','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store'}});
  const path=new URL(req.url).pathname;
  // Retire both bot ingress and delivery. Never fetch LINE Bot endpoints.
  if(path.endsWith('/webhook')||path.endsWith('/worker'))return reply({error:'Bot integration retired; share cards manually from TK7'},410);
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
   const identity=await verified.json();if(typeof identity.sub!=='string'||!identity.sub.trim())return reply({error:'Invalid identity'},401);
   const a=await active();
   // Only trust the name returned by LINE's server-side ID-token verification.
   const actorName=typeof identity.name==='string'&&identity.name.trim()?identity.name.slice(0,60):'LINE user · '+identity.sub.slice(-6);
   const filter=filterOf(a);
   if(b.action==='dates'){
    const sessions=await db('tk7_signup_sessions?select=id,match_date,is_open,start_time,time_per_match&'+filter+'&is_open=eq.true&match_date=gte.'+bangkokToday()+'&order=match_date');
    return reply({dates:sessions.map(s=>({id:s.id,date:s.match_date,label:thaiDate(s.match_date),startTime:String(s.start_time||'20:00').slice(0,5),timePerMatch:s.time_per_match||8,isOpen:s.is_open}))});
   }
   if(!uuid(b.sessionId))return reply({error:L('กรุณาเลือกวันแข่งขัน','Please choose a match date')},400);
   const sessions=await db('tk7_signup_sessions?select=id,match_date,teams,is_open&'+filter+'&id=eq.'+b.sessionId);const s=sessions[0];
   if(!s)return reply({error:L('ไม่พบวันแข่งขันนี้','Match date not found')},404);
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

Deno.serve(createHandler(Deno.env.toObject()));
