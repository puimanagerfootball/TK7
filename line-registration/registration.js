// TK7 LIFF: ผู้เล่นเลือกสีเอง สีละ 7 คน · ลงให้เพื่อนได้ · ย้าย / สลับ / ยกเลิก
// เปิด register.html?demo=1 เพื่อดูหน้าตาโดยไม่ต้องเชื่อม LINE
(()=>{
const $=id=>document.getElementById(id);
// ---------- 2 ภาษา (ไทย / English) ----------
const COLORS=[["green","เขียว","Green"],["red","แดง","Red"],["white","ขาว","White"],["blue","น้ำเงิน","Blue"],["black","ดำ","Black"],["yellow","เหลือง","Yellow"],["pink","ชมพู","Pink"],["orange","ส้ม","Orange"],["navy","น้ำเงินเข้ม","Navy"],["purple","ม่วง","Purple"]];
const I18N={
 th:{title:"⚽ เลือกสีเสื้อ ลงชื่อเตะบอล",relogin:"กำลังเข้าสู่ระบบใหม่…",down:"ระบบไม่พร้อม กรุณาลองใหม่",closedShort:" · ปิดแล้ว",start:"🕗 เริ่ม {t} น.",perMatch:"⏱️ {n} นาที/แมตช์",teams:"👥 {t} ทีม · {p} คน",closed:"🔒 ปิดรับลงชื่อแล้ว",
  joinColor:"ลงชื่อสี{c}",closedCta:"ปิดรับแล้ว",full:"เต็มแล้ว ✓",joinLeft:"＋ ลงสีนี้ (ว่าง {n})",openTeam:"＋ เปิดทีมสี{c}",openSec:"ทีมที่เปิดแล้ว · แตะชื่อเพื่อย้าย/ยกเลิก",otherSec:"สีอื่น · แตะเพื่อเปิดทีมใหม่",firstSec:"ยังไม่มีใครลง · เลือกสีเปิดทีมแรกได้เลย",closedEmpty:"ปิดรับลงชื่อแล้ว และยังไม่มีรายชื่อ",
  addFriend:"＋ เพิ่มชื่อเพื่อน",confirmJoin:"ยืนยันลงสี{c} ({n} คน)",needName:"ใส่ชื่ออย่างน้อย 1 ชื่อ",friend:"ชื่อเพื่อน",you:"ชื่อของคุณ",removeRow:"ลบช่องนี้",dupNames:"มีชื่อซ้ำกันในรายการ",onlyLeft:"สีนี้ว่างแค่ {n} ที่",saving:"กำลังบันทึก…",joined:"ลงชื่อสำเร็จ",
  seatsInfo:"ว่าง {n} จาก 7 ที่",has:" · มี ",joinHint:"ลงให้ตัวเองและเพื่อนได้พร้อมกัน · ถ้าที่ว่างไม่พอ ระบบจะไม่บันทึกบางส่วน",cancel:"ยกเลิก",pickTarget:"เลือกสีปลายทาง หรือคนที่จะสลับ",moveTo:"ย้ายไปสี{c}",swapWith:"สลับกับ {n}",orSwap:"หรือสลับกับ",saved:"บันทึกแล้ว",
  removeName:"ยกเลิกชื่อ {n}",tapAgain:"แตะอีกครั้งเพื่อยืนยันยกเลิก",inColor:"อยู่สี{c} · ลำดับ {n}",moveLabel:"ย้ายไปสี",close:"ปิด",noConfig:"ยังไม่ได้ตั้งค่า LIFF ID และ API",noDates:"ยังไม่มีวันเปิดรับลงชื่อ\nรอผู้ดูแลเปิดวันแข่งในเว็บ TK7",connFail:"เชื่อมต่อไม่สำเร็จ: ",refresh:"รีเฟรชรายชื่อ"},
 en:{title:"⚽ Pick your shirt colour & sign up",relogin:"Signing in again…",down:"Service unavailable, please try again",closedShort:" · closed",start:"🕗 Kick-off {t}",perMatch:"⏱️ {n} min/match",teams:"👥 {t} teams · {p} players",closed:"🔒 Registration closed",
  joinColor:"Join {c}",closedCta:"Closed",full:"Full ✓",joinLeft:"＋ Join ({n} left)",openTeam:"＋ Start {c} team",openSec:"Open teams · tap a name to move/remove",otherSec:"Other colours · tap to start a new team",firstSec:"No one yet · pick a colour to start the first team",closedEmpty:"Registration closed, no players yet",
  addFriend:"＋ Add a friend",confirmJoin:"Join {c} ({n} players)",needName:"Enter at least 1 name",friend:"Friend's name",you:"Your name",removeRow:"Remove",dupNames:"Duplicate names in the list",onlyLeft:"Only {n} spots left in this colour",saving:"Saving…",joined:"Signed up",
  seatsInfo:"{n} of 7 spots left",has:" · ",joinHint:"Sign up yourself and friends together · if there aren't enough spots, nothing is saved",cancel:"Cancel",pickTarget:"Choose a colour or a player to swap",moveTo:"Move to {c}",swapWith:"Swap with {n}",orSwap:"Or swap with",saved:"Saved",
  removeName:"Remove {n}",tapAgain:"Tap again to confirm",inColor:"{c} · spot {n}",moveLabel:"Move to",close:"Close",noConfig:"LIFF ID / API not configured",noDates:"No match open for sign-up yet\nPlease wait for the admin",connFail:"Connection failed: ",refresh:"Refresh"}
};
const LANG_KEY="tk7.lang";
let lang=(()=>{try{const v=localStorage.getItem(LANG_KEY);if(v)return v}catch{}const n=(navigator.language||"th").toLowerCase();return n.startsWith("th")?"th":"en"})();
const T=(k,v={})=>String((I18N[lang]||I18N.th)[k]??I18N.th[k]??k).replace(/\{(\w+)\}/g,(_,x)=>v[x]??"");
const label=slug=>{const c=COLORS.find(c=>c[0]===slug);return c?(lang==="en"?c[2]:c[1]):slug};
const dateLabel=d=>{try{return new Date(d+"T00:00:00+07:00").toLocaleDateString(lang==="en"?"en-GB":"th-TH",{weekday:"short",day:"numeric",month:"short",timeZone:"Asia/Bangkok"})}catch{return d}};
const MAX=7;
const demo=new URLSearchParams(location.search).has("demo");
let dates=[],sessionId="",roster=null,busy=false,loadSeq=0,myName="";

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
function renderInfo(){
 const info=$("info");info.replaceChildren();if(!roster)return;
 const d=dates.find(x=>x.id===sessionId)||{};
 const teams=new Set([...roster.entries.map(e=>e.team),...(roster.presetTeams||[])]).size;
 if(dates.length<2)info.append(el("span",{class:"pill",text:"📅 "+(roster.matchDate?dateLabel(roster.matchDate):d.label)}));
 info.append(el("span",{class:"pill",text:T("start",{t:roster.startTime||d.startTime||"20:00"})}),
  el("span",{class:"pill",text:T("perMatch",{n:roster.timePerMatch||d.timePerMatch||8})}),
  el("span",{class:"pill",text:T("teams",{t:teams,p:roster.entries.length})}));
 if(!roster.isOpen)info.append(el("span",{class:"pill closed",text:T("closed")}));
}
function teamCard(slug){
 const players=roster.entries.filter(e=>e.team===slug).sort((a,b)=>a.slot-b.slot);
 const allowed=roster.teams.includes(slug);
 const full=players.length>=MAX;
 const canJoin=roster.isOpen&&allowed&&!full;
 const card=el("div",{class:"team"+(full?" full":"")+(players.length?"":" empty")+(canJoin?" joinable":"")});
 const join=()=>canJoin&&openRegister(slug);
 const band=el("div",{class:"band c-"+slug,onclick:join},shirt(slug),el("span",{class:"name",text:label(slug)}),el("span",{class:"count",text:players.length+"/"+MAX}));
 const dots=el("div",{class:"dots",onclick:join});for(let i=0;i<MAX;i++)dots.append(el("i",{class:i<players.length?"on":""}));
 card.append(band,dots);
 if(players.length){
  const list=el("div",{class:"players"});
  for(const p of players)list.append(roster.isOpen?el("button",{type:"button",class:"chip",text:p.name,onclick:()=>openManage(p)}):el("span",{class:"chip",text:p.name}));
  card.append(list);
 }
 card.append(el("button",{type:"button",class:"cta",disabled:canJoin?null:true,onclick:join,"aria-label":T("joinColor",{c:label(slug)}),
  text:!roster.isOpen?T("closedCta"):full?T("full"):(players.length||(roster.presetTeams||[]).includes(slug))?T("joinLeft",{n:MAX-players.length}):T("openTeam",{c:label(slug)})}));
 return card;
}
function renderBoard(){
 const board=$("board");board.replaceChildren();renderInfo();
 if(!roster)return;
 const preset=roster.presetTeams||[];
 const used=COLORS.map(c=>c[0]).filter(s=>roster.entries.some(e=>e.team===s)||preset.includes(s));
 const free=COLORS.map(c=>c[0]).filter(s=>!used.includes(s)&&roster.teams.includes(s));
 if(used.length){board.append(el("div",{class:"section-label",text:T("openSec")}),el("div",{class:"grid"},used.map(teamCard)))}
 if(free.length&&roster.isOpen){board.append(el("div",{class:"section-label",text:used.length?T("otherSec"):T("firstSec")}),el("div",{class:"grid empty-grid"},free.map(teamCard)))}
 if(!used.length&&!roster.isOpen)board.append(el("div",{class:"notice",text:T("closedEmpty")}));
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
  sessionId=(dates.find(d=>d.isOpen)||dates[0]).id;
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
 const free=t=>[1,2,3,4,5,6,7].filter(n=>!s.entries.some(e=>e.team===t&&e.slot===n));
 if(action==="register"){const f=free(p.team);if(f.length<p.names.length)throw Error("สีนี้ที่ว่างไม่พอ");p.names.forEach((name,i)=>s.entries.push({id:crypto.randomUUID(),team:p.team,slot:f[i],name}))}
 const a=s.entries.find(e=>e.id===p.entryId);
 if(action==="cancel")s.entries=s.entries.filter(e=>e!==a);
 if(action==="move"){a.team=p.team;a.slot=free(p.team)[0]}
 if(action==="swap"){const b=s.entries.find(e=>e.id===p.otherId);[a.team,a.slot,b.team,b.slot]=[b.team,b.slot,a.team,a.slot]}
 s.revision++;return{ok:true,message:"บันทึกแล้ว ✓ (โหมดตัวอย่าง)"};
}
})();
