// Capture before LIFF consumes redirect query parameters.
(()=>{
 const q=new URLSearchParams(location.search);
 const nested=new URLSearchParams((q.get('liff.state')||'').split('?')[1]||'');
 window.TK7_SHARE_ONLY=q.get('quick')==='1'||nested.get('quick')==='1';
 const returnOrigin=q.get('returnOrigin')||nested.get('returnOrigin');
 const allowed=['https://puimanagerfootball.github.io','https://tk7-line-registration-odf.md-8887.chatgpt.site','https://tk7-line-registration-odf.joviallemur25.chatgpt.site'];
 window.TK7_SHARE_RETURN_ORIGIN=allowed.includes(returnOrigin)?returnOrigin:location.origin;
 if(window.TK7_SHARE_ONLY){
  const style=document.createElement('style');
  style.textContent='#board,#dates,#info,#title,#refresh,.lang{display:none!important}.tk7-share>summary{display:none}.wrap{padding-bottom:24px!important}';
  document.head.append(style);
  document.title='TK7 · แชร์การ์ด / Share card';
 }
})();
