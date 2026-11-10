// Coalesce score edits per date. Keep failed drafts and serialize server writes.
globalThis.TK7ScoreWriter={
async replaceFixture(db,{date,schedule,settings,existing}){
 const table=db.from('match_days');
 if(existing&&!existing.updated_at)throw Error('ไม่พบรุ่นข้อมูล กรุณาโหลดตารางใหม่');
 const request=existing
  ?table.update({schedule,settings}).eq('match_date',date).eq('updated_at',existing.updated_at)
  :table.insert({match_date:date,schedule,settings});
 const {data,error}=await request.select('updated_at').maybeSingle();
 if(error?.code==='23505'||(!error&&!data))throw Error('ตารางเปลี่ยนจากอุปกรณ์อื่น กรุณาโหลดใหม่ก่อนบันทึก');
 if(error)throw error;
 return data;
},
async persist(db,{date,schedule,version,baseline}){
 if(!version){
  const {data,error}=await db.from('match_days').select('schedule,updated_at').eq('match_date',date).maybeSingle();
  if(error)throw error;
  if(!data||JSON.stringify(data.schedule)!==JSON.stringify(baseline))throw Error('ตารางบนเซิร์ฟเวอร์เปลี่ยนแล้ว กรุณาเก็บคะแนนที่แก้ไว้ก่อนโหลดใหม่');
  version=data.updated_at;
 }
 if(!version)throw Error('ไม่พบรุ่นข้อมูล กรุณาโหลดตารางใหม่');
 const {data,error}=await db.from('match_days').update({schedule}).eq('match_date',date).eq('updated_at',version).select('updated_at').maybeSingle();
 if(error)throw error;
 if(!data)throw Error('ตารางเปลี่ยนจากอุปกรณ์อื่นหรือสิทธิ์ไม่เพียงพอ กรุณาเก็บคะแนนที่แก้ไว้ก่อนโหลดใหม่');
 return data;
},
create({save,onError=()=>{},onSaved=()=>{},delay=500,setTimer=setTimeout,clearTimer=clearTimeout}){
 const drafts=new Map(),queued=new Set(),saving=new Set();let timer=null,chain=Promise.resolve();
 const clone=value=>JSON.parse(JSON.stringify(value));
 function mark(date,schedule,version,baseline){
  const previous=drafts.get(date);
  drafts.set(date,{schedule:clone(schedule),baseline:previous?.baseline||clone(baseline||schedule),version:previous?.version??version,revision:(previous?.revision||0)+1,failed:false});
  clearTimer(timer);timer=setTimer(()=>{timer=null;flush()},delay);
 }
 function flush(date){
  clearTimer(timer);timer=null;
  for(const key of date?[date]:[...drafts.keys()]){
   if(!drafts.has(key)||queued.has(key))continue;
   queued.add(key);
   chain=chain.then(async()=>{
    const draft=drafts.get(key);if(!draft){queued.delete(key);return;}
    const revision=draft.revision;saving.add(key);
    try{
     const result=await save({date:key,schedule:clone(draft.schedule),version:draft.version,baseline:clone(draft.baseline)});
     const current=drafts.get(key);
     if(current?.revision===revision)drafts.delete(key);
     else if(current){current.version=result.updated_at;current.baseline=clone(draft.schedule);}
     onSaved(key,result);
    }catch(error){const current=drafts.get(key);if(current)current.failed=true;onError(error,key);}
    finally{saving.delete(key);queued.delete(key);}
   }).catch(error=>{saving.delete(key);queued.delete(key);const current=drafts.get(key);if(current)current.failed=true;onError(error,key)});
  }
  return chain.then(()=>{
   const remaining=[...drafts].filter(([key,value])=>(!date||date===key)&&!value.failed);
   if(remaining.length)return flush(date);
   return ![...drafts.keys()].some(key=>!date||key===date);
  });
 }
 function discard(){clearTimer(timer);timer=null;drafts.clear();}
 return {mark,flush,discard,hasPending:date=>date?drafts.has(date):drafts.size>0,isSaving:date=>date?saving.has(date):saving.size>0};
}};
