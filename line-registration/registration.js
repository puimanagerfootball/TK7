// TK7 LIFF: ผู้เล่นเลือกสีเอง สีละ 7 คน · ลงให้เพื่อนได้ · ย้าย / สลับ / ยกเลิก
// เปิด register.html?demo=1 เพื่อดูหน้าตาโดยไม่ต้องเชื่อม LINE
(()=>{
const $=id=>document.getElementById(id);
const COLORS=[["green","เขียว"],["red","แดง"],["white","ขาว"],["blue","น้ำเงิน"],["black","ดำ"],["yellow","เหลือง"],["pink","ชมพู"],["orange","ส้ม"],["navy","น้ำเงินเข้ม"],["purple","ม่วง"]];
const label=slug=>(COLORS.find(c=>c[0]===slug)||[slug,slug])[1];
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
 const r=await fetch(window.TK7_CONFIG.apiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,idToken:liff.getIDToken(),sessionId,...payload})});
 const result=await r.json().catch(()=>({}));
 if(r.status===401&&result.relogin){liff.logout();liff.login({redirectUri:location.href});throw Error("กำลังเข้าสู่ระบบใหม่…")}
 if(!r.ok)throw Error(result.error||"ระบบไม่พร้อม กรุณาลองใหม่");
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
   el("b",{text:d.label}),el("small",{text:"🕗 "+d.startTime+(d.isOpen?"":" · ปิดแล้ว")})));
 }
 nav.hidden=dates.length<2;
}
function renderInfo(){
 const info=$("info");info.replaceChildren();if(!roster)return;
 const d=dates.find(x=>x.id===sessionId)||{};
 const teams=new Set([...roster.entries.map(e=>e.team),...(roster.presetTeams||[])]).size;
 if(dates.length<2)info.append(el("span",{class:"pill",text:"📅 "+(d.label||roster.matchDate)}));
 info.append(el("span",{class:"pill",text:"🕗 เริ่ม "+(roster.startTime||d.startTime||"20:00")+" น."}),
  el("span",{class:"pill",text:"⏱️ "+(roster.timePerMatch||d.timePerMatch||8)+" นาที/แมตช์"}),
  el("span",{class:"pill",text:"👥 "+teams+" ทีม · "+roster.entries.length+" คน"}));
 if(!roster.isOpen)info.append(el("span",{class:"pill closed",text:"🔒 ปิดรับลงชื่อแล้ว"}));
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
 card.append(el("button",{type:"button",class:"cta",disabled:canJoin?null:true,onclick:join,"aria-label":"ลงชื่อสี"+label(slug),
  text:!roster.isOpen?"ปิดรับแล้ว":full?"เต็มแล้ว ✓":players.length?"＋ ลงสีนี้ (ว่าง "+(MAX-players.length)+")":"＋ เปิดทีมสี"+label(slug)}));
 return card;
}
function renderBoard(){
 const board=$("board");board.replaceChildren();renderInfo();
 if(!roster)return;
 const preset=roster.presetTeams||[];
 const used=COLORS.map(c=>c[0]).filter(s=>roster.entries.some(e=>e.team===s)||preset.includes(s));
 const free=COLORS.map(c=>c[0]).filter(s=>!used.includes(s)&&roster.teams.includes(s));
 if(used.length){board.append(el("div",{class:"section-label",text:"ทีมที่เปิดแล้ว · แตะชื่อเพื่อย้าย/ยกเลิก"}),el("div",{class:"grid"},used.map(teamCard)))}
 if(free.length&&roster.isOpen){board.append(el("div",{class:"section-label",text:used.length?"สีอื่น · แตะเพื่อเปิดทีมใหม่":"ยังไม่มีใครลง · เลือกสีเปิดทีมแรกได้เลย"}),el("div",{class:"grid empty-grid"},free.map(teamCard)))}
 if(!used.length&&!roster.isOpen)board.append(el("div",{class:"notice",text:"ปิดรับลงชื่อแล้ว และยังไม่มีรายชื่อ"}));
}

