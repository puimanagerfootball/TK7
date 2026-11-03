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
  try{liff.closeWindow();return true;}catch{ /* Try the browser close below. */ }
 }
 // LINE's login redirects may clear opener even for a script-created popup.
 try{view.close();return true;}catch{}
 return false;
}

export function buildMenuMessage(url='https://liff.line.me/2012278818-W0pIi2y0') {
 const row=(icon,label,value,extra={})=>({type:'box',layout:'horizontal',spacing:'md',alignItems:'center',backgroundColor:'#f2f6f4',cornerRadius:'12px',paddingAll:'16px',contents:[{type:'text',text:icon,size:'xl',flex:0},{type:'box',layout:'vertical',spacing:'xs',flex:1,contents:[{type:'text',text:label,size:'xs',color:'#71867c',wrap:true},{type:'text',text:value,size:'lg',weight:'bold',color:'#142b20',wrap:true,...extra}]}]});
 const location=row('📍','Location / สถานที่','Google Maps ›',{color:'#1674ed'});
 location.action={type:'uri',label:'แผนที่ / Google Maps',uri:'https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA'};
 return {type:'flex',altText:'⚽ TK7 FOOTBALL · ลงชื่อ / Join the game',contents:{type:'bubble',size:'mega',header:{type:'box',layout:'vertical',backgroundColor:'#123d2b',paddingAll:'24px',spacing:'md',contents:[{type:'text',text:'TK7 / FOOTBALL CLUB',weight:'bold',size:'xs',color:'#b9ed83'},{type:'text',text:'⚽ LET’S PLAY\nFOOTBALL.',weight:'bold',size:'xxl',color:'#ffffff',wrap:true},{type:'text',text:'@ TK7 Stadium',weight:'bold',size:'md',color:'#c5ee80'}]},body:{type:'box',layout:'vertical',spacing:'md',paddingAll:'20px',contents:[{type:'text',text:'เลือกวัน · เลือกทีม · ใส่ชื่อ',size:'lg',weight:'bold',color:'#163d2a',wrap:true},{type:'text',text:'Choose a date. Pick a team. Add your name.',size:'xs',color:'#687e70',wrap:true},location]},footer:{type:'box',layout:'vertical',paddingAll:'20px',paddingTop:'0px',spacing:'sm',contents:[{type:'button',style:'primary',color:'#247c43',height:'md',action:{type:'uri',label:'⚽ ลงชื่อ / JOIN THE GAME',uri:url}},{type:'text',text:'ดูรายชื่อและจัดการทีมได้ในลิงก์เดียว\nView players & manage your team',size:'xxs',align:'center',color:'#687e70',wrap:true}]}}};
}

