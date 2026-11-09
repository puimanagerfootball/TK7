// Trusted SVG paths for interface icons. Player names and shared LINE text stay plain text.
(() => {
 const paths = {
  ball:'<circle cx="12" cy="12" r="9"/><path d="m12 8 4 3-1.5 4.5h-5L8 11l4-3Zm0 0V3m4 8 4.5-2m-6 6.5 3 4m-8-4-3 4M8 11 3.5 9"/>',
  share:'<path d="M13 5h6v6m0-6-9 9m7-1v6H5V7h6"/>',
  import:'<path d="M12 3v11m-4-4 4 4 4-4M4 14v6h16v-6"/>',
  list:'<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',
  shirt:'<path d="m9 4-5 2-2 5 4 2 2-3v10h8V10l2 3 4-2-2-5-5-2a3 3 0 0 1-6 0Z"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  unlock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0m-4 7v3"/>',
  trash:'<path d="M4 7h16m-14 0 1 13h10l1-13M9 7V4h6v3m-5 4v5m4-5v5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar:'<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v5m8-5v5M4 10h16m-12 4h2m4 0h2m-8 3h2"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 1 1 0 6m2 2a5 5 0 0 1 3 5v2"/>',
  shield:'<path d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-3Zm-4 9 3 3 5-6"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3h.01"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2"/>',
  trophy:'<path d="M8 4h8v6a4 4 0 0 1-8 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v6m-4 0h8"/>',
  save:'<path d="M5 4h12l3 3v13H4V5l1-1Zm3 0v6h8V4M8 20v-6h8v6"/>',
  edit:'<path d="m5 16-1 4 4-1L20 7l-3-3L5 16Zm10-10 3 3"/>',
  chart:'<path d="M4 4v16h16M8 16v-4m4 4V8m4 8v-6"/>',
  phone:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17h2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  view:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  warning:'<path d="M12 4 2 20h20L12 4Zm0 6v4m0 3h.01"/>',
  palette:'<path d="M20 12a8 8 0 1 0-8 8h2a2 2 0 0 0 1-4c-1-1 0-2 1-2h2a2 2 0 0 0 2-2ZM8 10h.01m4-3h.01m4 3h.01m-8 5h.01"/>',
  bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4"/>'
 };
 const palettes = {
  ball:['#145421','#2e9d41','#58ba61'],
  shirt:['#45226b','#8050bd','#a474d7'],
  calendar:['#16427e','#286fce','#548fe5'],
  edit:['#813809','#c56616','#e18d35'],
  trophy:['#734305','#a96b10','#cb8d26'],
  share:['#124d2e','#278f55','#49ac6d'],
  import:['#123d77','#246bc2','#4c92e6'],
  list:['#08545a','#16828b','#36a2aa'],
  lock:['#723509','#ad5816','#d48137'],
  unlock:['#145421','#2e9d41','#58ba61'],
  trash:['#751d25','#bd343f','#e15d63'],
  clock:['#16427e','#286fce','#548fe5'],
  users:['#244779','#386db3','#6396d5'],
  shield:['#124d2e','#278f55','#49ac6d'],
  pin:['#751d25','#bd343f','#e15d63'],
  warning:['#734305','#a96b10','#cb8d26']
 };
 const worldCup = '<circle cx="16" cy="9.5" r="7.4" fill="#d8901b" stroke="#6c3908" stroke-width="1.1"/>'+
  '<path d="M9 9.6a7.2 7.2 0 0 1 12.5-4.7c-2.2-.6-4-.1-5 1.2l.8 2.2-2.4 1.5-2.7-.8-1.2 2.2Z" fill="#ffe497"/>'+
  '<path d="M21.9 8.1c1.7 3.1-.5 6.1-3.5 7.1l-1.1-2 2.6-1.8-.2-2.3Z" fill="#ffc757"/>'+
  '<path d="M7.8 12.2c2.3 3 5.8 4.8 8.4 6.7 3.3-2 6.1-5.4 7.7-8.1l2.2 2.3c-1.4 5.2-5 9.1-7.2 12.1l-.5 5.9h-5.6l-.5-5.4C9 22.2 6.2 17.7 5.9 14Z" fill="#d98f17" stroke="#6c3908" stroke-width="1.2"/>'+
  '<path d="M7.4 13.6c2.8 3.9 5.9 5.6 8.7 8.6l-1 8.3h-2l-.5-5.1c-3-3.5-5.3-7.1-5.2-11.8Zm16.8-.4c-1.5 3.8-4.6 7.5-6.7 9.5l-.6 7.8h1.5l.5-5.6c2.5-3.3 5.6-7 6.4-10.6Z" fill="#ffe08c"/>'+
  '<path d="M11.4 30.3h9.2l1.5 4.6H9.9Z" fill="#227349" stroke="#0e3a27" stroke-width="1.2"/>'+
  '<path d="M10.7 33.2h10.6l.8 1.7H9.9Z" fill="#e3a535"/>';
 function html(name) {
  if(name==='world-cup')return '<svg class="tk7-icon tk7-icon-world-cup" viewBox="0 0 32 37" aria-hidden="true" focusable="false">'+worldCup+'</svg>';
  if(!Object.hasOwn(paths,name))return '';
  const attrs=' fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  const [edge,face,light]=palettes[name]||['#184c35','#327a53','#5c9e73'];
  return '<svg class="tk7-icon tk7-icon-badge" viewBox="0 0 32 32"'+attrs+
   '<rect x="1" y="1" width="30" height="30" rx="6" fill="'+edge+'"/>'+
   '<rect x="2.5" y="2.5" width="27" height="25" rx="4.5" fill="'+face+'"/>'+
   '<path d="M3.5 7a4 4 0 0 1 4-4h17a4 4 0 0 1 4 4v4h-25Z" fill="'+light+'"/>'+
   '<rect x="4" y="4" width="24" height="22.5" rx="3.5" stroke="#fff" stroke-opacity=".48" stroke-width=".9"/>'+
   '<g transform="translate(5 4) scale(.9167)" stroke="#fff" stroke-width="1.85">'+paths[name]+'</g></svg>';
 }
 function node(name) {
  const template=document.createElement('template');
  template.innerHTML=html(name);
  return template.content.firstElementChild;
 }
 globalThis.TK7Icons={html,node};
 for(const placeholder of document.querySelectorAll('[data-tk7-icon]')){
  const icon=node(placeholder.dataset.tk7Icon);
  if(icon)placeholder.replaceWith(icon);
 }
})();
