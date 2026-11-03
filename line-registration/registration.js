// TK7 LIFF: ผู้เล่นเลือกสีเอง สีละ 7 คน · ลงให้เพื่อนได้ · ย้าย / สลับ / ยกเลิก
// เปิด register.html?demo=1 เพื่อดูหน้าตาโดยไม่ต้องเชื่อม LINE
(()=>{
const $=id=>document.getElementById(id);
// ---------- 2 ภาษา (ไทย / English) ----------
const COLORS=[["green","เขียว","Green"],["red","แดง","Red"],["white","ขาว","White"],["blue","น้ำเงิน","Blue"],["black","ดำ","Black"],["yellow","เหลือง","Yellow"],["pink","ชมพู","Pink"],["orange","ส้ม","Orange"],["navy","น้ำเงินเข้ม","Navy"],["purple","ม่วง","Purple"]];
const I18N={
 th:{title:"👇 เลือกสีเสื้อ แล้วลงชื่อ",relogin:"กำลังเข้าสู่ระบบใหม่…",down:"ระบบไม่พร้อม กรุณาลองใหม่",closedShort:" · ปิดแล้ว",start:"🕗 เริ่ม {t} น.",perMatch:"⏱️ {n} นาที/แมตช์",teams:"👥 {t} ทีม · {p} คน",closed:"🔒 ปิดรับลงชื่อแล้ว",
  joinColor:"ลงชื่อสี{c}",closedCta:"ปิดรับแล้ว",full:"เต็มแล้ว ✓",joinLeft:"＋ ลงสีนี้ (ว่าง {n})",openTeam:"＋ เปิดทีมสี{c}",openSec:"ทีมที่เปิดแล้ว",otherSec:"สีอื่น · แตะเพื่อเปิดทีมใหม่",firstSec:"ยังไม่มีใครลง · เลือกสีเปิดทีมแรกได้เลย",closedEmpty:"ปิดรับลงชื่อแล้ว และยังไม่มีรายชื่อ",
  addFriend:"＋ เพิ่มชื่อเพื่อน",confirmJoin:"ยืนยันลงสี{c} ({n} คน)",needName:"ใส่ชื่ออย่างน้อย 1 ชื่อ",friend:"ชื่อเพื่อน",you:"ชื่อของคุณ",removeRow:"ลบช่องนี้",dupNames:"มีชื่อซ้ำกันในรายการ",onlyLeft:"สีนี้ว่างแค่ {n} ที่",saving:"กำลังบันทึก…",joined:"ลงชื่อสำเร็จ",
  seatsInfo:"ว่าง {n} จาก 7 ที่",has:" · มี ",joinHint:"ลงให้ตัวเองและเพื่อนได้พร้อมกัน · ถ้าที่ว่างไม่พอ ระบบจะไม่บันทึกบางส่วน",cancel:"ยกเลิก",pickTarget:"เลือกสีปลายทาง หรือคนที่จะสลับ",moveTo:"ย้ายไปสี{c}",swapWith:"สลับกับ {n}",orSwap:"หรือสลับกับ",saved:"บันทึกแล้ว",
  removeName:"ยกเลิกชื่อ {n}",tapAgain:"แตะอีกครั้งเพื่อยืนยันยกเลิก",inColor:"อยู่สี{c} · ลำดับ {n}",moveLabel:"ย้ายไปสี",close:"ปิด",noConfig:"ยังไม่ได้ตั้งค่า LIFF ID และ API",noDates:"ยังไม่มีวันเปิดรับลงชื่อ\nรอผู้ดูแลเปิดวันแข่งในเว็บ TK7",connFail:"เชื่อมต่อไม่สำเร็จ: ",refresh:"รีเฟรชรายชื่อ",selected:"เลือก {n} คน",moveSel:"ย้ายไปสี…",cancelSel:"ยกเลิกชื่อ",swapSel:"สลับ…",clearSel:"ล้างที่เลือก",moveSelTitle:"ย้าย {n} คนไปสี",cancelConfirm:"แตะอีกครั้ง: ยกเลิก {n} ชื่อ",recolorTitle:"เปลี่ยนสีทีม{c}ทั้งทีม",recolorHint:"สีที่มีคนอยู่แล้ว = สลับสีกันทั้งทีม",recolorTo:"เปลี่ยนเป็น",swapTeams:"สลับกับ",moreColors:"＋ สีอื่น ({n})",lessColors:"ซ่อนสีอื่น",tapHint:"แตะชื่อเพื่อเลือก (หลายคนได้) · แตะแถบสีเพื่อเปลี่ยนสีทั้งทีม",history:"🕘 ประวัติ",emptySlot:"ว่าง",historyTitle:"แก้ไขล่าสุด 3 รายการ",noHistory:"ยังไม่มีประวัติ"},
 en:{title:"👇 Pick a shirt colour & sign up",relogin:"Signing in again…",down:"Service unavailable, please try again",closedShort:" · closed",start:"🕗 Kick-off {t}",perMatch:"⏱️ {n} min/match",teams:"👥 {t} teams · {p} players",closed:"🔒 Registration closed",
  joinColor:"Join {c}",closedCta:"Closed",full:"Full ✓",joinLeft:"＋ Join ({n} left)",openTeam:"＋ Start {c} team",openSec:"Open teams",otherSec:"Other colours · tap to start a new team",firstSec:"No one yet · pick a colour to start the first team",closedEmpty:"Registration closed, no players yet",
  addFriend:"＋ Add a friend",confirmJoin:"Join {c} ({n} players)",needName:"Enter at least 1 name",friend:"Friend's name",you:"Your name",removeRow:"Remove",dupNames:"Duplicate names in the list",onlyLeft:"Only {n} spots left in this colour",saving:"Saving…",joined:"Signed up",
  seatsInfo:"{n} of 7 spots left",has:" · ",joinHint:"Sign up yourself and friends together · if there aren't enough spots, nothing is saved",cancel:"Cancel",pickTarget:"Choose a colour or a player to swap",moveTo:"Move to {c}",swapWith:"Swap with {n}",orSwap:"Or swap with",saved:"Saved",
  removeName:"Remove {n}",tapAgain:"Tap again to confirm",inColor:"{c} · spot {n}",moveLabel:"Move to",close:"Close",noConfig:"LIFF ID / API not configured",noDates:"No match open for sign-up yet\nPlease wait for the admin",connFail:"Connection failed: ",refresh:"Refresh",selected:"{n} selected",moveSel:"Move to…",cancelSel:"Remove",swapSel:"Swap…",clearSel:"Clear",moveSelTitle:"Move {n} to",cancelConfirm:"Tap again: remove {n}",recolorTitle:"Change {c} team colour",recolorHint:"A colour that already has players = swap the two teams",recolorTo:"Change to",swapTeams:"Swap with",moreColors:"＋ Other colours ({n})",lessColors:"Hide other colours",tapHint:"Tap names to select (multiple) · tap the colour bar to recolour the whole team",history:"🕘 History",emptySlot:"open",historyTitle:"Latest 3 changes",noHistory:"No changes yet"}
};
const LANG_KEY="tk7.lang";
let lang=(()=>{try{const v=localStorage.getItem(LANG_KEY);if(v)return v}catch{}const n=(navigator.language||"th").toLowerCase();return n.startsWith("th")?"th":"en"})();
const T=(k,v={})=>String((I18N[lang]||I18N.th)[k]??I18N.th[k]??k).replace(/\{(\w+)\}/g,(_,x)=>v[x]??"");
const label=slug=>{const c=COLORS.find(c=>c[0]===slug);return c?(lang==="en"?c[2]:c[1]):slug};
const dateLabel=d=>{try{return new Date(d+"T00:00:00+07:00").toLocaleDateString(lang==="en"?"en-GB":"th-TH",{weekday:"short",day:"numeric",month:"short",timeZone:"Asia/Bangkok"})}catch{return d}};
const MAX=7;
const demo=new URLSearchParams(location.search).has("demo");
let dates=[],sessionId="",roster=null,busy=false,loadSeq=0,myName="",showMore=false;
const selected=new Set();

function el(tag,props={},...kids){const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==="class")n.className=v;else if(k==="text")n.textContent=v;else if(k.startsWith("on"))n[k]=v;else if(v!==undefined&&v!==null&&v!==false)n.setAttribute(k,v===true?"":v)}for(const k of kids.flat())if(k!=null)n.append(k);return n}
function shirt(slug){
 const ns="http://www.w3.org/2000/svg";const s=document.createElementNS(ns,"svg");s.setAttribute("viewBox","0 0 32 32");s.setAttribute("class","shirt");s.setAttribute("aria-hidden","true");
 const p=document.createElementNS(ns,"path");p.setAttribute("d","M11 4l-7 4 3 6 3-1.5V28h12V12.5l3 1.5 3-6-7-4c-1 2-2.6 3-5 3s-4-1-5-3z");
 const light=slug==="white"||slug==="yellow";p.setAttribute("fill",light?"rgba(0,0,0,.12)":"rgba(255,255,255,.92)");p.setAttribute("stroke",light?"rgba(0,0,0,.45)":"rgba(0,0,0,.15)");p.setAttribute("stroke-width","1.2");p.setAttribute("stroke-linejoin","round");
 s.append(p);return s;
}
let toastTimer;
function toast(msg,err=false){const t=$("toast");t.textContent=msg;t.classList.toggle("err",err);t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),err?5000:2800)}

