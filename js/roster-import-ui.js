// Import is an explicit, admin-only preview/confirm flow. Pasting never writes.
globalThis.TK7RosterImportUI={create({el,getSession,refresh,rpc,canManage,setBusy=()=>{},afterSave=()=>{},message=()=>{},errText=e=>e.message}){
 const modal=el('div',{class:'tk7l-modal',role:'dialog','aria-modal':'true','aria-label':'นำเข้ารายชื่อจาก LINE',hidden:true});document.body.append(modal);
 let busy=false,sequence=0,trigger=null,reviewTimer=null;
 function cancelReview(){if(reviewTimer!==null)clearTimeout(reviewTimer);reviewTimer=null;}
 function close(){if(busy)return;cancelReview();sequence++;modal.hidden=true;modal.replaceChildren();trigger?.focus?.()}
 window.TK7Backdrop.install(modal,e=>e.target===modal,close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 function open(){
  if(busy||!canManage())return;
  const chosen=getSession();if(!chosen)return;
  cancelReview();
  const generation=++sequence;trigger=document.activeElement;let plan=null,needsDate=false,previewEpoch=0;
  const input=el('textarea',{'aria-label':'วางข้อความรายชื่อจาก LINE',placeholder:'วางข้อความกลุ่มใหญ่ หรือกลุ่มย่อย พร้อมเลขครบ 7 ช่องต่อสี',maxLength:20000,style:'min-height:220px;resize:vertical'});
  const notice=el('p',{role:'status',text:'เฉพาะสีที่อยู่ในข้อความจะถูกปรับ สีที่ไม่ได้ส่งมาคงเดิม · ช่องว่างจะลบชื่อในช่องนั้น'});
  const dateCheck=el('input',{type:'checkbox'}),dateConfirm=el('label',{hidden:true},dateCheck,el('span',{text:'ข้อความไม่มีวันที่ — ยืนยันนำเข้าให้วันที่ '+chosen.match_date}));
  const suggestions=el('div',{class:'tk7l-import-suggestions'});
  let suggestionChecks=[];
  const output=el('div',{class:'tk7l-import-preview'});
  const review=el('button',{type:'button',class:'btn btn-secondary',text:'ตรวจสอบก่อนนำเข้า'});
  const apply=el('button',{type:'button',class:'btn btn-primary',text:'ยืนยันนำเข้า',disabled:true});
  const closeButton=el('button',{type:'button',class:'tk7l-x',text:'✕','aria-label':'ปิด',onclick:close});
  const resetPreview=()=>{
   plan=null;apply.disabled=true;output.replaceChildren();suggestions.replaceChildren();suggestionChecks=[];
   dateConfirm.hidden=true;dateCheck.checked=false;
  };
  const queueReview=()=>{
   cancelReview();previewEpoch++;resetPreview();
   review.disabled=false;
   if(!input.value.trim()){
    notice.textContent='วางข้อความเพื่อตรวจสอบรายชื่อ';
    return;
   }
   notice.textContent='กำลังตรวจสอบ…';
   reviewTimer=setTimeout(runReview,300);
  };
  input.oninput=queueReview;dateCheck.onchange=()=>apply.disabled=!plan||(needsDate&&!dateCheck.checked);
  async function runReview(){
   cancelReview();
   if(busy||generation!==sequence)return;
   const ticket=++previewEpoch;
   resetPreview();review.disabled=true;notice.textContent='กำลังตรวจสอบ…';
   const current=()=>generation===sequence&&ticket===previewEpoch;
   try{
    const parsed=window.TK7RosterText.parse(input.value);
    if(parsed.date&&parsed.date!==chosen.match_date)throw Error('วันที่ในข้อความไม่ตรงกับวันที่เลือก');
    if(!await refresh())throw Error('โหลดรายชื่อล่าสุดไม่สำเร็จ กรุณาตรวจสอบใหม่');
    if(!current())return;
    const latest=getSession();if(!canManage()||latest?.id!==chosen.id)throw Error('วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดนำเข้าใหม่');
    if(!latest.is_open)throw Error('ปิดลงทะเบียนแล้ว กรุณาเปิดลงทะเบียนก่อนนำเข้า');
    const rosterText=window.TK7RosterText;
    const selected=new Set();
    const renderPreview=()=>{
     const blocks=parsed.blocks.map(block=>selected.has(block.team)?{...block,slots:Array(7).fill(block.slots.find(Boolean))}:block);
     const diff=rosterText.diff({...parsed,blocks},latest);
     output.replaceChildren();
     notice.textContent='รายการนำเข้า · '+latest.match_date;
     renderChanges(diff, selected, rosterText.labels, output);
     plan=diff.changes.length?{p_session:latest.id,p_request:crypto.randomUUID(),p_revision:latest.revision,p_match_date:latest.match_date,p_blocks:diff.blocks}:null;
     if(!plan)notice.textContent+=' · ตรงกับระบบแล้ว';
     dateConfirm.hidden=!needsDate||!plan;
     apply.disabled=!plan||(needsDate&&!dateCheck.checked);
    };
    needsDate=!parsed.date;
    renderPreview();
    const teamPrefix=/^(?:ทีม\s*|team\s+)/iu;
    const teamNameKey=name=>name.normalize('NFC').trim().replace(teamPrefix,'').trim().replace(/\s+/g,' ').toLowerCase();
    const existing=latest.roster?.entries||[];
    for(const block of parsed.blocks){
     const names=block.slots.filter(Boolean);
     if(names.length!==1)continue;
     const [name]=names;
     if(block.slots[0]&&!teamPrefix.test(name))continue;
     const key=teamNameKey(name);
     if(!key)continue;
     const replaced=existing.filter(entry=>entry.team===block.team&&teamNameKey(entry.name)!==key).length;
     const checkbox=el('input',{type:'checkbox',onchange:()=>{
      if(busy)return;
      if(checkbox.checked)selected.add(block.team);else selected.delete(block.team);
      renderPreview();
     }});
     suggestionChecks.push(checkbox);
     const description=el('span',{},el('span',{text:'จองสี'+rosterText.labels[block.team]+' ทั้งทีม 7 ที่ให้ “'+name+'”'}));
     if(replaced)description.append(el('small',{class:'tk7l-import-replace',text:'หากเลือก จะลงชื่อทีมแทน '+replaced+' ชื่อเดิมในสีนี้'}));
     suggestions.append(el('label',{},checkbox,description));
    }
   }catch(error){if(current())notice.textContent=errText(error)}
   finally{if(current())review.disabled=false;}
  }
  review.onclick=runReview;
  apply.onclick=async()=>{
   if(busy||!plan||needsDate&&!dateCheck.checked)return;
   if(!canManage()||getSession()?.id!==chosen.id){notice.textContent='วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดนำเข้าใหม่';return;}
   busy=true;setBusy(true);input.disabled=true;review.disabled=true;apply.disabled=true;dateCheck.disabled=true;
   suggestionChecks.forEach(check=>check.disabled=true);
   try{
    const result=await rpc('tk7_admin_import_roster',plan);
    afterSave(chosen.id,result);await refresh();busy=false;close();message('นำเข้าแล้ว: เพิ่ม '+result.added+' · เปลี่ยน '+result.changed+' · ลบ '+result.deleted+' คน');
   }catch(error){notice.textContent=errText(error);if(error.message==='Roster changed; refresh first'){queueReview();notice.textContent='รายชื่อเพิ่งเปลี่ยน กำลังตรวจสอบใหม่…';}}
   finally{busy=false;setBusy(false);input.disabled=false;review.disabled=false;dateCheck.disabled=false;suggestionChecks.forEach(check=>check.disabled=false);apply.disabled=!plan||(needsDate&&!dateCheck.checked);}
  };
  const actions=el('div',{class:'tk7l-import-actions'},review,apply);
  modal.replaceChildren(el('section',{class:'tk7l-sheet'},el('div',{class:'tk7l-sheet-head'},el('strong',{text:'นำเข้าจาก LINE · '+chosen.match_date}),closeButton),el('div',{class:'tk7l-sheet-body'},input,suggestions,notice,output,dateConfirm,actions)));
  modal.hidden=false;input.focus();
 }
 function renderChanges(diff,selected,labels,output){
  if(!diff.changes.length)return;
  const badge=(kind,count)=>el('span',{class:'tk7l-import-count '+kind,text:({add:'เพิ่ม',change:'เปลี่ยน',delete:'ลบ'}[kind])+' '+count});
  output.append(el('div',{class:'tk7l-import-counts'},badge('add',diff.added),badge('change',diff.changed),badge('delete',diff.deleted)));
  if(diff.deleted)output.append(el('p',{class:'tk7l-import-warning',text:'รายการนี้จะลบ '+diff.deleted+' ชื่อ กดที่สีทีมเพื่อดูรายละเอียดก่อนยืนยัน'}));
  for(const block of diff.blocks){
   const rows=diff.changes.filter(item=>item.team===block.team);
   if(!rows.length)continue;
   const counts=['add','change','delete'].map(kind=>{
    const count=rows.filter(item=>item.kind===kind).length;
    return count?badge(kind,count):null;
   }).filter(Boolean);
   const label='ทีม'+labels[block.team]+(selected.has(block.team)?' · '+block.slots[0]+' ×7':'');
   const details=el('details',{class:'tk7l-import-team',open:selected.has(block.team)&&rows.some(item=>item.kind==='change')},
    el('summary',{},el('span',{class:'tk7l-import-team-summary'},el('strong',{text:label}),el('span',{class:'tk7l-import-counts'},...counts))),
    el('ul',{},...rows.map(item=>el('li',{class:item.kind,text:'#'+item.slot+' '+(item.before||'(ว่าง)')+' → '+(item.after||'(ว่าง)')}))));
   output.append(details);
  }
 }
 return {open,close};
}};
