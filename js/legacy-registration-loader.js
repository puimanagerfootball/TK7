// Keep the text-copy menu available without parsing its tools on every page load.
globalThis.TK7LegacyRegistrationLoader=(()=>{
 const source=new URL(document.currentScript.src);
 function bind(options){
  const button=document.getElementById('copy-reg-template-btn');let ready=null;
  const load=()=>ready||=(async()=>{
   const script=document.createElement('script'),style=document.createElement('link');
   script.src=new URL('legacy-registration.js'+source.search,source).href;
   style.rel='stylesheet';style.href=new URL('../css/legacy-registration.css'+source.search,source).href;
   try{
    await Promise.all([script,style].map(element=>new Promise((resolve,reject)=>{element.onload=resolve;element.onerror=()=>reject(Error('โหลดเมนูคัดลอกข้อความไม่สำเร็จ กรุณาลองใหม่'));document.head.append(element)})));
    const menu=window.TK7LegacyRegistration.create(options);menu.mount({bindTrigger:false});return menu;
   }catch(error){script.remove();style.remove();ready=null;throw error}
  })();
  button.addEventListener('click',async()=>{
   if(button.disabled)return;
   const label=button.textContent;button.disabled=true;button.textContent='กำลังเตรียมเมนู…';
   try{(await load()).open()}catch(error){alert(error.message)}
   finally{button.disabled=false;button.textContent=label}
  });
 }
 return {bind};
})();
