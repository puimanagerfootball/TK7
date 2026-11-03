// Server-only: สร้างการ์ดสรุป (Flex) และส่งเข้ากลุ่ม
// ใช้การ์ดเดียวที่มีทั้งรายชื่อ + ปุ่มลงชื่อ จึงไม่มีปุ่มแยกที่หลุดหาย
export const DEFAULT_LIFF_URL = "https://liff.line.me/2012278818-W0pIi2y0";
export const TEAM_COLORS = [
 ["green","เขียว","#43a047"],["red","แดง","#e53935"],["white","ขาว","#f5f5f5"],["blue","ฟ้า","#1e88e5"],["black","ดำ","#212121"],
 ["yellow","เหลือง","#fdd835"],["pink","ชมพู","#ec407a"],["orange","ส้ม","#fb8c00"],["navy","น้ำเงิน","#1a237e"],["purple","ม่วง","#8e24aa"]
];

// รูปแบบเดียวกับปุ่ม "แชร์รูปแบบลงทะเบียน LINE" ในเว็บ TK7
export const REG_LABELS={green:["🟢","Green Shirt (สีเขียว)"],red:["🔴","Red Shirt (สีแดง)"],white:["⚪️","White Shirt (สีขาว)"],blue:["🔵","Blue Shirt (สีน้ำเงิน)"],black:["⚫","Black Shirt (สีดำ)"],yellow:["🟡","Yellow Shirt (สีเหลือง)"],pink:["🩷","Pink Shirt (สีชมพู)"],orange:["🟠","Orange Shirt (สีส้ม)"],navy:["🔵","Navy Shirt (สีน้ำเงินเข้ม)"],purple:["🟣","Purple Shirt (สีม่วง)"]};
export function longThaiDate(date){
 if(!date)return "";
 try{return new Date(date+"T00:00:00+07:00").toLocaleDateString("th-TH",{weekday:"long",year:"numeric",month:"long",day:"numeric",timeZone:"Asia/Bangkok"})}catch{return date}
}
export function summaryTeams(session,entries){
 const preset=session.preset_teams||session.presetTeams||[];
 return TEAM_COLORS.map(c=>c[0]).filter(t=>preset.includes(t)||entries.some(e=>e.team===t));
}
export function buildSummaryText(session,entries,liffUrl=DEFAULT_LIFF_URL){
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
export function buildSignupCards(sessions,liffUrl=DEFAULT_LIFF_URL){
 if(sessions.length===1)return buildSignupCard(sessions[0],liffUrl);
 const cards=sessions.slice(0,10).map(s=>buildSignupCard(s,liffUrl));
 return {type:"flex",altText:"⚽ TK7 · เปิดรับลงชื่อ "+sessions.length+" วัน: "+sessions.map(s=>dmy(s.match_date)).join(", "),contents:{type:"carousel",contents:cards.map(c=>c.contents)}};
}
// การ์ดสั้นในกลุ่ม: หัวข้อ + ปุ่มลงชื่อ (ไม่โชว์รายชื่อ กันคนพิมพ์ต่อในไลน์)
export function dmy(date){const [y,m,d]=String(date||"").split("-").map(Number);return y?d+"-"+m+"-"+y:""}
export function headerText(session){
 const start=String(session.start_time||session.startTime||"20:00").slice(0,5);
 return "⚽️ FOOTBALL MATCH @ TK7 Stadium\n📅 Date / วันที่ : "+dmy(session.match_date||session.matchDate)+"\n🕗 Kick-off / เวลาเตะ : "+start+"\n📍 Location: https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA";
}
export function buildSignupCard(session,liffUrl=DEFAULT_LIFF_URL){
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

export function thaiDate(date){
 if(!date)return "";
 try{return new Date(date+"T00:00:00+07:00").toLocaleDateString("th-TH",{weekday:"short",day:"numeric",month:"short",timeZone:"Asia/Bangkok"})}catch{return date}
}
const hhmm=t=>String(t||"20:00").slice(0,5);

export function summarize(session,entries){
 const teams=TEAM_COLORS.filter(([slug])=>entries.some(e=>e.team===slug)).map(([slug,label,hex])=>({slug,label,hex,players:entries.filter(e=>e.team===slug).sort((a,b)=>a.slot-b.slot)}));
 return {teams,players:entries.length,dateLabel:thaiDate(session.match_date),start:hhmm(session.start_time),minutes:session.time_per_match||8};
}

export function buildRosterFlex(session,entries,liffUrl=DEFAULT_LIFF_URL,{title}={}){
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

