// Parse both former numbered LINE templates and current seven-slot summaries.
globalThis.TK7RosterText=(()=>{
 const labels={green:'เขียว',red:'แดง',white:'ขาว',blue:'ฟ้า',black:'ดำ',yellow:'เหลือง',pink:'ชมพู',orange:'ส้ม',navy:'น้ำเงิน',purple:'ม่วง'};
 function teamFromHeader(line){
  if(/^\s*\d+\s*[.)]/u.test(line))return null;
  const text=line.trim();
  const english=[['navy',/\b(?:navy|dark blue)\b/i],['green',/\bgreen\b/i],['red',/\bred\b/i],['white',/\bwhite\b/i],['blue',/\bblue\b/i],['black',/\bblack\b/i],['yellow',/\byellow\b/i],['pink',/\bpink\b/i],['orange',/\borange\b/i],['purple',/\bpurple\b/i]];
  if(!/[/🟢🔴⚪🔵⚫🟡🩷💗🟠🔷🟣]|shirt|ทีม|^สี/iu.test(text))return null;
  for(const [slug,pattern] of english)if(pattern.test(text))return slug;
  if(/น้ำเงินเข้ม/.test(text))return 'navy';
  if(/สีน้ำเงิน/.test(text))return 'blue';
  for(const [slug,label] of Object.entries(labels))if(text.includes(label))return slug;
  return null;
 }
 function parse(text){
  if(typeof text!=='string'||!text.trim()||text.length>20000)throw Error('กรุณาวางข้อความรายชื่อ ไม่เกิน 20,000 ตัวอักษร');
  const blocks=[],dates=new Set();let block=null;
  const finish=()=>{
   if(!block)return;
   if(block.rows.length!==7)throw Error('ทีม'+labels[block.team]+': ต้องมีเลขครบ 7 ช่อง เพื่อป้องกันรายชื่อหาย');
   const start=block.rows[0].number;
   if(start<1||(start-1)%7!==0||block.rows.some((row,i)=>row.number!==start+i))throw Error('ทีม'+labels[block.team]+': เลขลำดับต้องต่อกัน 7 ช่อง');
   blocks.push({team:block.team,slots:block.rows.map(row=>row.name||null)});block=null;
  };
  for(const raw of text.replace(/\r\n?/g,'\n').split('\n')){
   const line=raw.trim();if(!line)continue;
   if(/^(?:📅|date\b|วันที่)/iu.test(line)){
    const match=line.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
    if(match){let year=Number(match[3]);if(year>2400)year-=543;const month=Number(match[2]),day=Number(match[1]);const value=new Date(Date.UTC(year,month-1,day));if(value.getUTCFullYear()!==year||value.getUTCMonth()!==month-1||value.getUTCDate()!==day)throw Error('วันที่ในข้อความไม่ถูกต้อง');dates.add(year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'));}
   }
   const row=line.match(/^(\d{1,2})\s*[.)]\s*(.*)$/u);
   if(row){
    if(!block)throw Error('พบรายชื่อที่ไม่มีหัวข้อสีทีม');
    const name=row[2].replace(/\s+/g,' ').trim();
    if(Array.from(name).length>40||/[\u0000-\u001f\u007f]/u.test(name))throw Error('ชื่อผู้เล่นต้องไม่เกิน 40 ตัวอักษร');
    block.rows.push({number:Number(row[1]),name});continue;
   }
   if(/^https?:\/\//i.test(line))continue;
   const team=teamFromHeader(line);
   if(team){finish();if(blocks.some(item=>item.team===team))throw Error('พบหัวข้อทีม'+labels[team]+'ซ้ำ กรุณาเลือกข้อความล่าสุดเพียงชุดเดียว');block={team,rows:[]};continue;}
   const metadata=/^(?:⚽|📅|🕗|📍|⏱|👥|🔒|https?:\/\/|ดูรายชื่อ|หน้าลงทะเบียน|ลงทะเบียน|สำเนารายชื่อ|ยังไม่มีผู้ลงชื่อ|no players|latest roster|registration|snapshot|kick-off|location|date|•)/iu.test(line);
   if(!metadata&&block)throw Error('อ่านบรรทัดนี้ไม่ได้ กรุณาใส่ชื่อหลังเลขลำดับ: '+line.slice(0,50));
  }
  finish();
  if(!blocks.length)throw Error('ไม่พบทีมและรายชื่อในข้อความ');
  if(dates.size>1)throw Error('พบหลายวันที่ในข้อความ กรุณาใช้รายชื่อวันเดียว');
  return {date:[...dates][0]||null,blocks};
 }
 function diff(parsed,session){
  if(parsed.date&&parsed.date!==session.match_date)throw Error('วันที่ในข้อความไม่ตรงกับวันที่เลือก');
  const current=session.roster?.entries||[],changes=[];
  for(const block of parsed.blocks){
   if(!session.teams.includes(block.team))throw Error('ทีม'+labels[block.team]+'ยังไม่เปิดให้ลงชื่อ');
   block.slots.forEach((after,index)=>{
    const before=current.find(entry=>entry.team===block.team&&entry.slot===index+1)?.name||null;
    if(before!==after)changes.push({team:block.team,slot:index+1,before,after,kind:!before?'add':!after?'delete':'change'});
   });
  }
  return {blocks:parsed.blocks,changes,added:changes.filter(x=>x.kind==='add').length,changed:changes.filter(x=>x.kind==='change').length,deleted:changes.filter(x=>x.kind==='delete').length};
 }
 return {parse,diff,teamFromHeader,labels};
})();
