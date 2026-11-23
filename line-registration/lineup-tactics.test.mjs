import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/lineup-tactics.js', import.meta.url), 'utf8');

class Node {
    constructor() {
        this.handlers = new Map();
        this.style = {};
        this.dataset = {};
        this.children = [];
        this.attributes = {};
        this.value = '';
        this.textContent = '';
        this.classList = { add() {}, toggle() {} };
    }
    addEventListener(type, handler, { signal } = {}) {
        const handlers = this.handlers.get(type) || new Set();
        handlers.add(handler);
        this.handlers.set(type, handlers);
        signal?.addEventListener('abort', () => handlers.delete(handler), { once: true });
    }
    fire(type, payload = {}) {
        const event = { type, target: this, preventDefault() {}, stopImmediatePropagation() {}, ...payload };
        return Promise.all([...(this.handlers.get(type) || [])].map(handler => handler(event)));
    }
    setAttribute(key, value) { this.attributes[key] = value; }
    append(node) { this.children.push(node); }
    replaceChildren(...nodes) { this.children = nodes; }
    remove() {}
    closest(selector) { return selector === '.pitch-slot' && this.dataset.slotId ? this : null; }
    matches() { return false; }
}

function harness({ reduced = false } = {}) {
    const ids = ['lineup-tools', 'lineup-runner', 'lineup-play', 'lineup-clear-route',
        'lineup-reset-points', 'lineup-duration', 'lineup-tactic-hint'];
    const nodes = Object.fromEntries(ids.map(id => [id, new Node()]));
    nodes['lineup-duration'].value = '4000';
    const modes = ['name', 'move', 'route'].map(mode => {
        const button = new Node();
        button.dataset.tacticMode = mode;
        return button;
    });
    nodes['lineup-tools'].querySelectorAll = () => modes;
    const document = new Node();
    document.getElementById = id => nodes[id];
    document.createElement = document.createElementNS = () => new Node();
    const context = { document, AbortController, structuredClone, window: { matchMedia: () => ({ matches: reduced }) } };
    vm.createContext(context);
    vm.runInContext(source, context);
    const pitch = new Node();
    const slots = ['a', 'b'].map((id, i) => {
        const slot = new Node();
        slot.dataset.slotId = id;
        slot.textContent = 'Player ' + id;
        slot.style = { left: (30 + i * 40) + '%', top: '50%' };
        return slot;
    });
    pitch.querySelectorAll = () => slots;
    pitch.contains = slot => slots.includes(slot);
    pitch.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
    pitch.setPointerCapture = () => {};
    pitch.hasPointerCapture = () => false;
    context.TK7Tactics.mount(pitch, 'green:2-3-1');
    return { editor: context.TK7Tactics, nodes, modes, pitch, slots };
}

test('dragging clamps a player inside the pitch and a cancelled drag restores the point', async () => {
    const h = harness();
    await h.modes[1].fire('click');
    const pointer = { target: h.slots[0], button: 0, isPrimary: true, pointerId: 1 };
    await h.pitch.fire('pointerdown', pointer);
    await h.pitch.fire('pointermove', { ...pointer, clientX: -10, clientY: 120 });
    assert.equal(h.slots[0].style.left, '12%');
    assert.equal(h.slots[0].style.top, '92%');
    await h.pitch.fire('pointercancel', pointer);
    assert.equal(h.slots[0].style.left, '30%');
    assert.equal(h.slots[0].style.top, '50%');
});

test('two players animate their selected routes together and stop restores their starts', async () => {
    const h = harness();
    await h.modes[2].fire('click');
    await h.pitch.fire('click', { target: h.slots[1] });
    h.nodes['lineup-runner'].value = 'b';
    await h.nodes['lineup-runner'].fire('change');
    await h.pitch.fire('click', { clientX: 30, clientY: 50 });
    const calls = [], finished = [];
    for (const slot of h.slots) {
        slot.animate = (frames, options) => {
            let resolve;
            const promise = new Promise(r => { resolve = r; });
            finished.push(resolve);
            calls.push({ frames, options });
            return { finished: promise, cancel() { resolve(); } };
        };
    }
    const playing = h.nodes['lineup-play'].fire('click');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].frames[1].left, '70%');
    assert.equal(calls[1].frames[1].left, '30%');
    assert.equal(calls[0].options.duration, 4000);
    h.editor.stop();
    await playing;
    assert.equal(h.slots[0].style.left, '30%');
    assert.equal(h.slots[1].style.left, '70%');
    assert.equal(h.nodes['lineup-play'].textContent, 'เล่นแผน');
});

test('reduced motion shows the end point and drafts remain separate by team', async () => {
    const h = harness({ reduced: true });
    await h.modes[2].fire('click');
    await h.pitch.fire('click', { clientX: 60, clientY: 35 });
    await h.nodes['lineup-play'].fire('click');
    assert.equal(h.slots[0].style.left, '60%');
    h.editor.stop();
    h.editor.mount(h.pitch, 'blue:2-3-1');
    assert.equal(h.nodes['lineup-play'].disabled, true);
    h.editor.mount(h.pitch, 'green:2-3-1');
    assert.equal(h.nodes['lineup-play'].disabled, false);
});
