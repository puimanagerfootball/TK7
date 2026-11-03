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
  #tk7-line-card{display:flex;flex-direction:column;gap:12px;text-align:left}
  #tk7-line-card h2{margin:0;display:flex;align-items:center;justify-content:space-between;gap:8px}
  .tk7l-pill{font-size:13px;font-weight:600;padding:4px 12px;border-radius:999px;background:#dff3e4;color:#1f6b3a;white-space:nowrap}
  .tk7l-pill.off{background:#fff0d4;color:#7a5200}
  .tk7l-pill.none{background:#eceff1;color:#546e7a}
  .tk7l-sum{font-size:15px;line-height:1.6;margin:0;color:#2d4a37}
  .tk7l-sum b{font-weight:600}
  .tk7l-hint{font-size:13px;line-height:1.6;margin:0;color:#5f7466}
  .tk7l-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
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
  /* ข้อมูล LINE ในรายการทีม */
  #page-setup .team-toggle{gap:10px}
  .tk7l-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;font-size:12.5px;line-height:1.35;color:#3d5545}
  .tk7l-info .cnt{font-weight:600;font-size:13px;color:#1f4d30}
  .tk7l-info .cnt.full{color:#1b7a3a}
  .tk7l-info .names{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#5f7466}
  .tk7l-recolor{font:inherit;font-size:12px;padding:3px 6px;border-radius:8px;border:1px solid rgba(0,0,0,.15);background:#fff;color:#2d4a37;max-width:150px;align-self:flex-start;margin-top:2px}
  #page-setup .team-toggle.tk7l-has{box-shadow:inset 3px 0 0 #2e8b57}
  .tk7l-colorbox{display:flex;flex-direction:column;gap:6px}
  .tk7l-colors{display:flex;flex-wrap:wrap;gap:6px}
  #tk7-line-card .tk7l-chip{font-size:13px!important;padding:5px 10px!important;min-width:0!important;width:auto!important;height:auto!important;border-radius:999px!important;cursor:pointer;box-shadow:none!important;transform:none!important}
  #tk7-line-card .tk7l-chip.off{opacity:.35;filter:grayscale(.6)}
  /* คอม: การ์ด LINE อยู่ล่างสุดของคอลัมน์ขวา (ใต้รูปแบบตาราง + นัดเปิดสนาม) */
  /* คอม: การ์ด LINE กว้างเต็มหน้า ใต้สองคอลัมน์ */
  #setup-content-wrapper > #tk7-line-card{grid-column:1 / -1 !important;grid-row:3 !important;margin:0}
  #setup-content-wrapper > #tk7-line-card .tk7l-actions{grid-template-columns:repeat(4,1fr)}
  #setup-content-wrapper > #tk7-line-card .tk7l-main{max-width:420px}
  #setup-content-wrapper > #tk7-line-card .tk7l-grid{grid-template-columns:2fr 1fr 1fr 1fr}
 `}));

 const card=el('div',{class:'card',id:'tk7-line-card'});
 const pill=el('span',{class:'tk7l-pill none',text:'—'});
 const summary=el('p',{class:'tk7l-sum'});
 const hint=el('p',{class:'tk7l-hint'});
 const main=el('button',{type:'button',class:'btn btn-primary tk7l-main'});
 const actions=el('div',{class:'tk7l-actions'});
 const status=el('p',{class:'tk7l-status',role:'status'});
 const groupBox=el('details');
 card.append(el('h2',{},el('span',{text:'📲 ลงชื่อผ่าน LINE'}),pill),summary,hint,main,actions,status,groupBox);
 // มือถือ: ใต้ช่องวันที่/เวลา · คอม: กว้างเต็มหน้า ใต้สองคอลัมน์ (เหนือปุ่มบันทึกตาราง)
 const wide=matchMedia('(min-width: 768px), (orientation: landscape)');
 function place(){
  if(wide.matches){const btn=$('generate-schedule-btn');if(btn&&btn.parentElement?.id==='setup-content-wrapper'){btn.before(card);return}}
  const anchor=document.querySelector('.setup-settings-card');
  if(anchor)anchor.after(card);else $('copy-reg-template-btn')?.after(card);
 }
 place();wide.addEventListener?.('change',place);

 let autoDated=false;
 let data=null,loading=false,lastSig='',syncTimer=null,pulledFor='',presetTimer=null,applying=false;
 const date=()=>$('match-date')?.value||'';
 const minutes=()=>parseInt($('time-per-match')?.value,10)||8;
 const startTime=()=>$('start-time')?.value||'20:00';
 const say=(t,err)=>{status.textContent=t||'';status.classList.toggle('err',!!err)};
 const thai=d=>new Date(d+'T00:00:00').toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short'});
 const errText=e=>({'Choose a LINE group first':'เลือกกลุ่ม LINE ก่อน (ด้านล่าง)','Group not verified':'ยังไม่พบกลุ่มนี้ — เชิญบอทเข้ากลุ่มแล้วพิมพ์ "ลงชื่อ" 1 ครั้ง','Target group already has one of these dates':'กลุ่มปลายทางมีวันเดียวกันอยู่แล้ว','Admin required':'ต้องเป็นผู้ดูแลที่อนุมัติแล้ว'}[e?.message]||e?.message||String(e));
 async function rpc(name,args){const {data:d,error}=await db.rpc(name,args);if(error)throw error;return d}
 const cfg=()=>data?.settings||{};
 const session=()=>(data?.sessions||[]).find(s=>s.match_date===date()&&s.group_id===cfg().group_id&&s.environment===cfg().environment);
 const entriesOf=s=>s?.roster?.entries||[];
 const playersOf=(s,t)=>entriesOf(s).filter(e=>e.team===t).sort((a,b)=>a.slot-b.slot);
 const presetOf=s=>s?.preset_teams||[];
 const checkedTeams=()=>[...document.querySelectorAll('.team-switch:checked')].map(x=>x.dataset.teamSlug);
 // สรุปแบบเดียวกับปุ่ม "แชร์รูปแบบลงทะเบียน LINE" แต่มีชื่อจาก LINE
 const REG={green:['🟢','Green Shirt (สีเขียว)'],red:['🔴','Red Shirt (สีแดง)'],white:['⚪️','White Shirt (สีขาว)'],blue:['🔵','Blue Shirt (สีน้ำเงิน)'],black:['⚫','Black Shirt (สีดำ)'],yellow:['🟡','Yellow Shirt (สีเหลือง)'],pink:['🩷','Pink Shirt (สีชมพู)'],orange:['🟠','Orange Shirt (สีส้ม)'],navy:['🔵','Navy Shirt (สีน้ำเงินเข้ม)'],purple:['🟣','Purple Shirt (สีม่วง)']};
 function summaryText(s){
  const st=String(s.start_time).slice(0,5);
  const d=new Date(s.match_date+'T00:00:00').toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  let t='⚽️ FOOTBALL MATCH @ TK7 Stadium\n📍 Location: https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA\n📅 Date / วันที่: '+d+'\n🕗 Kick-off: '+st+' | เวลาเตะ: '+st+' น.\n\n';
  let n=1;
  for(const team of ORDER.filter(x=>presetOf(s).includes(x)||playersOf(s,x).length)){
   t+=REG[team][0]+' '+REG[team][1]+'\n';
   for(let i=1;i<=7;i++)t+=(n+i-1)+'.'+(entriesOf(s).find(e=>e.team===team&&e.slot===i)?.name||'')+'\n';
   n+=7;
  }
  return t+'\n⏱️ Match Duration / เวลาเล่น:\n• 4 Teams = 2 Hours (เล่น 2 ชม.)\n• 5 Teams = 3 Hours (เล่น 3 ชม.)\n\n👇 Please add your name / ลงชื่อต่อลำดับได้เลยครับ\n'+LIFF;
 }

 async function load(){
  if(!canManage()){card.style.display='none';return}
  card.style.display='';
  if(loading)return;loading=true;
  try{data=await rpc('tk7_admin_overview');if(pickLatestOpenDate())return;render()}
  catch(e){say('โหลดข้อมูล LINE ไม่สำเร็จ: '+errText(e),true)}
  finally{loading=false}
 }

 // ครั้งแรกที่โหลด: ตั้งวันที่แข่งเป็นวันล่าสุดที่เปิดรับลงชื่อ
 function pickLatestOpenDate(){
  if(autoDated)return false;autoDated=true;
  const c=cfg();
  const open=(data?.sessions||[]).filter(s=>s.is_open&&s.group_id===c.group_id&&s.environment===c.environment).map(s=>s.match_date).sort();
  const latest=open[open.length-1];const input=$('match-date');
  if(!latest||!input||input.value===latest)return false;
  input.value=latest;input.dispatchEvent(new Event('change',{bubbles:true}));
  say('เลือกวันที่ '+thai(latest)+' ให้แล้ว (วันล่าสุดที่เปิดรับลงชื่อ)');
  return true;
 }

 // ---------- render ----------
 function render(){
  const s=session();const c=cfg();
  actions.replaceChildren();card.querySelector('.tk7l-colorbox')?.remove();main.hidden=false;
  if(!c.group_id){
   pill.className='tk7l-pill none';pill.textContent='ยังไม่เลือกกลุ่ม';
   summary.textContent='';hint.textContent='เลือกกลุ่ม LINE ที่ "👥 กลุ่ม LINE" ด้านล่างก่อน';main.hidden=true;
  }else if(!date()){
   pill.className='tk7l-pill none';pill.textContent='—';summary.textContent='';hint.textContent='เลือกวันที่แข่งขันด้านบน';main.hidden=true;
  }else if(!s){
   pill.className='tk7l-pill none';pill.textContent='ยังไม่เปิด';
   summary.replaceChildren(el('b',{text:thai(date())}),' · เริ่ม '+startTime()+' · '+minutes()+' นาที/แมตช์');
   hint.textContent='สีที่เปิดสวิตช์ไว้ทางซ้าย = เปิดทีมไว้ล่วงหน้า (ขึ้นในสรุปพร้อมช่องว่าง 7 ช่อง) · ผู้เล่นยังเลือกสีอื่นเพิ่มได้';
   main.textContent='📲 เปิดรับลงชื่อใน LINE';
   main.onclick=()=>act(main,async()=>{const sid=await rpc('tk7_admin_open_session',{p_date:date(),p_time_per_match:minutes(),p_start_time:startTime(),p_open:true});await rpc('tk7_admin_set_preset',{p_session:sid,p_teams:checkedTeams()});return 'เปิดรับลงชื่อแล้ว · ทุกคนในกลุ่มกดปุ่มในการ์ดหรือพิมพ์ "ลงชื่อ" ได้เลย'});
  }else{
   const teams=ORDER.filter(t=>playersOf(s,t).length||presetOf(s).includes(t));const total=entriesOf(s).length;
   pill.className='tk7l-pill'+(s.is_open?'':' off');pill.textContent=s.is_open?'🟢 เปิดรับ':'🔒 ปิดรับแล้ว';
   summary.replaceChildren(el('b',{text:thai(date())}),' · เริ่ม '+String(s.start_time).slice(0,5)+' · '+s.time_per_match+' นาที/แมตช์',el('br'),
    el('b',{text:teams.length+' ทีม · '+total+' คน'}),teams.length?' ('+teams.map(t=>COLORS[t]+' '+playersOf(s,t).length).join(', ')+')':'');
   hint.textContent='เปิด/ปิดสวิตช์สีทางซ้าย = เปิดทีมไว้ล่วงหน้าใน LINE · แก้นาที/เวลาเริ่มด้านบน = อัปเดตใน LINE อัตโนมัติ';
   main.hidden=true;
   const toggle=el('button',{type:'button',class:'btn btn-secondary',text:s.is_open?'🔒 ปิดรับลงชื่อ':'🔓 เปิดรับอีกครั้ง'});
   toggle.onclick=()=>act(toggle,async()=>{await rpc('tk7_admin_set_open',{p_session:s.id,p_open:!s.is_open});return s.is_open?'ปิดรับแล้ว (รายชื่อยังอยู่)':'เปิดรับอีกครั้งแล้ว'});
   const push=el('button',{type:'button',class:'btn btn-secondary',text:'📤 ส่งสรุปเข้ากลุ่ม'});
   push.onclick=()=>act(push,async()=>{await rpc('tk7_admin_push_summary',{p_session:s.id});return 'เข้าคิวแล้ว · ขึ้นในกลุ่มภายใน ~1 นาที'});
   const copy=el('button',{type:'button',class:'btn btn-secondary',text:'📋 คัดลอกสรุปรายชื่อ'});
   copy.onclick=async()=>{try{await navigator.clipboard.writeText(summaryText(s));say('คัดลอกสรุปแล้ว (รูปแบบเดียวกับแชร์ลงทะเบียน) · วางในไลน์ได้เลย')}catch{say('คัดลอกไม่สำเร็จ',true)}};
   const clear=el('button',{type:'button',class:'btn tk7l-danger',text:'🗑 ล้างรายชื่อ',disabled:total?null:true});
   clear.onclick=()=>{if(!confirm('ล้างรายชื่อทั้งหมด '+total+' คน ของวันที่ '+thai(date())+' ?\n(ลบแล้วกู้คืนไม่ได้)'))return;
    act(clear,async()=>{const n=await rpc('tk7_admin_clear_session',{p_session:s.id});lastSig='';return 'ล้างรายชื่อแล้ว '+n+' คน'})};
   actions.append(toggle,push,copy,clear);
   // สีที่เปิดให้เลือกใน LINE (ปิดสีที่ไม่ใช้)
   const allowed=s.teams||ORDER;
   const chips=el('div',{class:'tk7l-colors'});
   for(const t of ORDER){
    const on=allowed.includes(t);const has=playersOf(s,t).length>0;
    const b=el('button',{type:'button',class:'tk7l-chip team-emblem '+t+(on?'':' off'),'aria-pressed':String(on),title:has?'มีคนลงอยู่ ปิดไม่ได้':'',text:(on?'✓ ':'✕ ')+COLORS[t]});
    b.onclick=()=>{if(has&&on){say('สี'+COLORS[t]+' มีคนลงอยู่ — ย้ายคนออกก่อนจึงปิดได้',true);return}
     const next=on?allowed.filter(x=>x!==t):[...allowed,t];
     act(b,async()=>{await rpc('tk7_admin_set_teams',{p_session:s.id,p_teams:next});return (on?'ปิด':'เปิด')+'สี'+COLORS[t]+'ในหน้าลงชื่อแล้ว'})};
    chips.append(b);
   }
   actions.after(el('div',{class:'tk7l-colorbox'},el('div',{class:'tk7l-hint',text:'สีที่ให้เลือกในหน้าลงชื่อ (แตะเพื่อเปิด/ปิด):'}),chips));
  }
  renderTeams(s);renderGroup();pullFormFrom(s);
 }

 // รายการทีมด้านซ้าย: แสดงคนจาก LINE + เปลี่ยนสี + ติ๊กอัตโนมัติ
 function renderTeams(s){
  const switches=[...document.querySelectorAll('.team-switch')];
  for(const sw of switches){
   const slug=sw.dataset.teamSlug;const row=sw.closest('.team-toggle');if(!row)continue;
   row.querySelector('.tk7l-info')?.remove();row.classList.remove('tk7l-has');
   if(!s)continue;
   const players=playersOf(s,slug);
   const info=el('div',{class:'tk7l-info'});
   if(players.length){
    row.classList.add('tk7l-has');
    info.append(el('span',{class:'cnt'+(players.length>=7?' full':''),text:players.length+'/7'+(players.length>=7?' ครบ':'')}),el('span',{class:'names',title:players.map(p=>p.name).join(', '),text:players.map(p=>p.name).join(', ')}));
    const sel=el('select',{class:'tk7l-recolor','aria-label':'เปลี่ยนสีทีม'+COLORS[slug]},el('option',{value:'',text:'🎨 เปลี่ยนสี…'}));
    for(const t of ORDER){if(t===slug)continue;const n=playersOf(s,t).length;sel.append(el('option',{value:t,text:(n?'⇄ สลับกับ':'→ ')+COLORS[t]+(n?' ('+n+')':'')}))}
    sel.onchange=()=>{const to=sel.value;if(!to)return;recolor(s,slug,to);sel.value=''};
    info.append(sel);
   }else info.append(el('span',{class:'names',text:presetOf(s).includes(slug)?'เปิดไว้ · ยังไม่มีคนลง':'ยังไม่มีคนลง'}));
   const emblem=row.querySelector('.team-emblem');emblem?emblem.after(info):row.prepend(info);
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

 async function recolor(s,from,to){
  const nTo=playersOf(s,to).length;
  if(!confirm((nTo?'สลับสี '+COLORS[from]+' ⇄ '+COLORS[to]:'เปลี่ยนทีม'+COLORS[from]+' ทั้งหมดเป็นสี'+COLORS[to])+' ?'))return;
  say('กำลังเปลี่ยนสี…');
  try{
   await rpc('tk7_admin_recolor',{p_session:s.id,p_from:from,p_to:to});
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
   try{await rpc('tk7_admin_open_session',{p_date:date(),p_time_per_match:minutes(),p_start_time:startTime(),p_open:s.is_open});await load();say('อัปเดตเวลาใน LINE แล้ว: เริ่ม '+startTime()+' · '+minutes()+' นาที/แมตช์')}
   catch(e){say(errText(e),true)}
  },900);
 }

 function renderGroup(){
  const c=cfg();const groups=data?.groups||[];
  groupBox.replaceChildren(el('summary',{text:'👥 กลุ่ม LINE: '+(c.group_name||c.group_id||'ยังไม่ได้เลือก')+(c.environment==='test'?' (ทดสอบ)':'')}));
  const sel=el('select',{'aria-label':'กลุ่ม LINE'});
  for(const g of groups)sel.append(el('option',{value:g.group_id,text:(g.group_name||g.group_id)+(g.group_id===c.group_id?' ✓':''),selected:g.group_id===c.group_id?true:null}));
  const env=el('select',{'aria-label':'ประเภทกลุ่ม'});
  for(const [v,t] of [['production','กลุ่มจริง'],['test','กลุ่มทดสอบ']])env.append(el('option',{value:v,text:t,selected:(c.environment||'test')===v?true:null}));
  const moveChk=el('input',{type:'checkbox',id:'tk7l-move',checked:true});
  const save=el('button',{type:'button',class:'btn btn-primary',text:'ใช้กลุ่มนี้',disabled:groups.length?null:true});
  save.onclick=()=>act(save,async()=>{const r=await rpc('tk7_admin_set_group',{p_group:sel.value,p_environment:env.value,p_move_upcoming:moveChk.checked});return 'เปลี่ยนกลุ่มแล้ว'+(r?.moved?' · ย้าย '+r.moved+' วันไปด้วย':'')});
  const reload=el('button',{type:'button',class:'btn btn-secondary',text:'↻ โหลดใหม่'});reload.onclick=()=>load().then(()=>say('โหลดรายชื่อกลุ่มแล้ว'));
  const pushChk=el('input',{type:'checkbox',id:'tk7l-push',checked:c.push_summary!==false?true:null});
  pushChk.onchange=()=>act(pushChk,async()=>{await rpc('tk7_admin_set_push',{p_on:pushChk.checked});return pushChk.checked?'เปิดส่งสรุปอัตโนมัติ':'ปิดส่งสรุปอัตโนมัติ'});
  groupBox.append(
   el('p',{class:'tk7l-hint',style:'margin-top:8px',text:'ย้ายกลุ่ม: เชิญบอทเข้ากลุ่มใหม่ (ใครสร้างกลุ่มก็ได้) → พิมพ์ "ลงชื่อ" ในกลุ่ม 1 ครั้ง → โหลดใหม่ → เลือกกลุ่ม'}),
   el('div',{class:'tk7l-grid'},sel,env,save,reload),
   el('label',{class:'tk7l-check',for:'tk7l-move'},moveChk,el('span',{text:'ย้ายวันแข่งที่ยังไม่ถึงไปกลุ่มใหม่ด้วย'})),
   el('label',{class:'tk7l-check',for:'tk7l-push'},pushChk,el('span',{text:'ส่งสรุปรายชื่อเข้ากลุ่มอัตโนมัติหลังมีคนลง (รวมทุก ~1 นาที)'})));
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
  if(!sw.checked&&playersOf(s,sw.dataset.teamSlug).length){say('สี'+COLORS[sw.dataset.teamSlug]+' มีคนลงอยู่ — ยังแสดงใน LINE จนกว่าจะย้ายคนออก')}
  clearTimeout(presetTimer);
  presetTimer=setTimeout(async()=>{try{await rpc('tk7_admin_set_preset',{p_session:s.id,p_teams:checkedTeams()});await load();say('อัปเดตสีที่เปิดไว้ใน LINE แล้ว')}catch(err){say(errText(err),true)}},700);
 },true);
 new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))load()}).observe(card);
 const setupVisible=()=>!!$('page-setup')?.offsetParent;
 setInterval(()=>{if(!document.hidden&&setupVisible()&&!document.activeElement?.closest?.('#page-setup select'))load()},20000);
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>setupVisible()&&load(),200)));
 db.auth.onAuthStateChange?.(()=>setTimeout(load,1200));
}};
