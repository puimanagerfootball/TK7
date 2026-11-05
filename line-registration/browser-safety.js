// Keep recovery scoped to this app; other GitHub Pages apps share an origin.
(function(){
 const colours=new Set(['green','red','white','blue','black','yellow','pink','orange','navy','purple']);
 function readCollapsed(storage){
  try{const value=JSON.parse(storage.getItem('tk7-collapsed')||'[]');return Array.isArray(value)?value.filter(x=>colours.has(x)):[]}catch{return[]}
 }
 async function retireOwnWorker(serviceWorker,baseURI){
  try{
   const base=new URL('./',baseURI),scripts=new Set(['sw.js','service-worker.js'].map(p=>new URL(p,base).href));
   const registrations=await serviceWorker.getRegistrations();
   const own=registrations.filter(r=>r.scope===base.href&&[r.active,r.waiting,r.installing].some(w=>w&&scripts.has(w.scriptURL)));
   const results=await Promise.all(own.map(r=>Promise.resolve().then(()=>r.unregister()).catch(()=>false)));
   return results.some(Boolean);
  }catch{return false}
 }
 globalThis.TK7BrowserSafety={readCollapsed,retireOwnWorker};
})();
