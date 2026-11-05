import {buildMenuMessage,shareAvailability} from './share-card.mjs?v=20261103-root-share';

export function createDirectShare({liffId,loadSdk,redirectUri}){
 const configured=typeof liffId==='string'&&/^\d+-[A-Za-z0-9]+$/.test(liffId)&&liffId!=='2012278818-W0pIi2y0';
 let sdk,state=configured?'loading':'unconfigured',failure;
 const ready=configured?Promise.resolve().then(loadSdk).then(async value=>{
  sdk=value;await sdk.init({liffId});state='ready';
 }).catch(error=>{failure=error;state='failed';}):Promise.resolve();
 return {
  configured,ready,get state(){return state;},
  // No await before the picker: preserve the user's original button gesture.
  share(messages=[buildMenuMessage()]){
   if(!configured)throw Error('ยังไม่ได้ตั้งค่าแชร์ตรง / Direct sharing is not configured.');
   if(state==='loading')throw Error('กำลังเชื่อมต่อ LINE กรุณารอสักครู่แล้วกดแชร์อีกครั้ง / LINE is loading. Please tap Share again shortly.');
   if(state==='failed')throw Error(failure?.message||'เชื่อมต่อ LINE ไม่สำเร็จ / LINE initialization failed.');
   if(!sdk.isLoggedIn()){
    sdk.login({redirectUri});return Promise.resolve({login:true});
   }
   const diagnostic=shareAvailability(sdk);
   if(!diagnostic.available)throw Error('LINE ยังไม่พร้อมแชร์ / LINE sharing unavailable.\n'+JSON.stringify(diagnostic));
   if(!Array.isArray(messages)||messages.length<1||messages.length>5)throw Error('Invalid sharing messages');
   return sdk.shareTargetPicker(messages);
  }
 };
}

if(typeof window!=='undefined'){
 const loadSdk=()=>new Promise((resolve,reject)=>{
  if(window.liff)return resolve(window.liff);
  const script=document.createElement('script');
  script.src='https://static.line-scdn.net/liff/edge/2/sdk.js';
  script.onload=()=>window.liff?resolve(window.liff):reject(Error('LINE SDK unavailable'));
  script.onerror=()=>reject(Error('โหลด LINE ไม่สำเร็จ กรุณาลองใหม่ / Could not load LINE.'));
  document.head.append(script);
 });
 window.TK7DirectShare=createDirectShare({
  liffId:window.TK7_DIRECT_SHARE_CONFIG?.liffId,
  loadSdk,redirectUri:location.href,
 });
}
