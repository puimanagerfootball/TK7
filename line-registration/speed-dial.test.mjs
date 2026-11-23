import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function harness(supported = true) {
    class Element {
        children = []; attributes = {}; style = {}; listeners = {};
        classList = { add() {}, toggle() {} };
        constructor(tag = 'div') { this.tagName = tag; }
        append(...nodes) {
            for (const node of nodes) {
                if (node.parent) node.parent.children = node.parent.children.filter(item => item !== node);
                node.parent = this; this.children.push(node);
            }
        }
        querySelector() { return this.children.find(child => child.className === 'speed-dial-trigger'); }
        setAttribute(key, value) { this.attributes[key] = value; }
        addEventListener(name, callback) { this.listeners[name] = callback; }
    }
    if (supported) Element.prototype.showPopover = function () {};
    const context = { HTMLElement: Element, document: { createElement: tag => new Element(tag), querySelector: () => null } };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(new URL('../js/speed-dial.js', import.meta.url), 'utf8'), context);
    return { Element, mount: context.TK7SpeedDial.mount };
}

test('speed dial keeps the original actions, permissions and handlers', () => {
    const { Element, mount } = harness();
    const root = new Element(), action = new Element('button');
    action.disabled = true; action.onclick = () => 'original';
    root.append(action); mount(root, 'Account');
    const [trigger, panel] = root.children;
    assert.equal(panel.children[1], action);
    assert.equal(panel.children[0].children[1].attributes['aria-label'], 'ปิดเมนู');
    assert.equal(action.disabled, true);
    assert.equal(action.onclick(), 'original');
    assert.equal(trigger.attributes['aria-controls'], panel.id);
    panel.listeners.toggle({ newState: 'open' });
    assert.equal(trigger.attributes['aria-expanded'], 'true');
    mount(root);
    assert.equal(root.children.length, 2);
});

test('split button leaves the primary action directly available', () => {
    const { Element, mount } = harness();
    const root = new Element(), primary = new Element('button'), secondary = new Element('button');
    root.append(primary, secondary); mount(root, 'More', primary);
    assert.equal(root.children[0], primary);
    assert.equal(root.children[2].children[1], secondary);
    assert.equal(root.children[1].attributes['aria-label'], 'More');
});

test('unsupported browsers retain all ordinary buttons', () => {
    const { Element, mount } = harness(false);
    const root = new Element(), action = new Element('button');
    root.append(action); mount(root);
    assert.deepEqual(root.children, [action]);
});
