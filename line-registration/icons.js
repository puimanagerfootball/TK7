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
 const html = name => Object.hasOwn(paths,name)
  ? '<svg class="tk7-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[name]+'</svg>' : '';
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
