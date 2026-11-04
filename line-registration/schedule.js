// Shared schedule formatting for the authenticated API, LIFF view and manual sharing.
globalThis.TK7Schedule=(()=>{
 const teams={green:['เขียว','Green','#34813a'],red:['แดง','Red','#d53532'],white:['ขาว','White','#647168'],blue:['ฟ้า','Blue','#1677c8'],black:['ดำ','Black','#212121'],yellow:['เหลือง','Yellow','#9b7900'],pink:['ชมพู','Pink','#ce3266'],orange:['ส้ม','Orange','#ba6800'],navy:['น้ำเงิน','Navy','#1a237e'],purple:['ม่วง','Purple','#8e24aa']};
 function normalize(day){
  if(!day||!/^\d{4}-\d{2}-\d{2}$/.test(day.match_date)||!Array.isArray(day.schedule)||!day.schedule.length)return null;
  if(day.schedule.some(m=>!m||!Object.hasOwn(teams,m.home)||!Object.hasOwn(teams,m.away)||m.home===m.away))return null;
  const settings=day.settings||{},startTime=/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(settings.startTime)?settings.startTime.slice(0,5):'20:00';
  const duration=Number(settings.timePerMatch);
  return {date:day.match_date,startTime,timePerMatch:Number.isInteger(duration)&&duration>=1&&duration<=60?duration:8,matches:day.schedule.map(m=>({home:m.home,away:m.away}))};
 }
 const label=(slug,lang='th')=>teams[slug]?.[lang==='en'?1:0]||slug;
 const dateLabel=date=>date.split('-').reverse().join('-');
 function rows(schedule){
  const [h,m]=schedule.startTime.split(':').map(Number);
  return schedule.matches.map((match,index)=>{const minutes=h*60+m+index*schedule.timePerMatch;return {...match,number:index+1,time:String(Math.floor(minutes/60)%24).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0')};});
 }
 function buildMessage(schedule){
  const list=rows(schedule),pages=[];
  if(list.length>240)throw Error('Schedule is too long to share as a card');
  for(let offset=0;offset<list.length;offset+=20){
   pages.push({type:'bubble',size:'giga',header:{type:'box',layout:'vertical',backgroundColor:'#1F6B3A',paddingAll:'16px',contents:[{type:'text',text:'⚽ TK7 · MATCH SCHEDULE',weight:'bold',size:'md',color:'#FFFFFF'},{type:'text',text:dateLabel(schedule.date)+' · '+schedule.timePerMatch+' min / นาที',size:'xs',color:'#D9F2DF',margin:'sm'}]},body:{type:'box',layout:'vertical',spacing:'sm',paddingAll:'14px',contents:list.slice(offset,offset+20).map(r=>({type:'box',layout:'horizontal',spacing:'sm',contents:[{type:'text',text:r.number+'. '+r.time,size:'xs',color:'#61756A',flex:0,width:'72px'},{type:'text',text:label(r.home)+' / '+label(r.home,'en'),color:teams[r.home][2],size:'xs',flex:1,wrap:true},{type:'text',text:'vs',size:'xxs',color:'#8C9D92',flex:0},{type:'text',text:label(r.away)+' / '+label(r.away,'en'),color:teams[r.away][2],size:'xs',flex:1,wrap:true}]}))},footer:{type:'box',layout:'vertical',contents:[{type:'button',style:'primary',color:'#247A43',action:{type:'uri',label:'ดูตารางล่าสุด / View schedule',uri:'https://liff.line.me/2012278818-W0pIi2y0?date='+schedule.date+'&view=schedule'}}]}});
  }
  return {type:'flex',altText:'⚽ TK7 ตารางแข่ง / Schedule · '+dateLabel(schedule.date)+' · '+list.length+' matches',contents:pages.length===1?pages[0]:{type:'carousel',contents:pages}};
 }
 function share(sdk,schedule){
  if(!schedule?.matches?.length)throw Error('ยังไม่มีตารางแข่ง / No schedule yet');
  if(!sdk.isApiAvailable('shareTargetPicker'))throw Error('กรุณาเปิดผ่าน LINE และตรวจสอบสิทธิ์แชร์ / Please open in LINE and enable sharing');
  // Keep the picker in the original click; never fetch or await before this call.
  return sdk.shareTargetPicker([buildMessage(schedule)]);
 }
 return {normalize,rows,label,dateLabel,buildMessage,share};
})();
