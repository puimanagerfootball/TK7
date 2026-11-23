/* Reuse the original controls and their permission checks inside a compact dial. */
globalThis.TK7SpeedDial = (() => {
    let sequence = 0;
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
        panel.append(...[...root.children].filter(child => child !== primary));
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'speed-dial-trigger';
        trigger.setAttribute('aria-controls', panel.id);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-label', label);
        const icon = document.createElement('span');
        icon.className = 'speed-dial-plus';
        icon.textContent = primary ? '⌄' : '+';
        icon.setAttribute('aria-hidden', 'true');
        const caption = document.createElement('span');
        caption.textContent = label;
        trigger.append(icon);
        if (!primary) trigger.append(caption);
        function position() {
            const bounds = trigger.getBoundingClientRect();
            const width = Math.min(330, innerWidth - 24);
            panel.style.width = width + 'px';
            const height = panel.getBoundingClientRect().height;
            panel.style.left = Math.max(12, Math.min(bounds.right - width, innerWidth - width - 12)) + 'px';
            panel.style.top = Math.max(12, Math.min(bounds.bottom + 10, innerHeight - height - 12)) + 'px';
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
    return { mount };
})();
globalThis.TK7SpeedDial.mount(document.querySelector('.auth-user-controls'), 'เมนูบัญชี');
