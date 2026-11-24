// Render tactical clips on a canvas so recording does not repeatedly capture the DOM.
globalThis.TK7LineupVideo = (() => {
    const paths = new WeakMap();
    function positionAt(player, progress) {
        if(globalThis.TK7Path){
            if(!paths.has(player))paths.set(player,globalThis.TK7Path.prepare(player.start,player.route));
            return globalThis.TK7Path.position(paths.get(player),progress);
        }
        const points = [player.start, ...player.route];
        if (points.length === 1) return player.start;
        const offset = Math.max(0, Math.min(1, progress)) * (points.length - 1);
        const index = Math.min(Math.floor(offset), points.length - 2);
        const fraction = offset - index;
        return {
            x: points[index].x + (points[index + 1].x - points[index].x) * fraction,
            y: points[index].y + (points[index + 1].y - points[index].y) * fraction
        };
    }

    function draw(context, plan, progress) {
        const width = 720, height = 1024, left = 36, top = 120, fieldWidth = 648, fieldHeight = 832;
        const location = point => [left + point.x / 100 * fieldWidth, top + point.y / 100 * fieldHeight];
        context.fillStyle = '#123c2a';
        context.fillRect(0, 0, width, height);
        context.textAlign = 'center';
        context.fillStyle = '#fff';
        context.font = '700 28px Kanit, sans-serif';
        context.fillText('TK7 · ' + (plan.teamName || 'แผนการวิ่ง'), width / 2, 48);
        context.font = '20px Kanit, sans-serif';
        context.fillText('แผน ' + (plan.formation || ''), width / 2, 86);
        for (let stripe = 0; stripe < 8; stripe++) {
            context.fillStyle = stripe % 2 ? '#2d774b' : '#348653';
            context.fillRect(left, top + stripe * fieldHeight / 8, fieldWidth, fieldHeight / 8);
        }
        context.strokeStyle = '#c9e8cd';
        context.lineWidth = 3;
        context.strokeRect(left + 6, top + 6, fieldWidth - 12, fieldHeight - 12);
        context.beginPath();
        context.moveTo(left, top + fieldHeight / 2);
        context.lineTo(left + fieldWidth, top + fieldHeight / 2);
        context.stroke();
        context.beginPath();
        context.arc(width / 2, top + fieldHeight / 2, 76, 0, Math.PI * 2);
        context.stroke();
        for (const goalY of [top + 6, top + fieldHeight - 138]) {
            context.strokeRect(left + fieldWidth * .22, goalY, fieldWidth * .56, 132);
        }
        for (const player of plan.players) {
            const [x, y] = location(positionAt(player, progress));
            context.beginPath();
            context.arc(x, y, 24, 0, Math.PI * 2);
            context.fillStyle = player.color;
            context.fill();
            context.strokeStyle = '#fff';
            context.lineWidth = 3;
            context.stroke();
            context.font = '700 17px Kanit, sans-serif';
            context.fillStyle = player.textColor;
            context.fillText(player.label, x, y + 6, 42);
            context.font = '18px Kanit, sans-serif';
            const name = player.name === 'ว่าง' ? '' : player.name;
            if (name) {
                const labelWidth = Math.min(130, context.measureText(name).width + 16);
                context.fillStyle = '#102b22';
                context.fillRect(x - labelWidth / 2, y + 30, labelWidth, 28);
                context.fillStyle = '#fff';
                context.fillText(name, x, y + 50, labelWidth - 10);
            }
        }
        context.font = '18px Kanit, sans-serif';
        context.fillStyle = '#e3f3e8';
        context.fillText('ทิศทางการวิ่ง · TK7 Football', width / 2, 995);
    }

    function record(canvas, plan, signal, status) {
        const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4']
            .find(type => globalThis.MediaRecorder?.isTypeSupported(type));
        if (!mime || !canvas.captureStream) {
            return Promise.reject(Error('เบราว์เซอร์นี้ยังสร้าง MP4 ไม่ได้ กรุณาเปิดด้วย Chrome หรือ Safari เวอร์ชันล่าสุด'));
        }
        return new Promise((resolve, reject) => {
            let stream, recorder, frame, deadline, settled = false;
            const chunks = [];
            const context = canvas.getContext('2d', { alpha: false });
            const finish = error => {
                if (settled) return;
                settled = true;
                cancelAnimationFrame(frame);
                clearTimeout(deadline);
                signal.removeEventListener('abort', cancelled);
                document.removeEventListener('visibilitychange', hidden);
                if (recorder?.state === 'recording') recorder.stop();
                stream?.getTracks().forEach(track => track.stop());
                if (error) reject(error);
                else {
                    const blob = new Blob(chunks, { type: 'video/mp4' });
                    if (blob.size) resolve(blob);
                    else reject(Error('สร้างวิดีโอไม่สำเร็จ กรุณาลองใหม่'));
                }
            };
            const cancelled = () => finish(new DOMException('ยกเลิกสร้างวิดีโอ', 'AbortError'));
            const hidden = () => { if (document.hidden) finish(Error('กรุณาเปิดหน้านี้ไว้ระหว่างสร้างวิดีโอ แล้วลองอีกครั้ง')); };
            signal.addEventListener('abort', cancelled, { once: true });
            document.addEventListener('visibilitychange', hidden);
            if (signal.aborted) { cancelled(); return; }
            try {
                draw(context, plan, 0);
                stream = canvas.captureStream(30);
                recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 });
                recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
                recorder.onerror = () => finish(Error('เครื่องสร้างวิดีโอไม่สำเร็จ กรุณาลองใหม่'));
                recorder.onstop = () => finish();
                const start = performance.now();
                const total = plan.duration + 1300;
                let lastFrame = -1, lastProgress = -1;
                recorder.start();
                const paint = now => {
                    if (settled) return;
                    const elapsed = now - start;
                    try {
                        const frameNumber=Math.floor(elapsed*30/1000);
                        if(frameNumber!==lastFrame){
                            draw(context, plan, Math.max(0, Math.min(1, (elapsed - 500) / plan.duration)));
                            lastFrame=frameNumber;
                        }
                    } catch (error) { finish(error); return; }
                    const progress=Math.min(99,Math.floor(elapsed/total*100));
                    if(progress!==lastProgress){status.textContent='กำลังสร้างวิดีโอ '+progress+'%';lastProgress=progress;}
                    if (elapsed >= total) { recorder.stop(); return; }
                    frame = requestAnimationFrame(paint);
                };
                deadline = setTimeout(() => finish(Error('สร้างวิดีโอนานเกินไป กรุณาลองใหม่')), total + 10000);
                frame = requestAnimationFrame(paint);
            } catch (error) { finish(error); }
        });
    }

    let current = null;
    async function open(plan, prepared = null) {
        if ((!plan && !prepared) || current) return;
        const controller = new AbortController();
        const dialog = document.createElement('dialog');
        dialog.className = 'lineup-video-dialog';
        const title = document.createElement('h2');
        title.textContent = 'วิดีโอแผนการวิ่ง';
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.textContent = 'กำลังเตรียมวิดีโอ…';
        const preview = document.createElement('video');
        preview.controls = true;
        preview.playsInline = true;
        preview.hidden = true;
        const share = document.createElement('button');
        share.type = 'button';
        share.textContent = 'แชร์ผ่านเครื่อง';
        share.disabled = true;
        share.hidden = true;
        const lineShare = document.createElement('button');
        lineShare.type = 'button';
        lineShare.textContent = 'เตรียมส่ง LINE';
        lineShare.disabled = true;
        const download = document.createElement('a');
        download.textContent = 'ดาวน์โหลด MP4';
        download.hidden = true;
        download.download = 'TK7-Tactics.mp4';
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = 'ปิด';
        const actions = document.createElement('div');
        actions.className = 'lineup-video-actions';
        actions.append(lineShare, share, download, close);
        dialog.append(title, preview, status, actions);
        document.body.append(dialog);
        dialog.showModal();
        current = dialog;
        let url = null;
        let message = prepared;
        let videoBlob = null;
        let poster = null;
        lineShare.onclick = async () => {
            lineShare.disabled = true;
            try {
                if (!message) {
                    status.textContent = 'กำลังอัปโหลดวิดีโอและภาพตัวอย่าง…';
                    message = await globalThis.TK7UploadTactics(videoBlob, poster);
                    if (controller.signal.aborted) return;
                    globalThis.TK7LineupMedia.remember(message);
                    lineShare.textContent = 'เลือกแชต LINE';
                    status.textContent = 'พร้อมส่ง กดเลือกแชต LINE · ลิงก์ไฟล์มีอายุ 7 วัน';
                    return;
                }
                // Invoke the picker in this click, before any asynchronous work.
                globalThis.TK7LineupMedia.remember(message);
                if (!globalThis.TK7DirectShare) throw Error('LINE ยังไม่พร้อม กรุณาลองอีกครั้ง');
                const result = await globalThis.TK7DirectShare.share([message]);
                if (result?.status === 'success') dialog.close();
                else if (!result?.login) status.textContent = 'ยังไม่ได้ส่ง เลือกแชต LINE เพื่อลองอีกครั้ง';
            } catch (error) {
                if (!controller.signal.aborted) status.textContent = 'ส่ง LINE ไม่สำเร็จ: ' + error.message;
            } finally { if (!controller.signal.aborted) lineShare.disabled = false; }
        };
        close.onclick = () => dialog.close();
        dialog.addEventListener('close', () => {
            controller.abort();
            globalThis.TK7LineupMedia?.forget();
            preview.pause();
            if (url) URL.revokeObjectURL(url);
            dialog.remove();
            current = null;
        }, { once: true });
        try {
            if (prepared) {
                preview.src = prepared.originalContentUrl;
                preview.poster = prepared.previewImageUrl;
                preview.hidden = false;
                lineShare.textContent = 'เลือกแชต LINE';
                lineShare.disabled = false;
                status.textContent = 'วิดีโอพร้อมแล้ว กดเลือกแชต LINE เพื่อส่ง';
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = 720;
            canvas.height = 1024;
            if(document.fonts?.ready)await document.fonts.ready;
            if(controller.signal.aborted)return;
            const blob = await record(canvas, plan, controller.signal, status);
            if (controller.signal.aborted) return;
            videoBlob = blob;
            draw(canvas.getContext('2d'), plan, 0);
            poster = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
            if (controller.signal.aborted) return;
            if (!poster) throw Error('สร้างภาพตัวอย่างไม่สำเร็จ กรุณาลองใหม่');
            url = URL.createObjectURL(blob);
            preview.src = url;
            preview.hidden = false;
            download.href = url;
            download.hidden = false;
            const file = new File([blob], 'TK7-Tactics.mp4', { type: 'video/mp4' });
            const canShare = navigator.canShare?.({ files: [file] }) && !!navigator.share;
            share.disabled = !canShare;
            share.hidden = !canShare;
            lineShare.disabled = false;
            status.textContent = 'เตรียมส่ง LINE จะอัปโหลดไฟล์ส่วนตัว พร้อมลิงก์ชั่วคราว 7 วัน';
            share.onclick = async () => {
                share.disabled = true;
                try { await navigator.share({ files: [file], title: 'TK7 · แผนการวิ่ง' }); dialog.close(); }
                catch (error) { if (error.name !== 'AbortError') status.textContent = 'แชร์ไม่สำเร็จ ลองใหม่หรือดาวน์โหลด MP4'; }
                finally { share.disabled = false; }
            };
        } catch (error) {
            if (!controller.signal.aborted) status.textContent = error.message;
        }
    }
    document.getElementById('lineup-video')?.addEventListener('click', () => {
        globalThis.TK7Tactics?.stop();
        open(globalThis.TK7Tactics?.snapshot());
    });
    const resume = () => {
        const pending = globalThis.TK7LineupMedia?.pending();
        if (pending) open(null, pending);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resume, { once: true });
    else resume();
    return { positionAt };
})();
