// Shared decorative icons; the World Cup lever uses its custom SVG.
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
  bell:'🔔'
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
  if(!Object.hasOwn(emoji,name))return '';
  return '<span class="tk7-icon tk7-icon-emoji" aria-hidden="true">'+emoji[name]+'</span>';
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
