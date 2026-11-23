// Local tactical drafts are kept independently for each team and formation.
globalThis.TK7Tactics = (() => {
    const drafts = new Map();
    let active = null;
    let mode = 'name';
    const point = (x, y) => ({
        x: Math.max(12, Math.min(88, x)),
        y: Math.max(8, Math.min(92, y))
    });
    const frame = position => ({ left: position.x + '%', top: position.y + '%' });
    const svgNode = name => document.createElementNS('http://www.w3.org/2000/svg', name);

    function mount(pitch, key) {
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
        const reset = document.getElementById('lineup-reset-points');
        const duration = document.getElementById('lineup-duration');
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
        let selected = runner.value in defaults ? runner.value : slots[0]?.dataset.slotId;
        let drag = null;
        let animations = [];
        let playing = false;
        let playback = 0;

        runner.replaceChildren(...slots.map(slot => {
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
                slot.classList.toggle('tactic-selected', mode !== 'name' && id === selected);
                const route = draft.routes[id] || [];
                if (!route.length) continue;
                const path = svgNode('polyline');
                const positions = [draft.positions[id] || defaults[id], ...route];
                path.setAttribute('points', positions.map(p => p.x + ',' + p.y).join(' '));
                path.setAttribute('class', id === selected ? 'selected-route' : '');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', id === selected ? '#fff' : '#ffe478');
                path.setAttribute('stroke-width', '.65');
                path.setAttribute('stroke-dasharray', '1.5 1');
                overlay.append(path);
                const end = route[route.length - 1];
                const previous = positions[positions.length - 2];
                const angle = Math.atan2(end.y - previous.y, end.x - previous.x);
                const arrow = svgNode('path');
                const wing = offset => (end.x - 2.3 * Math.cos(angle + offset)) + ' ' +
                    (end.y - 2.3 * Math.sin(angle + offset));
                arrow.setAttribute('d', 'M ' + wing(-0.5) + ' L ' + end.x + ' ' + end.y + ' L ' + wing(0.5));
                arrow.setAttribute('fill', 'none');
                arrow.setAttribute('stroke', '#ffe478');
                arrow.setAttribute('stroke-width', '.65');
                overlay.append(arrow);
            }
            pitch.dataset.tacticMode = mode;
            tools.querySelectorAll('[data-tactic-mode]').forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.tacticMode === mode));
            });
            clear.disabled = playing || !(draft.routes[selected]?.length);
            reset.disabled = playing;
            runner.disabled = playing;
            duration.disabled = playing;
            play.disabled = !playing && !Object.values(draft.routes).some(route => route.length);
            play.textContent = playing ? 'หยุด / กลับจุดเริ่ม' : 'เล่นแผน';
            play.setAttribute('aria-pressed', String(playing));
            hint.textContent = playing ? 'กำลังเล่นแผน กดหยุดเพื่อกลับจุดเริ่ม'
                : mode === 'move' ? 'ลากผู้เล่นไปยังจุดที่ต้องการ หรือเลือกแล้วใช้ปุ่มลูกศร'
                : mode === 'route' ? 'เลือกผู้เล่นจากรายการ แล้วแตะสนามหรือจุดผู้เล่นอื่นตามลำดับทางวิ่ง'
                : 'เลือกผู้เล่นเพื่อใส่ชื่อ เก็บแผนไว้ในแท็บนี้';
        }

        function stop() {
            playback++;
            playing = false;
            animations.forEach(animation => animation.cancel());
            animations = [];
            draw();
        }

        function coordinates(event) {
            const bounds = pitch.getBoundingClientRect();
            return point((event.clientX - bounds.left) / bounds.width * 100,
                (event.clientY - bounds.top) / bounds.height * 100);
        }

        listen(pitch, 'pointerdown', event => {
            if (mode === 'name' || event.button !== 0 || !event.isPrimary) return;
            if (playing) { event.preventDefault(); return; }
            const slot = event.target.closest('.pitch-slot');
            if (!slot || !pitch.contains(slot)) return;
            event.preventDefault();
            if (mode === 'route') return;
            selected = slot.dataset.slotId;
            runner.value = selected;
            if (mode === 'move') {
                drag = { id: selected, pointer: event.pointerId, original: { ...draft.positions[selected] } };
                pitch.setPointerCapture(event.pointerId);
            }
            draw();
        });
        listen(pitch, 'pointermove', event => {
            if (!drag || drag.pointer !== event.pointerId) return;
            draft.positions[drag.id] = coordinates(event);
            draw();
        });
        const finishDrag = event => {
            if (!drag || drag.pointer !== event.pointerId) return;
            if (event.type === 'pointercancel') draft.positions[drag.id] = drag.original;
            drag = null;
            if (pitch.hasPointerCapture(event.pointerId)) pitch.releasePointerCapture(event.pointerId);
            draw();
        };
        listen(pitch, 'pointerup', finishDrag);
        listen(pitch, 'pointercancel', finishDrag);
        listen(pitch, 'lostpointercapture', event => {
            if (drag?.pointer !== event.pointerId) return;
            draft.positions[drag.id] = drag.original;
            drag = null;
            draw();
        });
        listen(pitch, 'click', event => {
            if (mode === 'name') return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (playing || mode !== 'route' || !selected) return;
            const route = draft.routes[selected] ||= [];
            if (route.length >= 12) {
                hint.textContent = 'ทางวิ่งครบ 12 จุดแล้ว กดล้างทางวิ่งเพื่อวาดใหม่';
                return;
            }
            const target = event.target.closest('.pitch-slot');
            route.push(target ? { ...draft.positions[target.dataset.slotId] } : coordinates(event));
            draw();
        }, { capture: true });
        listen(pitch, 'keydown', event => {
            const slot = event.target.closest('.pitch-slot');
            if (!slot || event.target.matches('input')) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (playing) return;
                if (mode === 'name') slot.click();
                else { selected = slot.dataset.slotId; runner.value = selected; draw(); }
            }
            const offsets = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
            if (mode !== 'move' || playing || !offsets[event.key]) return;
            event.preventDefault();
            const id = slot.dataset.slotId, current = draft.positions[id];
            const [x, y] = offsets[event.key];
            draft.positions[id] = point(current.x + x, current.y + y);
            draw();
        });
        listen(runner, 'change', () => { selected = runner.value; draw(); });
        tools.querySelectorAll('[data-tactic-mode]').forEach(button => {
            listen(button, 'click', () => { stop(); mode = button.dataset.tacticMode; draw(); });
        });
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
                return slot.animate([draft.positions[id], ...draft.routes[id]].map(frame),
                    { duration: Number(duration.value) || 4000, easing: 'linear', fill: 'forwards' });
            });
            await Promise.allSettled(animations.map(animation => animation.finished));
            if (ticket === playback) stop();
        });
        listen(document, 'visibilitychange', () => { if (document.hidden) stop(); });
        active = {
            stop,
            destroy() { stop(); events.abort(); overlay.remove(); }
        };
        draw();
    }
    return { mount, stop: () => active?.stop() };
})();
