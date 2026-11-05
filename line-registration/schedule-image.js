globalThis.TK7ScheduleImage=(()=>{
 const assets=typeof document!=='undefined'?new URL('.',document.currentScript.src):null;
 const query=typeof document!=='undefined'?new URL(document.currentScript.src).search:'';
 const cache=new Map();
 const deadline=(promise,ms,message)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(message)),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})});
 const key=s=>JSON.stringify(s);
 const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function buildDocument(schedule,css){
  const S=globalThis.TK7Schedule;
  const date=new Date(schedule.date+'T00:00:00+07:00').toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Bangkok'});
  const cards=S.rows(schedule).map(r=>'<div class="card match-card"><div class="match-header"><span>แมตช์ที่ '+r.number+'</span><span>⏱️ '+r.time+'</span></div><div class="match-body"><div class="team-emblem '+escape(r.home)+'">ทีม'+escape(S.label(r.home))+'</div><span class="vs">VS</span><div class="team-emblem '+escape(r.away)+'">ทีม'+escape(S.label(r.away))+'</div></div></div>').join('');
  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=860"><link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700&display=swap" rel="stylesheet"><style>'+css+'</style><style>html,body{margin:0;padding:0;min-height:0;background:#3d8b37}.capture-stage{position:relative!important;z-index:1!important;clip-path:none!important;-webkit-clip-path:none!important;left:auto!important;top:auto!important;opacity:1!important;pointer-events:auto!important}.temp-export-container{width:860px!important;box-sizing:border-box;overflow:hidden}</style></head><body><div id="schedule-export" class="temp-export-container capture-stage pitch-export-bg"><div class="export-header"><h1>⚽ ตารางการแข่งขัน</h1><h2>วันที่ '+escape(date)+'</h2></div><div id="schedule-container" class="export-mode-grid" style="grid-template-rows:repeat('+Math.ceil(schedule.matches.length/2)+',auto)">'+cards+'</div></div></body></html>';
 }
 let cssPromise;
 function prepare(schedule){
  const id=key(schedule);if(cache.has(id))return cache.get(id).promise;
  const entry={};cache.set(id,entry);
  entry.promise=(async()=>{
   const css=await (cssPromise||=(fetch(new URL('schedule-web.css'+query,assets),{signal:AbortSignal.timeout(15000)}).then(r=>{if(!r.ok)throw Error('โหลดรูปแบบตารางไม่สำเร็จ');return r.text();}).catch(e=>{cssPromise=null;throw e})));
   const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-12000px;top:0;width:860px;height:1000px;border:0;pointer-events:none';
   try{
    const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject;});
    frame.srcdoc=buildDocument(schedule,css);document.body.append(frame);await deadline(loaded,15000,'โหลดหน้ารูปตารางไม่สำเร็จ');
    const doc=frame.contentDocument,win=frame.contentWindow;
    if(doc.fonts?.ready)await deadline(doc.fonts.ready,10000,'โหลดฟอนต์ตารางไม่สำเร็จ');
    await deadline(new Promise((resolve,reject)=>{const script=doc.createElement('script');script.src=new URL('vendor/html2canvas-1.4.1.min.js',assets).href;script.integrity='sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H';script.crossOrigin='anonymous';script.onload=resolve;script.onerror=()=>reject(Error('โหลดตัวสร้างรูปไม่สำเร็จ'));doc.head.append(script);}),15000,'โหลดตัวสร้างรูปไม่สำเร็จ');
    const target=doc.getElementById('schedule-export');
    // Offscreen iframes may never receive animation frames. Flush layout directly.
    target.getBoundingClientRect();
    const height=target.scrollHeight,scale=Math.min(2.2,Math.sqrt(16000000/(860*Math.max(1,height))));
    const canvas=await deadline(win.html2canvas(target,{backgroundColor:'#3d8b37',useCORS:true,scale,logging:false,windowWidth:860,windowHeight:height}),25000,'สร้างรูปตารางนานเกินไป กรุณาลองอีกครั้ง');
    const blob=await deadline(new Promise(resolve=>canvas.toBlob(resolve,'image/png')),5000,'แปลงรูปตารางไม่สำเร็จ');
    canvas.width=0;canvas.height=0;
    if(!blob||blob.size<500)throw Error('สร้างรูปตารางไม่สำเร็จ กรุณาลองอีกครั้ง');
    entry.blob=blob;entry.file=new File([blob],'TK7-Schedule-'+schedule.date+'.png',{type:'image/png'});entry.url=URL.createObjectURL(blob);
    for(const [k,old] of cache){if(cache.size>2&&k!==id&&old.url){URL.revokeObjectURL(old.url);cache.delete(k);}}
    return entry;
   }finally{frame.remove();}
  })().catch(error=>{cache.delete(id);throw error;});
  return entry.promise;
 }
 function deliver(entry,env=globalThis){
  const nav=env.navigator;
  const download=()=>{const a=env.document.createElement('a');a.href=entry.url;a.download=entry.file.name;env.document.body.append(a);a.click();a.remove();return 'download';};
  const copy=()=>{try{if(env.ClipboardItem&&nav.clipboard?.write)return Promise.resolve(nav.clipboard.write([new env.ClipboardItem({'image/png':entry.blob})])).then(()=>'copied',download);}catch{}return Promise.resolve(download());};
  if(/Android|iPhone|iPad|iPod/i.test(nav.userAgent||'')||(nav.maxTouchPoints>1&&/Macintosh/i.test(nav.userAgent||''))){
   try{if(nav.canShare?.({files:[entry.file]}))return Promise.resolve(nav.share({files:[entry.file],title:'TK7 ตารางการแข่งขัน'})).then(()=>'shared',error=>error?.name==='AbortError'?'cancelled':copy());}catch{}
  }
  return copy();
 }
 return {buildDocument,prepare,peek:s=>cache.get(key(s)),deliver};
})();
