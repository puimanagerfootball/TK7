import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);

test('manifest icons are local valid PNGs matching their declared dimensions',()=>{
    const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
    assert.equal(manifest.display,'standalone');
    for(const size of [192,512]){
        const icon=manifest.icons.find(icon=>icon.sizes===`${size}x${size}`);
        assert.ok(icon);
        assert.equal(icon.type,'image/png');
        assert.equal(icon.src.startsWith('assets/icons/'),true);
        const png=fs.readFileSync(new URL(icon.src,root));
        assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
        assert.equal(png.readUInt32BE(16),size);
        assert.equal(png.readUInt32BE(20),size);
    }
});

test('page icon links resolve locally and old standalone meta flag is removed',()=>{
    const html=fs.readFileSync(new URL('index.html',root),'utf8');
    assert.doesNotMatch(html,/name="apple-mobile-web-app-capable"/);
    assert.doesNotMatch(html,/cdn-icons-png\.flaticon\.com/);
    for(const match of html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]+href="([^"]+)"/g)){
        assert.ok(fs.existsSync(new URL(match[1],root)));
    }
    const apple=fs.readFileSync(new URL('assets/icons/icon-180.png',root));
    assert.equal(apple.readUInt32BE(16),180);
    assert.equal(apple.readUInt32BE(20),180);
});
