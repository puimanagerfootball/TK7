// A plain-text snapshot: never include account IDs, tokens or private settings.
globalThis.TK7RosterSummary={build(session){
 if(!session||!/^\d{4}-\d{2}-\d{2}$/.test(session.match_date||''))throw Error('กรุณาเลือกวันลงทะเบียน');
 const teams=[['green','🟢','เขียว / Green'],['red','🔴','แดง / Red'],['white','⚪','ขาว / White'],['blue','🔵','ฟ้า / Blue'],['black','⚫','ดำ / Black'],['yellow','🟡','เหลือง / Yellow'],['pink','🩷','ชมพู / Pink'],['orange','🟠','ส้ม / Orange'],['navy','🔷','น้ำเงิน / Navy'],['purple','🟣','ม่วง / Purple']];
 const clean=value=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim():'';
 const entries=(Array.isArray(session.roster?.entries)?session.roster.entries:[]).filter(e=>e&&teams.some(t=>t[0]===e.team)&&clean(e.name));
 const presets=Array.isArray(session.preset_teams)?session.preset_teams:[];
 const active=teams.filter(t=>presets.includes(t[0])||entries.some(e=>e.team===t[0]));
 const date=session.match_date.split('-').reverse().map((x,i)=>i<2?String(Number(x)):x).join('-');
 const time=/^([01]\d|2[0-3]):[0-5]\d/.test(session.start_time||'')?session.start_time.slice(0,5):'20:00';
 const lines=['⚽ TK7 · สรุปรายชื่อ / Player summary','📅 '+date+' · 🕗 '+time,'👥 '+entries.length+' คน / players · '+active.length+' ทีม / teams',session.is_open?'🟢 เปิดรับ / Open':'🔒 ปิดลงทะเบียน / Closed'];
 for(const [slug,icon,label] of active){
  const players=entries.filter(e=>e.team===slug).sort((a,b)=>(Number(a.slot)||0)-(Number(b.slot)||0));
  lines.push('',icon+' '+label+' ('+players.length+'/7)');
  if(!players.length)lines.push('ยังไม่มีผู้ลงชื่อ / No players');
  for(let slot=1;slot<=7;slot++){
   const player=players.find(e=>Number(e.slot)===slot);
   lines.push(slot+'.'+(player?' '+clean(player.name):''));
  }
 }
 if(!entries.length)lines.push('','ยังไม่มีผู้ลงชื่อ / No players yet');
 lines.push('',session.is_open?'ดูรายชื่อล่าสุด / Latest roster:':'หน้าลงทะเบียน / Registration:',
  'https://liff.line.me/2012278818-W0pIi2y0'+(session.is_open?'?date='+session.match_date:''),'สำเนารายชื่อ ณ ตอนเปิดสรุป / Snapshot');
 const text=lines.join('\n');
 if(text.length>5000)throw Error('รายชื่อยาวเกินขนาดข้อความ LINE กรุณาลดความยาวชื่อก่อนส่ง');
 return text;
}};
