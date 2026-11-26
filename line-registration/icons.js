// Shared 24px outline SVG icons for web and LINE registration controls.
(() => {
 const artwork={
  "ball": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m12 7 4.5 3.3-1.7 5.2H9.2l-1.7-5.2zM12 3v4m8.6 2.2-4.1 1.1m.8 8.4-2.5-3.2m-8.1 3.2 2.5-3.2M3.4 9.2l4.1 1.1\"/>",
  "share": "<path d=\"M14 3h7v7m0-7L10 14M11 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6\"/>",
  "import": "<path d=\"M12 3v11m-4-4 4 4 4-4M4 13v7h16v-7M4 15h4l2 3h4l2-3h4\"/>",
  "list": "<rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><rect x=\"9\" y=\"2\" width=\"6\" height=\"4\" rx=\"1\"/><path d=\"M9 10h6m-6 4h6m-6 4h4\"/>",
  "shirt": "<path d=\"m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0z\"/>",
  "lock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3m-4 5v2\"/>",
  "unlock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0m-4 8v2\"/>",
  "trash": "<path d=\"M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 6v6l4 2\"/>",
  "calendar": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 3v4m10-4v4M3 10h18m-14 4h2m4 0h2m-8 3h2m4 0h2\"/>",
  "users": "<circle cx=\"9\" cy=\"7\" r=\"3\"/><path d=\"M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2\"/>",
  "shield": "<path d=\"m12 2-9 4v6c0 5 5 8 9 10 4-2 9-5 9-10V6zM8 12l3 3 5-6\"/>",
  "help": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 8.5a2.6 2.6 0 1 1 4 2.3c-1 .6-1.5 1-1.5 2.2m0 3h.01\"/>",
  "settings": "<polygon points=\"12.00,4.00 13.95,2.19 15.83,2.76 16.44,5.35 17.66,6.34 20.31,6.44 21.24,8.17 19.85,10.44 20.00,12.00 21.81,13.95 21.24,15.83 18.65,16.44 17.66,17.66 17.56,20.31 15.83,21.24 13.56,19.85 12.00,20.00 10.05,21.81 8.17,21.24 7.56,18.65 6.34,17.66 3.69,17.56 2.76,15.83 4.15,13.56 4.00,12.00 2.19,10.05 2.76,8.17 5.35,7.56 6.34,6.34 6.44,3.69 8.17,2.76 10.44,4.15\"/><circle cx=\"12\" cy=\"12\" r=\"3.3\"/>",
  "trophy": "<path d=\"M7 3h10v7a5 5 0 0 1-10 0zM7 5H3v3a5 5 0 0 0 5 5m9-8h4v3a5 5 0 0 1-5 5M12 15v6m-4 0h8\"/>",
  "save": "<path d=\"M4 3h13l4 4v14H3V3zm3 0v6h10V3M7 21v-8h10v8\"/>",
  "edit": "<path d=\"m4 16-1 5 5-1L21 7l-4-4zM14 6l4 4M4 16l4 4\"/>",
  "chart": "<path d=\"M3 3v18h18M7 17v-4m5 4V7m5 10V4\"/>",
  "phone": "<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2\"/><path d=\"M10 5h4m-3 14h2\"/>",
  "plus": "<path d=\"M12 4v16M4 12h16\"/>",
  "check": "<path d=\"m5 12 4 4L19 6\"/>",
  "view": "<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "pin": "<path d=\"M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>",
  "warning": "<path d=\"M12 3 2 21h20zM12 9v5m0 3h.01\"/>",
  "palette": "<path d=\"M21 12a9 9 0 1 0-9 9h1a2 2 0 0 0 0-4 2 2 0 0 1 0-4h6a2 2 0 0 0 2-1z\"/><circle cx=\"7\" cy=\"10\" r=\".7\"/><circle cx=\"10\" cy=\"6.5\" r=\".7\"/><circle cx=\"15\" cy=\"7\" r=\".7\"/>",
  "bell": "<path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6M12 2V1\"/>",
  "play": "<path d=\"m7 4 14 8-14 8z\"/>",
  "stop": "<rect x=\"5\" y=\"5\" width=\"14\" height=\"14\" rx=\"1\"/>",
  "reset": "<path d=\"M3 10a9 9 0 1 1 1 8M3 4v6h6\"/>",
  "download": "<path d=\"M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4\"/>",
  "logout": "<path d=\"M10 4H4v16h6M15 8l4 4-4 4M8 12h11\"/>",
  "link": "<path d=\"m10 13 4-4m-6 6-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 8a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1\" transform=\"translate(1 1)\"/>",
  "close": "<path d=\"m6 6 12 12M6 18 18 6\"/>",
  "move": "<path d=\"M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4\"/>",
  "pitch": "<rect x=\"3\" y=\"2\" width=\"18\" height=\"20\" rx=\"1\"/><path d=\"M3 12h18M8 2v4h8V2M8 22v-4h8v4\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"
};
 function html(name) {
  if(!Object.hasOwn(artwork,name))return '';
  const content='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+artwork[name]+'</svg>';
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
   [/^(ส่ง LINE|แชร์ LINE|ส่งสรุป|เตรียมส่ง LINE|เลือกแชต LINE|เลือกแชตหรือกลุ่ม LINE|แชร์ผ่านเครื่อง|Share|Send)/i,'share'],
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
 function hydrate(root){
  const placeholders=[...(root.matches?.('[data-tk7-icon]')?[root]:[]),...root.querySelectorAll('[data-tk7-icon]')];
  for(const placeholder of placeholders){const icon=node(placeholder.dataset.tk7Icon);if(icon)placeholder.replaceWith(icon);}
 }
 hydrate(document);
 for(const control of document.querySelectorAll('button,summary'))decorateAction(control);
 // Inspect only newly changed controls, including labels changed by language or playback state.
 if(typeof MutationObserver!=='undefined'&&document.body){
  new MutationObserver(records=>{
   const controls=new Set();
   for(const record of records){
    const parent=record.target.closest?.('button,summary');if(parent)controls.add(parent);
    for(const added of record.addedNodes){
     if(added.nodeType!==1)continue;
     hydrate(added);
     if(added.matches('button,summary'))controls.add(added);
     for(const child of added.querySelectorAll('button,summary'))controls.add(child);
    }
   }
   for(const control of controls)decorateAction(control);
  }).observe(document.body,{childList:true,subtree:true});
 }
})();
