// Optional text signup workflow, kept alongside the current Flex sharing menu.
globalThis.TK7LegacyRegistration={create({getCurrentDate,teamInfo,teams,showToast}){
// --- SECTION: REGISTRATION ---
        function getActiveRegTeamSlugs() {
            return Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug);
        }

        function buildTeamSlotsBlock(slug, startPlayerNum) {
            const info = teamInfo[slug] || { emoji: '⚽', label: slug };
            let text = `${info.emoji} ${info.label}\n`;
            for (let i = 0; i < 7; i++) {
                text += `${startPlayerNum + i}. \n`;
            }
            return text;
        }

        function getRegistrationMatchDateLabel() {
            const raw = document.getElementById('match-date')?.value || getCurrentDate();
            if (!raw) return '';
            // รูปแบบ 6-11-2026
            const [y, m, d] = raw.split('-').map(Number);
            return `${d}-${m}-${y}`;
        }

        // จับหัวข้อสีทีมจากข้อความ LINE (ลำดับสำคัญ: navy ก่อน blue)
        const REG_TEAM_LINE_MATCHERS = [
            { slug: 'navy', patterns: [/Navy Shirt/i, /สีน้ำเงินเข้ม/, /น้ำเงินเข้ม/] },
            { slug: 'green', patterns: [/Green Shirt/i, /สีเขียว/, /🟢/] },
            { slug: 'red', patterns: [/Red Shirt/i, /สีแดง/, /🔴/] },
            { slug: 'white', patterns: [/White Shirt/i, /สีขาว/, /⚪️/, /⚪/] },
            { slug: 'blue', patterns: [/Blue Shirt/i, /สีน้ำเงิน(?!เข้ม)/, /🔵/] },
            { slug: 'black', patterns: [/Black Shirt/i, /สีดำ/, /⚫/, /⚫️/] },
            { slug: 'yellow', patterns: [/Yellow Shirt/i, /สีเหลือง/, /🟡/] },
            { slug: 'pink', patterns: [/Pink Shirt/i, /สีชมพู/, /🩷/, /💗/] },
            { slug: 'orange', patterns: [/Orange Shirt/i, /สีส้ม/, /🟠/] },
            { slug: 'purple', patterns: [/Purple Shirt/i, /สีม่วง/, /🟣/] }
        ];

        function resolveRegTeamSlugFromLine(line) {
            const text = String(line || '').trim();
            if (!text) return null;
            for (const { slug, patterns } of REG_TEAM_LINE_MATCHERS) {
                const info = teamInfo[slug];
                if (info?.label && text.includes(info.label)) return slug;
                if (patterns.some(re => re.test(text))) return slug;
            }
            return null;
        }

        function parseRegSlotNames(lines, startIdx) {
            const names = [];
            let i = startIdx;
            while (i < lines.length && names.length < 7) {
                const match = String(lines[i]).match(/^\s*\d+\.\s*(.*)$/);
                if (!match) break;
                names.push(match[1].trim());
                i += 1;
            }
            return { names, nextIdx: i };
        }

        function regTeamShortLabel(slug) {
            const info = teamInfo[slug];
            const team = teams.find(t => t.slug === slug);
            if (info && team) return `${info.emoji} ${team.name}`;
            return info?.label || slug;
        }

        // ดึงบล็อกทีม + จำนวนช่องเลขจากข้อความ LINE
        function parseRegistrationTeamBlocks(text) {
            const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
            const blocks = [];
            for (let i = 0; i < lines.length; i++) {
                const slug = resolveRegTeamSlugFromLine(lines[i]);
                if (!slug) continue;
                const { names, nextIdx } = parseRegSlotNames(lines, i + 1);
                blocks.push({
                    slug,
                    names: names.slice(0, 7),
                    slotCount: names.length,
                    header: String(lines[i]).trim()
                });
                i = Math.max(i, nextIdx - 1);
            }
            return blocks;
        }

        // ดึงชื่อต่อทีมจากข้อความลงทะเบียน (กลุ่มใหญ่หรือกลุ่มย่อย)
        function parseRegistrationTeamNames(text) {
            const blocks = {};
            parseRegistrationTeamBlocks(text).forEach(block => {
                if (!block.slotCount) return;
                const names = block.names.slice();
                while (names.length < 7) names.push('');
                blocks[block.slug] = names.slice(0, 7);
            });
            return blocks;
        }

        function validateRegistrationPaste(text, kind) {
            const trimmed = String(text || '').trim();
            if (!trimmed) {
                return { ok: false, level: 'empty', message: 'รอวางข้อความจาก LINE' };
            }

            const blocks = parseRegistrationTeamBlocks(trimmed);
            if (!blocks.length) {
                return { ok: false, level: 'error', message: 'รูปแบบไม่ถูกต้อง — ไม่พบหัวข้อสีทีม' };
            }

            const noSlots = blocks.filter(b => b.slotCount === 0);
            if (noSlots.length) {
                return {
                    ok: false,
                    level: 'error',
                    message: `รูปแบบไม่ถูกต้อง — ไม่มีเลขลำดับใต้ ${noSlots.map(b => regTeamShortLabel(b.slug)).join(', ')}`
                };
            }

            const shortBlocks = blocks.filter(b => b.slotCount < 7);
            if (shortBlocks.length) {
                return {
                    ok: false,
                    level: 'error',
                    message: `รูปแบบไม่ครบ — ${shortBlocks.map(b => `${regTeamShortLabel(b.slug)} มี ${b.slotCount}/7 ช่อง`).join(', ')}`
                };
            }

            const teamText = blocks.map(b => regTeamShortLabel(b.slug)).join(', ');
            if (kind === 'large') {
                return {
                    ok: true,
                    level: 'ok',
                    message: `รูปแบบถูกต้อง — พบ ${blocks.length} ทีม (${teamText})`,
                    blocks
                };
            }

            return {
                ok: true,
                level: 'ok',
                message: `รูปแบบถูกต้อง — ${teamText}`,
                blocks
            };
        }

        function applyShareRegStatus(textareaId, statusId, result) {
            const ta = document.getElementById(textareaId);
            const statusEl = document.getElementById(statusId);
            if (!ta || !statusEl) return;
            ta.classList.remove('is-ok', 'is-error', 'is-empty');
            statusEl.classList.remove('is-ok', 'is-error');
            if (result.level === 'ok') {
                ta.classList.add('is-ok');
                statusEl.classList.add('is-ok');
            } else if (result.level === 'error') {
                ta.classList.add('is-error');
                statusEl.classList.add('is-error');
            } else {
                ta.classList.add('is-empty');
            }
            statusEl.textContent = result.message;
        }

        function getShareRegMergeReadiness() {
            const largeEl = document.getElementById('share-reg-merge-large');
            const smallEl = document.getElementById('share-reg-merge-small');
            const largeRaw = largeEl?.value || '';
            const smallRaw = smallEl?.value || '';
            const largeEmpty = !String(largeRaw).trim();
            const small = validateRegistrationPaste(smallRaw, 'small');

            // วางแค่กลุ่มย่อย = ลงชื่อคนแรก → สร้างกลุ่มใหญ่จากทีมที่เลือก
            if (largeEmpty) {
                if (!small.ok) {
                    return {
                        ready: false,
                        firstEntry: true,
                        large: {
                            ok: false,
                            level: 'empty',
                            message: 'ว่างได้ถ้าเป็นคนแรก — วางกลุ่มย่อยได้เลย'
                        },
                        small
                    };
                }

                const activeSlugs = getActiveRegTeamSlugs();
                if (!activeSlugs.length) {
                    return {
                        ready: false,
                        firstEntry: true,
                        large: {
                            ok: false,
                            level: 'error',
                            message: 'ยังไม่ได้เลือกทีมที่เข้าร่วมในหน้าจัดการทีม'
                        },
                        small
                    };
                }

                const activeSet = new Set(activeSlugs);
                const missing = (small.blocks || []).filter(b => !activeSet.has(b.slug));
                if (missing.length) {
                    return {
                        ready: false,
                        firstEntry: true,
                        large: {
                            ok: false,
                            level: 'error',
                            message: 'ทีมในกลุ่มย่อยไม่อยู่ในทีมที่เลือกวันนี้'
                        },
                        small: {
                            ok: false,
                            level: 'error',
                            message: `ทีมนี้ไม่ได้ถูกเลือกวันนี้ — ${missing.map(b => regTeamShortLabel(b.slug)).join(', ')}`,
                            blocks: small.blocks
                        }
                    };
                }

                return {
                    ready: true,
                    firstEntry: true,
                    large: {
                        ok: true,
                        level: 'ok',
                        message: `ลงชื่อคนแรก — จะสร้างกลุ่มใหญ่ใหม่ (${activeSlugs.length} ทีม)`
                    },
                    small
                };
            }

            const large = validateRegistrationPaste(largeRaw, 'large');
            if (!large.ok || !small.ok) {
                return { ready: false, firstEntry: false, large, small };
            }

            const largeSlugs = new Set((large.blocks || []).map(b => b.slug));
            const missing = (small.blocks || []).filter(b => !largeSlugs.has(b.slug));
            if (missing.length) {
                return {
                    ready: false,
                    firstEntry: false,
                    large,
                    small: {
                        ok: false,
                        level: 'error',
                        message: `ทีมนี้ไม่มีในกลุ่มใหญ่ — ${missing.map(b => regTeamShortLabel(b.slug)).join(', ')}`,
                        blocks: small.blocks
                    }
                };
            }

            return { ready: true, firstEntry: false, large, small };
        }

        function refreshShareRegMergeValidation() {
            const check = getShareRegMergeReadiness();
            applyShareRegStatus('share-reg-merge-large', 'share-reg-merge-large-status', check.large);
            applyShareRegStatus('share-reg-merge-small', 'share-reg-merge-small-status', check.small);
            const btn = document.getElementById('share-reg-merge-btn');
            if (btn) btn.disabled = !check.ready;
            return check;
        }

        function closeShareRegModal() {
            const modal = document.getElementById('share-reg-modal');
            if (!modal) return;
            modal.classList.remove('is-open');
            modal.style.display = 'none';
        }

        // รวมชื่อจากกลุ่มย่อยเข้ากลุ่มใหญ่ — คงเลขลำดับของกลุ่มใหญ่
        // ถ้าว่างกลุ่มใหญ่ = ลงชื่อคนแรก → สร้างเทมเพลตจากทีมที่เลือก
        function mergeRegistrationFromSmallGroups(largeText, smallText) {
            const small = validateRegistrationPaste(smallText, 'small');
            if (!small.ok) return { ok: false, error: small.message };

            let baseText = String(largeText || '').trim();
            let firstEntry = false;

            if (!baseText) {
                if (!getActiveRegTeamSlugs().length) {
                    return { ok: false, error: 'ยังไม่ได้เลือกทีมที่เข้าร่วมในหน้าจัดการทีม' };
                }
                const activeSet = new Set(getActiveRegTeamSlugs());
                const missing = (small.blocks || []).filter(b => !activeSet.has(b.slug));
                if (missing.length) {
                    return {
                        ok: false,
                        error: `ทีมนี้ไม่ได้ถูกเลือกวันนี้ — ${missing.map(b => regTeamShortLabel(b.slug)).join(', ')}`
                    };
                }
                baseText = buildRegistrationTemplate('all');
                firstEntry = true;
            } else {
                const large = validateRegistrationPaste(baseText, 'large');
                if (!large.ok) return { ok: false, error: large.message };
            }

            const smallBlocks = parseRegistrationTeamNames(smallText);
            const smallSlugs = Object.keys(smallBlocks);
            const lines = baseText.replace(/\r\n/g, '\n').split('\n');
            const updatedSlugs = [];

            for (let i = 0; i < lines.length; i++) {
                const slug = resolveRegTeamSlugFromLine(lines[i]);
                if (!slug || !smallBlocks[slug]) continue;

                const smallNames = smallBlocks[slug];
                let slot = 0;
                let j = i + 1;
                let replaced = 0;
                while (j < lines.length && slot < 7) {
                    const match = String(lines[j]).match(/^(\s*)(\d+)\.\s*(.*)$/);
                    if (!match) break;
                    lines[j] = `${match[1]}${match[2]}.${smallNames[slot] || ''}`;
                    replaced += 1;
                    slot += 1;
                    j += 1;
                }
                if (replaced > 0) updatedSlugs.push(slug);
                i = j - 1;
            }

            if (!updatedSlugs.length) {
                const labels = smallSlugs.map(regTeamShortLabel).join(', ');
                return { ok: false, error: `ไม่พบทีมที่ตรงกันในกลุ่มใหญ่ — ${labels}` };
            }

            return { ok: true, text: lines.join('\n'), updatedSlugs, firstEntry };
        }

        // กลุ่มใหญ่ = ข้อความครบ | กลุ่มย่อย = เฉพาะบล็อกสี + เลขผู้เล่น 1–7
        function buildRegistrationTemplate(mode, teamSlug) {
            const activeTeamSlugs = getActiveRegTeamSlugs();
            if (mode === 'single') {
                return buildTeamSlotsBlock(teamSlug, 1).trimEnd();
            }

            const startTime = document.getElementById('start-time').value;
            const dateLabel = getRegistrationMatchDateLabel();
            let templateText = `⚽️ FOOTBALL MATCH @ TK7 Stadium\n`;
            if (dateLabel) {
                templateText += `📅 Date / วันที่ : ${dateLabel}\n`;
            }
            templateText += `🕗 Kick-off / เวลาเตะ : ${startTime}\n`;
            templateText += `📍 Location: https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA\n\n`;

            let playerCount = 1;
            activeTeamSlugs.forEach((slug) => {
                templateText += buildTeamSlotsBlock(slug, playerCount);
                playerCount += 7;
            });

            templateText += `\n⏱️ Match Duration / เวลาเล่น :\n`;
            templateText += `• 4 Teams = 2 Hours\n`;
            templateText += `• 5 Teams = 3 Hours`;
            return templateText;
        }

        function isMobileDevice() {
            return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
        }

        // คัดลอกข้อความอัตโนมัติ — วางใน LINE เอง (มือถือเปิด LINE ให้ด้วยถ้าได้)
        async function shareTextToLine(text, toastMessage) {
            try {
                await navigator.clipboard.writeText(text);
            } catch (err) {
                alert('คัดลอกไม่สำเร็จ กรุณาลองอีกครั้ง');
                return;
            }

            if (isMobileDevice()) {
                try {
                    window.open('https://line.me/R/msg/text/?' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
                } catch (_) { /* ignore */ }
                showToast(toastMessage || '📋 คัดลอกแล้ว — เปิด LINE แล้ววางได้เลย');
            } else {
                showToast(toastMessage || '📋 คัดลอกแล้ว! เปิด LINE แล้วกด Ctrl+V');
            }
        }

        function setShareRegMode(mode) {
            document.querySelectorAll('#share-reg-modal .share-mode-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });
            document.getElementById('share-reg-all-actions').style.display = mode === 'all' ? 'block' : 'none';
            document.getElementById('share-reg-single-panel').style.display = mode === 'single' ? 'block' : 'none';
            document.getElementById('share-reg-merge-panel').style.display = mode === 'merge' ? 'block' : 'none';

            document.getElementById('share-reg-line-btn').textContent = '📋 คัดลอกอัตโนมัติ';
            document.getElementById('share-reg-hint').textContent = 'กดแล้วคัดลอกอัตโนมัติ → เปิด LINE แล้ววางในกลุ่มใหญ่';
            document.getElementById('share-reg-single-hint').textContent = 'เลือกสี → คัดลอกอัตโนมัติ → วางในกลุ่มย่อย';
            document.getElementById('share-reg-merge-hint').textContent = 'วางแค่กลุ่มย่อยได้ถ้าเป็นคนแรก — หรือวางกลุ่มใหญ่แล้วค่อยอัปเดตจากกลุ่มย่อย';
            if (mode === 'merge') refreshShareRegMergeValidation();
        }

        function openShareRegModal() {
            const activeTeamSlugs = getActiveRegTeamSlugs();
            if (activeTeamSlugs.length === 0) {
                alert('กรุณาเลือกทีมที่เข้าร่วมอย่างน้อย 1 ทีม');
                return;
            }

            const list = document.getElementById('share-reg-team-list');
            list.innerHTML = '';
            activeTeamSlugs.forEach(slug => {
                const team = teams.find(t => t.slug === slug);
                const info = teamInfo[slug] || { emoji: '⚽', label: slug };
                const el = document.createElement('div');
                el.className = `team-emblem ${slug}`;
                el.textContent = `${info.emoji} ${team ? team.name : slug}`;
                el.onclick = () => {
                    shareTextToLine(buildRegistrationTemplate('single', slug));
                    closeShareRegModal();
                };
                list.appendChild(el);
            });

            setShareRegMode('all');
            const modal = document.getElementById('share-reg-modal');
            modal.classList.add('is-open');
            modal.style.display = 'flex';
            refreshShareRegMergeValidation();
        }
        

 function mount({bindTrigger=true}={}){
  document.querySelector('#share-reg-modal .close-modal-btn').addEventListener('click',closeShareRegModal);
  if(bindTrigger)document.getElementById('copy-reg-template-btn').addEventListener('click',openShareRegModal);
            document.querySelectorAll('#share-reg-modal .share-mode-btn').forEach(btn => {
                btn.addEventListener('click', () => setShareRegMode(btn.dataset.mode));
            });
            document.getElementById('share-reg-line-btn').addEventListener('click', () => {
                if (getActiveRegTeamSlugs().length === 0) {
                    alert('กรุณาเลือกทีมที่เข้าร่วมอย่างน้อย 1 ทีม');
                    return;
                }
                shareTextToLine(buildRegistrationTemplate('all'));
                closeShareRegModal();
            });
            document.getElementById('share-reg-merge-btn').addEventListener('click', () => {
                const check = getShareRegMergeReadiness();
                if (!check.ready) {
                    refreshShareRegMergeValidation();
                    return;
                }
                const largeEl = document.getElementById('share-reg-merge-large');
                const smallEl = document.getElementById('share-reg-merge-small');
                const merged = mergeRegistrationFromSmallGroups(largeEl.value, smallEl.value);
                if (!merged.ok) {
                    refreshShareRegMergeValidation();
                    alert(merged.error);
                    return;
                }
                largeEl.value = merged.text;
                smallEl.value = '';
                refreshShareRegMergeValidation();
                const teamLabels = merged.updatedSlugs.map(regTeamShortLabel).join(', ');
                const toastMsg = merged.firstEntry
                    ? `✅ ลงชื่อคนแรก — สร้างกลุ่มใหญ่แล้ว (${teamLabels})`
                    : `✅ อัปเดต ${teamLabels} — คัดลอกแล้ว วางในกลุ่มใหญ่ได้เลย`;
                shareTextToLine(merged.text, toastMsg);
            });
            ['share-reg-merge-large', 'share-reg-merge-small'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.addEventListener('input', refreshShareRegMergeValidation);
                el.addEventListener('paste', () => setTimeout(refreshShareRegMergeValidation, 0));
            });

  const modal=document.getElementById('share-reg-modal');
  if(window.TK7Backdrop)window.TK7Backdrop.install(modal,event=>event.target===modal,closeShareRegModal);
  else window.addEventListener('click',event=>{if(event.target===modal)closeShareRegModal()});
 }
 return {mount,open:openShareRegModal,close:closeShareRegModal,merge:mergeRegistrationFromSmallGroups,validate:validateRegistrationPaste};
}};