// ---------- API ----------
async function api(action,payload={}){
 if(demo)return demoApi(action,payload);
 const r=await fetch(window.TK7_CONFIG.apiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,lang,idToken:liff.getIDToken(),sessionId,...payload})});
 const result=await r.json().catch(()=>({}));
 if(r.status===401&&result.relogin){liff.logout();liff.login({redirectUri:location.href});throw Error(T("relogin"))}
 if(!r.ok)throw Error(result.error||T("down"));
 return result;
}

// ---------- sheet ----------
function openSheet(content){$("sheet-content").replaceChildren(content);$("sheet").classList.add("show");$("scrim").classList.add("show")}
function closeSheet(){$("sheet").classList.remove("show");$("scrim").classList.remove("show")}
$("scrim").onclick=closeSheet;

// ---------- render ----------
function renderDates(){
 const nav=$("dates");nav.replaceChildren();
 for(const d of dates){
  nav.append(el("button",{class:"date","aria-pressed":String(d.id===sessionId),onclick:()=>{if(d.id===sessionId)return;sessionId=d.id;renderDates();loadRoster(true)}},
   el("b",{text:d.date?dateLabel(d.date):d.label}),el("small",{text:"🕗 "+d.startTime+(d.isOpen?"":T("closedShort"))})));
 }
 nav.hidden=dates.length<2;
}
// การ์ดข้อมูลแมตช์ (ดีไซน์เดียวกับการ์ดตอบกลับในไลน์)
const dmy=d=>{const [y,m,dd]=String(d||"").split("-").map(Number);return y?dd+"-"+m+"-"+y:""};
function renderInfo(){
 const info=$("info");info.replaceChildren();if(!roster)return;
 const d=dates.find(x=>x.id===sessionId)||{};
 const teams=new Set([...roster.entries.map(e=>e.team),...(roster.presetTeams||[])]).size;
 const row=(icon,lab,val,href)=>el(href?"a":"div",{class:"m-row",href:href||null,target:href?"_blank":null,rel:href?"noopener":null},
  el("span",{class:"m-ico",text:icon}),el("span",{class:"m-txt"},el("small",{text:lab}),el("b",{class:href?"link":"",text:val})));
 const card=el("div",{class:"match"},
  el("div",{class:"m-head"},el("div",{},el("div",{class:"m-title",text:"⚽ FOOTBALL MATCH"}),el("div",{class:"m-sub",text:"@ TK7 Stadium"})),
   roster.isOpen?el("span",{class:"m-badge",text:lang==="en"?"OPEN":"เปิดรับ"}):el("span",{class:"m-badge off",text:lang==="en"?"CLOSED":"ปิดรับแล้ว"})),
  el("div",{class:"m-rows"},
   row("📅","Date / วันที่",dmy(roster.matchDate||d.date)),
   row("🕗","Kick-off / เวลาเตะ",(roster.startTime||d.startTime||"20:00")+(lang==="en"?"":" น.")),
   row("⏱️",lang==="en"?"Per match":"เวลาต่อแมตช์",(roster.timePerMatch||d.timePerMatch||8)+(lang==="en"?" min":" นาที")),
   row("📍","Location / สถานที่",lang==="en"?"Open map ›":"เปิดแผนที่ ›","https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA")),
  el("div",{class:"m-foot"},el("span",{text:T("teams",{t:teams,p:roster.entries.length})}),
   el("button",{type:"button",class:"m-hist",text:T("history"),onclick:openHistory})));
 info.append(card);
}
function teamCard(slug){
 const players=roster.entries.filter(e=>e.team===slug).sort((a,b)=>a.slot-b.slot);
 const allowed=roster.teams.includes(slug);
 const full=players.length>=MAX;
 const preset=(roster.presetTeams||[]).includes(slug);
 const canJoin=roster.isOpen&&allowed&&!full;
 const active=players.length||preset;
 const card=el("div",{class:"team"+(full?" full":"")+(players.length?"":" empty")});
 const band=el("button",{type:"button",class:"band c-"+slug,"aria-label":active?T("recolorTitle",{c:label(slug)}):T("joinColor",{c:label(slug)}),
  onclick:()=>{if(!roster.isOpen)return;if(active)openRecolor(slug);else if(canJoin)openRegister(slug)}},
  shirt(slug),el("span",{class:"name",text:label(slug)}),active&&roster.isOpen?el("span",{class:"chev","aria-hidden":"true",text:"🎨"}):null,el("span",{class:"count",text:players.length+"/"+MAX}));
 card.append(band);
 // เตรียมไว้ 7 ช่องทุกการ์ด (ขนาดเท่ากัน) · ช่องว่างแตะเพื่อลงชื่อ
 {
  const list=el("div",{class:"plist"});
  for(let slot=1;slot<=MAX;slot++){
   const p=players.find(x=>x.slot===slot);
   if(!p){list.append(el("button",{type:"button",class:"prow empty",disabled:canJoin?null:true,onclick:()=>canJoin&&openRegister(slug)},el("span",{class:"box"}),el("span",{class:"num",text:slot+"."}),el("span",{class:"pname",text:T("emptySlot")})));continue}
   const on=selected.has(p.id);
   const row=el("button",{type:"button",class:"prow"+(on?" on":""),"aria-pressed":String(on),disabled:roster.isOpen?null:true,onclick:()=>{on?selected.delete(p.id):selected.add(p.id);renderBoard()}},
    el("span",{class:"box",text:on?"✓":""}),el("span",{class:"num",text:p.slot+"."}),el("span",{class:"pname",text:p.name}));
   list.append(row);
  }
  card.append(list);
 }
 card.append(el("button",{type:"button",class:"cta",disabled:canJoin?null:true,onclick:()=>canJoin&&openRegister(slug),"aria-label":T("joinColor",{c:label(slug)}),
  text:!roster.isOpen?T("closedCta"):full?T("full"):active?T("joinLeft",{n:MAX-players.length}):T("openTeam",{c:label(slug)})}));
 return card;
}
function renderBoard(){
 const board=$("board");board.replaceChildren();renderInfo();
 if(!roster)return;
 for(const id of [...selected])if(!roster.entries.some(e=>e.id===id))selected.delete(id);
 const preset=roster.presetTeams||[];
 const used=COLORS.map(c=>c[0]).filter(s=>roster.entries.some(e=>e.team===s)||preset.includes(s));
 const free=COLORS.map(c=>c[0]).filter(s=>!used.includes(s)&&roster.teams.includes(s));
 if(used.length){board.append(el("div",{class:"section-label",text:T("openSec")}));if(roster.isOpen&&roster.entries.length)board.append(el("p",{class:"tap-hint",text:T("tapHint")}));board.append(el("div",{class:"grid"},used.map(teamCard)))}
 if(free.length&&roster.isOpen){
  if(!used.length||showMore){board.append(el("div",{class:"section-label",text:used.length?T("otherSec"):T("firstSec")}),el("div",{class:"grid empty-grid"},free.map(teamCard)))}
  if(used.length)board.append(el("button",{type:"button",class:"more",text:showMore?T("lessColors"):T("moreColors",{n:free.length}),onclick:()=>{showMore=!showMore;renderBoard()}}));
 }
 if(!used.length&&!roster.isOpen)board.append(el("div",{class:"notice",text:T("closedEmpty")}));
 renderBar();
}
// แถบคำสั่งเมื่อเลือกชื่อ
function renderBar(){
 let bar=$("selbar");if(!bar){bar=el("div",{class:"selbar",id:"selbar"});document.body.append(bar)}
 bar.replaceChildren();
 const n=selected.size;bar.classList.toggle("show",n>0&&!!roster?.isOpen);$("refresh").classList.toggle("lift",n>0);
 if(!n)return;
 let armed=false;
 const cancel=el("button",{type:"button",class:"b-danger",text:T("cancelSel")});
 cancel.onclick=()=>{if(!armed){armed=true;cancel.textContent=T("cancelConfirm",{n});return}runTeam("bulk",{op:"cancel",entryIds:[...selected]})};
 bar.append(el("div",{class:"sel-n",text:T("selected",{n})}),
  el("div",{class:"sel-actions"},
   el("button",{type:"button",class:"b-main",text:T("moveSel"),onclick:openBulkMove}),
   n===1?el("button",{type:"button",class:"b-soft",text:T("swapSel"),onclick:()=>openManage(roster.entries.find(e=>e.id===[...selected][0]))}):null,
   cancel,
   el("button",{type:"button",class:"b-soft",text:"✕","aria-label":T("clearSel"),onclick:()=>{selected.clear();renderBoard()}})));
}
async function runTeam(action,payload){
 if(busy)return;busy=true;
 try{const r=await api(action,{...payload,revision:roster.revision,requestId:crypto.randomUUID()});selected.clear();closeSheet();toast(r.message||T("saved"))}
 catch(e){closeSheet();toast(e.message,true)}
 finally{busy=false;await loadRoster()}
}
function colorGrid(exclude,onPick,{swapOk}={}){
 const grid=el("div",{class:"move-grid"});
 for(const [slug] of COLORS){
  if(exclude.includes(slug)||!roster.teams.includes(slug))continue;
  const n=roster.entries.filter(e=>e.team===slug).length;
  const b=el("button",{type:"button",class:"c-"+slug,disabled:swapOk?null:(n>=MAX?true:null)},el("div",{text:label(slug)}),el("small",{text:n+"/7"}));
  b.onclick=()=>onPick(slug,n);grid.append(b);
 }
 return grid;
}
function openBulkMove(){
 const ids=[...selected];const from=new Set(roster.entries.filter(e=>ids.includes(e.id)).map(e=>e.team));
 const box=el("div",{},el("div",{class:"sheet-head"},el("div",{},el("h2",{text:T("moveSelTitle",{n:ids.length})}))),
  el("div",{class:"sheet-body"},colorGrid(from.size===1?[...from]:[],slug=>runTeam("bulk",{op:"move",team:slug,entryIds:ids})),
   el("button",{class:"ghost",type:"button",text:T("cancel"),onclick:closeSheet})));
 openSheet(box);
}
function openRecolor(slug){
 const box=el("div",{},el("div",{class:"sheet-head"},el("div",{class:"band c-"+slug,style:"height:auto;padding:4px;border-radius:10px"},shirt(slug)),
   el("div",{},el("h2",{text:T("recolorTitle",{c:label(slug)})}),el("p",{text:T("recolorHint")}))),
  el("div",{class:"sheet-body"},el("div",{class:"label",text:T("recolorTo")}),
   colorGrid([slug],to=>runTeam("recolor",{from:slug,team:to}),{swapOk:true}),
   el("button",{class:"ghost",type:"button",text:T("cancel"),onclick:closeSheet})));
 openSheet(box);
}

