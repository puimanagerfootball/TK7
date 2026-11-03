window.TK7Admin={mount({db,canManage}){
 const style=document.createElement('style');style.textContent=`.tk7-line-panel{background:#f5f8f2!important;color:#193c2c!important;border:1px solid #d8e5d5!important;border-radius:20px!important;padding:24px!important;margin-top:24px!important;text-align:left!important}.tk7-line-panel h2{color:#173e2c!important;font-size:24px!important;margin:0 0 12px!important}.tk7-line-panel h3{color:#214a33!important;font-size:17px!important}.tk7-line-panel a{color:#176c43!important;display:inline-block;margin-bottom:15px}.tk7-line-panel p{color:#607568!important;font-size:13px;line-height:1.8}.tk7-line-panel button{border-radius:10px!important;padding:12px 16px!important;margin:8px 0!important;min-height:44px}.tk7-line-panel select,.tk7-line-panel input{color:#1c422d!important;background:#fff!important;border:1px solid #ccdcca!important;border-radius:10px!important;width:100%;min-height:46px;padding:10px!important;margin:6px 0 0!important}.tk7-line-panel .line-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:20px;background:white;border-radius:16px;margin:20px 0}.tk7-line-panel label{font-size:12px;color:#3a6045;display:block}.tk7-line-panel .line-form button{grid-column:1/-1;background:#197349!important;color:white!important}.tk7-line-panel .line-session{background:white;border:1px solid #dfe8dc;border-radius:14px;padding:18px;margin-top:14px}.tk7-line-panel details{background:#e9f0e1;border-radius:12px;padding:14px;margin-top:12px;font-size:12px;line-height:1.8}.tk7-line-panel summary{cursor:pointer;font-weight:600}.tk7-line-panel .line-help{margin:10px 0 0;padding-left:20px}@media(max-width:600px){.tk7-line-panel{padding:18px!important}.tk7-line-panel .line-form{grid-template-columns:1fr;padding:15px}.tk7-line-panel h2{font-size:21px!important}}`;document.head.append(style);
 const card=document.createElement('section');card.className='card tk7-line-panel';
 const title=document.createElement('h2');title.textContent='⚽ รายชื่อจาก LINE';
 const open=document.createElement('a');open.href='https://liff.line.me/2012278818-W0pIi2y0';open.target='_blank';open.rel='noopener';open.textContent='เปิดเมนูลงชื่อ / ย้ายทีม / ยกเลิกชื่อ';
 const refresh=document.createElement('button');refresh.type='button';refresh.className='btn btn-secondary';refresh.textContent='โหลดรายชื่อและจัดการวันลงชื่อ';
 const status=document.createElement('p');status.role='status';
 const intro=document.createElement('p');intro.textContent='เปิดวันเตะ ดูรายชื่อทุกทีม และจัดการการลงชื่อในที่เดียว';
 const help=document.createElement('details');const helpTitle=document.createElement('summary');helpTitle.textContent='อยากเปลี่ยนกลุ่ม LINE ทำอย่างไร?';const instructions=document.createElement('ol');instructions.className='line-help';for(const text of ['เชิญบอท PUICUPPOM เข้ากลุ่มใหม่ แล้วส่งข้อความในกลุ่มหนึ่งครั้ง เพื่อให้ระบบรู้จักกลุ่ม','กดโหลดรายชื่อใหม่ กลุ่มที่บอทตรวจพบจะปรากฏในตัวเลือกด้านล่าง','ก่อนย้ายใช้งาน ต้องให้ผู้ดูแลระบบเปลี่ยนกลุ่มที่แอปผูกไว้ใน Supabase และตรวจสิทธิ์สมาชิกกลุ่มใหม่','เปิดวันลงชื่อของกลุ่มใหม่ แล้วทดสอบลงชื่อและตรวจว่าสรุปส่งเข้ากลุ่มถูกต้อง']){const li=document.createElement('li');li.textContent=text;instructions.append(li)}const caution=document.createElement('p');caution.textContent='ตอนนี้ยังใช้กลุ่มทดสอบเดิม การเลือกกลุ่มด้านล่างเป็นการกำหนดกลุ่มของวันแข่งขัน ยังไม่เปลี่ยนกลุ่มหลักของแอป และไม่ย้ายรายชื่อเดิม';help.append(helpTitle,instructions,caution);
 const content=document.createElement('div');card.append(title,intro,open,document.createElement('br'),refresh,status,help,content);
 document.getElementById('copy-reg-template-btn').after(card);
 async function load(){
  if(!canManage()){status.textContent='กรุณาเข้าสู่ระบบผู้ดูแล TK7 ที่ได้รับอนุมัติ';return}
  refresh.disabled=true;
  try{
   const {data,error}=await db.rpc('tk7_admin_overview');if(error)throw error;
   content.replaceChildren();
   const group=document.createElement('select');group.ariaLabel='กลุ่ม LINE';
   for(const g of data.groups){const option=document.createElement('option');option.value=g.group_id;option.textContent=g.group_name||g.group_id;group.append(option)}
   const date=document.createElement('input');date.type='date';date.value=document.getElementById('match-date').value||'2026-11-06';date.ariaLabel='วันเปิดลงชื่อ';
   const environment=document.createElement('select');environment.ariaLabel='ประเภทกลุ่ม';
   for(const [value,label] of [['test','กลุ่มทดสอบ'],['production','กลุ่มจริง']]){const o=document.createElement('option');o.value=value;o.textContent=label;environment.append(o)}
   const teamCount=document.createElement('select');teamCount.ariaLabel='จำนวนทีม';for(const n of [5,4]){const o=document.createElement('option');o.value=n;o.textContent=n+' ทีม';teamCount.append(o)}
   const save=document.createElement('button');save.textContent='เปิดรับลงชื่อวันที่เลือก';save.type='button';save.className='btn btn-primary';save.disabled=!data.groups.length;
   save.onclick=async()=>{if(!date.value||!group.value)return;save.disabled=true;try{const {error}=await db.rpc('tk7_admin_session',{p_date:date.value,p_group:group.value,p_environment:environment.value,p_open:true,p_teams:['green','red','white','blue','black'].slice(0,Number(teamCount.value))});if(error)throw error;await load();status.textContent='เปิดรับลงชื่อแล้ว'}catch(e){status.textContent=e.message}finally{save.disabled=false}};
   const form=document.createElement('div');form.className='line-form';for(const [text,control] of [['กลุ่มที่จะรับรายชื่อ',group],['วันแข่งขัน',date],['ประเภทการใช้งาน',environment],['จำนวนทีม',teamCount]]){const label=document.createElement('label');label.append(document.createTextNode(text),control);form.append(label)}form.append(save);content.append(form);
   const colors={green:'🟢 เขียว',red:'🔴 แดง',white:'⚪ ขาว',blue:'🔵 น้ำเงิน',black:'⚫ ดำ'};
   for(const s of data.sessions.sort((a,b)=>b.match_date.localeCompare(a.match_date))){
    const section=document.createElement('section');section.className='line-session';const h=document.createElement('h3');h.textContent=new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(s.match_date+'T12:00:00+07:00'))+' · '+(s.is_open?'เปิดรับลงชื่อ':'ปิดลงชื่อ');const meta=document.createElement('p');meta.textContent=(data.groups.find(g=>g.group_id===s.group_id)?.group_name||'กลุ่ม LINE')+' · '+(s.environment==='test'?'ทดสอบ':'ใช้งานจริง');section.append(h,meta);
    for(const t of s.teams){const p=document.createElement('p');p.textContent=colors[t]+': '+s.roster.entries.filter(e=>e.team===t).sort((a,b)=>a.slot-b.slot).map(e=>e.name).join(', ');section.append(p)}
    const toggle=document.createElement('button');toggle.type='button';toggle.textContent=s.is_open?'ปิดรับลงชื่อ':'เปิดรับลงชื่อ';toggle.onclick=async()=>{toggle.disabled=true;try{const {error}=await db.rpc('tk7_admin_session',{p_date:s.match_date,p_group:s.group_id,p_environment:s.environment,p_open:!s.is_open,p_teams:s.teams});if(error)throw error;await load()}catch(e){status.textContent=e.message;toggle.disabled=false}};section.append(toggle);content.append(section);
   }
   status.textContent=data.sessions.length+' นัด · ใช้ฐานข้อมูล TK7 เดียวกัน';
  }catch(e){status.textContent='โหลดไม่สำเร็จ: '+e.message}finally{refresh.disabled=false}
 }
 refresh.onclick=load;
}};
