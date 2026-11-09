import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.resolve(process.argv[2]||'');
const workspace=path.dirname(root);
if(!site.startsWith(workspace+path.sep)||path.basename(site)!=='tk7-site-release')throw Error('Expected the existing tk7-site-release checkout in this workspace');
const manifest=JSON.parse(fs.readFileSync(path.join(site,'.openai/hosting.json'),'utf8'));
if(manifest.project_id!=='appgprj_6ae7ee8d6c4c81918352700a8c9ea8a2')throw Error('Unexpected Sites identity');
const destination=path.join(site,'dist'),source=path.join(root,'line-registration');
const files=['register.html','privacy.html','privacy-control.css','config.js','share-launcher.js','backdrop-guard.js','schedule.js','schedule-image.js','browser-safety.js','icons.js','roster-summary.js','name-paste.js','registration.js','share-menu.mjs','share-card.mjs','team-card.css','schedule-web.css','vendor/html2canvas-1.4.1.min.js','vendor/html2canvas-1.4.1.min.js.LICENSE'];
for(const file of files){const target=path.join(destination,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(source,file),target)}
fs.copyFileSync(path.join(source,'register.html'),path.join(destination,'index.html'));
fs.copyFileSync(path.join(root,'version.json'),path.join(destination,'version.json'));
// These server/admin modules were copied by the former broad *.js copy step.
for(const file of ['security.js','admin-integration.js']){
 const target=path.join(destination,file);if(fs.existsSync(target))fs.unlinkSync(target);
}
console.log('LIFF mirror synchronized: '+(files.length+2)+' required assets; server/admin-only files excluded');
