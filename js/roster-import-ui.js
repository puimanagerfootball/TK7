// Import is an explicit, admin-only preview/confirm flow. Pasting never writes.
globalThis.TK7RosterImportUI={create({el,getSession,refresh,rpc,canManage,setBusy=()=>{},afterSave=()=>{},message=()=>{},errText=e=>e.message}){
 const modal=el('div',{class:'tk7l-modal',role:'dialog','aria-modal':'true','aria-label':'นำเข้ารายชื่อจาก LINE',hidden:true});document.body.append(modal);
 let busy=false,sequence=0,trigger=null;
 function close(){if(busy)return;sequence++;modal.hidden=true;modal.replaceChildren();trigger?.focus?.()}
 window.TK7Backdrop.install(modal,e=>e.target===modal,close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 function open(){
  if(busy||!canManage())return;
  const chosen=getSession();if(!chosen)return;
  const generation=++sequence;trigger=document.activeElement;let plan=null,needsDate=false,textRevision=0;
  const input=el('textarea',{'aria-label':'วางข้อความรายชื่อจาก LINE',placeholder:'วางข้อความกลุ่มใหญ่ หรือกลุ่มย่อย พร้อมเลขครบ 7 ช่องต่อสี',maxLength:20000,style:'min-height:220px;resize:vertical'});
  const notice=el('p',{role:'status',text:'เฉพาะสีที่อยู่ในข้อความจะถูกปรับ สีที่ไม่ได้ส่งมาคงเดิม · ช่องว่างจะลบชื่อในช่องนั้น'});
  const dateCheck=el('input',{type:'checkbox'}),dateConfirm=el('label',{hidden:true},dateCheck,el('span',{text:'ข้อความไม่มีวันที่ — ยืนยันนำเข้าให้วันที่ '+chosen.match_date}));
  const output=el('div',{style:'max-height:240px;overflow:auto;margin:12px 0'});
  const review=el('button',{type:'button',class:'btn btn-secondary',text:'ตรวจสอบก่อนนำเข้า'});
  const apply=el('button',{type:'button',class:'btn btn-primary',text:'ยืนยันนำเข้า',disabled:true});
  const closeButton=el('button',{type:'button',class:'tk7l-x',text:'✕','aria-label':'ปิด',onclick:close});
  const invalidate=()=>{textRevision++;plan=null;apply.disabled=true;output.replaceChildren();dateConfirm.hidden=true;dateCheck.checked=false;notice.textContent='กดตรวจสอบเพื่อดูรายการที่จะเพิ่ม เปลี่ยน หรือลบ'};
  input.oninput=invalidate;dateCheck.onchange=()=>apply.disabled=!plan||(needsDate&&!dateCheck.checked);
  review.onclick=async()=>{
   if(busy)return;plan=null;apply.disabled=true;review.disabled=true;output.replaceChildren();
   try{
    const reviewedText=input.value,revision=textRevision;
    const parsed=window.TK7RosterText.parse(reviewedText);
    if(parsed.date&&parsed.date!==chosen.match_date)throw Error('วันที่ในข้อความไม่ตรงกับวันที่เลือก');
    if(!await refresh())throw Error('โหลดรายชื่อล่าสุดไม่สำเร็จ กรุณาตรวจสอบใหม่');
    if(generation!==sequence)return;
    if(revision!==textRevision||input.value!==reviewedText){notice.textContent='ข้อความเปลี่ยนระหว่างตรวจสอบ กรุณากดตรวจสอบใหม่';return;}
    const latest=getSession();if(!canManage()||latest?.id!==chosen.id)throw Error('วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดนำเข้าใหม่');
    if(!latest.is_open)throw Error('ปิดลงทะเบียนแล้ว กรุณาเปิดลงทะเบียนก่อนนำเข้า');
    const diff=window.TK7RosterText.diff(parsed,latest);
    notice.textContent='วันที่ '+latest.match_date+' · เพิ่ม '+diff.added+' · เปลี่ยน '+diff.changed+' · ลบ '+diff.deleted+' คน';
    for(const item of diff.changes)output.append(el('p',{text:'ทีม'+window.TK7RosterText.labels[item.team]+' #'+item.slot+': '+(item.before||'(ว่าง)')+' → '+(item.after||'(ว่าง)'),style:item.kind==='delete'?'color:#b3261e':''}));
    if(!diff.changes.length){notice.textContent+=' · ตรงกับระบบแล้ว';return;}
    plan={p_session:latest.id,p_request:crypto.randomUUID(),p_revision:latest.revision,p_match_date:latest.match_date,p_blocks:diff.blocks};
    needsDate=!parsed.date;dateConfirm.hidden=!needsDate;dateCheck.checked=false;apply.disabled=needsDate;
   }catch(error){notice.textContent=errText(error)}
   finally{review.disabled=false;}
  };
  apply.onclick=async()=>{
   if(busy||!plan||needsDate&&!dateCheck.checked)return;
   if(!canManage()||getSession()?.id!==chosen.id){notice.textContent='วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดนำเข้าใหม่';return;}
   busy=true;setBusy(true);input.disabled=true;review.disabled=true;apply.disabled=true;dateCheck.disabled=true;
   try{
    const result=await rpc('tk7_admin_import_roster',plan);
    afterSave(chosen.id,result);await refresh();busy=false;close();message('นำเข้าแล้ว: เพิ่ม '+result.added+' · เปลี่ยน '+result.changed+' · ลบ '+result.deleted+' คน');
   }catch(error){notice.textContent=errText(error);if(error.message==='Roster changed; refresh first'){plan=null;notice.textContent='มีคนแก้รายชื่อระหว่างนี้ กรุณากดตรวจสอบใหม่';}}
   finally{busy=false;setBusy(false);input.disabled=false;review.disabled=false;dateCheck.disabled=false;apply.disabled=!plan||(needsDate&&!dateCheck.checked);}
  };
  modal.replaceChildren(el('section',{class:'tk7l-sheet'},el('div',{class:'tk7l-sheet-head'},el('strong',{text:'📥 นำเข้าจาก LINE · '+chosen.match_date}),closeButton),el('div',{class:'tk7l-sheet-body'},input,notice,output,dateConfirm,review,apply)));
  modal.hidden=false;input.focus();
 }
 return {open,close};
}};
