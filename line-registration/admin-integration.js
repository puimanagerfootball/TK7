// Serialize refreshes and discard a read started before a confirmed change.
function createTK7OverviewLoader(read,apply,onError){
 let running=null,epoch=0;
 const refresh=async(fresh=false)=>{
  if(fresh)epoch++;
  while(running){if(!fresh)return running;await running;}
  const started=epoch;
  const job=Promise.resolve().then(read).then(value=>{if(started===epoch)apply(value);return true;},error=>{onError(error);return false;});
  running=job;
  try{return await job;}finally{if(running===job)running=null;}
 };
 refresh.invalidate=()=>{epoch++;};
 return refresh;
}
// TK7 admin: เชื่อมหน้าจัดการทีมกับการลงชื่อใน LINE
// - วันที่ / นาทีต่อแมตช์ / เวลาเริ่ม ในฟอร์ม = ค่าใน LINE (แก้ที่เดียว อัปเดตอัตโนมัติ)
// - รายการ "เลือกทีมที่เข้าร่วม" แสดงจำนวน/ชื่อคนจาก LINE และติ๊กทีมที่มีคนลงให้เอง
// - เปลี่ยนสีทั้งทีมได้ (ถ้าสีปลายทางมีคน = สลับกัน) และอัปเดตตารางแข่งที่บันทึกไว้ด้วย
window.TK7Admin={mount({db,canManage,getDisplayName=()=>''}){
 const COLORS={green:'เขียว',red:'แดง',white:'ขาว',blue:'ฟ้า',black:'ดำ',yellow:'เหลือง',pink:'ชมพู',orange:'ส้ม',navy:'น้ำเงิน',purple:'ม่วง'};
 const ORDER=Object.keys(COLORS);
 const $=id=>document.getElementById(id);
 const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k==='style')n.style.cssText=v;else if(k.startsWith('on'))n[k]=v;else if(v!=null&&v!==false)n.setAttribute(k,v===true?'':v)}for(const c of kids.flat())if(c!=null)n.append(c);return n};

 document.head.append(el('style',{text:`
  #tk7-line-card .tk7l-dates{display:flex;gap:10px;flex-wrap:nowrap;overflow-x:auto;padding:2px 2px 8px}
  #tk7-line-card .tk7l-dtab{min-width:150px;flex:0 0 auto;border-radius:14px!important;padding:14px 18px!important;text-align:left}
  #tk7-line-card .tk7l-dtab b{display:block;font-size:17px}
  #tk7-line-card .tk7l-dtab small{display:block;font-size:11px;opacity:.8;margin-top:5px}
  #tk7-line-card .tk7l-status:empty{display:none}

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
  .tk7l-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
  #tk7-line-card .tk7l-actions .btn,#tk7-line-card .tk7l-main{margin:0!important;width:100%;font-size:14px;min-height:44px;padding:10px 8px}
  #tk7-line-card .tk7l-register{background:#238947!important;color:#fff!important;box-shadow:0 4px 0 #146331!important}
  #tk7-line-card .tk7l-register:hover{background:#2a9951!important}
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
  .tk7l-sheet{background:#fff;border-radius:24px;width:min(700px,100%);max-height:90vh;overflow:auto;box-shadow:0 20px 50px rgba(0,0,0,.35);font-family:inherit}
  .tk7l-sheet-head{max-width:none!important;justify-content:flex-start!important;overflow:visible!important;display:flex!important;align-items:center;gap:10px;padding:14px 16px!important;border-radius:18px 18px 0 0!important;width:auto!important;height:auto!important;min-width:0!important;font-size:18px!important;cursor:default!important;box-shadow:none!important;transform:none!important}
  .tk7l-sheet-head strong{flex:1;text-align:left}
  .tk7l-sheet-head .tk7l-count{background:rgba(255,255,255,.9);color:#1f4d30;font-size:13px;padding:3px 10px;border-radius:999px;text-shadow:none}
  .tk7l-x{background:rgba(0,0,0,.18);color:inherit;border:0;width:32px;height:32px;border-radius:50%;font-size:15px;cursor:pointer;min-height:0;padding:0}
  .tk7l-sheet-body{padding:0 22px 24px;color:#1d2b22}
  .tk7l-roster-sheet{background:transparent;border-radius:16px;width:min(528px,100%)}.tk7l-roster-sheet:before{display:none!important}.tk7l-roster-sheet .tk7l-sheet-body{padding:0}.tk7l-selection-tools{padding:12px;background:#fff;border-radius:14px;margin-top:10px}.tk7l-selection-tools[hidden]{display:none}.tk7l-roster-sheet .tk7l-team-notice:not(:empty),.tk7l-roster-sheet details{background:#fff;padding:12px;border-radius:12px}.tk7l-roster-sheet .tk7l-colorgrid{padding:4px}
  .tk7l-joining{align-items:flex-end!important;padding:0!important}.tk7l-sheet.tk7l-join-sheet{position:relative;z-index:2;width:min(560px,100%);max-height:88dvh;border-radius:20px 20px 0 0;padding-bottom:calc(16px + env(safe-area-inset-bottom));box-shadow:none}.tk7l-sheet.tk7l-join-sheet:before{width:40px;height:4px;margin:8px auto 0;background:#cfd8d2}.tk7l-join-sheet .tk7l-join-head{padding:12px 18px;gap:10px}.tk7l-join-sheet .tk7l-shirt{width:42px;height:42px;border-radius:10px}.tk7l-join-sheet .tk7l-shirt svg{width:34px;height:34px}.tk7l-join-sheet .tk7l-join-heading strong{font-size:19px}.tk7l-join-sheet .tk7l-join-heading small{font-size:13px;margin-top:0}.tk7l-join-sheet .tk7l-x{display:none}.tk7l-join-sheet .tk7l-sheet-body{padding:4px 18px}.tk7l-join-sheet .tk7l-name-fields{gap:8px}.tk7l-join-sheet .tk7l-name-field{grid-template-columns:minmax(0,1fr) 44px;gap:8px}.tk7l-join-sheet .tk7l-name-field input{height:auto;min-height:48px;padding:11px 12px;border:1.5px solid #cfdad2;border-radius:10px;font-size:16px;background:#f8fbf9}.tk7l-join-sheet .tk7l-remove-field{height:auto;min-height:48px;border-radius:10px;font-size:18px;background:#eef3ef}.tk7l-join-sheet .tk7l-add-friend{padding:6px 0;font-size:16px;color:#1f7a43}.tk7l-join-sheet .tk7l-add{background:#1f7a43;font-size:17px;border-radius:12px;padding:13px;margin-top:10px;min-height:0}.tk7l-join-hint{font-size:12px;color:#5d6e63;margin:16px 0 0}.tk7l-cancel-join{width:100%;border:0;border-radius:12px;background:#eef3ef;color:#16241b;font:inherit;padding:12px;margin-top:8px;cursor:pointer}.tk7l-back-card{position:absolute;top:24px;left:50%;transform:translateX(-50%);width:min(528px,calc(100% - 32px));pointer-events:none}.tk7l-back-card .tk7l-sheet{max-height:none;width:100%;box-shadow:none}.tk7l-join-dim{position:absolute;inset:0;background:rgba(0,0,0,.45)}
  .tk7l-sheet:before{content:'';display:block;width:50px;height:5px;border-radius:6px;background:#d1dad5;margin:10px auto 0}
  .tk7l-join-head{display:flex;align-items:center;gap:12px;padding:18px 22px 22px;color:#192d21;text-align:left}.tk7l-shirt{display:grid;place-items:center;width:54px;height:54px;border-radius:13px;flex:none}.tk7l-shirt svg{width:40px;height:40px}.tk7l-join-heading{flex:1;min-width:0}.tk7l-join-heading strong{display:block;font-size:22px;line-height:1.3}.tk7l-join-heading small{display:block;color:#65796d;font-size:14px;margin-top:4px}.tk7l-join-head .tk7l-x{background:#eef4f0;color:#65796d}
  .tk7l-name-fields{display:grid;gap:9px}.tk7l-name-field{display:grid;grid-template-columns:minmax(0,1fr) 56px;gap:10px}.tk7l-name-field input{box-sizing:border-box;width:100%;min-width:0;height:60px;border:1px solid #ceddd3;border-radius:13px;background:#f7faf8;color:#1d2b22;padding:14px;font:inherit;font-size:18px}.tk7l-name-field input:focus{outline:2px solid #238947;outline-offset:1px}.tk7l-remove-field{height:60px;border:0;border-radius:13px;background:#edf3ef;color:#687c6f;font:inherit;font-size:23px;cursor:pointer}.tk7l-add-friend{display:block;border:0;background:transparent;color:#208342;font:inherit;font-size:18px;font-weight:600;padding:14px 3px;cursor:pointer}.tk7l-add-friend[hidden]{display:none}.tk7l-roster-heading{border-top:1px solid #e4ece7;margin-top:22px;padding-top:18px;font-weight:600}
  @media(max-width:600px){.tk7l-modal{align-items:flex-end;padding:8px}.tk7l-sheet{max-height:92dvh;border-radius:24px 24px 16px 16px}.tk7l-join-head{padding:18px 16px}.tk7l-sheet-body{padding:0 16px 20px}.tk7l-join-heading strong{font-size:21px}}
  .tk7l-names{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:2px}
  .tk7l-names li{display:flex;gap:10px;padding:8px 10px;background:#fff;border-radius:10px;font-size:15px}
  .tk7l-names .n{color:#6b7d71;min-width:20px}
  .tk7l-sub{font-weight:600;font-size:14px;margin:4px 0 8px}
  .tk7l-colorgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .tk7l-colorgrid .team-emblem{max-width:none!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;width:auto!important;min-width:0!important;height:auto!important;padding:10px 4px!important;font-size:14px!important;line-height:1.2;cursor:pointer;border:0}
  .tk7l-colorgrid small{font-size:11px;opacity:.85;font-weight:400}
  .tk7l-checklist{display:grid;gap:6px;margin:8px 0 12px}.tk7l-checkrow,.tk7l-select-all{display:flex;align-items:center;gap:10px;padding:10px;background:white;border-radius:10px;cursor:pointer;text-align:left}.tk7l-checkrow input,.tk7l-select-all input{width:20px;height:20px;accent-color:#238947;margin:0}.tk7l-edit-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.tk7l-edit-btn{font:inherit;font-weight:600;font-size:14px;padding:12px 8px;border:0;border-radius:10px;cursor:pointer;min-height:44px}.tk7l-edit-btn.primary{background:#238947;color:white}.tk7l-edit-btn.danger{background:#fdeaea;color:#b3261e}.tk7l-sheet :disabled{opacity:.5;cursor:default}.tk7l-sheet textarea,.tk7l-sheet select{box-sizing:border-box;width:100%;font:inherit;padding:10px;border:1px solid #c8dacc;border-radius:10px;background:#fff;color:#1d2b22}.tk7l-add{width:100%;margin-top:8px}.tk7l-team-notice{font-size:13px;white-space:pre-line}.tk7l-team-notice:empty{display:none}.tk7l-sheet .tk7l-sub{display:block;margin-top:14px}
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


 const dateTabs=el('div',{class:'tk7l-dates'});

 const main=el('button',{type:'button',class:'btn btn-primary tk7l-main'});
 const actions=el('div',{class:'tk7l-actions'});
 const status=el('p',{class:'tk7l-status',role:'status'});

 async function openCardShare(){
  const direct=window.TK7DirectShare;
  if(!direct?.configured){say('กำลังเตรียมแชร์ตรง กรุณารีเฟรชหน้า TK7 / Please refresh TK7 to load direct sharing.',true);return;}
  try{
   const result=await direct.share();
   say(result?.login?'เข้าสู่ระบบ LINE แล้วกดแชร์อีกครั้ง':result?.status==='success'?'แชร์ลงทะเบียนแล้ว':'ยกเลิกการแชร์');
  }catch(error){say(error?.message||'แชร์ไม่สำเร็จ กรุณาลองอีกครั้ง',true);}
 }
 const logBox=el('details',{class:'tk7l-log'});
 card.append(el('h2',{},el('span',{text:'⚽ ลงชื่อเตะบอล'})),dateTabs,actions,status,logBox);
 // มือถือ: ใต้ช่องวันที่/เวลา · คอม: กว้างเต็มหน้า ใต้สองคอลัมน์ (เหนือปุ่มบันทึกตาราง)
 const wide=matchMedia('(min-width: 768px), (orientation: landscape)');
 // การ์ด LINE อยู่ล่างสุดของหน้าจัดการทีม (ใต้ปุ่มบันทึก/แชร์) ทั้งมือถือและคอม
 function place(){
  const last=$('copy-reg-template-btn')||$('generate-schedule-btn');
  if(last)last.after(card);else document.querySelector('.setup-settings-card')?.after(card);
 }
 place();wide.addEventListener?.('change',place);

 let autoDated=false;
 let data=null,mutating=false,lastSig='',syncTimer=null,pulledFor='',presetTimer=null,applying=false;
 const date=()=>$('match-date')?.value||'';
 const minutes=()=>parseInt($('time-per-match')?.value,10)||8;
 const startTime=()=>$('start-time')?.value||'20:00';
 const say=(t,err)=>{status.textContent=t||'';status.classList.toggle('err',!!err)};
 const thai=d=>new Date(d+'T00:00:00').toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short'});
 const errText=e=>({'Choose a LINE group first':'ยังไม่ได้ติดตั้งการตั้งค่าระบบลงชื่อ','Target group already has one of these dates':'กลุ่มปลายทางมีวันเดียวกันอยู่แล้ว','Admin required':'ต้องเป็นผู้ดูแลที่อนุมัติแล้ว','Not enough seats':'สีปลายทางมีที่ว่างไม่พอ กรุณาเลือกสีอื่นหรือลดจำนวนคน','Registration closed':'ปิดรับลงทะเบียนแล้ว','Invalid names':'กรุณาตรวจสอบชื่อผู้เล่น','Player not found':'รายชื่อเปลี่ยนแล้ว กรุณาเปิดทีมใหม่','Roster changed; refresh first':'รายชื่อเปลี่ยนแล้ว กรุณาลองอีกครั้ง'}[e?.message]||e?.message||String(e));
 async function rpc(name,args){const {data:d,error}=await db.rpc(name,args);if(error)throw error;return d}
 const cfg=()=>data?.settings||{};
 const session=()=>(data?.sessions||[]).find(s=>s.match_date===date()&&s.group_id===cfg().group_id&&s.environment===cfg().environment);
 const entriesOf=s=>s?.roster?.entries||[];
 const playersOf=(s,t)=>entriesOf(s).filter(e=>e.team===t).sort((a,b)=>a.slot-b.slot);
 const presetOf=s=>s?.preset_teams||[];
 const checkedTeams=()=>[...document.querySelectorAll('.team-switch:checked')].map(x=>x.dataset.teamSlug);

 const refreshOverview=createTK7OverviewLoader(
  ()=>rpc('tk7_admin_overview'),
  next=>{if(!canManage())return;if(JSON.stringify(data)===JSON.stringify(next))return;data=next;pickLatestOpenDate();render();},
  error=>say('โหลดข้อมูลลงชื่อไม่สำเร็จ: '+errText(error),true)
 );
 async function load(fresh=false){
  if(!canManage()){card.style.display='none';return;}
  card.style.display='';
  if(mutating&&!fresh)return;
  return refreshOverview(fresh);
 }
 function removeDeletedSession(deleted){
  refreshOverview.invalidate();
  data={...data,sessions:(data?.sessions||[]).filter(row=>row.id!==deleted.id)};
  lastSig='';pulledFor='';
  if(date()===deleted.match_date){
   const c=cfg();const remaining=data.sessions.filter(row=>row.group_id===c.group_id&&row.environment===c.environment).sort((a,b)=>a.match_date.localeCompare(b.match_date));
   const today=new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
   const next=remaining.find(row=>row.match_date>=today)||remaining[remaining.length-1];
   const input=$('match-date');
   if(input){input.value=next?.match_date||'';input.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  render();
 }

 // หลายวันเปิดรับ: ปุ่มสลับวัน
 function renderDateTabs(){
  const c=cfg();dateTabs.replaceChildren();dateTabs.hidden=false;
  const list=(data?.sessions||[]).filter(x=>x.group_id===c.group_id&&x.environment===c.environment).sort((a,b)=>a.match_date.localeCompare(b.match_date));
  if(date()&&!list.some(x=>x.match_date===date()))list.push({match_date:date(),is_open:false,draft:true});
  list.sort((a,b)=>a.match_date.localeCompare(b.match_date));
  for(const x of list){const on=x.match_date===date();
   dateTabs.append(el('button',{type:'button',class:'tk7l-dtab'+(on?' on':''),'aria-pressed':String(on),
    onclick:()=>{const i=$('match-date');if(!i||on)return;i.value=x.match_date;i.dispatchEvent(new Event('change',{bubbles:true}))}},
    el('b',{text:thai(x.match_date)}),el('small',{text:x.draft?'ยังไม่เปิด':x.is_open?'เปิดรับลงทะเบียน':'ปิดลงทะเบียน'})));
  }
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

  return true;
 }

 // ---------- render ----------
 function render(){
  const s=session();const c=cfg();
  actions.replaceChildren();
  const share=el('button',{type:'button',class:'btn tk7l-register',text:'แชร์ลงทะเบียนผ่านระบบ',onclick:openCardShare});
  main.hidden=false;main.textContent=s?.is_open?'🔒 ปิดลงทะเบียน':'🔓 เปิดลงทะเบียน';
  main.disabled=!c.group_id||!date();
  main.onclick=()=>act(main,async()=>{
   if(!s){
    const sid=await rpc('tk7_admin_open_session',{p_date:date(),p_time_per_match:minutes(),p_start_time:startTime(),p_open:true});
    await rpc('tk7_admin_set_preset',{p_session:sid,p_teams:checkedTeams()});await logWeb(sid,'open','เปิดรับลงชื่อ');
    return 'เปิดลงทะเบียนแล้ว';
   }
   await rpc('tk7_admin_set_open',{p_session:s.id,p_open:!s.is_open});
   await logWeb(s.id,s.is_open?'close':'reopen',s.is_open?'ปิดรับลงชื่อ':'เปิดรับลงชื่ออีกครั้ง');
   return s.is_open?'ปิดลงทะเบียนแล้ว':'เปิดลงทะเบียนแล้ว';
  });
  const del=el('button',{type:'button',class:'btn tk7l-danger',text:'🗓 ลบวันลงทะเบียน',disabled:!s});
  del.onclick=()=>{
   if(!s||!confirm('ลบวันลงทะเบียน '+thai(date())+' ?\nรายชื่อและประวัติของวันนี้จะถูกลบและกู้คืนไม่ได้'))return;
   act(del,async()=>{await rpc('tk7_admin_delete_session',{p_session:s.id});removeDeletedSession(s);return 'ลบวันลงทะเบียนแล้ว'});
  };
  const summary=el('button',{type:'button',class:'btn tk7l-register',text:'📋 ส่งสรุปรายชื่อ',disabled:!s,onclick:openRosterSummary});
  actions.append(share,summary,main,del);
  renderDateTabs();renderTeams(s);renderLog(s);pullFormFrom(s);
 }

 // รายการทีมด้านซ้าย: แสดงคนจาก LINE + เปลี่ยนสี + ติ๊กอัตโนมัติ
 function renderTeams(s){
  const switches=[...document.querySelectorAll('.team-switch')];
  for(const sw of switches){
   const slug=sw.dataset.teamSlug;const row=sw.closest('.team-toggle');if(!row)continue;
   row.querySelector('.tk7l-info')?.remove();row.querySelector('.tk7l-count')?.remove();row.classList.remove('tk7l-has');
   const emblem=row.querySelector('.team-emblem');
   if(emblem){emblem.classList.remove('tk7l-tap');emblem.onclick=null;emblem.removeAttribute('role');emblem.removeAttribute('tabindex')}
   const players=playersOf(s,slug);
   if(players.length){
    row.classList.add('tk7l-has');
    row.append(el('span',{class:'tk7l-count'+(players.length>=7?' full':''),title:players.map(p=>p.name).join(', '),text:'👥 '+players.length+'/7'}));
   }
   if(emblem){
    emblem.classList.add('tk7l-tap');emblem.setAttribute('role','button');emblem.setAttribute('tabindex','0');emblem.title='ลงชื่อ / เลือกลบ / ย้ายสี';
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
 const summaryModal=el('div',{class:'tk7l-modal',role:'dialog','aria-modal':'true','aria-label':'สรุปรายชื่อจากระบบ',hidden:true});
 document.body.append(summaryModal);
 let summarySequence=0,summarySending=false,summaryTrigger=null;
 function closeRosterSummary(){if(summarySending)return;summarySequence++;summaryModal.hidden=true;summaryModal.replaceChildren();summaryTrigger?.focus?.()}
 window.TK7Backdrop.install(summaryModal,e=>e.target===summaryModal,closeRosterSummary);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!summaryModal.hidden)closeRosterSummary()});
 async function openRosterSummary(){
  if(!canManage()||summarySending)return;
  const chosen=session();if(!chosen)return;
  const sequence=++summarySequence;summaryTrigger=document.activeElement;
  const preview=el('textarea',{readonly:true,'aria-label':'ข้อความสรุปรายชื่อ',style:'min-height:280px;resize:vertical;font-size:15px;line-height:1.6'});
  const notice=el('p',{role:'status',text:'กำลังอ่านรายชื่อล่าสุด…'});
  const send=el('button',{type:'button',class:'btn btn-primary',text:'เลือกแชตหรือกลุ่ม LINE',disabled:true});
  const copy=el('button',{type:'button',class:'btn btn-secondary',text:'คัดลอกข้อความ',disabled:true});
  const refresh=el('button',{type:'button',class:'btn btn-secondary',text:'อัปเดตรายชื่อ',onclick:openRosterSummary});
  const close=el('button',{type:'button',class:'tk7l-x',text:'✕','aria-label':'ปิด',onclick:closeRosterSummary});
  summaryModal.replaceChildren(el('section',{class:'tk7l-sheet'},el('div',{class:'tk7l-sheet-head'},el('strong',{text:'📋 สรุปรายชื่อจากระบบ'}),close),el('div',{class:'tk7l-sheet-body'},preview,notice,send,copy,refresh)));
  summaryModal.hidden=false;
  try{
   if(!await load(true))throw Error('อ่านรายชื่อล่าสุดไม่สำเร็จ กรุณากดอัปเดตอีกครั้ง');
   if(sequence!==summarySequence)return;
   const latest=session();if(!canManage()||latest?.id!==chosen.id)throw Error('วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาปิดแล้วเปิดสรุปใหม่');
   const text=window.TK7RosterSummary.build(latest);preview.value=text;send.disabled=false;copy.disabled=false;
   notice.textContent='ตรวจรายชื่อก่อนส่ง · หากมีการแก้ไข ให้กดอัปเดตรายชื่อ';
   send.onclick=async()=>{
    if(summarySending||!canManage()||session()?.id!==chosen.id){notice.textContent='วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดสรุปใหม่';return;}
    summarySending=true;send.disabled=true;refresh.disabled=true;notice.textContent='กำลังเปิดหน้าเลือกผู้รับ…';
    try{
     const direct=window.TK7DirectShare;if(!direct?.configured)throw Error('LINE ยังไม่พร้อม กรุณาลองใหม่ หรือใช้ปุ่มคัดลอกข้อความ');
     // The picker is invoked in this click, without awaiting a data read first.
     const result=await direct.share([{type:'text',text}]);
     notice.textContent=result?.login?'เข้าสู่ระบบ LINE แล้วเปิดสรุปและกดส่งอีกครั้ง':result?.status==='success'?'ส่งสรุปรายชื่อแล้ว':'ยกเลิกการส่ง';
    }catch(error){notice.textContent=errText(error)}
    finally{summarySending=false;send.disabled=false;refresh.disabled=false;}
   };
   copy.onclick=async()=>{if(!canManage()||session()?.id!==chosen.id){notice.textContent='วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดสรุปใหม่';return;}try{await navigator.clipboard.writeText(text);notice.textContent='คัดลอกแล้ว เปิด LINE แล้ววางในแชตได้เลย'}catch{notice.textContent='คัดลอกไม่สำเร็จ เลือกข้อความด้านบนแล้วคัดลอกเองได้'}};
  }catch(error){if(sequence===summarySequence)notice.textContent=errText(error)}
 }

 let teamBusy=false,teamTrigger=null,teamBackdrop=null,activeJoinSlug=null;
 const modal=el('div',{class:'tk7l-modal',role:'dialog','aria-modal':'true',hidden:true});
 window.TK7Backdrop.install(modal,e=>e.target===modal||e.target.classList?.contains('tk7l-join-dim'),closeTeam);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeTeam()});
 document.body.append(modal);
 function closeTeam(){if(teamBusy)return;if(activeJoinSlug){const slug=activeJoinSlug;activeJoinSlug=null;openTeam(slug);return;}teamBackdrop=null;modal.hidden=true;modal.replaceChildren();teamTrigger?.focus?.()}
 function openTeam(slug,restore={}){
  if(!canManage()||teamBusy)return;
  if(modal.hidden)teamTrigger=document.activeElement;
  const s=session(),players=playersOf(s,slug),chosen=new Set((restore.selected||[]).filter(id=>players.some(p=>p.id===id)));
  const isJoin=restore.view==='join';
  if(isJoin)teamBackdrop=modal.querySelector('.tk7l-roster-sheet')?.cloneNode?.(true)||teamBackdrop;else teamBackdrop=null;
  if(isJoin&&teamBackdrop)for(const node of teamBackdrop.querySelectorAll('[id]'))node.removeAttribute('id');
  activeJoinSlug=isJoin?slug:null;
  modal.className='tk7l-modal'+(isJoin?' tk7l-joining':'');
  const box=el('div',{class:'tk7l-sheet'+(isJoin?' tk7l-join-sheet':s?' tk7l-roster-sheet':'')});
  const icon=el('span',{class:'tk7l-shirt',style:'background:'+({green:'#43a047',red:'#e53935',white:'#e8ece9',blue:'#1e88e5',black:'#212121',yellow:'#fdd835',pink:'#ec407a',orange:'#fb8c00',navy:'#1a237e',purple:'#8e24aa'}[slug])});
  icon.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="'+(['white','yellow'].includes(slug)?'#34483b':'#fff')+'" d="M11 4 4 8 7 14 10 12.5V28H22V12.5L25 14 28 8 21 4C20 6 18 7 16 7S12 6 11 4Z"/></svg>';
  if(isJoin||!s)box.append(el('div',{class:'tk7l-join-head'},icon,el('div',{class:'tk7l-join-heading'},el('strong',{id:'tk7-team-title',text:'ลงชื่อสี'+COLORS[slug]}),el('small',{text:'ว่าง '+(7-players.length)+' จาก 7 ที่'+(players.length?' · มี '+players.map(p=>p.name).join(', '):'')})),
   el('button',{type:'button',class:'tk7l-x','aria-label':'ปิด',text:'✕',onclick:closeTeam})));
  modal.setAttribute('aria-labelledby','tk7-team-title');
  const body=el('div',{class:'tk7l-sheet-body'}),notice=el('p',{class:'tk7l-team-notice',role:'status'});
  if(!s){
   body.append(el('p',{text:'เปิดลงทะเบียนของวันที่เลือกก่อน แล้วกดสีเพื่อเพิ่มรายชื่อ'}),el('button',{type:'button',class:'tk7l-edit-btn primary',text:'เปิดลงทะเบียน',disabled:!date(),onclick:()=>{closeTeam();main.click()}}));
   box.append(body);modal.replaceChildren(box);modal.hidden=false;return;
  }
  const enabled=s.is_open&&s.teams.includes(slug);
  const fields=[],rows=el('div',{class:'tk7l-name-fields'});
  const values=()=>fields.map(i=>i.value.trim()).filter(Boolean);
  const addFriend=el('button',{type:'button',class:'tk7l-add-friend',text:'＋ เพิ่มชื่อเพื่อน',disabled:!enabled});
  const join=el('button',{type:'button',class:'tk7l-edit-btn primary tk7l-add',text:'ยืนยันลงสี'+COLORS[slug],disabled:!enabled,onclick:()=>submit('add')});
  const syncNames=()=>{const count=values().length;join.textContent='ยืนยันลงสี'+COLORS[slug]+(count?' ('+count+' คน)':'');join.disabled=!enabled||!count;addFriend.hidden=fields.length>=7-players.length;};
  function addName(value=''){
   if(fields.length>=7-players.length)return;
   const input=el('input',{type:'text',maxlength:'40',placeholder:fields.length?'ชื่อเพื่อน':'ชื่อของคุณ',autocomplete:'off','aria-label':fields.length?'ชื่อเพื่อน':'ชื่อของคุณ',disabled:!enabled});input.value=value;input.oninput=syncNames;
   const row=el('div',{class:'tk7l-name-field'},input,el('button',{type:'button',class:'tk7l-remove-field','aria-label':'ลบช่องชื่อนี้',text:'✕',disabled:!enabled,onclick:()=>{row.remove();fields.splice(fields.indexOf(input),1);if(!fields.length)addName();syncNames()}}));
   fields.push(input);rows.append(row);syncNames();return input;
  }
  addFriend.onclick=()=>addName()?.focus();
  if(players.length<7){const draft=(restore.draft??(getDisplayName()||'')).split(/\r?\n/);for(const name of draft)addName(name);}

  let pending=null;
  const submit=async(action,extra={})=>{
   if(teamBusy||mutating)return;
   if(session()?.id!==s.id){notice.textContent='วันที่เลือกเปลี่ยนแล้ว กรุณาเปิดทีมใหม่';return;}
   const ids=[...chosen];
   if((action==='delete'||action==='move')&&!ids.length){notice.textContent='กรุณาติ๊กชื่อที่ต้องการก่อน';return;}
   const added=values();
   if(action==='add'&&(!added.length||added.length>7||added.some(n=>n.length>40))){notice.textContent='ใส่ 1–7 ชื่อ ชื่อละไม่เกิน 40 ตัวอักษร';return;}
   if(action==='clear'&&!confirm('ลบรายชื่อทีม'+COLORS[slug]+'ทั้งหมด '+players.length+' คน?'))return;
   if(action==='delete'&&!confirm('ลบรายชื่อที่เลือก '+ids.length+' คน?'))return;
   const input={p_session:s.id,p_revision:s.revision,p_action:action,p_team:slug,p_entries:['delete','move'].includes(action)?ids:null,p_names:action==='add'?added:null,p_target:extra.target||null};
   const key=JSON.stringify(input);if(!pending||pending.key!==key)pending={key,args:{...input,p_request:crypto.randomUUID()}};
   teamBusy=true;mutating=true;refreshOverview.invalidate();notice.textContent='กำลังบันทึก…';
   const controls=[...box.querySelectorAll('button,input,textarea,select')];const disabled=controls.map(n=>n.disabled);controls.forEach(n=>n.disabled=true);
   try{
    await rpc('tk7_admin_roster_edit',pending.args);pending=null;
    const refreshed=await load(true);
    teamBusy=false;
    if(refreshed===false){notice.textContent='บันทึกแล้ว แต่โหลดรายชื่อล่าสุดไม่ได้ กรุณาปิดแล้วเปิดทีมใหม่';return;}
    if(session()?.id===s.id){openTeam(slug);const msg=modal.querySelector('[role="status"]');if(msg)msg.textContent='บันทึกแล้ว ✓';}
    else closeTeam();
    say('อัปเดตรายชื่อทีม'+COLORS[slug]+'แล้ว');
   }catch(error){
    notice.textContent=errText(error);
    if(error.message==='Roster changed; refresh first'){
     pending=null;await load(true);teamBusy=false;
     if(session()?.id===s.id){openTeam(slug,{draft:fields.map(i=>i.value).join('\n'),selected:ids,view:isJoin?'join':undefined});modal.querySelector('[role="status"]').textContent='รายชื่อเปลี่ยนแล้ว ตรวจรายการล่าสุดแล้วลองอีกครั้ง';}else closeTeam();
    }
   }finally{teamBusy=false;mutating=false;controls.forEach((n,i)=>n.disabled=disabled[i])}
  };
  if(!enabled)body.append(el('p',{class:'tk7l-empty',text:'ปิดรับลงทะเบียนแล้ว เปิดลงทะเบียนก่อนแก้รายชื่อ'}));
  if(isJoin&&players.length<7)body.append(rows,addFriend,el('p',{class:'tk7l-join-hint',text:'ใช้ชื่อเล่นได้ · แจ้งและขออนุญาตเพื่อนก่อนลงชื่อ · รายชื่อเก็บ 30 วันหลังแข่ง'}),join,el('button',{type:'button',class:'tk7l-cancel-join',text:'ยกเลิก',onclick:closeTeam}));
  const cardView=el('div',{class:'tk7-team-card'}),plist=el('div',{class:'plist'});
  const shirt=el('span',{class:'shirt'});shirt.innerHTML=icon.innerHTML;
  let colorDetails=null;
  const fold=el('span',{class:'fold','aria-hidden':'true',text:'▴'});
  const band=el('div',{class:'band c-'+slug,role:'button',tabindex:'0','aria-expanded':'true'},shirt,el('span',{class:'name',id:isJoin?'tk7-roster-title':'tk7-team-title',text:COLORS[slug]}),el('span',{class:'count',text:players.length+'/7'}),
   el('button',{type:'button',class:'recolor-btn',disabled:!enabled,text:'🎨 เปลี่ยนสี',onclick:e=>{e.stopPropagation();if(colorDetails){colorDetails.hidden=false;colorDetails.open=true;colorDetails.scrollIntoView?.({block:'nearest'})}}}),fold);
  const toggle=()=>{plist.hidden=!plist.hidden;fold.textContent=plist.hidden?'▾':'▴';band.setAttribute('aria-expanded',String(!plist.hidden));};band.onclick=toggle;band.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
  cardView.append(band,plist);
  const management=el('div',{class:'tk7l-selection-tools',hidden:chosen.size===0});
  const chooseJoin=()=>openTeam(slug,{view:'join',selected:[...chosen]});
  const cta=el('button',{type:'button',class:'cta',text:!enabled?'ปิดรับแล้ว':players.length>=7?'เต็มแล้ว ✓':'＋ ลงสีนี้ (ว่าง '+(7-players.length)+')',disabled:!enabled||players.length>=7,onclick:chooseJoin});
  cardView.append(cta);
  if(!isJoin)body.append(cardView);

  if(players.length){

   const all=el('input',{type:'checkbox','aria-label':'เลือกทุกชื่อในทีม',disabled:!enabled});
   const label=el('span',{text:'เลือกทั้งหมด'});
   management.append(el('label',{class:'tk7l-select-all'},all,label));
   const list=el('div',{class:'tk7l-checklist'}),checks=[];
   const sync=()=>{management.hidden=chosen.size===0;all.checked=chosen.size===players.length;all.indeterminate=chosen.size>0&&chosen.size<players.length;label.textContent='เลือกทั้งหมด · '+chosen.size+' คน';del.disabled=!enabled||!chosen.size;move.disabled=!enabled||!chosen.size;};
   for(let slot=1;slot<=7;slot++){
    const p=players.find(p=>p.slot===slot);
    if(!p){plist.append(el('button',{type:'button',class:'prow empty',disabled:!enabled,onclick:chooseJoin},el('span',{class:'box'}),el('span',{class:'num',text:slot+'.'}),el('span',{class:'pname',text:'ว่าง'})));continue;}
    const check=el('input',{type:'checkbox',class:'box','aria-label':'เลือก '+p.name,disabled:!enabled});check.checked=chosen.has(p.id);check.onchange=()=>{check.checked?chosen.add(p.id):chosen.delete(p.id);sync()};checks.push(check);
    plist.append(el('label',{class:'prow'},check,el('span',{class:'num',text:p.slot+'.'}),el('span',{class:'pname',text:p.name})));
   }
   all.onchange=()=>{checks.forEach((c,i)=>{c.checked=all.checked;c.checked?chosen.add(players[i].id):chosen.delete(players[i].id)});sync()};

   const del=el('button',{type:'button',class:'tk7l-edit-btn danger',text:'ลบชื่อที่เลือก',onclick:()=>submit('delete')});
   const clear=el('button',{type:'button',class:'tk7l-edit-btn danger',text:'ลบหมดในทีมนี้',disabled:!enabled,onclick:()=>submit('clear')});
   management.append(el('div',{class:'tk7l-edit-actions'},del,clear));
   const target=el('select',{'aria-label':'สีปลายทาง',disabled:!enabled});
   for(const t of ORDER){if(t!==slug&&s.teams.includes(t))target.append(el('option',{value:t,text:'ทีม'+COLORS[t]+' · ว่าง '+(7-playersOf(s,t).length)}));}
   const move=el('button',{type:'button',class:'tk7l-edit-btn primary',text:'ย้ายชื่อที่เลือก',onclick:()=>submit('move',{target:target.value})});
   management.append(el('div',{class:'tk7l-edit-actions'},target,move));sync();
  }
  if(!players.length){for(let slot=1;slot<=7;slot++)plist.append(el('button',{type:'button',class:'prow empty',disabled:!enabled,onclick:chooseJoin},el('span',{class:'box'}),el('span',{class:'num',text:slot+'.'}),el('span',{class:'pname',text:'ว่าง'})));}

  if(!isJoin)body.append(management);
  body.append(notice);
  {
   const details=el('details',{},el('summary',{class:'tk7l-sub',text:'เปลี่ยนสีทั้งทีม / สลับทีม'}));
   const grid=el('div',{class:'tk7l-colorgrid'});
   for(const t of ORDER){if(t===slug)continue;const n=playersOf(s,t).length;
    grid.append(el('button',{type:'button',class:'team-emblem '+t,disabled:!enabled,onclick:()=>{closeTeam();recolor(s,slug,t)}},el('span',{text:COLORS[t]}),el('small',{text:n?'⇄ '+n+' คน':'ว่าง'})))}
   colorDetails=details;details.hidden=true;details.append(grid);body.append(details);
  }
  box.append(body);
  if(isJoin&&teamBackdrop)modal.replaceChildren(el('div',{class:'tk7l-back-card','aria-hidden':'true',inert:true},teamBackdrop),el('div',{class:'tk7l-join-dim'}),box);else modal.replaceChildren(box);
  modal.hidden=false;
  box.querySelector('input:not(:disabled),textarea:not(:disabled),button')?.focus();
 }

 async function recolor(s,from,to){
  const nTo=playersOf(s,to).length;
  if(!confirm((nTo?'สลับสี '+COLORS[from]+' ⇄ '+COLORS[to]:'เปลี่ยนทีม'+COLORS[from]+' ทั้งหมดเป็นสี'+COLORS[to])+' ?'))return;
  say('กำลังเปลี่ยนสี…');
  try{
   await rpc('tk7_admin_recolor',{p_session:s.id,p_from:from,p_to:to});await logWeb(s.id,'recolor','ทีมสี'+COLORS[from]+(nTo?' ⇄ ':' → ')+'สี'+COLORS[to]);
   const sched=await swapScheduleColors(s.match_date,from,to);
   lastSig='';await load(true);
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
   try{await rpc('tk7_admin_open_session',{p_date:date(),p_time_per_match:minutes(),p_start_time:startTime(),p_open:s.is_open});await logWeb(s.id,'time','เปลี่ยนเวลาเป็น '+startTime()+' · '+minutes()+' นาที/แมตช์');await load(true);say('อัปเดตเวลาในหน้าลงชื่อแล้ว: เริ่ม '+startTime()+' · '+minutes()+' นาที/แมตช์')}
   catch(e){say(errText(e),true)}
  },900);
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
  const rows=s?.log||[];logBox.hidden=false;
  logBox.append(el('summary',{text:'🕘 ประวัติการแก้ไข'}));
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
  btn.disabled=true;mutating=true;refreshOverview.invalidate();say('กำลังบันทึก…');
  try{const msg=await fn();const refreshed=await load(true);if(refreshed!==false)say(msg)}
  catch(e){say(errText(e),true);btn.disabled=false}
  finally{mutating=false;if(btn===main)btn.disabled=!cfg().group_id||!date();else if(btn.isConnected)btn.disabled=false;}
 }

 // events
 $('match-date')?.addEventListener('change',()=>{
  clearTimeout(syncTimer);clearTimeout(presetTimer);autoDated=true;pulledFor='';lastSig='';
  if(data)render();else load();
 });
 document.addEventListener('tk7:setup-date-ready',event=>{
  if(event.detail?.date!==date())return;
  pulledFor='';lastSig='';if(data)render();
 });
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
  presetTimer=setTimeout(async()=>{try{await rpc('tk7_admin_set_preset',{p_session:s.id,p_teams:checkedTeams()});await load(true);say('อัปเดตสีในหน้าลงชื่อแล้ว')}catch(err){say(errText(err),true)}},700);
 },true);
 new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))load()}).observe(card);
 const setupVisible=()=>!!$('page-setup')?.offsetParent;
 setInterval(()=>{if(!document.hidden&&setupVisible()&&!document.activeElement?.closest?.('#page-setup select'))load()},20000);
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>setupVisible()&&load(),200)));
 db.auth.onAuthStateChange?.(()=>setTimeout(()=>{if(!canManage())closeRosterSummary();load()},1200));
}};

