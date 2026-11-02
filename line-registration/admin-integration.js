window.TK7Admin={mount({db,canManage}){
 const card=document.createElement('section');card.className='card';
 const title=document.createElement('h2');title.textContent='⚽ รายชื่อจาก LINE';
 const open=document.createElement('a');open.href='https://liff.line.me/2012278818-W0pIi2y0';open.target='_blank';open.rel='noopener';open.textContent='เปิดเมนูลงชื่อ / ย้ายทีม / ยกเลิกชื่อ';
 const refresh=document.createElement('button');refresh.type='button';refresh.className='btn btn-secondary';refresh.textContent='โหลดรายชื่อและจัดการวันลงชื่อ';
 const status=document.createElement('p');status.role='status';
 const content=document.createElement('div');card.append(title,open,refresh,status,content);
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
   content.append(group,date,environment,teamCount,save);
   const colors={green:'🟢 เขียว',red:'🔴 แดง',white:'⚪ ขาว',blue:'🔵 น้ำเงิน',black:'⚫ ดำ'};
   for(const s of data.sessions.sort((a,b)=>b.match_date.localeCompare(a.match_date))){
    const section=document.createElement('section');const h=document.createElement('h3');h.textContent=s.match_date+' · '+s.environment+' · '+(s.is_open?'เปิดรับลงชื่อ':'ปิดลงชื่อ');section.append(h);
    for(const t of s.teams){const p=document.createElement('p');p.textContent=colors[t]+': '+s.roster.entries.filter(e=>e.team===t).sort((a,b)=>a.slot-b.slot).map(e=>e.name).join(', ');section.append(p)}
    const toggle=document.createElement('button');toggle.type='button';toggle.textContent=s.is_open?'ปิดรับลงชื่อ':'เปิดรับลงชื่อ';toggle.onclick=async()=>{toggle.disabled=true;try{const {error}=await db.rpc('tk7_admin_session',{p_date:s.match_date,p_group:s.group_id,p_environment:s.environment,p_open:!s.is_open,p_teams:s.teams});if(error)throw error;await load()}catch(e){status.textContent=e.message;toggle.disabled=false}};section.append(toggle);content.append(section);
   }
   status.textContent=data.sessions.length+' นัด · ใช้ฐานข้อมูล TK7 เดียวกัน';
  }catch(e){status.textContent='โหลดไม่สำเร็จ: '+e.message}finally{refresh.disabled=false}
 }
 refresh.onclick=load;
}};
