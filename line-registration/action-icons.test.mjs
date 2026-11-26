import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function icons() {
    const context = { document: { querySelectorAll: () => [], createElement: () => ({ content: { firstElementChild: {} } }) } };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(new URL('icons.js', import.meta.url), 'utf8'), context);
    return context.TK7Icons;
}

test('Thai and English commands share the same semantic icons', () => {
    const { actionIcon } = icons();
    for (const [thai, english, name] of [
        ['เข้าสู่ระบบ','Login','lock'], ['สมัครสมาชิก','Sign up','users'],
        ['เล่นแผน','Play plan','play'], ['คืนตำแหน่ง','Reset positions','reset'],
        ['ยกเลิก','Cancel','reset'], ['บันทึก','Save','save'], ['ปิด','Close','close']
    ]) {
        assert.equal(actionIcon(thai), name);
        assert.equal(actionIcon(english), name);
    }
    assert.equal(actionIcon('Tong'), null);
    assert.equal(actionIcon('EN'), null);
    assert.equal(actionIcon('3'), null);
});

test('decorating repeated renders preserves existing icons and player controls', () => {
    const api = icons();
    let count = 0, hasIcon = false, excluded = false;
    const control = {
        textContent: 'เล่นแผน',
        matches: selector => selector === 'button,summary' || excluded,
        querySelector: () => hasIcon,
        prepend: () => { count++; hasIcon = true; },
        classList: { add() {} }
    };
    api.decorateAction(control); api.decorateAction(control);
    assert.equal(count, 1);
    hasIcon = false; excluded = true;
    api.decorateAction(control);
    assert.equal(count, 1);
});

test('primary command SVGs inherit the readable label colour on light and dark controls', () => {
    const { html } = icons();
    for (const command of ['share','import','lock','unlock','trash','save','users','logout']) {
        const markup = html(command);
        assert.match(markup, /<svg/);
        assert.match(markup, /stroke="currentColor"/);
        assert.match(markup, /aria-hidden="true"/);
    }
});

test('only the circled summary icons adopt outline styling while navigation keeps its original artwork',()=>{
 const {html}=icons();for(const name of ['list','shirt']){const markup=html(name);assert.match(markup,/<svg/);assert.match(markup,/stroke="currentColor"/);assert.match(markup,/stroke-width="1.8"/);}
 for(const name of ['settings','calendar','edit','trophy'])assert.match(html(name),/#[0-9a-f]{3,8}/i);
 assert.match(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),/class="icon-svg pitch-icon"/);
});
test('new dialog placeholders are hydrated before automatic button decoration',()=>{
 let callback,replaced;
 const placeholder={dataset:{tk7Icon:'list'},replaceWith:icon=>replaced=icon};
 const control={nodeType:1,textContent:'ส่งสรุป (กลุ่มใหญ่)',matches:selector=>selector==='button,summary',querySelectorAll:selector=>selector==='[data-tk7-icon]'?[placeholder]:[],querySelector:()=>replaced,prepend(){throw Error('duplicate decoration');}};
 const document={body:{},querySelectorAll:()=>[],createElement:()=>({content:{firstElementChild:null},set innerHTML(value){this.content.firstElementChild={markup:value};}})};
 const context={document,MutationObserver:class{constructor(fn){callback=fn;}observe(){}}};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('icons.js',import.meta.url),'utf8'),context);
 callback([{target:{},addedNodes:[control]}]);assert.match(replaced.markup,/tk7-icon-list/);assert.match(replaced.markup,/<svg/);
});
