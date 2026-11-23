import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function harness(failAt = '') {
    const calls = [], cache = new Map();
    const bucket = {
        async upload(path, blob, options) {
            calls.push(['upload', path, options]);
            return { error: path.endsWith(failAt || '!') ? Error('Upload failed') : null };
        },
        async createSignedUrl(path, seconds) {
            calls.push(['sign', path, seconds]);
            return { data: { signedUrl: 'https://rwsyiiulfbolymxppvmy.supabase.co/storage/v1/object/sign/tk7-tactics-media/' + path } };
        },
        async remove(paths) { calls.push(['remove', paths]); }
    };
    const context = { URL, Date, crypto: { randomUUID: () => 'unique-id' }, sessionStorage: {
        setItem: (key, value) => cache.set(key, value), getItem: key => cache.get(key), removeItem: key => cache.delete(key)
    } };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(new URL('../js/lineup-media.js', import.meta.url), 'utf8'), context);
    return { api: context.TK7LineupMedia, calls, cache, args: {
        db: { storage: { from: name => { assert.equal(name, 'tk7-tactics-media'); return bucket; } } },
        userId: 'owner', approved: true,
        video: { type: 'video/mp4', size: 100 }, poster: { type: 'image/jpeg', size: 20 }
    } };
}

test('LINE video uses owner-scoped private uploads and seven-day signed URLs', async () => {
    const { api, calls, args } = harness();
    const message = await api.upload(args);
    assert.equal(message.type, 'video');
    assert.match(message.originalContentUrl, /owner\/unique-id\/video.mp4$/);
    assert.match(message.previewImageUrl, /preview.jpg$/);
    assert.equal(calls.filter(call => call[0] === 'sign').every(call => call[2] === 604800), true);
    assert.equal(calls[0][2].upsert, false);
});

test('incomplete upload removes its files and never creates sharing links', async () => {
    const { api, calls, args } = harness('preview.jpg');
    await assert.rejects(api.upload(args), /Upload failed/);
    assert.equal(calls.at(-1)[0], 'remove');
    assert.equal(calls.some(call => call[0] === 'sign'), false);
});

test('unapproved users and oversized files cannot start upload', async () => {
    const { api, calls, args } = harness();
    await assert.rejects(api.upload({ ...args, approved: false }));
    await assert.rejects(api.upload({ ...args, video: { type: 'video/mp4', size: 26 * 1024 * 1024 } }));
    assert.equal(calls.length, 0);
});

test('login resume accepts only unexpired video URLs in the private media bucket', async () => {
    const { api, args, cache } = harness();
    const message = await api.upload(args);
    api.remember(message);
    assert.equal(api.pending().originalContentUrl, message.originalContentUrl);
    const key = [...cache.keys()][0];
    cache.set(key, JSON.stringify({ message, expires: 0 }));
    assert.equal(api.pending(), null);
    api.remember({ ...message, originalContentUrl: 'https://example.com/video.mp4' });
    assert.equal(api.pending(), null);
    api.forget();
    assert.equal(cache.size, 0);
});