// ---------- register sheet ----------
function openRegister(slug){
 const players=roster.entries.filter(e=>e.team===slug);const left=MAX-players.length;
 const box=el("div");
 const rows=el("div");
 const submit=el("button",{class:"primary",type:"button"});
 const addBtn=el("button",{class:"add",type:"button",text:"＋ เพิ่มชื่อเพื่อน"});
 const requestId={value:null,key:""};
 const values=()=>[...rows.querySelectorAll("input")].map(i=>i.value.trim().replace(/\s+/g," ")).filter(Boolean);
 function sync(){const n=values().length;submit.textContent=n?"ยืนยันลงสี"+label(slug)+" ("+n+" คน)":"ใส่ชื่ออย่างน้อย 1 ชื่อ";submit.disabled=!n||busy;addBtn.hidden=rows.children.length>=left}
 function addRow(v=""){
  const input=el("input",{type:"text",maxlength:"40",placeholder:rows.children.length?"ชื่อเพื่อน":"ชื่อของคุณ",value:v,autocomplete:"off",enterkeyhint:"done"});
  input.oninput=sync;
  const del=el("button",{type:"button","aria-label":"ลบช่องนี้",text:"✕",onclick:()=>{row.remove();if(!rows.children.length)addRow();sync()}});
  const row=el("div",{class:"field"},input,del);rows.append(row);sync();return input;
 }
 addBtn.onclick=()=>{addRow().focus()};
 submit.onclick=async()=>{
  const names=values();
  if(new Set(names.map(n=>n.toLocaleLowerCase())).size!==names.length)return toast("มีชื่อซ้ำกันในรายการ",true);
  if(names.length>left)return toast("สีนี้ว่างแค่ "+left+" ที่",true);
  const key=JSON.stringify([sessionId,slug,names]);if(requestId.key!==key){requestId.key=key;requestId.value=crypto.randomUUID()}
  busy=true;sync();submit.textContent="กำลังบันทึก…";
  try{const r=await api("register",{team:slug,names,requestId:requestId.value});myName=names[0];closeSheet();toast(r.message||"ลงชื่อสำเร็จ");await loadRoster()}
  catch(e){toast(e.message,true);await loadRoster()}
  finally{busy=false;sync()}
 };
 box.append(el("div",{class:"sheet-head"},el("div",{class:"band c-"+slug,style:"height:auto;padding:4px;border-radius:10px"},shirt(slug)),
  el("div",{},el("h2",{text:"ลงชื่อสี"+label(slug)}),el("p",{text:"ว่าง "+left+" จาก 7 ที่"+(players.length?" · มี "+players.map(p=>p.name).join(", "):"")}))),
  el("div",{class:"sheet-body"},rows,addBtn,el("p",{class:"hint",text:"ลงให้ตัวเองและเพื่อนได้พร้อมกัน · ถ้าที่ว่างไม่พอ ระบบจะไม่บันทึกบางส่วน"}),submit,el("button",{class:"ghost",type:"button",text:"ยกเลิก",onclick:closeSheet})));
 openSheet(box);
 const first=addRow(myName);if(!myName)setTimeout(()=>first.focus(),250);
}

// ---------- manage sheet ----------
function openManage(player){
 const viewed=roster;let choice=null;const req={key:"",id:null};
 const box=el("div");
 const go=el("button",{class:"primary",type:"button",text:"เลือกสีปลายทาง หรือคนที่จะสลับ",disabled:true});
 const moveGrid=el("div",{class:"move-grid"});
 const swapWrap=el("div");
 function pick(c,btn){choice=c;for(const b of box.querySelectorAll("[aria-pressed]"))b.setAttribute("aria-pressed","false");btn.setAttribute("aria-pressed","true");
  go.disabled=false;go.textContent=c.action==="move"?"ย้ายไปสี"+label(c.team):"สลับกับ "+c.name}
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
  swapWrap.append(el("div",{class:"label",text:"หรือสลับกับ"}),list);
 }
 async function run(action){
  if(busy)return;
  const payload={action:action.action,team:action.team,otherId:action.otherId,entryId:player.id,revision:viewed.revision};
  const key=JSON.stringify(payload);if(req.key!==key){req.key=key;req.id=crypto.randomUUID()}
  busy=true;go.disabled=cancel.disabled=true;
  try{const r=await api(action.action,{...payload,requestId:req.id});closeSheet();toast(r.message||"บันทึกแล้ว")}
  catch(e){closeSheet();toast(e.message,true)}
  finally{busy=false;await loadRoster()}
 }
 let armed=false;
 const cancel=el("button",{class:"danger",type:"button",text:"ยกเลิกชื่อ "+player.name});
 cancel.onclick=()=>{if(!armed){armed=true;cancel.textContent="แตะอีกครั้งเพื่อยืนยันยกเลิก";return}run({action:"cancel"})};
 go.onclick=()=>choice&&run(choice);
 box.append(el("div",{class:"sheet-head"},el("div",{class:"band c-"+player.team,style:"height:auto;padding:4px;border-radius:10px"},shirt(player.team)),
  el("div",{},el("h2",{text:player.name}),el("p",{text:"อยู่สี"+label(player.team)+" · ลำดับ "+player.slot}))),
  el("div",{class:"sheet-body"},el("div",{class:"label",text:"ย้ายไปสี"}),moveGrid,swapWrap,go,cancel,el("button",{class:"ghost",type:"button",text:"ปิด",onclick:closeSheet})));
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
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!busy&&!$("sheet").classList.contains("show"))loadRoster()});
setInterval(()=>{if(!document.hidden&&!busy&&!$("sheet").classList.contains("show"))loadRoster()},20000);

function fail(msg){$("board").replaceChildren(el("div",{class:"notice",text:msg}))}
(async()=>{
 try{
  if(!demo){
   const c=window.TK7_CONFIG;
   if(!c?.liffId||!c?.apiUrl)return fail("ยังไม่ได้ตั้งค่า LIFF ID และ API");
   await liff.init({liffId:c.liffId});
   if(!liff.isLoggedIn()){liff.login({redirectUri:location.href});return}
   try{myName=liff.getDecodedIDToken()?.name||""}catch{}
  }
  const r=await api("dates");dates=r.dates||[];
  if(!dates.length)return fail("ยังไม่มีวันเปิดรับลงชื่อ\nรอผู้ดูแลเปิดวันแข่งในเว็บ TK7");
  sessionId=(dates.find(d=>d.isOpen)||dates[0]).id;
  renderDates();await loadRoster();
 }catch(e){fail("เชื่อมต่อไม่สำเร็จ: "+e.message)}
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
 if(action==="dates")return{dates:[{id:"d1",label:"ศ. 6 พ.ย.",startTime:"20:00",timePerMatch:8,isOpen:true},{id:"d2",label:"ศ. 13 พ.ย.",startTime:"20:00",timePerMatch:8,isOpen:true}]};
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
