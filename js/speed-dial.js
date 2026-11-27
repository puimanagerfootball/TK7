/* Reuse the original controls and their permission checks inside a compact dial. */
globalThis.TK7SpeedDial = (() => {
    let sequence = 0;
    function placement({ viewportWidth, viewportHeight, bottom = viewportHeight, anchor, height }) {
        const gap = 12;
        const width = Math.min(viewportWidth <= 600 ? 360 : 300, viewportWidth - gap * 2);
        const above = Math.max(0, anchor.top - gap * 2);
        const below = Math.max(0, bottom - anchor.bottom - gap * 2);
        const opensBelow = height <= below || (height > above && below >= above);
        const maxHeight = Math.max(44, Math.min(bottom - gap * 2, opensBelow ? below : above));
        const actualHeight = Math.min(height, maxHeight);
        const left = (anchor.left + anchor.right - width) / 2;
        const top = opensBelow ? anchor.bottom + gap : anchor.top - gap - actualHeight;
        return {
            width, maxHeight,
            left: Math.max(gap, Math.min(left, viewportWidth - width - gap)),
            top: Math.max(gap, Math.min(top, bottom - actualHeight - gap))
        };
    }
    function mount(root, label = 'เมนูเพิ่มเติม', primary = null) {
        if (!root || root.querySelector('.speed-dial-trigger')) return;
        // Older browsers retain the ordinary controls.
        if (!('showPopover' in HTMLElement.prototype)) return;
        const panel = document.createElement('div');
        panel.className = 'speed-dial-panel';
        panel.id = 'tk7-speed-dial-' + ++sequence;
        panel.setAttribute('popover', 'auto');
        panel.setAttribute('role', 'group');
        panel.setAttribute('aria-label', label);
        const heading = document.createElement('div');
        heading.className = 'speed-dial-heading';
        const title = document.createElement('strong');
        title.textContent = label;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'speed-dial-close';
        close.textContent = '×';
        close.setAttribute('aria-label', 'ปิดเมนู');
        close.onclick = () => { panel.hidePopover(); trigger.focus(); };
        heading.append(title, close);
        panel.append(heading, ...[...root.children].filter(child => child !== primary));
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'speed-dial-trigger';
        trigger.setAttribute('aria-controls', panel.id);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-label', label);
        const icon = document.createElement('span');
        icon.className = 'speed-dial-plus';
        icon.textContent = '+';
        icon.setAttribute('aria-hidden', 'true');
        const caption = document.createElement('span');
        caption.className = 'speed-dial-caption';
        caption.textContent = label;
        const groupIcon=label==='เปิด–ปิดลงทะเบียน'?'unlock':label==='แชร์และนำเข้า'?'share':null;
        if(groupIcon){
            const decorativeIcon=globalThis.TK7Icons?.node(groupIcon);
            if(decorativeIcon)caption.prepend(decorativeIcon);
        }
        trigger.append(icon);
        if (!primary) trigger.append(caption);
        function position() {
            const bounds = trigger.getBoundingClientRect();
            const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
            const bottom = nav?.top > 0 ? Math.min(innerHeight, nav.top) : innerHeight;
            const input = { viewportWidth: innerWidth, viewportHeight: innerHeight, bottom, anchor: bounds };
            const initial = placement({ ...input, height: 0 });
            panel.style.width = initial.width + 'px';
            // Measure the full menu before choosing the side with enough space.
            panel.style.maxHeight = Math.max(44, bottom - 24) + 'px';
            const result = placement({ ...input, height: panel.getBoundingClientRect().height });
            panel.style.maxHeight = result.maxHeight + 'px';
            panel.style.left = result.left + 'px';
            panel.style.top = result.top + 'px';
        }
        trigger.onclick = () => {
            if (panel.matches(':popover-open')) panel.hidePopover();
            else { panel.showPopover(); position(); }
        };
        panel.addEventListener('toggle', event => {
            trigger.setAttribute('aria-expanded', String(event.newState === 'open'));
        });
        panel.addEventListener('click', event => {
            const action = event.target.closest('button,a');
            if (action && !action.disabled && panel.matches(':popover-open')) panel.hidePopover();
        });
        root.classList.add('speed-dial-host');
        root.classList.toggle('speed-dial-split', !!primary);
        root.append(trigger, panel);
    }
    return { mount, placement };
})();
// Do not leave a menu anchored to stale coordinates after rotation or keyboard resize.
if (typeof window !== 'undefined') {
    const dismiss = () => document.querySelectorAll('.speed-dial-panel:popover-open').forEach(panel => panel.hidePopover());
    window.addEventListener('resize', dismiss, { passive: true });
    window.visualViewport?.addEventListener('resize', dismiss, { passive: true });
    document.addEventListener('scroll', event => {
        if (!event.target?.closest?.('.speed-dial-panel')) dismiss();
    }, { passive: true, capture: true });
}
