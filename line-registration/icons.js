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
  settings:'<path d="M18.5 9.3 18.9 10.4 21.7 10.3v3.4l-2.8-.1-.4 1.1-.5 1 2 1.9-2.4 2.4-1.9-2-1 .5-1.1.4.1 2.8h-3.4l.1-2.8-1.1-.4-1-.5-1.9 2L4 17.6l2-1.9-.5-1-.4-1.1-2.8.1v-3.4l2.8.1.4-1.1.5-1-2-1.9L6.4 4l1.9 2 1-.5 1.1-.4-.1-2.8h3.4l-.1 2.8 1.1.4 1 .5 1.9-2L20 6.4l-2 1.9Z M15.3 12a3.3 3.3 0 1 0-6.6 0 3.3 3.3 0 1 0 6.6 0Z" fill="currentColor" fill-rule="evenodd" stroke-width="1.35"/>',
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
  ball:['#123f2a','#319449'],shirt:['#45226b','#9858df'],calendar:['#123c77','#428aeb'],
  edit:['#80380b','#ffb34f'],trophy:['#784306','#f9bd45'],share:['#104e31','#53d98d'],
  import:['#123f76','#78b9ff'],list:['#094d56','#5ed4d0'],lock:['#783d10','#ffc160'],
  unlock:['#145421','#68d88f'],trash:['#781e29','#ff8b94'],clock:['#16427e','#81bdf8'],
  users:['#244779','#7cb6fa'],shield:['#124d2e','#60cb8c'],pin:['#751d25','#f37880'],
  warning:['#734305','#ffc354'],settings:['#193c61','#70a8df']
 };
 const silhouettes = {
  ball:'<circle cx="12" cy="12" r="9" fill="#fff"/><path fill="currentColor" d="m12 8 4 3-1.5 4.5h-5L8 11Zm0-5 3.1.6L12 8 9 3.6ZM16 11l4.5-2-.3 4.1Zm-1.5 4.5 3 4-4 1.3Zm-5 0-3 4L4 16.2ZM8 11l-4.5-2-.2 4Z"/>',
  shirt:'<path fill="currentColor" d="m9 4-5 2-2 5 4 2 2-3v10h8V10l2 3 4-2-2-5-5-2a3 3 0 0 1-6 0Z"/><path d="M9 5.2a3.6 3.6 0 0 0 6 0M10 18h4" stroke="#f4e7ff"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="16" rx="3" fill="currentColor"/><path d="M5 10h14v9H5Z" fill="#f0f7ff" stroke="none"/><path d="M8 3v4m8-4v4M7.5 13.3h1m3 0h1m3 0h1m-9 3h1m3 0h1m3 0h1"/>',
  edit:'<path fill="currentColor" d="m5 16-1 4 4-1L20 7l-3-3L5 16Z"/><path d="m15 6 3 3M6 16l2 2m-.2-2.3 7.8-7.8" stroke="#fff4ce"/>',
  trophy:'<path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4" stroke-width="2"/><path d="M8 4h8v6a4 4 0 0 1-8 0Zm3.1 10h1.8v4h2.7l1.4 2H7l1.4-2h2.7Z" fill="currentColor"/><path d="M10 6v4a2 2 0 0 0 2 2" stroke="#fff1aa"/>',
  share:'<path d="M5 7h6v4h3l3 2v6H5Z" fill="currentColor"/><path d="M13 4h7v7l-2.5-2.5-6.4 6.4-2-2 6.4-6.4Z" fill="#e4ffec"/>',
  import:'<path d="M4 14h4l2 2h4l2-2h4v6H4Z" fill="currentColor"/><path d="M10.6 3h2.8v7H17l-5 4-5-4h3.6Z" fill="#e8f4ff"/>',
  list:'<rect x="5" y="4" width="14" height="16" rx="2" fill="currentColor"/><path d="M8.5 8h7m-7 4h7m-7 4h4.5" stroke="#fff"/>',
  lock:'<path d="M8 10V7a4 4 0 0 1 8 0v3" stroke-width="2"/><rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M12 14v3"/>',
  unlock:'<path d="M8 10V7a4 4 0 0 1 8 0" stroke-width="2"/><rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M12 14v3"/>',
  trash:'<path d="m6 7 1 13h10l1-13Z" fill="currentColor"/><path d="M4 7h16m-11 0V4h6v3m-5 4v5m4-5v5"/>',
  clock:'<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M12 7v5l3 2" stroke="#fff"/>',
  shield:'<path d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6Z" fill="currentColor"/><path d="m8 12 3 3 5-6" stroke="#fff"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z" fill="currentColor"/><circle cx="12" cy="10" r="2" fill="#fff"/>'
 };
 const worldCup = '<g stroke-linecap="round" stroke-linejoin="round">'+
  '<circle cx="18" cy="10.2" r="8.5" fill="#f4b33e" stroke="#794307" stroke-width="1.15"/>'+
  '<path d="M10.4 8.1a8 8 0 0 1 11.1-5.3l-1.9 1.1.3 1.5-2.1 1.1-1.4-.6-1.6 1.5.8 1.6-1.1 1.2-1.7-.4-.9 1.4Z" fill="#ffe7a2"/>'+
  '<path d="m16.7 10 2 .3 1.2 1.4 1.6.4-.9 2.2-1.7 2.3-1.2-.6-.1-2.1-1.2-1.3Zm6.4-3.4 2.2 1.7.4 1.6-1.6.7-1.7-1.8Z" fill="#c77c13"/>'+
  '<path d="M11.2 13.8c3.4 2.6 9.4 2.5 13.3-.6m-12-8.1c-1.8 2-2.3 4.6-1.8 6.7m13.7-7c1.6 2 2.1 4.2 1.5 6.8" fill="none" stroke="#fff0ad" stroke-opacity=".7" stroke-width=".75"/>'+
  '<path d="M6.6 15.5c2.1 3.3 6.4 5.7 10.9 7.9 4.3-2.4 8.3-6.1 10.8-10.3l1.8 2.4c-1.2 5.5-5.1 10.3-8.8 14.2l-.8 7.1h-5.8l-.5-6.4C10.5 26 6.1 20.7 5.4 17.2Z" fill="#c98518" stroke="#794307" stroke-width="1.2"/>'+
  '<path d="M6.7 16.8c3.5 4.1 7.9 6 11.6 8.3l-1.1 10.4h-1.7l-.6-5.5c-3.6-4-6.9-8.1-8.2-13.2Zm21.7-2.4c-1.5 4.5-5 8.5-8.8 11.8l-.7 9.3h1.2l.7-6.5c3.6-3.7 7.1-8.7 7.6-14.6Z" fill="#ffe491"/>'+
  '<path d="M9.4 20.4c2.3 2.8 4.6 4.1 7.1 5.9m5.1-.2c2.4-2.5 4.4-5.3 5.4-8.4m-9.2 9.5-.5 7.4" fill="none" stroke="#a65a0c" stroke-width=".85"/>'+
  '<path d="M13.8 35.9h7.9l1.7 5.3H12.2Z" fill="#17724b" stroke="#234421" stroke-width="1.1"/>'+
  '<path d="M14 37.3h7.5m-8.7 2.2h10.1" stroke="#82c895" stroke-width=".75"/>'+
  '<path d="M12.3 40h11l.3 1.5H12Z" fill="#eab143" stroke="#8f520b" stroke-width=".7"/></g>';
 function html(name) {
  if(name==='world-cup')return '<svg class="tk7-icon tk7-icon-world-cup" viewBox="0 0 36 43" aria-hidden="true" focusable="false">'+worldCup+'</svg>';
  if(!Object.hasOwn(paths,name))return '';
  const attrs=' fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  const [edge,face]=palettes[name]||['#184c35','#5ac38c'];
  return '<svg class="tk7-icon tk7-icon-shape" viewBox="0 0 24 24" color="'+face+'" stroke="'+edge+'" stroke-width="1.55"'+attrs+
   (silhouettes[name]||paths[name])+'</svg>';
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
