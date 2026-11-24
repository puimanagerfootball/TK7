// Shared decorative emoji for the web and LINE registration interface.
(() => {
 const emoji = {
  ball:'⚽',
  share:'↗️',
  import:'📥',
  list:'📋',
  shirt:'👕',
  lock:'🔒',
  unlock:'🔓',
  trash:'🗑️',
  clock:'🕘',
  calendar:'📅',
  users:'👥',
  shield:'🛡️',
  help:'❓',
  settings:'⚙️',
  trophy:'🏆',
  save:'💾',
  edit:'✏️',
  chart:'📊',
  phone:'📱',
  plus:'➕',
  check:'✅',
  view:'👁️',
  pin:'📍',
  warning:'⚠️',
  palette:'🎨',
  bell:'🔔',
  play:'▶️', stop:'⏹️', reset:'↩️', download:'📥', logout:'🚪', link:'🔗', close:'✕'
 };
 const artwork={
  logout:'<g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4H4v16h6m4-12 4 4-4 4m-6-4h14"/></g>',
  share:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7m0-7L10 14"/><path d="M11 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></g>',
  import:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11m-4-4 4 4 4-4M4 13v7h16v-7"/><path d="M4 15h4l2 3h4l2-3h4"/></g>',
  lock:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></g>',
  unlock:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0m-4 8v2"/></g>',
  trash:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></g>',
  save:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 3h13l4 4v14H3V3zm3 0v6h10V3M7 21v-8h10v8"/></g>',
  users:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/></g>',
  settings:'<g fill="#24679e">'+Array.from({length:8},(_,i)=>'<rect x="10" y="1.5" width="4" height="7" rx="1" transform="rotate('+i*45+' 12 12)"/>').join('')+'<circle cx="12" cy="12" r="7.8"/></g><circle cx="12" cy="12" r="3.5" fill="#f7fbff" stroke="#16476f" stroke-width="1.2"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="3" fill="#fff" stroke="#245e99" stroke-width="1.5"/><path d="M3 8h18V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3z" fill="#2878ba"/><path d="M8 2v4m8-4v4" stroke="#164674" stroke-width="2" stroke-linecap="round"/><path d="M7 12h2m3 0h2m3 0h1M7 16h2m3 0h2m3 0h1" stroke="#245e99" stroke-width="2"/>',
  edit:'<path d="m4 16-1 5 5-1L21 7l-4-4z" fill="#f5ac37" stroke="#985917" stroke-width="1.1"/><path d="m16 4 3-3 4 4-3 3z" fill="#ec6971"/><path d="m4 16 4 4-5 1z" fill="#263b41"/><path d="m7 16 9-9" stroke="#ffe3a3" stroke-width="1.5"/>',
  trophy:'<path d="M7 3h10v7c0 4-3 6-5 6s-5-2-5-6z" fill="#f5bc2b" stroke="#996510" stroke-width="1.2"/><path d="M7 5H3v4c0 3 2 5 5 5m9-9h4v4c0 3-2 5-5 5" fill="none" stroke="#b87b13" stroke-width="2"/><path d="M12 16v4m-4 1h8" stroke="#976019" stroke-width="2.5" stroke-linecap="round"/><path d="M10 5v5" stroke="#fff2ad" stroke-width="1.5" stroke-linecap="round"/>'
 };
 function html(name) {
  if(!Object.hasOwn(emoji,name))return '';
  const content=artwork[name]?'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+artwork[name]+'</svg>':emoji[name];
  return '<span class="tk7-icon tk7-icon-emoji tk7-icon-'+name+'" aria-hidden="true">'+content+'</span>';
 }
 function node(name) {
  const template=document.createElement('template');
  template.innerHTML=html(name);
  return template.content.firstElementChild;
 }
 function actionIcon(text) {
  const label=String(text).trim();
  const rules=[
   [/^(เข้าสู่ระบบ|Log in|Login|Sign in)$/i,'lock'],
   [/^(สมัครสมาชิก|สมัคร Admin|Sign up|Register)$/i,'users'],
   [/^(ออกจากระบบ|Log out|Logout)$/i,'logout'],
   [/^(เล่นแผน|Play plan|Play)$/i,'play'],[/^(หยุด|หยุดแผน|Stop)$/i,'stop'],
   [/^(คืนตำแหน่ง|Reset positions|Reset)$/i,'reset'],
   [/^(ล้างทางวิ่ง|Clear route|Clear paths)/i,'trash'],
   [/^(ตัวเลือกแผน|Plan options)$/i,'settings'],
   [/^(ลองใหม่|ลองบันทึกอีกครั้ง|Retry|Refresh)$/i,'reset'],
   [/^(บันทึก|Save)/i,'save'],[/^(ยืนยัน|Confirm|ตกลง|OK)/i,'check'],
   [/^(ดาวน์โหลด|Download)/i,'download'],
   [/^(เตรียมส่ง LINE|เลือกแชต LINE|เลือกแชตหรือกลุ่ม LINE|แชร์ผ่านเครื่อง|Share|Send)/i,'share'],
   [/^(เพิ่มชื่อเพื่อน|Add a friend)$/i,'users'],
   [/^(ดูทั้งหมด|See all|ประวัติ|History)$/i,'clock'],
   [/^(ยกเลิก|Cancel)$/i,'reset'],[/^(ปิด|Close)$/i,'close'],
   [/^(ลบ|Remove|Delete)/i,'trash'],
   [/^(ย้าย|Move to|Swap|สลับ)/i,'palette'],
   [/^(ลงชื่อ|ลงสี|Join |Start .* team)/i,'shirt']
  ];
  return rules.find(([pattern])=>pattern.test(label))?.[1]||null;
 }
 function decorateAction(control) {
  if(!control?.matches?.('button,summary')||control.matches('.prow,.band,.team-emblem,.speed-dial-trigger,.recolor-btn'))return;
  if(control.querySelector('svg,.tk7-icon,[data-tk7-icon],.media-rec,.icon'))return;
  const name=actionIcon(control.textContent);
  if(!name)return;
  control.prepend(node(name));
  control.classList.add('tk7-has-action-icon');
 }
 globalThis.TK7Icons={html,node,actionIcon,decorateAction};
 for(const placeholder of document.querySelectorAll('[data-tk7-icon]')){
  const icon=node(placeholder.dataset.tk7Icon);
  if(icon)placeholder.replaceWith(icon);
 }
 for(const control of document.querySelectorAll('button,summary'))decorateAction(control);
 // Inspect only newly changed controls, including labels changed by language or playback state.
 if(typeof MutationObserver!=='undefined'&&document.body){
  new MutationObserver(records=>{
   const controls=new Set();
   for(const record of records){
    const parent=record.target.closest?.('button,summary');if(parent)controls.add(parent);
    for(const added of record.addedNodes){
     if(added.nodeType!==1)continue;
     if(added.matches('button,summary'))controls.add(added);
     for(const child of added.querySelectorAll('button,summary'))controls.add(child);
    }
   }
   for(const control of controls)decorateAction(control);
  }).observe(document.body,{childList:true,subtree:true});
 }
})();
