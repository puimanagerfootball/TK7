import {buildMenuMessage,shareAvailability,shareErrorText,closeSharedView} from './share-card.mjs?v=20261103-root-share';
export {buildMenuMessage,shareAvailability,shareErrorText,closeSharedView};

const explicitShareView=()=>{
 if(typeof document==='undefined')return false;
 const q=new URLSearchParams(location.search);
 return window.TK7_SHARE_ONLY||document.body.dataset.menuPreview==='true'||q.get('share')==='1'||new URLSearchParams((q.get('liff.state')||'').split('?')[1]||'').get('share')==='1';
};
if(explicitShareView()) {
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
 if(window.TK7_SHARE_ONLY){
  panel.querySelector('.tk7-card').remove();
  const title=document.createElement('h2');title.textContent='แชร์ลงทะเบียน / Share signup';title.style.cssText='font-size:20px;margin:20px 0';
  panel.querySelector('.tk7-share-inner').prepend(title);
  button.textContent='↗ เลือกกลุ่ม LINE / Choose recipients';
 }
 button.style.cssText='display:block;width:100%;padding:15px 10px;border:0;border-radius:12px;background:#b9ed83;color:#123d2b;font:inherit;font-size:15px;font-weight:bold;cursor:pointer';
 const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='text-align:center;padding:0 8px;white-space:pre-line;overflow-wrap:anywhere;font-size:12px;line-height:1.6';
 const back=document.createElement('a');back.href='https://puimanagerfootball.github.io/TK7/';back.textContent='กลับ TK7 / Back to TK7';back.style.cssText='display:none;text-align:center;margin-top:12px;padding:12px;color:#b9ed83';
 panel.querySelector('.tk7-share-inner').append(button,status,back);
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
   if(result?.status==='success')back.style.display='block';
   closeSharedView(result,liff,window,window.TK7_SHARE_ONLY||shareRequested());
  }catch(error){status.textContent=shareErrorText(error);}
  finally{button.disabled=false;}
 });
 // Never open the picker on load: it must remain in the user's click event.
}
