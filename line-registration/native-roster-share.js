/* Mobile text sharing must start in the user's click, without a network await or LINE login. */
globalThis.TK7NativeRosterShare = (() => {
    let sending=false,currentDialog=null;
    function available(env=globalThis){
        const device=env.navigator;
        if(typeof device?.share!=='function'||/^Win/i.test(device.platform||''))return false;
        return !!env.matchMedia?.('(pointer: coarse)').matches||
            device.maxTouchPoints>0&&/Android|iPhone|iPad|Macintosh/i.test(device.userAgent||'');
    }
    function share(text,env=globalThis){
        if(!available(env))throw Error('เมนูแชร์ของเครื่องยังไม่พร้อม');
        if(typeof text!=='string'||!text.trim())throw Error('ไม่มีข้อความสรุป');
        // Keep this invocation synchronous to retain transient user activation.
        return env.navigator.share({text}).then(()=>({status:'success'}),error=>{
            if(error?.name==='AbortError')return {status:'cancelled'};
            throw error;
        });
    }
    function request({mode='all',getSnapshot,isCurrent=()=>true,teams=[],english=false,onSent=()=>{},onError=()=>{}},env=globalThis){
        if(!available(env))return false;
        if(sending||currentDialog)return true;
        let dialog=null;
        function send(team){
            if(sending)return;
            try{
                if(!isCurrent())throw Error(english?'Match date or permission changed.':'วันที่หรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดสรุปใหม่');
                const text=env.TK7RosterSummary.build(getSnapshot(),{team});
                sending=true;
                dialog?.querySelectorAll('button').forEach(button=>button.disabled=true);
                share(text,env).then(result=>{
                    if(result.status==='success'){
                        if(dialog?.open)dialog.close();
                        onSent();
                    }
                }).catch(onError).finally(()=>{
                    sending=false;
                    dialog?.querySelectorAll('button').forEach(button=>button.disabled=false);
                });
            }catch(error){sending=false;onError(error);}
        }
        if(mode==='all'){send(null);return true;}
        if(!teams.length){onError(Error(english?'No team available.':'ยังไม่มีทีมให้ส่งสรุป'));return true;}
        const document=env.document;
        const previous=document.activeElement;
        const sourcePanel=previous?.closest?.('.speed-dial-panel');
        const restoreFocus=sourcePanel?document.querySelector('[aria-controls="'+sourcePanel.id+'"]'):previous;
        dialog=document.createElement('dialog');
        dialog.className='tk7-native-team-picker';
        dialog.setAttribute('aria-label',english?'Choose team to share':'เลือกทีมเพื่อแชร์');
        const header=document.createElement('div');header.className='tk7-native-picker-head';
        const title=document.createElement('strong');title.textContent=english?'Choose team':'เลือกทีม';
        const close=document.createElement('button');close.type='button';close.textContent='×';
        close.setAttribute('aria-label',english?'Close':'ปิด');close.onclick=()=>dialog.close();
        header.append(title,close);
        const choices=document.createElement('div');choices.className='tk7-native-team-choices';
        const colours={green:'#43a047',red:'#e53935',white:'#f5f5f5',blue:'#1e88e5',black:'#212121',yellow:'#fdd835',pink:'#ec407a',orange:'#fb8c00',navy:'#1a237e',purple:'#8e24aa'};
        for(const team of teams){
            const button=document.createElement('button');button.type='button';
            const dot=document.createElement('span');dot.className='tk7-native-colour';dot.setAttribute('aria-hidden','true');
            dot.style.backgroundColor=colours[team.slug]||'#627b69';
            const label=document.createElement('span');label.textContent=team.label;
            button.append(dot,label);button.onclick=()=>send(team.slug);choices.append(button);
        }
        dialog.append(header,choices);
        dialog.addEventListener('cancel',event=>{if(sending)event.preventDefault();});
        dialog.addEventListener('close',()=>{dialog.remove();currentDialog=null;restoreFocus?.focus?.();},{once:true});
        document.body.append(dialog);currentDialog=dialog;
        try{dialog.showModal();}catch(error){dialog.remove();currentDialog=null;onError(error);}
        return true;
    }
    return {available,share,request};
})();
