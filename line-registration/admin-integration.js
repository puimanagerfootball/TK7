// TK7 admin: เชื่อมหน้าจัดการทีมกับการลงชื่อใน LINE
// - วันที่ / นาทีต่อแมตช์ / เวลาเริ่ม ในฟอร์ม = ค่าใน LINE (แก้ที่เดียว อัปเดตอัตโนมัติ)
// - รายการ "เลือกทีมที่เข้าร่วม" แสดงจำนวน/ชื่อคนจาก LINE และติ๊กทีมที่มีคนลงให้เอง
// - เปลี่ยนสีทั้งทีมได้ (ถ้าสีปลายทางมีคน = สลับกัน) และอัปเดตตารางแข่งที่บันทึกไว้ด้วย
window.TK7Admin={mount({db,canManage}){
 const LIFF='https://liff.line.me/2012278818-W0pIi2y0';
 const COLORS={green:'เขียว',red:'แดง',white:'ขาว',blue:'ฟ้า',black:'ดำ',yellow:'เหลือง',pink:'ชมพู',orange:'ส้ม',navy:'น้ำเงิน',purple:'ม่วง'};
 const ORDER=Object.keys(COLORS);
 const $=id=>document.getElementById(id);
 const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k==='style')n.style.cssText=v;else if(k.startsWith('on'))n[k]=v;else if(v!=null&&v!==false)n.setAttribute(k,v===true?'':v)}for(const c of kids.flat())if(c!=null)n.append(c);return n};

 document.head.append(el('style',{text:`
  #tk7-line-card{background:#f5faf6!important;border:1px solid #d9e8dc!important;border-radius:22px!important;padding:24px!important;box-shadow:0 12px 28px #183c1812!important}
  .tk7l-sharebar{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;background:#123d2b;border-radius:16px;padding:20px;color:white}
  .tk7l-sharebar strong{font-size:18px}.tk7l-sharebar p{font-size:12px;color:#c5dacd;margin:5px 0 0}
  #tk7-line-card .tk7l-sharecta{display:block;background:#b9ed83;color:#123d2b;text-decoration:none;border:0;cursor:pointer;font:inherit;border-radius:12px;padding:14px 18px;font-weight:700;text-align:center}
  #tk7-line-card .tk7l-copylink{margin:0;border:1px solid #ffffff40;border-radius:12px;padding:13px;background:transparent;color:white;font:inherit;font-size:13px;cursor:pointer;box-shadow:none}
  #tk7-line-card :focus-visible{outline:3px solid #74b54e;outline-offset:3px}
  @media(max-width:680px){.tk7l-sharebar{grid-template-columns:1fr}.tk7l-actions{grid-template-columns:1fr!important}#tk7-line-card{padding:18px!important}}

  #tk7-line-card{display:flex;flex-direction:column;gap:12px;text-align:left}
  #tk7-line-card h2{margin:0;display:flex;align-items:center;justify-content:space-between;gap:8px}
  .tk7l-pill{font-size:13px;font-weight:600;padding:4px 12px;border-radius:999px;background:#dff3e4;color:#1f6b3a;white-space:nowrap}
  .tk7l-pill.off{background:#fff0d4;color:#7a5200}
  .tk7l-pill.none{background:#eceff1;color:#546e7a}
  .tk7l-sum{font-size:15px;line-height:1.6;margin:0;color:#2d4a37}
  .tk7l-sum b{font-weight:600}
  .tk7l-hint{font-size:13px;line-height:1.6;margin:0;color:#5f7466}
  .tk7l-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  #tk7-line-card .tk7l-actions .btn,#tk7-line-card .tk7l-main{margin:0!important;width:100%;font-size:14px;min-height:44px;padding:10px 8px}
  .tk7l-actions .tk7l-danger{background:#fdeaea!important;color:#b3261e!important;box-shadow:0 3px 0 #e8b4b0!important}
  .tk7l-status{font-size:14px;margin:0;min-height:1.2em;color:#2d4a37}
  .tk7l-status.err{color:#c62828}
  #tk7-line-card details{border-top:1px solid rgba(0,0,0,.08);padding-top:10px}
  #tk7-line-card summary{cursor:pointer;font-weight:600;font-size:14px;color:#2d4a37}
  .tk7l-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  #tk7-line-card select{font:inherit;font-size:14px;padding:9px;border-radius:10px;border:1px solid rgba(0,0,0,.18);background:#fff;min-width:0;width:100%}
  #tk7-line-card .tk7l-check{display:flex!important;width:100%;gap:10px;align-items:flex-start;justify-content:flex-start;text-align:left;font-size:14px;color:#3d5545;margin-top:10px;line-height:1.5;cursor:pointer}
  #tk7-line-card .tk7l-check input{appearance:auto;-webkit-appearance:checkbox;width:20px!important;height:20px!important;min-width:20px;min-height:0!important;flex:0 0 20px;margin:1px 0 0!important;padding:0!important;accent-color:#1f7a43;box-shadow:none!important}
  #tk7-line-card .tk7l-check span{flex:1;min-width:0}
  /* รายการทีม: ป้ายจำนวนคนจาก LINE + แตะสีเพื่อเปิดป็อปอัพ (การ์ดขนาดเท่ากัน) */
  #page-setup .team-emblem.tk7l-tap{cursor:pointer;position:relative}
  #page-setup .team-toggle{position:relative}
  #page-setup .team-toggle > .tk7l-count{position:absolute;top:-8px;left:10px;z-index:2;background:#fff;color:#1f4d30;font-size:11px;font-weight:700;line-height:1;padding:4px 8px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.22);pointer-events:none}
  #page-setup .team-toggle > .tk7l-count.full{background:#1f7a43;color:#fff}
  #page-setup .team-toggle.tk7l-has{outline:2px solid rgba(31,122,67,.35);outline-offset:-2px}
  .tk7l-modal{position:fixed;inset:0;background:rgba(10,25,15,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px}
  .tk7l-modal[hidden]{display:none}
  .tk7l-sheet{background:#f6faf6;border-radius:18px;width:min(440px,100%);max-height:90vh;overflow:auto;box-shadow:0 20px 50px rgba(0,0,0,.35);font-family:inherit}
  .tk7l-sheet-head{max-width:none!important;justify-content:flex-start!important;overflow:visible!important;display:flex!important;align-items:center;gap:10px;padding:14px 16px!important;border-radius:18px 18px 0 0!important;width:auto!important;height:auto!important;min-width:0!important;font-size:18px!important;cursor:default!important;box-shadow:none!important;transform:none!important}
  .tk7l-sheet-head strong{flex:1;text-align:left}
  .tk7l-sheet-head .tk7l-count{background:rgba(255,255,255,.9);color:#1f4d30;font-size:13px;padding:3px 10px;border-radius:999px;text-shadow:none}
  .tk7l-x{background:rgba(0,0,0,.18);color:inherit;border:0;width:32px;height:32px;border-radius:50%;font-size:15px;cursor:pointer;min-height:0;padding:0}
  .tk7l-sheet-body{padding:14px 16px 18px;color:#1d2b22}
  .tk7l-names{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:2px}
  .tk7l-names li{display:flex;gap:10px;padding:8px 10px;background:#fff;border-radius:10px;font-size:15px}
  .tk7l-names .n{color:#6b7d71;min-width:20px}
  .tk7l-sub{font-weight:600;font-size:14px;margin:4px 0 8px}
  .tk7l-colorgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .tk7l-colorgrid .team-emblem{max-width:none!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;width:auto!important;min-width:0!important;height:auto!important;padding:10px 4px!important;font-size:14px!important;line-height:1.2;cursor:pointer;border:0}
  .tk7l-colorgrid small{font-size:11px;opacity:.85;font-weight:400}
  .tk7l-empty{margin:4px 0 6px;color:#5f7466}
  .tk7l-dates{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  #tk7-line-card .tk7l-dtab{font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid rgba(31,122,67,.35);background:#fff;color:#1f4d30;cursor:pointer;min-height:0;margin:0;box-shadow:none}
  #tk7-line-card .tk7l-dtab.on{background:#1f7a43;color:#fff;border-color:#1f7a43}
  .tk7l-colorbox{display:flex;flex-direction:column;gap:6px}
  .tk7l-colors{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
  #tk7-line-card .tk7l-chip{width:100%!important;max-width:none!important;display:flex!important;justify-content:center;align-items:center;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  @media (max-width:480px){#tk7-line-card .tk7l-chip{font-size:11.5px!important;padding:6px 2px!important}}
  #tk7-line-card .tk7l-log summary{cursor:pointer;font-weight:600;font-size:14px;color:#2d4a37}
  .tk7l-loglist{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:4px;max-height:320px;overflow:auto}
  .tk7l-loglist li{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;background:rgba(255,255,255,.6);border-radius:10px;padding:8px 10px;font-size:13px;line-height:1.4;color:#1d2b22}
  .tk7l-loglist time{color:#6b7d71;font-size:12px;white-space:nowrap}
  .tk7l-loglist .who{font-weight:600}
  .tk7l-loglist .src{font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:999px;background:#06c755;color:#fff;margin-left:6px;vertical-align:1px}
  .tk7l-loglist .src.web{background:#5b7bd5}
  #tk7-line-card .tk7l-more{font:inherit;font-size:13px;margin:8px 0 0;padding:6px 14px;border-radius:999px;border:1px solid rgba(31,122,67,.35);background:#fff;color:#1f4d30;cursor:pointer;min-height:0;box-shadow:none}
  .tk7l-loglist .what{grid-column:2;color:#3d5545;word-break:break-word}
  #tk7-line-card .tk7l-chip{font-size:13px!important;padding:6px 6px!important;min-width:0!important;height:auto!important;border-radius:999px!important;cursor:pointer;box-shadow:none!important;transform:none!important}
  #tk7-line-card .tk7l-chip.off{opacity:.35;filter:grayscale(.6)}
  /* คอม: การ์ด LINE อยู่ล่างสุดของคอลัมน์ขวา (ใต้รูปแบบตาราง + นัดเปิดสนาม) */
  /* คอม: การ์ด LINE กว้างเต็มหน้า ใต้สองคอลัมน์ */
  #setup-content-wrapper > #tk7-line-card{grid-column:1 / -1 !important;margin:8px 0 0}
  #setup-content-wrapper > #tk7-line-card .tk7l-main{max-width:420px}
  #setup-content-wrapper > #tk7-line-card .tk7l-grid{grid-template-columns:2fr 1fr 1fr 1fr}
 `}));

 const card=el('div',{class:'card',id:'tk7-line-card'});
 const pill=el('span',{class:'tk7l-pill none',text:'—'});
 const summary=el('p',{class:'tk7l-sum'});
 const dateTabs=el('div',{class:'tk7l-dates'});
 const hint=el('p',{class:'tk7l-hint'});
 const main=el('button',{type:'button',class:'btn btn-primary tk7l-main'});
 const actions=el('div',{class:'tk7l-actions'});
 const status=el('p',{class:'tk7l-status',role:'status'});
 const groupBox=el('details');
 let shareWindow=null;
 function openCardShare(){
  const url=LIFF+'?share=1&quick=1&returnOrigin='+encodeURIComponent(location.origin);
  if(shareWindow&&!shareWindow.closed){shareWindow.focus();return;}
  shareWindow=window.open(url,'tk7-card-share','popup=yes,width=520,height=800');
  if(!shareWindow){window.location.assign(url);return;}
  say('เลือกกลุ่มในหน้าต่างแชร์ / Choose recipients in the share window');
 }
 window.addEventListener('message',event=>{
  const origins=[location.origin,'https://tk7-line-registration-odf.md-8887.chatgpt.site','https://tk7-line-registration-odf.joviallemur25.chatgpt.site'];
  if(shareWindow&&origins.includes(event.origin)&&event.source===shareWindow&&event.data?.type==='tk7-card-shared'){
   say('แชร์การ์ดแล้ว / Card shared');shareWindow=null;
  }
 });
 const share=el('div',{class:'tk7l-sharebar'},
  el('div',{},el('strong',{text:'ชวนเพื่อนลงสนาม / Invite your team'}),el('p',{text:'การ์ดสองภาษา ไม่ระบุวัน · แชร์เข้ากลุ่มที่คุณเลือก'})),
  el('button',{type:'button',class:'tk7l-sharecta',text:'↗ แชร์การ์ด / Share card',onclick:openCardShare}),
  el('button',{type:'button',class:'tk7l-copylink',text:'คัดลอกลิงก์ / Copy link',onclick:async()=>{try{await navigator.clipboard.writeText(LIFF);say('คัดลอกลิงก์ลงชื่อแล้ว / Link copied')}catch{say('ลิงก์ลงชื่อ: '+LIFF)}}}));
 const logBox=el('details',{class:'tk7l-log'});
 card.append(el('h2',{},el('span',{text:'⚽ ลงชื่อเตะบอล / Registration'}),pill),dateTabs,summary,hint,share,main,actions,status,logBox,groupBox);
 // มือถือ: ใต้ช่องวันที่/เวลา · คอม: กว้างเต็มหน้า ใต้สองคอลัมน์ (เหนือปุ่มบันทึกตาราง)
 const wide=matchMedia('(min-width: 768px), (orientation: landscape)');
 // การ์ด LINE อยู่ล่างสุดของหน้าจัดการทีม (ใต้ปุ่มบันทึก/แชร์) ทั้งมือถือและคอม
 function place(){
  const last=$('copy-reg-template-btn')||$('generate-schedule-btn');
  if(last)last.after(card);else document.querySelector('.setup-settings-card')?.after(card);
 }
 place();wide.addEventListener?.('change',place);

 let autoDated=false;
 let data=null,loading=false,lastSig='',syncTimer=null,pulledFor='',presetTimer=null,applying=false;
 const date=()=>$('match-date')?.value||'';
 const minutes=()=>parseInt($('time-per-match')?.value,10)||8;
 const startTime=()=>$('start-time')?.value||'20:00';
 const say=(t,err)=>{status.textContent=t||'';status.classList.toggle('err',!!err)};
 const thai=d=>new Date(d+'T00:00:00').toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short'});
 const errText=e=>({'Choose a LINE group first':'ยังไม่ได้ติดตั้งการตั้งค่าระบบลงชื่อ','Target group already has one of these dates':'กลุ่มปลายทางมีวันเดียวกันอยู่แล้ว','Admin required':'ต้องเป็นผู้ดูแลที่อนุมัติแล้ว'}[e?.message]||e?.message||String(e));
 async function rpc(name,args){const {data:d,error}=await db.rpc(name,args);if(error)throw error;return d}
 const cfg=()=>data?.settings||{};
 const session=()=>(data?.sessions||[]).find(s=>s.match_date===date()&&s.group_id===cfg().group_id&&s.environment===cfg().environment);
 const entriesOf=s=>s?.roster?.entries||[];
 const playersOf=(s,t)=>entriesOf(s).filter(e=>e.team===t).sort((a,b)=>a.slot-b.slot);
 const presetOf=s=>s?.preset_teams||[];
 const checkedTeams=()=>[...document.querySelectorAll('.team-switch:checked')].map(x=>x.dataset.teamSlug);

 async function load(){
  if(!canManage()){card.style.display='none';return}
  card.style.display='';
  if(loading)return;loading=true;
  try{data=await rpc('tk7_admin_overview');if(pickLatestOpenDate())return;render()}
  catch(e){say('โหลดข้อมูลลงชื่อไม่สำเร็จ: '+errText(e),true)}
  finally{loading=false}
 }

 // หลายวันเปิดรับ: ปุ่มสลับวัน
 function renderDateTabs(){
  const c=cfg();dateTabs.replaceChildren();
  const list=(data?.sessions||[]).filter(x=>x.is_open&&x.group_id===c.group_id&&x.environment===c.environment).sort((a,b)=>a.match_date.localeCompare(b.match_date));
  if(list.length<2&&!(list.length===1&&list[0].match_date!==date())){dateTabs.hidden=true;return}
  dateTabs.hidden=false;
  dateTabs.append(el('span',{class:'tk7l-hint',text:'วันที่เปิดรับ:'}));
  for(const x of list){const on=x.match_date===date();
   dateTabs.append(el('button',{type:'button',class:'tk7l-dtab'+(on?' on':''),'aria-pressed':String(on),text:thai(x.match_date)+' · '+entriesOf(x).length+' คน',
    onclick:()=>{const i=$('match-date');if(!i||on)return;i.value=x.match_date;i.dispatchEvent(new Event('change',{bubbles:true}))}}))}
 }

 // ครั้งแรกที่โหลด: ตั้งวันที่แข่งเป็นวันล่าสุดที่เปิดรับลงชื่อ
 function pickLatestOpenDate(){
  if(autoDated)return false;autoDated=true;
  const c=cfg();
  const today=new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
  const open=(data?.sessions||[]).filter(s=>s.is_open&&s.group_id===c.group_id&&s.environment===c.environment&&s.match_date>=today).map(s=>s.match_date).sort();
  const next=open[0];const input=$('match-date');
  if(!next||!input||input.value===next)return false;
  input.value=next;input.dispatchEvent(new Event('change',{bubbles:true}));
  say('เลือกวันที่ '+thai(next)+' ให้แล้ว (วันเปิดรับที่ใกล้ที่สุด)');
  return true;
 }

 // ---------- render ----------
 function render(){
  const s=session();const c=cfg();
  actions.replaceChildren();card.querySelector('.tk7l-colorbox')?.remove();main.hidden=false;
  if(!c.group_id){
   pill.className='tk7l-pill none';pill.textContent='รอตั้งค่า';
   summary.textContent='';hint.textContent='ยังไม่ได้ตั้งค่าระบบลงชื่อ กรุณาติดต่อผู้ดูแล';main.hidden=true;
  }else if(!date()){
   pill.className='tk7l-pill none';pill.textContent='—';summary.textContent='';hint.textContent='เลือกวันที่แข่งขันด้านบน';main.hidden=true;
  }else if(!s){
   pill.className='tk7l-pill none';pill.textContent='ยังไม่เปิด';
   summary.replaceChildren(el('b',{text:thai(date())}),' · เริ่ม '+startTime()+' · '+minutes()+' นาที/แมตช์');
   hint.textContent='เลือกวันและเวลา แล้วเปิดรับลงชื่อ · แชร์การ์ดเดียวให้ผู้เล่นเลือกวันและทีมในหน้าเว็บ';
   main.textContent='＋ เปิดรับลงชื่อ / Open registration';
   main.onclick=()=>act(main,async()=>{const sid=await rpc('tk7_admin_open_session',{p_date:date(),p_time_per_match:minutes(),p_start_time:startTime(),p_open:true});await rpc('tk7_admin_set_preset',{p_session:sid,p_teams:checkedTeams()});await logWeb(sid,'open','เปิดรับลงชื่อ · เริ่ม '+startTime()+' · '+minutes()+' นาที/แมตช์');return 'เปิดรับลงชื่อแล้ว · แชร์การ์ดหรือลิงก์ให้ผู้เล่นได้เลย'});
  }else{
   const teams=ORDER.filter(t=>playersOf(s,t).length||presetOf(s).includes(t));const total=entriesOf(s).length;
   pill.className='tk7l-pill'+(s.is_open?'':' off');pill.textContent=s.is_open?'🟢 เปิดรับ':'🔒 ปิดรับแล้ว';
   summary.replaceChildren(el('b',{text:thai(date())}),' · เริ่ม '+String(s.start_time).slice(0,5)+' · '+s.time_per_match+' นาที/แมตช์',el('br'),
    el('b',{text:teams.length+' ทีม · '+total+' คน'}),teams.length?' ('+teams.map(t=>COLORS[t]+' '+playersOf(s,t).length).join(', ')+')':'');
   hint.textContent='จัดการวัน เวลา และสีทีมที่นี่ · ผู้เล่นดูข้อมูลล่าสุดในหน้าลงชื่อ · แชร์การ์ดเข้ากลุ่มด้วยตัวเอง';
   main.hidden=true;
   const toggle=el('button',{type:'button',class:'btn btn-secondary',text:s.is_open?'🔒 ปิดรับลงชื่อ':'🔓 เปิดรับอีกครั้ง'});
   toggle.onclick=()=>act(toggle,async()=>{await rpc('tk7_admin_set_open',{p_session:s.id,p_open:!s.is_open});await logWeb(s.id,s.is_open?'close':'reopen',s.is_open?'ปิดรับลงชื่อ':'เปิดรับลงชื่ออีกครั้ง');return s.is_open?'ปิดรับแล้ว (รายชื่อยังอยู่)':'เปิดรับอีกครั้งแล้ว'});
   const clear=el('button',{type:'button',class:'btn tk7l-danger',text:'🗑 ล้างรายชื่อ',disabled:total?null:true});
   clear.onclick=()=>{if(!confirm('ล้างรายชื่อทั้งหมด '+total+' คน ของวันที่ '+thai(date())+' ?\n(ลบแล้วกู้คืนไม่ได้)'))return;
    act(clear,async()=>{const n=await rpc('tk7_admin_clear_session',{p_session:s.id});await logWeb(s.id,'clear','ล้างรายชื่อ '+n+' คน');lastSig='';return 'ล้างรายชื่อแล้ว '+n+' คน'})};
   const del=el('button',{type:'button',class:'btn tk7l-danger',text:'🗓 ลบวันลงทะเบียน'});
   del.onclick=()=>{if(!confirm('ลบวันลงทะเบียน '+thai(date())+' ?\nรายชื่อทั้งหมดของวันนี้จะหายและกู้คืนไม่ได้'))return;
    act(del,async()=>{await rpc('tk7_admin_delete_session',{p_session:s.id});lastSig='';return 'ลบวันลงทะเบียน '+thai(date())+' แล้ว'})};
   actions.append(toggle,clear,del);

  }
  renderDateTabs();renderTeams(s);renderLog(s);renderGroup();pullFormFrom(s);
 }

 // รายการทีมด้านซ้าย: แสดงคนจาก LINE + เปลี่ยนสี + ติ๊กอัตโนมัติ
 function renderTeams(s){
  const switches=[...document.querySelectorAll('.team-switch')];
  for(const sw of switches){
   const slug=sw.dataset.teamSlug;const row=sw.closest('.team-toggle');if(!row)continue;
   row.querySelector('.tk7l-info')?.remove();row.querySelector('.tk7l-count')?.remove();row.classList.remove('tk7l-has');
   const emblem=row.querySelector('.team-emblem');
   if(emblem){emblem.classList.remove('tk7l-tap');emblem.onclick=null;emblem.removeAttribute('role');emblem.removeAttribute('tabindex')}
   if(!s)continue;
   const players=playersOf(s,slug);
   if(players.length){
    row.classList.add('tk7l-has');
    row.append(el('span',{class:'tk7l-count'+(players.length>=7?' full':''),title:players.map(p=>p.name).join(', '),text:'👥 '+players.length+'/7'}));
   }
   if(emblem){
    emblem.classList.add('tk7l-tap');emblem.setAttribute('role','button');emblem.setAttribute('tabindex','0');emblem.title='ดูรายชื่อ / เปลี่ยนสีทีม';
    emblem.onclick=e=>{e.stopPropagation();openTeam(slug)};
    emblem.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openTeam(slug)}};
   }
  }
  // ติ๊กอัตโนมัติเมื่อสีที่มีคนลงเปลี่ยน
  if(!s)return;
  const used=ORDER.filter(t=>playersOf(s,t).length);
  const firstForDate=!lastSig.startsWith(s.id+':');
  const sig=s.id+':'+used.join(',')+'|'+presetOf(s).join(',');
  if(sig===lastSig)return;
  lastSig=sig;
  // ครั้งแรกของวัน: สวิตช์ = สีที่เปิดไว้ + สีที่มีคน · ครั้งต่อไป: เพิ่มเฉพาะสีที่มีคนลงใหม่ (ไม่ปิดของเดิม)
  const want=firstForDate&&presetOf(s).length?new Set([...presetOf(s),...used]):null;
  applying=true;
  for(const sw of switches){const t=sw.dataset.teamSlug;const on=want?want.has(t):(sw.checked||used.includes(t));if(sw.checked!==on){sw.checked=on;sw.dispatchEvent(new Event('change',{bubbles:true}))}}
  applying=false;
 }

 // ป็อปอัพทีม: รายชื่อ (ชื่อละบรรทัด) + เปลี่ยนสีทั้งทีม
 const modal=el('div',{class:'tk7l-modal',role:'dialog','aria-modal':'true',hidden:true});
 modal.onclick=e=>{if(e.target===modal)closeTeam()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeTeam()});
 document.body.append(modal);
 function closeTeam(){modal.hidden=true;modal.replaceChildren()}
 function openTeam(slug){
  const s=session();if(!s)return;
  const players=playersOf(s,slug);
  const box=el('div',{class:'tk7l-sheet'});
  box.append(el('div',{class:'tk7l-sheet-head team-emblem '+slug},el('strong',{text:'ทีม'+COLORS[slug]}),el('span',{class:'tk7l-count',text:players.length+'/7'}),
   el('button',{type:'button',class:'tk7l-x','aria-label':'ปิด',text:'✕',onclick:closeTeam})));
  const body=el('div',{class:'tk7l-sheet-body'});
  if(players.length){
   const ol=el('ol',{class:'tk7l-names'});for(const p of players)ol.append(el('li',{},el('span',{class:'n',text:p.slot+'.'}),el('span',{text:p.name})));
   body.append(ol);
   body.append(el('div',{class:'tk7l-sub',text:'🎨 เปลี่ยนสีทั้งทีม (สีที่มีคนอยู่ = สลับกัน)'}));
   const grid=el('div',{class:'tk7l-colorgrid'});
   for(const t of ORDER){if(t===slug)continue;const n=playersOf(s,t).length;
    grid.append(el('button',{type:'button',class:'team-emblem '+t,onclick:()=>{closeTeam();recolor(s,slug,t)}},el('span',{text:COLORS[t]}),el('small',{text:n?'⇄ '+n+' คน':'ว่าง'})))}
   body.append(grid);
  }else body.append(el('p',{class:'tk7l-empty',text:'ยังไม่มีคนลงสีนี้'}));
  box.append(body);modal.replaceChildren(box);modal.hidden=false;
 }

 async function recolor(s,from,to){
  const nTo=playersOf(s,to).length;
  if(!confirm((nTo?'สลับสี '+COLORS[from]+' ⇄ '+COLORS[to]:'เปลี่ยนทีม'+COLORS[from]+' ทั้งหมดเป็นสี'+COLORS[to])+' ?'))return;
  say('กำลังเปลี่ยนสี…');
  try{
   await rpc('tk7_admin_recolor',{p_session:s.id,p_from:from,p_to:to});await logWeb(s.id,'recolor','ทีมสี'+COLORS[from]+(nTo?' ⇄ ':' → ')+'สี'+COLORS[to]);
   const sched=await swapScheduleColors(s.match_date,from,to);
   lastSig='';await load();
   say('เปลี่ยนสีแล้ว: '+COLORS[from]+(nTo?' ⇄ ':' → ')+COLORS[to]+(sched?' · อัปเดตตารางแข่งที่บันทึกไว้ด้วย':''));
  }catch(e){say(errText(e),true)}
 }
 // ตารางแข่งที่บันทึกแล้ว (match_days): สลับสีให้ตรงกัน
 async function swapScheduleColors(matchDate,a,b){
  const {data:row,error}=await db.from('match_days').select('*').eq('match_date',matchDate).maybeSingle();
  if(error||!row)return false;
  const swap=v=>Array.isArray(v)?v.map(swap):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k===a?b:k===b?a:k,swap(x)])):v===a?b:v===b?a:v;
  const {error:e2}=await db.from('match_days').update({schedule:swap(row.schedule),settings:swap(row.settings)}).eq('match_date',matchDate);
  if(e2)throw e2;return true;
 }

 // ฟอร์ม ⇄ LINE
 function pullFormFrom(s){
  if(!s||pulledFor===s.id+date())return;
  pulledFor=s.id+date();
  const t=$('time-per-match'),st=$('start-time');
  if(t&&String(s.time_per_match)!==t.value)t.value=s.time_per_match;
  if(st&&String(s.start_time).slice(0,5)!==st.value)st.value=String(s.start_time).slice(0,5);
 }
 function pushFormSoon(){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(async()=>{
   const s=session();if(!s)return render();
   if(s.time_per_match===minutes()&&String(s.start_time).slice(0,5)===startTime())return;
   try{await rpc('tk7_admin_open_session',{p_date:date(),p_time_per_match:minutes(),p_start_time:startTime(),p_open:s.is_open});await logWeb(s.id,'time','เปลี่ยนเวลาเป็น '+startTime()+' · '+minutes()+' นาที/แมตช์');await load();say('อัปเดตเวลาในหน้าลงชื่อแล้ว: เริ่ม '+startTime()+' · '+minutes()+' นาที/แมตช์')}
   catch(e){say(errText(e),true)}
  },900);
 }

 function renderGroup(){
  groupBox.replaceChildren(el('summary',{text:'🔐 การเข้าใช้งาน / Access'}),
   el('p',{class:'tk7l-hint',style:'margin-top:10px',text:'ผู้ที่มีลิงก์และเข้าสู่ระบบ LINE ลงชื่อได้ ไม่ต้องเพิ่มเพื่อน OA หรือเชิญบอทเข้ากลุ่ม · ผู้ดูแลเปิด–ปิดวันได้เหมือนเดิม'}),
   el('p',{class:'tk7l-hint',text:'ประวัติยังแสดงชื่อผู้แก้ไข วันเวลา และรายละเอียด · ไม่มีการส่งข้อความเข้ากลุ่มอัตโนมัติ'}));
 }

 const logWeb=(sid,action,detail)=>rpc('tk7_admin_log',{p_session:sid,p_action:action,p_detail:detail}).catch(()=>{});
 function logItem(r){
  const t=new Date(r.created_at);
  return el('li',{},el('time',{text:t.toLocaleDateString('th-TH',{day:'numeric',month:'short'})+' '+t.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}),
   el('span',{},el('span',{class:'who',text:r.actor_name||'-'}),el('span',{class:'src'+(r.source==='web'?' web':''),text:r.source==='web'?'ผู้ดูแล':'LINE Login'})),
   el('span',{class:'what',text:r.detail||r.action}));
 }
 function renderLog(s){
  const open=logBox.open;logBox.replaceChildren();
  const rows=s?.log||[];logBox.hidden=!s;
  logBox.append(el('summary',{text:'🕘 แก้ไขล่าสุด (3 รายการ)'}));
  if(!rows.length){logBox.append(el('p',{class:'tk7l-hint',style:'margin-top:8px',text:'ยังไม่มีประวัติ'}));logBox.open=open;return}
  const ul=el('ul',{class:'tk7l-loglist'});
  for(const r of rows)ul.append(logItem(r));
  logBox.append(ul);
  const more=el('button',{type:'button',class:'tk7l-more',text:'ดูทั้งหมด'});
  more.onclick=async()=>{more.disabled=true;more.textContent='กำลังโหลด…';
   try{const all=await rpc('tk7_admin_session_log',{p_session:s.id});ul.replaceChildren(...(all||[]).map(logItem));more.remove();logBox.querySelector('summary').textContent='🕘 ประวัติทั้งหมด ('+(all||[]).length+' รายการ)'}
   catch(e){more.disabled=false;more.textContent='ดูทั้งหมด';say(errText(e),true)}};
  logBox.append(more);logBox.open=open;
 }

 async function act(btn,fn){
  btn.disabled=true;say('กำลังบันทึก…');
  try{const msg=await fn();await load();say(msg)}
  catch(e){say(errText(e),true);btn.disabled=false}
 }

 // events
 $('match-date')?.addEventListener('change',()=>{pulledFor='';lastSig='';setTimeout(()=>data?render():load(),1200)});
 $('time-per-match')?.addEventListener('input',pushFormSoon);
 $('time-per-match')?.addEventListener('change',pushFormSoon);
 $('start-time')?.addEventListener('change',pushFormSoon);
 document.querySelectorAll('#page-setup .num-stepper-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(pushFormSoon,0)));
 // สวิตช์สี → เปิดทีมไว้ล่วงหน้าใน LINE
 document.addEventListener('change',e=>{
  if(applying||!e.target?.classList?.contains('team-switch'))return;
  const sw=e.target;const s=session();if(!s)return;
  if(!sw.checked&&playersOf(s,sw.dataset.teamSlug).length){say('สี'+COLORS[sw.dataset.teamSlug]+' มีคนลงอยู่ — ยังแสดงในหน้าลงชื่อจนกว่าจะย้ายคนออก')}
  clearTimeout(presetTimer);
  presetTimer=setTimeout(async()=>{try{await rpc('tk7_admin_set_preset',{p_session:s.id,p_teams:checkedTeams()});await load();say('อัปเดตสีในหน้าลงชื่อแล้ว')}catch(err){say(errText(err),true)}},700);
 },true);
 new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))load()}).observe(card);
 const setupVisible=()=>!!$('page-setup')?.offsetParent;
 setInterval(()=>{if(!document.hidden&&setupVisible()&&!document.activeElement?.closest?.('#page-setup select'))load()},20000);
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>setupVisible()&&load(),200)));
 db.auth.onAuthStateChange?.(()=>setTimeout(load,1200));
}};

