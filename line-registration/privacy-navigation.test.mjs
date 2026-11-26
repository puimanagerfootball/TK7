import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync(new URL('privacy.html',import.meta.url),'utf8');
test('both privacy indexes link to existing answers in their selected language',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const lang of ['th','en']){
  const section=html.match(new RegExp('<section class="lang-'+lang+'" lang="'+lang+'"><h2 id="toc-heading-'+lang+'">([\\s\\S]*?)</section>'))?.[0];assert.ok(section);
  const links=[...section.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);assert.equal(links.length,9);
  for(const id of links){assert.ok(ids.includes(id));assert.ok(id==='privacy-contact'||id.endsWith('-'+lang));}
 }
 assert.equal((html.match(/class="topic-back"/g)||[]).length,16);
});
test('custom app launch overlay is absent while native splash branding remains',()=>{
 const main=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(!main.includes('tk7-startup'));assert.ok(!fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8').includes('TK7Startup'));
 const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));assert.equal(manifest.background_color,'#103d2b');assert.equal(manifest.icons.length,2);
});

test('privacy always offers an accessible return to the topic index in either language',()=>{
 assert.match(html,/<a class="privacy-to-top" href="#privacy-index">/);assert.ok(html.includes('กลับสารบัญ'));assert.ok(html.includes('Back to topics'));assert.ok(html.includes('safe-area-inset-bottom'));assert.ok(html.includes('id="privacy-index" class="privacy-index" tabindex="-1"'));
});
