globalThis.TK7Security=(()=>{
 const actions=new Set(['dates','roster','log','register','move','swap','cancel','recolor','bulk']);
 const reads=new Set(['dates','roster','log']);
 const error=(status,message)=>Object.assign(new Error(message),{status});
 async function readJSON(request,maxBytes=20000){
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw error(415,'Content-Type must be application/json');
  if(Number(request.headers.get('content-length'))>maxBytes)throw error(413,'Request too large');
  if(!request.body)throw error(400,'Invalid JSON');
  const reader=request.body.getReader(),chunks=[];let length=0,timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;reader.cancel().catch(()=>{});},10000);
  try{
   while(true){const part=await reader.read();if(timedOut)throw error(408,'Request timeout');if(part.done)break;length+=part.value.byteLength;if(length>maxBytes){reader.cancel().catch(()=>{});throw error(413,'Request too large');}chunks.push(part.value);}
  }finally{clearTimeout(timer);reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw error(400,'Invalid JSON');}
  if(!body||typeof body!=='object'||Array.isArray(body))throw error(400,'Invalid request object');
  return body;
 }
 return {actions,reads,readJSON};
})();
