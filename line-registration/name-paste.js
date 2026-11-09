// Fill the existing draft fields. The normal submit button saves the roster.
globalThis.TK7NamePaste={create({el,capacity,apply,english=false}){
 const label=english?'Paste multiple names':'วางรายชื่อหลายคน';
 const hint=english?'One name per line':'หนึ่งชื่อต่อบรรทัด';
 const input=el('textarea',{rows:4,placeholder:hint,'aria-label':hint});
 const notice=el('p',{class:'hint','aria-live':'polite'});
 const panel=el('details',{class:'tk7l-name-paste'},el('summary',{text:label}),input,notice);
 const use=el('button',{type:'button',class:'tk7l-paste-apply',text:english?'Replace draft names':'แทนรายชื่อในแบบฟอร์ม',onclick:()=>{
  const names=input.value.split(/\r\n?|\n/).map(line=>line.trim().replace(/\s+/g,' ')).filter(Boolean);
  if(!names.length){notice.textContent=hint;return;}
  if(names.length>capacity){
   notice.textContent=english?'Only '+capacity+' spots left. Remove extra names and try again.':'สีนี้ว่าง '+capacity+' ที่ กรุณาลดจำนวนชื่อก่อน';
   return;
  }
  if(names.some(name=>name.length>40||/[\u0000-\u001f\u007f]/.test(name))){
   notice.textContent=english?'Each name must be 40 characters or fewer.':'ชื่อละไม่เกิน 40 ตัวอักษร';
   return;
  }
  apply(names);
  input.value='';notice.textContent='';panel.open=false;
 }});
 input.oninput=()=>{notice.textContent='';};
 panel.append(use);
 return panel;
}};