async function openHistory(){
 const list=el("ul",{class:"hist-list"},el("li",{class:"hint",text:T("saving").replace("บันทึก","โหลด")}));
 openSheet(el("div",{},el("div",{class:"sheet-head"},el("div",{},el("h2",{text:T("historyTitle")}))),el("div",{class:"sheet-body"},list,el("button",{class:"ghost",type:"button",text:T("close"),onclick:closeSheet}))));
 try{
  const r=await api("log");list.replaceChildren();
  if(!r.log?.length){list.append(el("li",{class:"hint",text:T("noHistory")}));return}
  for(const x of r.log){const t=new Date(x.created_at);
   list.append(el("li",{},el("div",{class:"h-top"},el("b",{text:x.actor_name||"-"}),el("time",{text:t.toLocaleString(lang==="en"?"en-GB":"th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})})),el("div",{class:"h-what",text:x.detail||x.action})))}
 }catch(e){list.replaceChildren(el("li",{class:"hint",text:e.message}))}
}

// ---------- register sheet ----------
function openRegister(slug){
 const players=roster.entries.filter(e=>e.team===slug);const left=MAX-players.length;
 const box=el("div");
 const rows=el("div");
 const submit=el("button",{class:"primary",type:"button"});
 const addBtn=el("button",{class:"add",type:"button",text:T("addFriend")});
 const requestId={value:null,key:""};
 const values=()=>[...rows.querySelectorAll("input")].map(i=>i.value.trim().replace(/\s+/g," ")).filter(Boolean);
 function sync(){const n=values().length;submit.textContent=n?T("confirmJoin",{c:label(slug),n}):T("needName");submit.disabled=!n||busy;addBtn.hidden=rows.children.length>=left}
 function addRow(v=""){
  const input=el("input",{type:"text",maxlength:"40",placeholder:rows.children.length?T("friend"):T("you"),value:v,autocomplete:"off",enterkeyhint:"done"});
  input.oninput=sync;
  const del=el("button",{type:"button","aria-label":T("removeRow"),text:"✕",onclick:()=>{row.remove();if(!rows.children.length)addRow();sync()}});
  const row=el("div",{class:"field"},input,del);rows.append(row);sync();return input;
 }
 addBtn.onclick=()=>{addRow().focus()};
 submit.onclick=async()=>{
  const names=values();
  if(names.length>left)return toast(T("onlyLeft",{n:left}),true);
  const key=JSON.stringify([sessionId,slug,names]);if(requestId.key!==key){requestId.key=key;requestId.value=crypto.randomUUID()}
  busy=true;sync();submit.textContent=T("saving");
  try{const r=await api("register",{team:slug,names,requestId:requestId.value});myName=names[0];closeSheet();toast(r.message||T("joined"));await loadRoster()}
  catch(e){toast(e.message,true);await loadRoster()}
  finally{busy=false;sync()}
 };
 box.append(el("div",{class:"sheet-head"},el("div",{class:"band c-"+slug,style:"height:auto;padding:4px;border-radius:10px"},shirt(slug)),
  el("div",{},el("h2",{text:T("joinColor",{c:label(slug)})}),el("p",{text:T("seatsInfo",{n:left})+(players.length?T("has")+players.map(p=>p.name).join(", "):"")}))),
  el("div",{class:"sheet-body"},rows,addBtn,el("p",{class:"hint",text:T("joinHint")}),submit,el("button",{class:"ghost",type:"button",text:T("cancel"),onclick:closeSheet})));
 openSheet(box);
 const first=addRow(myName);if(!myName)setTimeout(()=>first.focus(),250);
}

// ---------- manage sheet ----------
function openManage(player){
 const viewed=roster;let choice=null;const req={key:"",id:null};
 const box=el("div");
 const go=el("button",{class:"primary",type:"button",text:T("pickTarget"),disabled:true});
 const moveGrid=el("div",{class:"move-grid"});
 const swapWrap=el("div");
 function pick(c,btn){choice=c;for(const b of box.querySelectorAll("[aria-pressed]"))b.setAttribute("aria-pressed","false");btn.setAttribute("aria-pressed","true");
  go.disabled=false;go.textContent=c.action==="move"?T("moveTo",{c:label(c.team)}):T("swapWith",{n:c.name})}
 for(const [slug] of COLORS){
  if(slug===player.team||!viewed.teams.includes(slug))continue;
  const n=viewed.entries.filter(e=>e.team===slug).length;
  const b=el("button",{type:"button",class:"c-"+slug,"aria-pressed":"false",disabled:n>=MAX?true:null},el("div",{text:label(slug)}),el("small",{text:n+"/7"}));
  b.onclick=()=>pick({action:"move",team:slug},b);moveGrid.append(b);
 }
 const others=viewed.entries.filter(e=>e.team!==player.team);
 if(others.length){
  const list=el("div",{class:"swap-list"});
  for(const o of others){const b=el("button",{type:"button",class:"chip","aria-pressed":"false",text:o.name+" · "+label(o.team)});b.onclick=()=>pick({action:"swap",otherId:o.id,name:o.name},b);list.append(b)}
  swapWrap.append(el("div",{class:"label",text:T("orSwap")}),list);
 }
 async function run(action){
  if(busy)return;
  const payload={action:action.action,team:action.team,otherId:action.otherId,entryId:player.id,revision:viewed.revision};
  const key=JSON.stringify(payload);if(req.key!==key){req.key=key;req.id=crypto.randomUUID()}
  busy=true;go.disabled=cancel.disabled=true;
  try{const r=await api(action.action,{...payload,requestId:req.id});closeSheet();toast(r.message||T("saved"))}
  catch(e){closeSheet();toast(e.message,true)}
  finally{busy=false;await loadRoster()}
 }
 let armed=false;
 const cancel=el("button",{class:"danger",type:"button",text:T("removeName",{n:player.name})});
 cancel.onclick=()=>{if(!armed){armed=true;cancel.textContent=T("tapAgain");return}run({action:"cancel"})};
 go.onclick=()=>choice&&run(choice);
 box.append(el("div",{class:"sheet-head"},el("div",{class:"band c-"+player.team,style:"height:auto;padding:4px;border-radius:10px"},shirt(player.team)),
  el("div",{},el("h2",{text:player.name}),el("p",{text:T("inColor",{c:label(player.team),n:player.slot})}))),
  el("div",{class:"sheet-body"},el("div",{class:"label",text:T("moveLabel")}),moveGrid,swapWrap,go,cancel,el("button",{class:"ghost",type:"button",text:T("close"),onclick:closeSheet})));
 openSheet(box);
}

// ---------- load ----------
async function loadRoster(showSkeleton=false){
 const seq=++loadSeq;const sid=sessionId;if(!sid)return;
 $("refresh").classList.add("spin");
 if(showSkeleton){roster=null;renderBoard();$("board").append(el("div",{class:"grid"},[1,2,3,4].map(()=>el("div",{class:"skeleton"}))))}
 try{const next=await api("roster",{sessionId:sid});if(seq!==loadSeq||sid!==sessionId)return;roster=next;renderBoard()}
 catch(e){if(seq===loadSeq)toast(e.message,true)}
 finally{if(seq===loadSeq)$("refresh").classList.remove("spin")}
}
$("refresh").onclick=()=>loadRoster();
// สลับภาษา
function applyLang(){document.documentElement.lang=lang;$("title").textContent=T("title");$("refresh").setAttribute("aria-label",T("refresh"));
 for(const b of document.querySelectorAll("#lang button"))b.setAttribute("aria-pressed",String(b.dataset.lang===lang))}
for(const b of document.querySelectorAll("#lang button"))b.onclick=()=>{lang=b.dataset.lang;try{localStorage.setItem(LANG_KEY,lang)}catch{};applyLang();renderDates();renderBoard()};
applyLang();
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!busy&&!$("sheet").classList.contains("show"))loadRoster()});
setInterval(()=>{if(!document.hidden&&!busy&&!$("sheet").classList.contains("show"))loadRoster()},20000);

function fail(msg){$("board").replaceChildren(el("div",{class:"notice",text:msg}))}
(async()=>{
 try{
  if(!demo){
   const c=window.TK7_CONFIG;
   if(!c?.liffId||!c?.apiUrl)return fail(T("noConfig"));
   await liff.init({liffId:c.liffId});
   if(!liff.isLoggedIn()){liff.login({redirectUri:location.href});return}
   try{myName=liff.getDecodedIDToken()?.name||""}catch{}
   try{if(!localStorage.getItem(LANG_KEY)){const l=(liff.getLanguage()||"").toLowerCase();if(l){lang=l.startsWith("th")?"th":"en";applyLang()}}}catch{}
  }
  const r=await api("dates");dates=r.dates||[];
  if(!dates.length)return fail(T("noDates"));
  // เปิดจากปุ่มของวันไหน ให้เลือกวันนั้น (?date=YYYY-MM-DD) ไม่งั้นเลือกวันที่ใกล้ที่สุด
  const want=(()=>{try{const q=new URLSearchParams(location.search);let d=q.get("date");if(!d&&q.get("liff.state"))d=new URLSearchParams(q.get("liff.state").split("?")[1]||"").get("date");return d}catch{return null}})();
  sessionId=(dates.find(d=>d.date===want)||dates.find(d=>d.isOpen)||dates[0]).id;
  renderDates();await loadRoster();
 }catch(e){fail(T("connFail")+e.message)}
})();

// ---------- demo ----------
let demoState=null;
async function demoApi(action,p){
 await new Promise(r=>setTimeout(r,250));
 if(!demoState){
  const mk=(team,names)=>names.map((name,i)=>({id:crypto.randomUUID(),team,slot:i+1,name}));
  demoState={revision:1,teams:COLORS.map(c=>c[0]),presetTeams:["green","red","blue"],isOpen:true,matchDate:"2026-11-06",startTime:"20:00",timePerMatch:8,
   entries:[...mk("green",["ปุ้ย","บอล","ต้น","เอก","นัท"]),...mk("red",["โอ๊ต","บีม","แบงค์","ต่อ","ปอนด์","เจ","ฟิล์ม"]),...mk("black",["ก้อง","ภูมิ"])]};
 }
 const s=demoState;
 if(action==="dates")return{dates:[{id:"d1",date:"2026-11-06",label:"ศ. 6 พ.ย.",startTime:"20:00",timePerMatch:8,isOpen:true},{id:"d2",date:"2026-11-13",label:"ศ. 13 พ.ย.",startTime:"20:00",timePerMatch:8,isOpen:true}]};
 if(action==="roster")return structuredClone(s);
 if(action==="log")return{log:[{actor_name:"Pui",action:"register",detail:"ลงสีเขียว: ปุ้ย, บอล",created_at:new Date().toISOString()},{actor_name:"แอดมิน",action:"open",detail:"เปิดรับลงชื่อ",created_at:new Date(Date.now()-3600e3).toISOString()}]};
 const free=t=>[1,2,3,4,5,6,7].filter(n=>!s.entries.some(e=>e.team===t&&e.slot===n));
 if(action==="register"){const f=free(p.team);if(f.length<p.names.length)throw Error("สีนี้ที่ว่างไม่พอ");p.names.forEach((name,i)=>s.entries.push({id:crypto.randomUUID(),team:p.team,slot:f[i],name}))}
 const a=s.entries.find(e=>e.id===p.entryId);
 if(action==="cancel")s.entries=s.entries.filter(e=>e!==a);
 if(action==="move"){a.team=p.team;a.slot=free(p.team)[0]}
 if(action==="swap"){const b=s.entries.find(e=>e.id===p.otherId);[a.team,a.slot,b.team,b.slot]=[b.team,b.slot,a.team,a.slot]}
 if(action==="recolor"){for(const e of s.entries){if(e.team===p.from)e.team=p.team;else if(e.team===p.team)e.team=p.from}s.presetTeams=(s.presetTeams||[]).map(t=>t===p.from?p.team:t===p.team?p.from:t)}
 if(action==="bulk"&&p.op==="cancel")s.entries=s.entries.filter(e=>!p.entryIds.includes(e.id));
 if(action==="bulk"&&p.op==="move"){const mv=s.entries.filter(e=>p.entryIds.includes(e.id)&&e.team!==p.team);const f=free(p.team);if(f.length<mv.length)throw Error(T("onlyLeft",{n:f.length}));mv.forEach((e,i)=>{e.team=p.team;e.slot=f[i]})}
 s.revision++;return{ok:true,message:"บันทึกแล้ว ✓ (โหมดตัวอย่าง)"};
}
})();
