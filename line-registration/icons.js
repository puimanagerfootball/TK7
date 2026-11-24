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
 function html(name) {
  if(!Object.hasOwn(emoji,name))return '';
  return '<span class="tk7-icon tk7-icon-emoji tk7-icon-'+name+'" aria-hidden="true">'+emoji[name]+'</span>';
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
