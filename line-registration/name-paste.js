// Per-name seat quantities shared by the web and LINE registration forms.
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
 }
};
