// Local tactical drafts are kept independently for each team and formation.
globalThis.TK7Tactics = (() => {
    const drafts = new Map();
    let active = null;
    const point = (x, y) => ({
        x: Math.max(12, Math.min(88, x)),
        y: Math.max(8, Math.min(92, y))
    });
    const frame = position => ({ left: position.x + '%', top: position.y + '%' });
    const svgNode = name => document.createElementNS('http://www.w3.org/2000/svg', name);

    function mount(pitch, key, metadata = {}) {
        active?.destroy();
        const tools = document.getElementById('lineup-tools');
        if (!tools) return;
        const slots = [...pitch.querySelectorAll('.pitch-slot')];
        const defaults = Object.fromEntries(slots.map(slot => [
            slot.dataset.slotId,
            { x: parseFloat(slot.style.left), y: parseFloat(slot.style.top) }
        ]));
        if (!drafts.has(key)) drafts.set(key, { positions: structuredClone(defaults), routes: {} });
        const draft = drafts.get(key);
        const runner = document.getElementById('lineup-runner');
        const play = document.getElementById('lineup-play');
        const clear = document.getElementById('lineup-clear-route');
        const selectedRoute = document.getElementById('lineup-selected-route');
        const selectedLabel = document.getElementById('lineup-selected-label');
        const reset = document.getElementById('lineup-reset-points');
        const duration = document.getElementById('lineup-duration');
        const durationTrigger = document.getElementById('lineup-duration-trigger');
        const durationMenu = document.getElementById('lineup-duration-menu');
        const durationValue = document.getElementById('lineup-duration-value');
        const video = document.getElementById('lineup-video');
        const hint = document.getElementById('lineup-tactic-hint');
        const events = new AbortController();
        const listen = (node, type, handler, options = {}) =>
            node.addEventListener(type, handler, { ...options, signal: events.signal });
        const overlay = svgNode('svg');
        overlay.classList.add('lineup-routes');
        overlay.setAttribute('viewBox', '0 0 100 100');
        overlay.setAttribute('preserveAspectRatio', 'none');
        overlay.setAttribute('aria-hidden', 'true');
        pitch.append(overlay);
        let selected = runner.value in defaults ? runner.value : null;
        let drag = null;
        let pressTimer = null;
        let lastTap = null;
        let allowNameClick = false;
        let animations = [];
        let playing = false;
        let playback = 0;

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'เลือกผู้เล่น';
        runner.replaceChildren(placeholder, ...slots.map(slot => {
            const option = document.createElement('option');
            option.value = slot.dataset.slotId;
            option.textContent = slot.textContent.trim().replace(/\s+/g, ' ');
            slot.tabIndex = 0;
            slot.setAttribute('role', 'button');
            slot.setAttribute('aria-label', option.textContent);
            return option;
        }));
        runner.value = selected || '';

        function draw() {
            overlay.replaceChildren();
            for (const slot of slots) {
                const id = slot.dataset.slotId;
                Object.assign(slot.style, frame(draft.positions[id] || defaults[id]));
                slot.classList.toggle('tactic-selected', id === selected);
                const route = draft.routes[id] || [];
                if (!route.length || playing) continue;
                const path = svgNode('polyline');
                const positions = globalThis.TK7Path?.prepare(draft.positions[id] || defaults[id],route) || [draft.positions[id] || defaults[id], ...route];
                path.setAttribute('points', positions.map(p => p.x + ',' + p.y).join(' '));
                path.setAttribute('class', id === selected ? 'selected-route' : '');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', id === selected ? '#fff' : '#ffe478');
                path.setAttribute('stroke-width', '.65');
                path.setAttribute('stroke-dasharray', '1.5 1');
                overlay.append(path);

            }
            pitch.dataset.tacticMode = drag?.kind === 'move' ? 'move' : 'route';
            clear.disabled = playing || !(draft.routes[selected]?.length);
            if (selectedRoute) selectedRoute.hidden = !(draft.routes[selected]?.length);
            if (selectedLabel) {
                const slot = slots.find(slot => slot.dataset.slotId === selected);
                const label = slot?.textContent.trim().replace(/\s+/g, ' ') || '';
                selectedLabel.textContent = label;
                selectedLabel.title = label;
                clear.setAttribute('aria-label', 'ล้างทางวิ่งของ ' + label);
            }
            reset.disabled = playing;
            runner.disabled = playing;
            duration.disabled = playing;
            if(durationTrigger)durationTrigger.disabled=playing;
            play.disabled = !playing && !Object.values(draft.routes).some(route => route.length);
            if (video) video.disabled = playing || !Object.values(draft.routes).some(route => route.length);
            const playLabel=playing?'หยุด':'เล่นแผน';
            if(play.dataset.tacticLabel!==playLabel){
                const icon=globalThis.TK7Icons?.node(playing?'stop':'play');
                if(icon)play.replaceChildren(icon);else play.textContent=playing?'■':'▶';
                play.setAttribute('aria-label',playLabel);play.setAttribute('title',playLabel);
                play.dataset.tacticLabel=playLabel;
            }
            play.setAttribute('aria-pressed', String(playing));
            const message=playing?'กำลังเล่นแผน':drag?.kind==='move'?'ย้ายตำแหน่ง':'จัดทางวิ่ง';
            if(hint.textContent!==message)hint.textContent=message;
        }

        function stop() {
            cancelPress();
            if (drag) {
                draft.positions[drag.id] = drag.original;
                draft.routes[drag.id] = drag.route;
                drag = null;
            }
            playback++;
            playing = false;
            animations.forEach(animation => animation.cancel());
            animations = [];
            draw();
        }

        function coordinates(event) {
            const bounds = drag?.bounds || pitch.getBoundingClientRect();
            return point((event.clientX - bounds.left) / bounds.width * 100,
                (event.clientY - bounds.top) / bounds.height * 100);
        }

        function cancelPress() {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        function editName(slot) {
            stop();
            allowNameClick = true;
            try { slot.click(); } finally { allowNameClick = false; }
        }
        listen(pitch, 'pointerdown', event => {
            if (event.button !== 0 || !event.isPrimary || drag || event.target.matches('input')) return;
            if (playing) { event.preventDefault(); return; }
            const slot = event.target.closest('.pitch-slot');
            if (!slot || !pitch.contains(slot)) return;
            event.preventDefault();
            const id = slot.dataset.slotId;
            drag = { id, pointer: event.pointerId, original: { ...draft.positions[id] },
                route: structuredClone(draft.routes[id] || []), kind: 'pending',
                startX: event.clientX, startY: event.clientY,
                bounds: pitch.getBoundingClientRect() };
            pitch.setPointerCapture(event.pointerId);
            pressTimer = setTimeout(() => {
                if (!drag || drag.pointer !== event.pointerId) return;
                drag.kind = 'move';
                selected = id;
                runner.value = id;
                lastTap = null;
                draw();
            }, 450);
            draw();
        });
        listen(pitch, 'pointermove', event => {
            if (!drag || drag.pointer !== event.pointerId) return;
            const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7;
            if (drag.kind === 'pending' && moved) {
                cancelPress();
                drag.kind = 'route';
                selected = drag.id;
                runner.value = selected;
                if (drag.kind === 'route') draft.routes[drag.id] = [];
                lastTap = null;
            }
            if (drag.kind === 'move') draft.positions[drag.id] = point(
                drag.original.x+(event.clientX-drag.startX)/drag.bounds.width*100,
                drag.original.y+(event.clientY-drag.startY)/drag.bounds.height*100);
            if (drag.kind === 'route') {
                const route = draft.routes[drag.id];
                const next = coordinates(event);
                const previous = route[route.length - 1] || draft.positions[drag.id];
                if (Math.hypot(next.x - previous.x, next.y - previous.y) >= 2) {
                    if (route.length < 60) route.push(next);
                    else route[route.length - 1] = next;
                }
            }
            draw();
        });
        const finishDrag = event => {
            if (!drag || drag.pointer !== event.pointerId) return;
            cancelPress();
            const finished = drag;
            if (event.type === 'pointercancel' || event.type === 'lostpointercapture') {
                draft.positions[finished.id] = finished.original;
                draft.routes[finished.id] = finished.route;
            }
            if(event.type==='pointerup'&&finished.kind==='route'){
                const route=draft.routes[finished.id], end=coordinates(event);
                const last=route[route.length-1];
                if(!last||Math.hypot(end.x-last.x,end.y-last.y)>.01){
                    if(route.length<60)route.push(end);else route[route.length-1]=end;
                }
            }
            drag = null;
            if (pitch.hasPointerCapture(event.pointerId)) pitch.releasePointerCapture(event.pointerId);
            if (event.type === 'pointerup' && finished.kind === 'pending') {
                selected = finished.id;
                runner.value = selected;
                if (lastTap?.id === selected && Date.now() - lastTap.time < 350) {
                    lastTap = null;
                    editName(slots.find(slot => slot.dataset.slotId === selected));
                    return;
                }
                lastTap = { id: selected, time: Date.now() };
            }
            draw();
        };
        listen(pitch, 'pointerup', finishDrag);
        listen(pitch, 'pointercancel', finishDrag);
        listen(pitch, 'lostpointercapture', finishDrag);
        listen(pitch, 'click', event => {
            if (allowNameClick || event.target.matches('input')) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        }, { capture: true });
        listen(pitch, 'dblclick', event => {
            const slot = event.target.closest('.pitch-slot');
            if (!slot || playing || event.target.matches('input')) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            editName(slot);
        }, { capture: true });
        listen(pitch, 'contextmenu', event => {
            if (event.target.closest('.pitch-slot')) event.preventDefault();
        });
        listen(pitch, 'keydown', event => {
            const slot = event.target.closest('.pitch-slot');
            if (!slot || event.target.matches('input')) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (playing) return;
                if (event.key === 'Enter') editName(slot);
                else { selected = slot.dataset.slotId; runner.value = selected; draw(); }
            }
            const offsets = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
            if (playing || !offsets[event.key]) return;
            event.preventDefault();
            const id = slot.dataset.slotId, current = draft.positions[id];
            const [x, y] = offsets[event.key];
            draft.positions[id] = point(current.x + x, current.y + y);
            draw();
        });
        listen(runner, 'change', () => { selected = runner.value; draw(); });
        if(durationTrigger&&durationMenu&&typeof durationMenu.showPopover==='function'){
            const options=[...durationMenu.querySelectorAll('[data-duration]')];
            const sync=()=>{
                durationValue.textContent=Number(duration.value)/1000+'s';
                durationTrigger.setAttribute('aria-label','ระยะเวลา '+Number(duration.value)/1000+' วินาที');
                options.forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.duration===duration.value)));
            };
            const close=()=>{if(durationMenu.matches(':popover-open'))durationMenu.hidePopover();};
            const open=()=>{
                if(playing)return;
                durationMenu.showPopover();
                const bounds=durationTrigger.getBoundingClientRect();
                const bottom=document.querySelector?.('.bottom-nav')?.getBoundingClientRect().top||innerHeight;
                const width=Math.min(144,innerWidth-24);
                durationMenu.style.width=width+'px';
                durationMenu.style.maxHeight=Math.max(44,bottom-24)+'px';
                const height=durationMenu.getBoundingClientRect().height;
                durationMenu.style.left=Math.max(12,Math.min(bounds.right-width,innerWidth-width-12))+'px';
                durationMenu.style.top=Math.max(12,Math.min(bounds.bottom+8+height<=bottom-12?bounds.bottom+8:bounds.top-height-8,bottom-height-12))+'px';
                options.find(option=>option.dataset.duration===duration.value)?.focus();
            };
            listen(durationTrigger,'click',()=>durationMenu.matches(':popover-open')?close():open());
            listen(durationMenu,'toggle',event=>durationTrigger.setAttribute('aria-expanded',String(event.newState==='open')));
            listen(durationMenu,'click',event=>{
                const option=event.target.closest('[data-duration]');
                if(!options.includes(option)||playing)return;
                duration.value=option.dataset.duration;sync();close();durationTrigger.focus();
            });
            listen(durationMenu,'keydown',event=>{
                if(event.key==='Escape'){event.preventDefault();close();durationTrigger.focus();return;}
                if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
                event.preventDefault();
                const current=options.indexOf(document.activeElement);
                const index=event.key==='Home'?0:event.key==='End'?options.length-1:(current+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
                options[index].focus();
            });
            listen(duration,'change',sync);
            if(window.addEventListener)listen(window,'resize',close);
            listen(document,'scroll',event=>{if(!durationMenu.contains(event.target))close();},{capture:true,passive:true});
            events.signal.addEventListener('abort',close,{once:true});
            sync();
        }else if(durationTrigger){durationTrigger.hidden=true;duration.hidden=false;}
        listen(clear, 'click', () => { delete draft.routes[selected]; draw(); });
        listen(reset, 'click', () => {
            draft.positions = structuredClone(defaults);
            draft.routes = {};
            draw();
        });
        listen(play, 'click', async () => {
            if (playing) { stop(); return; }
            const moving = slots.filter(slot => draft.routes[slot.dataset.slotId]?.length);
            if (!moving.length) return;
            playing = true;
            const ticket = ++playback;
            draw();
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduced || !moving.every(slot => typeof slot.animate === 'function')) {
                for (const slot of moving) {
                    const route = draft.routes[slot.dataset.slotId];
                    Object.assign(slot.style, frame(route[route.length - 1]));
                }
                hint.textContent = 'แสดงจุดปลายทาง กดหยุดเพื่อกลับจุดเริ่ม';
                return;
            }
            animations = moving.map(slot => {
                const id = slot.dataset.slotId;
                const start=draft.positions[id], bounds=pitch.getBoundingClientRect();
                const path=globalThis.TK7Path?.prepare(start,draft.routes[id]) || [start,...draft.routes[id]];
                return slot.animate(path.map(point=>({
                    transform:'translate(-50%,-50%) translate('+((point.x-start.x)/100*bounds.width)+'px,'+((point.y-start.y)/100*bounds.height)+'px)',
                    ...(point.offset === undefined ? {} : {offset:point.offset})
                })),
                    { duration: Number(duration.value) || 4000, easing: 'linear', fill: 'forwards' });
            });
            await Promise.allSettled(animations.map(animation => animation.finished));
            if (ticket === playback) stop();
        });
        if(window.addEventListener)listen(window,'resize',()=>{if(playing)stop();});
        listen(document, 'visibilitychange', () => { if (document.hidden) stop(); });
        active = {
            stop,
            destroy() { cancelPress(); stop(); events.abort(); overlay.remove(); },
            snapshot() {
                return { ...metadata, duration: Number(duration.value) || 4000,
                    players: slots.map(slot => {
                        const id = slot.dataset.slotId;
                        const face = slot.querySelector('.slot-dot-face');
                        return { id, label: face?.textContent || id,
                            name: slot.querySelector('.slot-name-input')?.value || slot.querySelector('.slot-name')?.textContent || '',
                            color: getComputedStyle(face || slot).backgroundColor,
                            textColor: getComputedStyle(face || slot).color,
                            start: { ...draft.positions[id] }, route: structuredClone(draft.routes[id] || []) };
                    }) };
            }
        };
        draw();
    }
    return { mount, stop: () => active?.stop(), snapshot: () => active?.snapshot() };
})();
