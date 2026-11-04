// A drag or text selection ending on the backdrop is not a dismissal tap.
function createTK7BackdropGuard(isBackdrop,onDismiss){
 let start=null,end=null;
 return {
  pointerdown(e){start=e.button===0&&isBackdrop(e)?{target:e.target,id:e.pointerId,x:e.clientX,y:e.clientY}:null;end=null;},
  pointerup(e){end=start&&e.pointerId===start.id?{target:e.target,x:e.clientX,y:e.clientY}:null;},
  pointercancel(){start=null;end=null;},
  click(e){
   const valid=start&&end&&isBackdrop(e)&&start.target===e.target&&end.target===e.target&&Math.hypot(end.x-start.x,end.y-start.y)<=8;
   start=null;end=null;
   if(valid)onDismiss();
  }
 };
}
if(typeof window!=='undefined')window.TK7Backdrop={
 install(root,isBackdrop,onDismiss){
  const guard=createTK7BackdropGuard(isBackdrop,onDismiss),doc=root.ownerDocument||document;
  doc.addEventListener('pointerdown',guard.pointerdown,true);
  doc.addEventListener('pointerup',guard.pointerup,true);
  doc.addEventListener('pointercancel',guard.pointercancel,true);
  root.addEventListener('click',guard.click);
 }
};
