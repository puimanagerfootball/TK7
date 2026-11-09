// A plain-text snapshot: never include account IDs, tokens or private settings.
globalThis.TK7RosterSummary={build(session,{team=null}={}){
 if(!session||!/^\d{4}-\d{2}-\d{2}$/.test(session.match_date||''))throw Error('กรุณาเลือกวันลงทะเบียน');
 const teams=[['green','🟢','เขียว / Green'],['red','🔴','แดง / Red'],['white','⚪','ขาว / White'],['blue','🔵','ฟ้า / Blue'],['black','⚫','ดำ / Black'],['yellow','🟡','เหลือง / Yellow'],['pink','🩷','ชมพู / Pink'],['orange','🟠','ส้ม / Orange'],['navy','🔷','น้ำเงิน / Navy'],['purple','🟣','ม่วง / Purple']];
 const clean=value=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim():'';
 const entries=(Array.isArray(session.roster?.entries)?session.roster.entries:[]).filter(e=>e&&teams.some(t=>t[0]===e.team)&&clean(e.name));
 const presets=Array.isArray(session.preset_teams)?session.preset_teams:[];
 if(team&&!teams.some(t=>t[0]===team))throw Error('กรุณาเลือกสีทีม');
 const active=teams.filter(t=>team?t[0]===team:presets.includes(t[0])||entries.some(e=>e.team===t[0]));
 const date=session.match_date.split('-').reverse().map((x,i)=>i<2?String(Number(x)):x).join('-');
 const time=/^([01]\d|2[0-3]):[0-5]\d/.test(session.start_time||'')?session.start_time.slice(0,5):'20:00';
 const lines=['⚽ TK7 · สรุปรายชื่อ / Player summary','📅 '+date+' · 🕗 '+time,'📍 TK7 Stadium · Google Maps','https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA'];
 for(const [slug,icon,label] of active){
  const players=entries.filter(e=>e.team===slug).sort((a,b)=>(Number(a.slot)||0)-(Number(b.slot)||0));
  lines.push('',icon+' '+label);
  for(let slot=1;slot<=7;slot++){
   const player=players.find(e=>Number(e.slot)===slot);
   lines.push(slot+'.'+(player?' '+clean(player.name):''));
  }
 }
 const text=lines.join('\n');
 if(text.length>5000)throw Error('รายชื่อยาวเกินขนาดข้อความ LINE กรุณาลดความยาวชื่อก่อนส่ง');
 return text;
}};
