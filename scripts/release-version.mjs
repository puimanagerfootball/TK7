import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version=process.argv[2];
if(!/^\d+\.\d+\.\d+$/.test(version||''))throw Error('Usage: node scripts/release-version.mjs 4.0.19');
for(const file of ['index.html','js/app.js','line-registration/register.html']){
 const filename=path.join(root,file);
 let text=fs.readFileSync(filename,'utf8').replace(/Ver \d+\.\d+\.\d+/g,'Ver '+version);
 if(file.endsWith('.html'))text=text.replace(/((?:src|href)="(?!https?:)[^"]+\?v=)[^"]+/g,(_,prefix)=>prefix+version);
 fs.writeFileSync(filename,text);
}
fs.copyFileSync(path.join(root,'css/app.css'),path.join(root,'line-registration/schedule-web.css'));
fs.writeFileSync(path.join(root,'version.json'),JSON.stringify({version},null,2)+'\n');
console.log('TK7 and LINE LIFF: '+version);
