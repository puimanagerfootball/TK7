globalThis.TK7LineupMedia = (() => {
    const bucketName = 'tk7-tactics-media';
    const pendingKey = 'tk7.pending-video-share';
    const lifetime = 7 * 24 * 60 * 60;
    async function upload({ db, userId, approved, video, poster }) {
        if (!userId || !approved) throw Error('กรุณาเข้าสู่ระบบผู้ดูแลก่อนเตรียมวิดีโอส่ง LINE');
        if (video.type !== 'video/mp4' || video.size > 25 * 1024 * 1024 ||
            poster.type !== 'image/jpeg' || poster.size > 2 * 1024 * 1024) {
            throw Error('วิดีโอต้องเป็น MP4 ไม่เกิน 25 MB และภาพตัวอย่างไม่เกิน 2 MB');
        }
        const folder = userId + '/' + crypto.randomUUID();
        const paths = [folder + '/video.mp4', folder + '/preview.jpg'];
        const bucket = db.storage.from(bucketName);
        try {
            for (const [index, blob] of [video, poster].entries()) {
                const { error } = await bucket.upload(paths[index], blob, { contentType: blob.type, upsert: false });
                if (error) throw error;
            }
            const signed = await Promise.all(paths.map(path => bucket.createSignedUrl(path, lifetime)));
            for (const result of signed) if (result.error) throw result.error;
            return {
                type: 'video',
                originalContentUrl: signed[0].data.signedUrl,
                previewImageUrl: signed[1].data.signedUrl
            };
        } catch (error) {
            await bucket.remove(paths).catch(() => {});
            throw error;
        }
    }
    function remember(message) {
        try { sessionStorage.setItem(pendingKey, JSON.stringify({ message, expires: Date.now() + lifetime * 1000 })); } catch {}
    }
    function pending() {
        try {
            const cached = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
            if (!cached || !Number.isFinite(cached.expires) || cached.expires <= Date.now() || cached.message?.type !== 'video') return null;
            for (const value of [cached.message.originalContentUrl, cached.message.previewImageUrl]) {
                const url = new URL(value);
                if (url.origin !== 'https://rwsyiiulfbolymxppvmy.supabase.co' ||
                    !url.pathname.startsWith('/storage/v1/object/sign/' + bucketName + '/')) return null;
            }
            return cached.message;
        } catch { return null; }
    }
    function forget() { try { sessionStorage.removeItem(pendingKey); } catch {} }
    return { upload, remember, pending, forget };
})();
