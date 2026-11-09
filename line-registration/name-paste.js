// Fill the existing draft fields. The normal submit button saves the roster.
globalThis.TK7NamePaste={
 quantity({el,amount=1,english=false,disabled=false,onchange}){
  const label=english?'Number of spots for this name':'จำนวนที่สำหรับชื่อนี้';
  const options=Array.from({length:7},(_,i)=>el('option',{value:i+1,text:'×'+(i+1)}));
  const select=el('select',{class:'tk7l-quantity','aria-label':label,title:label,disabled,onchange},options);
  select.value=String(amount);
  return select;
 },
 slots(fields){
  return fields.reduce((sum,{quantity})=>sum+Number(quantity.value),0);
 },
 limitQuantities(fields,capacity){
  const remaining=capacity-this.slots(fields);
  for(const {quantity} of fields){
   const current=Number(quantity.value);
   for(const option of quantity.children){
    const value=Number(option.value);
    option.disabled=value>current&&value>current+remaining;
   }
  }
 },
 names(fields){
  return fields.flatMap(({input,quantity})=>{
   const name=input.value.trim().replace(/\s+/g,' ');
   return name?Array(Number(quantity.value)).fill(name):[];
  });
 },
 create({el,capacity,apply,english=false}){
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
 }
};
