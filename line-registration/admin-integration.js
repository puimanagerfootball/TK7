// TK7 admin: การ์ด "ลงชื่อผ่าน LINE" ในหน้าจัดการทีม
// ใช้ วันที่ / นาทีต่อแมตช์ / เวลาเริ่ม จากฟอร์มด้านบนโดยตรง → เปิดรับลงชื่อ → ผู้เล่นเลือกสีเอง
// → กด "ใช้ทีมจาก LINE" เพื่อติ๊กทีมที่มีคนลง แล้วกดบันทึกตารางตามปกติ
window.TK7Admin={mount({db,canManage}){
 const LIFF='https://liff.line.me/2012278818-W0pIi2y0';
 const COLORS={green:'เขียว',red:'แดง',white:'ขาว',blue:'ฟ้า',black:'ดำ',yellow:'เหลือง',pink:'ชมพู',orange:'ส้ม',navy:'น้ำเงิน',purple:'ม่วง'};
 const ORDER=Object.keys(COLORS);
 const $=id=>document.getElementById(id);
 const el=(tag,props={},...kids)=>{const n=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k==='style')n.style.cssText=v;else if(k.startsWith('on'))n[k]=v;else if(v!=null&&v!==false)n.setAttribute(k,v===true?'':v)}for(const c of kids.flat())if(c!=null)n.append(c);return n};

 const style=el('style',{text:`
  .tk7l{display:flex;flex-direction:column;gap:12px}
  .tk7l-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .tk7l-row>*{flex:1 1 auto}
  .tk7l-muted{font-size:13px;opacity:.75;margin:0}
  .tk7l-status{font-size:14px;margin:0;min-height:1em}
  .tk7l-box{border:1px solid rgba(0,0,0,.1);border-radius:12px;padding:12px;background:rgba(255,255,255,.55)}
  .tk7l-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
  .tk7l-badge{font-size:12px;padding:3px 10px;border-radius:999px;background:#e3f3e7;color:#1f6b3a;white-space:nowrap}
  .tk7l-badge.off{background:#fff1d6;color:#7a5200}
  .tk7l-teams{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
  .tk7l .tk7l-team{border-radius:10px;padding:8px 10px;font-size:13px;line-height:1.35;white-space:normal;width:auto;max-width:none;min-width:0;height:auto;overflow:visible;text-overflow:clip}
  .tk7l-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}
  .tk7l .tk7l-actions .btn{font-size:13px;padding:8px 4px;width:auto;min-height:44px}
  .tk7l .tk7l-wide{width:100%;margin-top:10px}
  .tk7l-team b{display:block;font-size:14px}
  .tk7l select,.tk7l input[type=text]{font:inherit;padding:9px;border-radius:9px;border:1px solid rgba(0,0,0,.2);min-width:0}
  .tk7l button{min-height:40px}
  .tk7l details summary{cursor:pointer;font-weight:600}
  .tk7l .btn{margin:0}
 `});
 document.head.append(style);

 const card=el('div',{class:'card tk7l',id:'tk7-line-card'});
 const status=el('p',{class:'tk7l-status',role:'status'});
 const sessionBox=el('div');
 const groupBox=el('details');
 card.append(el('h2',{text:'📲 ลงชื่อผ่าน LINE'}),
  el('p',{class:'tk7l-muted',text:'ใช้ วันที่ · นาที/แมตช์ · เวลาเริ่ม จากด้านบน → ผู้เล่นเลือกสีเองใน LINE (สีละ 7 คน) → กด "ใช้ทีมจาก LINE" แล้วบันทึกตาราง'}),
  sessionBox,status,groupBox);
 const anchor=document.querySelector('.setup-settings-card');
 if(anchor)anchor.after(card);else $('copy-reg-template-btn')?.after(card);

 let data=null,loading=false;
 const setupDate=()=>$('match-date')?.value||'';
 const minutes=()=>parseInt($('time-per-match')?.value,10)||8;
 const startTime=()=>$('start-time')?.value||'20:00';
 const say=(t,err)=>{status.textContent=t||'';status.style.color=err?'#c62828':''};
 const thai=d=>new Date(d+'T00:00:00').toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short',year:'2-digit'});
 const errText=e=>({'Choose a LINE group first':'เลือกกลุ่ม LINE ก่อน (ด้านล่าง)','Group not verified':'ยังไม่พบกลุ่มนี้ — เชิญบอทเข้ากลุ่มแล้วพิมพ์ "ลงชื่อ" 1 ครั้ง','Target group already has one of these dates':'กลุ่มปลายทางมีวันเดียวกันอยู่แล้ว','Admin required':'ต้องเป็นผู้ดูแลที่อนุมัติแล้ว'}[e?.message]||e?.message||String(e));

 async function rpc(name,args){const {data:d,error}=await db.rpc(name,args);if(error)throw error;return d}
 const settings=()=>data?.settings||{};
 const sessionFor=date=>(data?.sessions||[]).find(s=>s.match_date===date&&s.group_id===settings().group_id&&s.environment===settings().environment);

 async function load(){
  if(!canManage()){card.style.display='none';return}
  card.style.display='';
  if(loading)return;loading=true;
  try{data=await rpc('tk7_admin_overview');render()}
  catch(e){say('โหลดข้อมูล LINE ไม่สำเร็จ: '+errText(e),true)}
  finally{loading=false}
 }

 function teamsFrom(s){
  const entries=s?.roster?.entries||[];
  return ORDER.filter(t=>entries.some(e=>e.team===t)).map(t=>({slug:t,players:entries.filter(e=>e.team===t).sort((a,b)=>a.slot-b.slot)}));
 }

 function render(){
  const date=setupDate();const s=sessionFor(date);const cfg=settings();
  sessionBox.replaceChildren();
  if(!cfg.group_id){
   sessionBox.append(el('p',{class:'tk7l-muted',text:'⚠️ ยังไม่ได้เลือกกลุ่ม LINE — ตั้งค่าที่ "กลุ่ม LINE" ด้านล่างก่อน'}));
  }else if(!date){
   sessionBox.append(el('p',{class:'tk7l-muted',text:'เลือกวันที่แข่งขันด้านบนก่อน'}));
  }else if(!s){
   const open=el('button',{type:'button',class:'btn btn-primary',text:'📲 เปิดรับลงชื่อ '+thai(date)+' · '+startTime()+' · '+minutes()+' นาที'});
   open.onclick=()=>act(open,async()=>{await rpc('tk7_admin_open_session',{p_date:date,p_time_per_match:minutes(),p_start_time:startTime(),p_open:true});return 'เปิดรับลงชื่อแล้ว · ส่งลิงก์หรือพิมพ์ "ลงชื่อ" ในกลุ่มได้เลย'});
   sessionBox.append(open);
  }else{
   const teams=teamsFrom(s);const total=teams.reduce((n,t)=>n+t.players.length,0);
   const changed=s.time_per_match!==minutes()||String(s.start_time).slice(0,5)!==startTime();
   const box=el('div',{class:'tk7l-box'});
   box.append(el('div',{class:'tk7l-head'},
    el('strong',{text:thai(date)+' · '+String(s.start_time).slice(0,5)+' น. · '+s.time_per_match+' นาที/แมตช์'}),
    el('span',{class:'tk7l-badge'+(s.is_open?'':' off'),text:s.is_open?'🟢 เปิดรับ':'🔒 ปิดแล้ว'})));
   if(teams.length){
    box.append(el('div',{class:'tk7l-teams'},teams.map(t=>el('div',{class:'tk7l-team team-emblem '+t.slug,style:'display:block;text-align:left;cursor:default;transform:none'},
     el('b',{text:COLORS[t.slug]+' '+t.players.length+'/7'}),el('span',{text:t.players.map(p=>p.name).join(', ')})))));
    box.append(el('p',{class:'tk7l-muted',style:'margin-top:8px',text:teams.length+' ทีม · '+total+' คน'+(teams.some(t=>t.players.length<7)?' · มีทีมที่ยังไม่ครบ 7':'')}));
   }else box.append(el('p',{class:'tk7l-muted',text:'ยังไม่มีใครลงชื่อ'}));
   const actions=el('div',{class:'tk7l-actions'});
   const use=el('button',{type:'button',class:'btn btn-primary tk7l-wide',text:'✅ ใช้ทีมจาก LINE ('+teams.length+' ทีม)',disabled:teams.length<2?true:null});
   use.onclick=()=>applyTeams(teams.map(t=>t.slug));
   const toggle=el('button',{type:'button',class:'btn btn-secondary',text:s.is_open?'🔒 ปิดรับ':'🔓 เปิดรับอีกครั้ง'});
   toggle.onclick=()=>act(toggle,async()=>{await rpc('tk7_admin_set_open',{p_session:s.id,p_open:!s.is_open});return s.is_open?'ปิดรับลงชื่อแล้ว (รายชื่อยังอยู่)':'เปิดรับลงชื่ออีกครั้งแล้ว'});
   const push=el('button',{type:'button',class:'btn btn-secondary',text:'📤 ส่งสรุป'});
   push.onclick=()=>act(push,async()=>{await rpc('tk7_admin_push_summary',{p_session:s.id});return 'เข้าคิวส่งแล้ว · จะขึ้นในกลุ่มภายใน ~1 นาที'});
   const copy=el('button',{type:'button',class:'btn btn-secondary',text:'🔗 คัดลอกลิงก์'});
   copy.onclick=async()=>{try{await navigator.clipboard.writeText(LIFF);say('คัดลอกลิงก์แล้ว: '+LIFF)}catch{say(LIFF)}};
   actions.append(toggle,push,copy);
   box.append(use,actions);
   if(changed){
    const upd=el('button',{type:'button',class:'btn btn-warning',style:'margin-top:8px;width:100%',text:'🔄 อัปเดตเวลาใน LINE เป็น '+startTime()+' · '+minutes()+' นาที'});
    upd.onclick=()=>act(upd,async()=>{await rpc('tk7_admin_open_session',{p_date:date,p_time_per_match:minutes(),p_start_time:startTime(),p_open:s.is_open});return 'อัปเดตเวลาแล้ว'});
    box.append(upd);
   }
   sessionBox.append(box);
  }
  renderGroup();
 }

 function renderGroup(){
  const cfg=settings();const groups=data?.groups||[];
  groupBox.replaceChildren();
  groupBox.append(el('summary',{text:'👥 กลุ่ม LINE: '+(cfg.group_name||cfg.group_id||'ยังไม่ได้เลือก')+(cfg.environment==='test'?' (ทดสอบ)':'')}));
  const inner=el('div',{class:'tk7l',style:'margin-top:10px'});
  inner.append(el('p',{class:'tk7l-muted',text:'ย้ายกลุ่ม: 1) เชิญบอท TK7 เข้ากลุ่มใหม่  2) พิมพ์ "ลงชื่อ" ในกลุ่มนั้น 1 ครั้ง  3) กดโหลดใหม่ แล้วเลือกกลุ่มด้านล่าง'}));
  const sel=el('select',{'aria-label':'กลุ่ม LINE'});
  for(const g of groups)sel.append(el('option',{value:g.group_id,text:(g.group_name||g.group_id)+(g.group_id===cfg.group_id?' ✓ ใช้อยู่':''),selected:g.group_id===cfg.group_id?true:null}));
  const env=el('select',{'aria-label':'ประเภทกลุ่ม'});
  for(const [v,t] of [['production','กลุ่มจริง'],['test','กลุ่มทดสอบ']])env.append(el('option',{value:v,text:t,selected:(cfg.environment||'test')===v?true:null}));
  const moveChk=el('input',{type:'checkbox',id:'tk7l-move',checked:true});
  const save=el('button',{type:'button',class:'btn btn-primary',text:'ใช้กลุ่มนี้',disabled:groups.length?null:true});
  save.onclick=()=>act(save,async()=>{const r=await rpc('tk7_admin_set_group',{p_group:sel.value,p_environment:env.value,p_move_upcoming:moveChk.checked});return 'เปลี่ยนกลุ่มแล้ว'+(r?.moved?' · ย้ายวันที่ยังไม่ถึง '+r.moved+' วันไปด้วย':'')});
  const reload=el('button',{type:'button',class:'btn btn-secondary',text:'↻ โหลดใหม่'});reload.onclick=()=>load().then(()=>say('โหลดรายชื่อกลุ่มแล้ว'));
  const pushChk=el('input',{type:'checkbox',id:'tk7l-push',checked:cfg.push_summary!==false?true:null});
  pushChk.onchange=()=>act(pushChk,async()=>{await rpc('tk7_admin_set_push',{p_on:pushChk.checked});return pushChk.checked?'เปิดส่งสรุปอัตโนมัติ':'ปิดส่งสรุปอัตโนมัติ (ยังพิมพ์ "ลงชื่อ" เรียกดูได้)'});
  inner.append(el('div',{class:'tk7l-row'},sel,env),
   el('label',{class:'tk7l-muted',for:'tk7l-move'},moveChk,' ย้ายวันแข่งที่ยังไม่ถึงไปกลุ่มใหม่ด้วย'),
   el('div',{class:'tk7l-row'},save,reload),
   el('label',{class:'tk7l-muted',for:'tk7l-push'},pushChk,' ส่งสรุปเข้ากลุ่มอัตโนมัติหลังมีคนลง (รวมเป็นข้อความเดียวทุก ~1 นาที)'));
  if(!groups.length)inner.append(el('p',{class:'tk7l-muted',text:'ยังไม่พบกลุ่ม — เชิญบอทเข้ากลุ่มแล้วพิมพ์ "ลงชื่อ"'}));
  groupBox.append(inner);
 }

 async function act(btn,fn){
  btn.disabled=true;say('กำลังบันทึก…');
  try{const msg=await fn();await load();say(msg)}
  catch(e){say(errText(e),true);btn.disabled=false}
 }

 // ติ๊กทีมในฟอร์มให้ตรงกับสีที่มีคนลง แล้วให้แอดมินกดบันทึกตารางเอง
 function applyTeams(slugs){
  const switches=[...document.querySelectorAll('.team-switch')];
  if(!switches.length){say('เปิดหน้าจัดการทีมก่อน',true);return}
  for(const sw of switches){const on=slugs.includes(sw.dataset.teamSlug);if(sw.checked!==on){sw.checked=on;sw.dispatchEvent(new Event('change',{bubbles:true}))}}
  document.querySelector('.setup-teams-card')?.scrollIntoView({behavior:'smooth',block:'center'});
  say('ติ๊กทีม '+slugs.map(s=>COLORS[s]).join(' · ')+' แล้ว → เลือกคู่เปิดสนาม แล้วกด "บันทึกตารางแข่งขัน"');
 }

 // รีเฟรชเมื่อเปลี่ยนวัน/เวลาในฟอร์ม และเมื่อการ์ดโผล่บนจอ
 $('match-date')?.addEventListener('change',()=>data?render():load());
 $('time-per-match')?.addEventListener('input',()=>data&&render());
 $('start-time')?.addEventListener('change',()=>data&&render());
 document.querySelectorAll('#page-setup .num-stepper-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>data&&render(),0)));
 new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))load()}).observe(card);
 const setupVisible=()=>!!$('page-setup')?.offsetParent;
 setInterval(()=>{if(!document.hidden&&setupVisible())load()},30000);
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>setupVisible()&&load(),200)));
 db.auth.onAuthStateChange?.(()=>setTimeout(load,1200));
}};
