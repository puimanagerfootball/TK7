export function shareAvailability(liff) {
 const context=liff.getContext?.()||{};
 const feature=context.availability?.shareTargetPicker;
 return {
  release:'share-check-2',
  available:liff.isApiAvailable('shareTargetPicker'),
  permission:feature?.permission??'unknown',
  line:liff.getLineVersion?.()||'external',
  os:liff.getOS?.()||'unknown',
  inLine:liff.isInClient?.()??false,
  liffId:context.liffId||liff.id||'unknown',
 };
}

export function shareErrorText(error){
 const code=typeof error?.code==='string'?error.code.slice(0,60):'UNKNOWN';
 const message=typeof error?.message==='string'?error.message.trim().slice(0,300):'';
 if(code==='EXCEPTION_IN_SUBWINDOW')return 'LINE เปิดหน้าต่างเลือกผู้รับไม่สำเร็จ กรุณาอนุญาตป๊อปอัปแล้วกดแชร์อีกครั้ง / Allow pop-ups and tap Share again.\nรหัส / Code: '+code;
 return (message||'LINE ยังแชร์ไม่สำเร็จ กรุณากดแชร์อีกครั้ง / LINE could not share. Please tap Share again.')+'\nรหัส / Code: '+code;
}

export function closeSharedView(result,liff,view,shareOnly){
 if(result?.status!=='success'||!shareOnly)return false;
 if(view.opener){
  try{view.opener.postMessage({type:'tk7-card-shared'},view.TK7_SHARE_RETURN_ORIGIN||view.location.origin);}catch{}
 }
 // A mobile LIFF window usually has no window.opener. Close it via LINE.
 if(liff.isInClient?.()){
  try{liff.closeWindow();return true;}catch{return false;}
 }
 if(view.opener){try{view.close();return true;}catch{}}
 return false;
}

export function buildMenuMessage(url='https://liff.line.me/2012278818-W0pIi2y0') {
 const row=(icon,label,value,extra={})=>({type:'box',layout:'horizontal',spacing:'md',alignItems:'center',backgroundColor:'#f2f6f4',cornerRadius:'12px',paddingAll:'16px',contents:[{type:'text',text:icon,size:'xl',flex:0},{type:'box',layout:'vertical',spacing:'xs',flex:1,contents:[{type:'text',text:label,size:'xs',color:'#71867c',wrap:true},{type:'text',text:value,size:'lg',weight:'bold',color:'#142b20',wrap:true,...extra}]}]});
 const location=row('📍','Location / สถานที่','Google Maps ›',{color:'#1674ed'});
 location.action={type:'uri',label:'แผนที่ / Google Maps',uri:'https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA'};
 return {type:'flex',altText:'⚽ TK7 FOOTBALL · ลงชื่อ / Join the game',contents:{type:'bubble',size:'mega',header:{type:'box',layout:'vertical',backgroundColor:'#123d2b',paddingAll:'24px',spacing:'md',contents:[{type:'text',text:'TK7 / FOOTBALL CLUB',weight:'bold',size:'xs',color:'#b9ed83'},{type:'text',text:'⚽ LET’S PLAY\nFOOTBALL.',weight:'bold',size:'xxl',color:'#ffffff',wrap:true},{type:'text',text:'@ TK7 Stadium',weight:'bold',size:'md',color:'#c5ee80'}]},body:{type:'box',layout:'vertical',spacing:'md',paddingAll:'20px',contents:[{type:'text',text:'เลือกวัน · เลือกทีม · ใส่ชื่อ',size:'lg',weight:'bold',color:'#163d2a',wrap:true},{type:'text',text:'Choose a date. Pick a team. Add your name.',size:'xs',color:'#687e70',wrap:true},location]},footer:{type:'box',layout:'vertical',paddingAll:'20px',paddingTop:'0px',spacing:'sm',contents:[{type:'button',style:'primary',color:'#247c43',height:'md',action:{type:'uri',label:'⚽ ลงชื่อ / JOIN THE GAME',uri:url}},{type:'text',text:'ดูรายชื่อและจัดการทีมได้ในลิงก์เดียว\nView players & manage your team',size:'xxs',align:'center',color:'#687e70',wrap:true}]}}};
}

