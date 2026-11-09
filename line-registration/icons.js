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
  bell:'🔔'
 };
 function html(name) {
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