if(typeof document!=='undefined') {
 const css=document.createElement('style');css.textContent=`
 .tk7-share{margin:16px 0;border:1px solid #ffffff30;border-radius:18px;background:#102f21;overflow:hidden;color:#fff}.tk7-share summary{padding:17px 18px;cursor:pointer;font-weight:600;font-size:15px}.tk7-share summary small{display:block;margin:5px 0 0 18px;color:#c6dace;font-size:11px;font-weight:400}.tk7-share-inner{padding:0 14px 14px}
 .tk7-card{background:#fff;color:#163d2a;border-radius:16px;overflow:hidden;max-width:340px;margin:0 auto 16px;box-shadow:0 12px 30px #0003}.tk7-card-head{padding:24px;background:radial-gradient(circle at 110% 0%,#397450,transparent 65%),#123d2b}.tk7-card-kicker{font-size:10px;letter-spacing:.15em;color:#b9ed83;font-weight:700}.tk7-card h2{font:800 32px/1.08 Arial,sans-serif;letter-spacing:-1px;color:#fff;margin:20px 0 12px}.tk7-card-head p{color:#c5ee80;font-size:15px;font-weight:600;margin:0}.tk7-card-body{padding:20px}.tk7-card h3{font-size:19px;margin:0 0 6px}.tk7-card-description{font-size:11px;color:#687e70;line-height:1.6;margin:0}.tk7-card-map{display:block;background:#f2f6f4;padding:16px;border-radius:12px;margin-top:18px;text-decoration:none;color:#1674ed;font-size:15px}.tk7-card-map small{display:block;font-size:11px;color:#687e70;margin-bottom:5px}.tk7-card-foot{padding:0 20px 18px}.tk7-card-join{display:block;background:#247c43;color:#fff!important;border-radius:10px;padding:16px 6px;text-align:center;text-decoration:none;font-weight:600;font-size:16px}.tk7-card-note{font-size:10px;line-height:1.6;text-align:center;color:#687e70;margin:10px 0 0}.tk7-share :focus-visible{outline:3px solid #93cd63;outline-offset:3px}
 `;document.head.append(css);
 const panel=document.createElement('details');panel.className='tk7-share';
 panel.innerHTML=`<summary>↗ แชร์การ์ดลงชื่อเข้ากลุ่ม<small>Share the football card to your LINE group</small></summary><div class="tk7-share-inner"><article class="tk7-card"><div class="tk7-card-head"><div class="tk7-card-kicker">TK7 / FOOTBALL CLUB</div><h2>⚽ LET’S PLAY<br>FOOTBALL.</h2><p>@ TK7 Stadium</p></div><div class="tk7-card-body"><h3>เลือกวัน · เลือกทีม · ใส่ชื่อ</h3><p class="tk7-card-description">Choose a date. Pick a team. Add your name.</p><a class="tk7-card-map" href="https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA"><small>📍 Location / สถานที่</small><strong>Google Maps ↗</strong></a></div><div class="tk7-card-foot"><a class="tk7-card-join" href="https://liff.line.me/2012278818-W0pIi2y0">⚽ ลงชื่อ / JOIN THE GAME</a><p class="tk7-card-note">ดูรายชื่อและจัดการทีมได้ในลิงก์เดียว<br>View players &amp; manage your team</p></div></article></div>`;
 // Keep outside #board, which registration.js replaces on every refresh.
 (document.querySelector('.top')||document.body).append(panel);
 const shareRequested=()=>{const q=new URLSearchParams(location.search);return q.get('share')==='1'||new URLSearchParams((q.get('liff.state')||'').split('?')[1]||'').get('share')==='1'};
 if(document.body.dataset.menuPreview==='true'||shareRequested()||window.TK7_SHARE_ONLY)panel.open=true;
 if(shareRequested())requestAnimationFrame(()=>panel.scrollIntoView({block:'start',behavior:'smooth'}));
 const button=document.createElement('button');
 button.type='button';button.textContent='↗ เลือกกลุ่มเพื่อแชร์ / Share to LINE';
 button.style.cssText='display:block;width:100%;padding:15px 10px;border:0;border-radius:12px;background:#b9ed83;color:#123d2b;font:inherit;font-size:15px;font-weight:bold;cursor:pointer';
 const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='text-align:center;padding:0 8px;white-space:pre-line;overflow-wrap:anywhere;font-size:12px;line-height:1.6';
 panel.querySelector('.tk7-share-inner').append(button,status);
 let sdkReady=false;
 button.disabled=true;status.textContent='กำลังเตรียม LINE… / Preparing LINE…';
 if(window.liff?.ready)window.liff.ready.then(()=>{
  sdkReady=true;button.disabled=false;
  status.textContent='กดปุ่มด้านบนเพื่อเลือกกลุ่ม / Tap the button above to choose recipients';
 });
 else{button.disabled=false;status.textContent='กรุณาเปิดผ่าน LINE / Please open in LINE';}
 button.addEventListener('click',async()=>{
  button.disabled=true;status.textContent='กำลังเปิดเมนูแชร์… / Opening share picker…';
  try {
   const liff=window.liff;
   if(!liff)throw new Error('กรุณาเปิดผ่าน LINE / Please open in LINE');
   if(!sdkReady)throw new Error('LINE ยังไม่พร้อม กรุณารอสักครู่ / LINE is not ready yet.');
   if(!liff.isLoggedIn()){liff.login({redirectUri:location.href});return;}
   const diagnostic=shareAvailability(liff);
   if(!diagnostic.available){
    const reason=diagnostic.permission===false
     ?'LINE ยังแจ้งว่าไม่ได้เปิดสิทธิ์แชร์สำหรับแอปนี้ / Sharing permission is not enabled for this app.'
     :'LINE ยังไม่รองรับการแชร์ในหน้าที่เปิดอยู่ / Sharing is unavailable in this browser or LINE version.';
    throw new Error(reason+'\nส่งรหัสด้านล่างให้ผู้ดูแล / Share this check with the admin:\n'+JSON.stringify(diagnostic));
   }
   const result=await liff.shareTargetPicker([buildMenuMessage()]);
   status.textContent=result?.status==='success'?'แชร์การ์ดแล้ว / Card shared':'ยกเลิกการแชร์ / Sharing cancelled';
   closeSharedView(result,liff,window,window.TK7_SHARE_ONLY||shareRequested());
  }catch(error){status.textContent=shareErrorText(error);}
  finally{button.disabled=false;}
 });
 // Never open the picker on load: it must remain in the user's click event.
}
