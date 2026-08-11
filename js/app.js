/* ==========================================================================
   TK7 app logic (Ver 4.0.4)
   แยกจาก index.html เพื่อแก้/ค้นหาง่ายขึ้น
   Sections (ค้นหาด้วย // --- SECTION:):
     CONFIG, AUTH, REGISTRATION, SCHEDULE, LINEUP, SETUP,
     SHARE/EXPORT, DATA/REALTIME, SCORES, TEMPLATES, BOOT
   ========================================================================== */
    document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
            }
            if(registrations.length > 0) {
                console.log('ล้างระบบเก่าสำเร็จ กำลังโหลดเวอร์ชันใหม่...');
                location.reload(true);
            }
        });
    }

// --- SECTION: CONFIG ---
        const SUPABASE_URL = 'https://rwsyiiulfbolymxppvmy.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3c3lpaXVsZmJvbHlteHBwdm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjAzMDQsImV4cCI6MjA4ODU5NjMwNH0.3CUw-Bjq_wzzCp6YSl3lThr8f0tWXLHVYnaVL8l1TVs';

        const { createClient } = supabase;
        let currentUser = null, userProfile = null, hasSuperadmin = false, pendingPasswordRecovery = false;

        // implicit = คลิกลิงก์รีเซ็ตรหัสจากอีเมลแล้วตั้งรหัสได้แม้คนละเครื่อง/เบราว์เซอร์
        const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'implicit'
            }
        });

// --- SECTION: AUTH ---
        function openResetPasswordModal() {
            pendingPasswordRecovery = true;
            const modal = document.getElementById('reset-password-modal');
            if (modal) modal.style.display = 'block';
            const login = document.getElementById('login-modal');
            if (login) login.style.display = 'none';
            // ล้าง token ใน URL หลัง session ถูก detect แล้ว
            setTimeout(() => clearAuthRedirectParamsFromUrl(), 0);
            setTimeout(() => {
                const input = document.getElementById('new-password');
                if (input) input.focus();
            }, 100);
        }

        function isPasswordRecoveryRedirect() {
            const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
            const query = new URLSearchParams(window.location.search || '');
            return hash.get('type') === 'recovery' || query.get('type') === 'recovery';
        }

        function getAuthRedirectError() {
            const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
            const query = new URLSearchParams(window.location.search || '');
            const error = query.get('error') || hash.get('error');
            const code = query.get('error_code') || hash.get('error_code');
            const description = query.get('error_description') || hash.get('error_description');
            if (!error && !code) return null;
            return {
                error,
                code,
                description: description ? decodeURIComponent(description.replace(/\+/g, ' ')) : ''
            };
        }

        function clearAuthRedirectParamsFromUrl() {
            if (!window.history.replaceState) return;
            const cleanPath = window.location.pathname || '/TK7/';
            window.history.replaceState(null, '', cleanPath);
        }

        function handleAuthRedirectError() {
            const authErr = getAuthRedirectError();
            if (!authErr) return false;
            clearAuthRedirectParamsFromUrl();

            const code = (authErr.code || '').toLowerCase();
            const desc = (authErr.description || '').toLowerCase();
            let message = 'ลิงก์จากอีเมลใช้ไม่ได้\n\n';
            if (code === 'otp_expired' || desc.includes('expired') || desc.includes('invalid')) {
                message += 'สาเหตุ: ลิงก์หมดอายุ หรือถูกใช้ไปแล้ว (ใช้ได้ครั้งเดียว)\n\n'
                    + 'ทำต่อแบบนี้:\n'
                    + '1) กด "เข้าสู่ระบบ" → "ลืมรหัสผ่าน?"\n'
                    + '2) รอเมลใหม่ (อย่ากดลิงก์เก่า)\n'
                    + '3) คลิกลิงก์ใหม่ทันที\n\n'
                    + 'หมายเหตุ: บางแอปเมลเปิดลิงก์ล่วงหน้า ทำให้ลิงก์หมดอายุก่อนคุณกด';
            } else {
                message += (authErr.description || authErr.error || 'เกิดข้อผิดพลาด');
            }
            alert(message);
            return true;
        }

        // onAuthStateChange ลงทะเบียนครั้งเดียวใน initializeApp (กันซ้ำ)

        const SVG_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/></svg>`;
        const SVG_MOVE_TOP = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.646 2.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 3.707 2.354 9.354a.5.5 0 1 1-.708-.708z"/><path d="M7.646 6.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 7.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg>`;
        const TEAMS = [ { name: 'ทีมเขียว', slug: 'green' }, { name: 'ทีมแดง', slug: 'red' }, { name: 'ทีมขาว', slug: 'white' }, { name: 'ทีมฟ้า', slug: 'blue' }, { name: 'ทีมดำ', slug: 'black' }, { name: 'ทีมเหลือง', slug: 'yellow' }, { name: 'ทีมชมพู', slug: 'pink' }, { name: 'ทีมส้ม', slug: 'orange' }, { name: 'ทีมน้ำเงิน', slug: 'navy' }, { name: 'ทีมม่วง', slug: 'purple' } ];
        
        const teamOrderMap = new Map(TEAMS.map((team, index) => [team.slug, index]));
        
        function todayDateKey() {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        let appData = {}, activePage = 'page-schedule', currentDateKey = todayDateKey(), currentEditingContext = { index: null, side: null }, isInitialSetupDone = false, draggedItem = null;
        let lastScrollPosition = 0, shouldRestoreScroll = false;
        const contentContainer = document.getElementById('content');
        const pages = document.querySelectorAll('.page'), navButtons = document.querySelectorAll('.nav-btn'), loginBtn = document.getElementById('login-btn'), logoutBtn = document.getElementById('logout-btn'), userInfo = document.getElementById('user-info'), loginModal = document.getElementById('login-modal'), teamSelectModal = document.getElementById('team-select-modal'), membersModal = document.getElementById('members-modal');
        let dbTemplates = [];

        function canManage() {
            if (pendingPasswordRecovery) return false;
            return !!(currentUser && userProfile && userProfile.status === 'approved' && (userProfile.role === 'admin' || userProfile.role === 'superadmin'));
        }
        function isSuperAdmin() {
            return !!(currentUser && userProfile && userProfile.status === 'approved' && userProfile.role === 'superadmin');
        }
        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        function sanitizeDisplayName(value) {
            return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, 40);
        } 

        // Mapping ชื่อสีและ Emoji สำหรับลงทะเบียน
        const REG_TEAM_INFO = {
            green: { emoji: '🟢', label: 'Green Shirt (สีเขียว)' },
            red: { emoji: '🔴', label: 'Red Shirt (สีแดง)' },
            white: { emoji: '⚪️', label: 'White Shirt (สีขาว)' },
            blue: { emoji: '🔵', label: 'Blue Shirt (สีน้ำเงิน)' },
            black: { emoji: '⚫', label: 'Black Shirt (สีดำ)' },
            yellow: { emoji: '🟡', label: 'Yellow Shirt (สีเหลือง)' },
            pink: { emoji: '🩷', label: 'Pink Shirt (สีชมพู)' },
            orange: { emoji: '🟠', label: 'Orange Shirt (สีส้ม)' },
            navy: { emoji: '🔵', label: 'Navy Shirt (สีน้ำเงินเข้ม)' },
            purple: { emoji: '🟣', label: 'Purple Shirt (สีม่วง)' }
        };

        // แผน 7 คน (x/y เป็น % บนสนาม — บน = รุก, ล่าง = เซฟ)
        const FORMATIONS = [
            {
                id: '2-3-1',
                name: '2-3-1',
                slots: [
                    { id: 'GK', label: 'GK', x: 50, y: 90 },
                    { id: 'LB', label: 'LB', x: 28, y: 70 },
                    { id: 'RB', label: 'RB', x: 72, y: 70 },
                    { id: 'LM', label: 'LM', x: 22, y: 48 },
                    { id: 'CM', label: 'CM', x: 50, y: 50 },
                    { id: 'RM', label: 'RM', x: 78, y: 48 },
                    { id: 'ST', label: 'ST', x: 50, y: 22 }
                ]
            },
            {
                id: '3-2-1',
                name: '3-2-1',
                slots: [
                    { id: 'GK', label: 'GK', x: 50, y: 90 },
                    { id: 'LB', label: 'LB', x: 22, y: 70 },
                    { id: 'CB', label: 'CB', x: 50, y: 72 },
                    { id: 'RB', label: 'RB', x: 78, y: 70 },
                    { id: 'LM', label: 'LM', x: 32, y: 45 },
                    { id: 'RM', label: 'RM', x: 68, y: 45 },
                    { id: 'ST', label: 'ST', x: 50, y: 20 }
                ]
            },
            {
                id: '2-2-2',
                name: '2-2-2',
                slots: [
                    { id: 'GK', label: 'GK', x: 50, y: 90 },
                    { id: 'LB', label: 'LB', x: 30, y: 70 },
                    { id: 'RB', label: 'RB', x: 70, y: 70 },
                    { id: 'CM', label: 'CM', x: 38, y: 48 },
                    { id: 'AM', label: 'AM', x: 62, y: 48 },
                    { id: 'LW', label: 'LW', x: 28, y: 22 },
                    { id: 'RW', label: 'RW', x: 72, y: 22 }
                ]
            },
            {
                id: '3-1-2',
                name: '3-1-2',
                slots: [
                    { id: 'GK', label: 'GK', x: 50, y: 90 },
                    { id: 'LB', label: 'LB', x: 22, y: 70 },
                    { id: 'CB', label: 'CB', x: 50, y: 72 },
                    { id: 'RB', label: 'RB', x: 78, y: 70 },
                    { id: 'CM', label: 'CM', x: 50, y: 48 },
                    { id: 'ST1', label: 'ST', x: 35, y: 22 },
                    { id: 'ST2', label: 'ST', x: 65, y: 22 }
                ]
            },
            {
                id: '2-1-3',
                name: '2-1-3',
                slots: [
                    { id: 'GK', label: 'GK', x: 50, y: 90 },
                    { id: 'LB', label: 'LB', x: 30, y: 70 },
                    { id: 'RB', label: 'RB', x: 70, y: 70 },
                    { id: 'CDM', label: 'CDM', x: 50, y: 55 },
                    { id: 'LW', label: 'LW', x: 22, y: 28 },
                    { id: 'ST', label: 'ST', x: 50, y: 20 },
                    { id: 'RW', label: 'RW', x: 78, y: 28 }
                ]
            }
        ];

        let lineupTeamSlug = 'green';
        let lineupFormationId = '2-3-1';
        let lineupNames = {};
        let lineupActiveSlotId = null;
        // จำคร่าว ๆ ระหว่างเปิดหน้าไว้เท่านั้น (ไม่เซฟ DB)
        let lineupDrafts = {};

        /* สีหมาก hex ตรงทีม — ทาสีที่ .slot-dot-face / .slot-dot-lip (html2canvas อ่านได้ชัวร์) */
        const LINEUP_PITCH_BG = '#7cb342';
        const LINEUP_PIECE_STYLE = {
            /* ทีมเขียวใช้โทนเข้มกว่า emblem เล็กน้อย เพื่อตัดกับสนาม */
            green:  { bg: '#2e7d32', lip: '#1b5e20', fg: '#ffffff', border: '#ffffff' },
            red:    { bg: '#e53935', lip: '#9a1c1c', fg: '#ffffff', border: '#ffffff' },
            white:  { bg: '#f5f5f5', lip: '#8a8a8a', fg: '#222222', border: '#333333' },
            blue:   { bg: '#1e88e5', lip: '#0d47a1', fg: '#ffffff', border: '#ffffff' },
            black:  { bg: '#212121', lip: '#000000', fg: '#ffffff', border: '#ffffff' },
            yellow: { bg: '#fdd835', lip: '#c49000', fg: '#222222', border: '#333333' },
            pink:   { bg: '#ec407a', lip: '#ad1457', fg: '#ffffff', border: '#ffffff' },
            orange: { bg: '#fb8c00', lip: '#e65100', fg: '#ffffff', border: '#ffffff' },
            navy:   { bg: '#1a237e', lip: '#000051', fg: '#ffffff', border: '#ffffff' },
            purple: { bg: '#8e24aa', lip: '#4a148c', fg: '#ffffff', border: '#ffffff' }
        };

        function applyLineupPieceStyles(root, teamSlug = lineupTeamSlug) {
            if (!root) return;
            const s = LINEUP_PIECE_STYLE[teamSlug] || LINEUP_PIECE_STYLE.green;
            root.querySelectorAll('.slot-dot').forEach((dot) => {
                dot.style.background = 'transparent';
                dot.style.backgroundColor = 'transparent';
                dot.style.backgroundImage = 'none';
                dot.style.border = 'none';
                dot.style.boxShadow = 'none';
                let face = dot.querySelector('.slot-dot-face');
                let lip = dot.querySelector('.slot-dot-lip');
                if (!face) {
                    const label = (dot.textContent || '').trim();
                    dot.textContent = '';
                    lip = document.createElement('span');
                    lip.className = 'slot-dot-lip';
                    face = document.createElement('span');
                    face.className = 'slot-dot-face';
                    face.textContent = label;
                    dot.appendChild(lip);
                    dot.appendChild(face);
                }
                if (lip) {
                    lip.style.background = s.lip;
                    lip.style.backgroundColor = s.lip;
                    lip.style.backgroundImage = 'none';
                }
                face.style.background = s.bg;
                face.style.backgroundColor = s.bg;
                face.style.backgroundImage = 'none';
                face.style.color = s.fg;
                face.style.border = `2.5px solid ${s.border}`;
                face.style.boxShadow = 'none';
            });
            const pitchEl = root.classList?.contains('pitch') ? root : root.querySelector('.pitch');
            if (pitchEl) {
                pitchEl.style.background = LINEUP_PITCH_BG;
                pitchEl.style.backgroundColor = LINEUP_PITCH_BG;
                pitchEl.style.backgroundImage = 'none';
                pitchEl.style.boxShadow = 'none';
            }
        }
        
        function saveScrollPosition() { lastScrollPosition = contentContainer.scrollTop; }
        function restoreScrollPosition() { if (shouldRestoreScroll) { requestAnimationFrame(() => { contentContainer.scrollTop = lastScrollPosition; }); } shouldRestoreScroll = false; }

        async function initializeApp() {
            loginBtn.addEventListener('click', () => { setAuthModalTab('login'); loginModal.style.display = 'block'; });
            logoutBtn.addEventListener('click', handleLogout);
            const claimBtn = document.getElementById('claim-superadmin-btn');
            if (claimBtn) claimBtn.addEventListener('click', claimSuperadmin);
            const resetClose = document.querySelector('#reset-password-modal .close-modal-btn');
            if (resetClose) {
                resetClose.addEventListener('click', () => {
                    pendingPasswordRecovery = false;
                    document.getElementById('reset-password-modal').style.display = 'none';
                    clearAuthRedirectParamsFromUrl();
                });
            }
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('signup-form').addEventListener('submit', handleSignup);
            document.getElementById('auth-tab-login').addEventListener('click', () => setAuthModalTab('login'));
            document.getElementById('auth-tab-signup').addEventListener('click', () => setAuthModalTab('signup'));
            document.getElementById('members-btn').addEventListener('click', openMembersModal);
            document.getElementById('help-btn').addEventListener('click', () => {
                document.getElementById('help-modal').style.display = 'block';
            });
            document.getElementById('share-help-btn').addEventListener('click', shareHelpInfographic);
            document.querySelector('#help-modal .close-modal-btn').addEventListener('click', () => {
                document.getElementById('help-modal').style.display = 'none';
            });
            
            document.getElementById('export-schedule-btn').addEventListener('click', (e) => handleExport('schedule-container', `TK7-Schedule-${currentDateKey}.png`, e.currentTarget));
            document.getElementById('export-scores-btn').addEventListener('click', (e) => handleExport('scores-container', `TK7-Scores-${currentDateKey}.png`, e.currentTarget));
            document.getElementById('export-leaderboard-btn').addEventListener('click', (e) => handleExport('leaderboard-container', `TK7-Leaderboard-${currentDateKey}.png`, e.currentTarget));
            document.getElementById('share-lineup-btn').addEventListener('click', shareCurrentLineup);

            // ตั้งค่าปุ่มสำหรับ Template
            document.getElementById('manage-templates-btn').onclick = openTemplateManager;
            document.getElementById('add-match-row-btn').onclick = addMatchInputRow;
            document.getElementById('save-template-btn').onclick = saveTemplate;
            document.querySelector('#template-manager-modal .close-modal-btn').onclick = () => {
                document.getElementById('template-manager-modal').style.display = 'none';
            };

            setupNavigation();
            setupOrientationGuard();
            document.querySelector('#login-modal .close-modal-btn').addEventListener('click', () => loginModal.style.display = 'none');
            document.querySelector('#team-select-modal .close-modal-btn').addEventListener('click', () => teamSelectModal.style.display = 'none');
            document.querySelector('#members-modal .close-modal-btn').addEventListener('click', () => membersModal.style.display = 'none');
            const shareRegModal = document.getElementById('share-reg-modal');
            const shareImageModal = document.getElementById('share-image-modal');
            document.querySelector('#share-reg-modal .close-modal-btn').addEventListener('click', closeShareRegModal);
            document.querySelector('#share-image-modal .close-modal-btn').addEventListener('click', closeShareImageModal);
            document.getElementById('share-image-download-btn').addEventListener('click', downloadShareImage);
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
            window.addEventListener('click', (event) => {
                if (event.target == shareRegModal) {
                    closeShareRegModal();
                    return;
                }
                if (event.target == loginModal || event.target == teamSelectModal || event.target == membersModal) {
                    event.target.style.display = "none";
                }
                if (event.target == shareImageModal) closeShareImageModal();
            });
            contentContainer.addEventListener('click', handleMainClick);
            setupDragAndDropListeners(document.getElementById('schedule-container'));
            
            // ลิงก์รีเซ็ตรหัสหมดอายุ/ใช้แล้ว → แจ้งชัด ๆ แทนการเงียบ
            if (handleAuthRedirectError()) {
                // ไม่เปิดฟอร์มตั้งรหัส
            } else if (isPasswordRecoveryRedirect() || pendingPasswordRecovery) {
                openResetPasswordModal();
            }

            const { data: { session } } = await db.auth.getSession();
            currentUser = session ? session.user : null;
            if (!getAuthRedirectError() && (isPasswordRecoveryRedirect() || pendingPasswordRecovery)) {
                openResetPasswordModal();
            }
            await refreshUserAccess();
            await fetchTemplates();
            await loadInitialData();

            db.auth.onAuthStateChange(async (event, session) => {
                if (event === 'PASSWORD_RECOVERY') {
                    currentUser = session ? session.user : null;
                    openResetPasswordModal();
                    return;
                }
                const prevId = currentUser?.id || null;
                currentUser = session ? session.user : null;
                const nextId = currentUser?.id || null;
                if (prevId !== nextId) {
                    if (currentUser && !pendingPasswordRecovery) loginModal.style.display = 'none';
                    await refreshUserAccess();
                    await loadInitialData();
                } else if (currentUser) {
                    await refreshUserAccess();
                }
            });
            listenToRealtimeChanges();
        }

        function setAuthModalTab(tab) {
            const isLogin = tab === 'login';
            document.getElementById('auth-tab-login').classList.toggle('active', isLogin);
            document.getElementById('auth-tab-signup').classList.toggle('active', !isLogin);
            document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
            document.getElementById('signup-form').style.display = isLogin ? 'none' : 'block';
            document.getElementById('forgot-password-wrap').style.display = isLogin ? 'block' : 'none';
            document.getElementById('auth-modal-title').textContent = isLogin ? '🔐 เข้าสู่ระบบ' : '📝 สมัคร Admin';
        }

        async function loadUserProfile() {
            userProfile = null;
            if (!currentUser) return;
            const { data, error } = await db.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
            if (error) {
                console.error('profiles error:', error);
                if (error.code === '42P01' || (error.message || '').includes('profiles')) {
                    showToast('⚠️ ยังไม่ได้รัน SQL ระบบสมาชิกใน Supabase');
                }
                return;
            }
            if (!data) {
                const { data: created, error: insertErr } = await db.from('profiles').insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    display_name: sanitizeDisplayName(currentUser.user_metadata?.display_name || (currentUser.email || '').split('@')[0]),
                    role: 'admin',
                    status: 'pending'
                }).select('*').maybeSingle();
                if (insertErr) console.error('create profile error:', insertErr);
                userProfile = created || null;
                return;
            }
            userProfile = data;
        }

        async function refreshSuperadminFlag() {
            if (isSuperAdmin()) { hasSuperadmin = true; return; }
            const { data, error } = await db.rpc('superadmin_exists');
            if (error) {
                console.error('superadmin_exists error:', error);
                hasSuperadmin = false;
                return;
            }
            hasSuperadmin = !!data;
        }

        async function refreshUserAccess() {
            await loadUserProfile();
            await refreshSuperadminFlag();
            refreshAuthUI();
        }

        function refreshAuthUI() {
            const loggedIn = !!currentUser;
            const manage = canManage();
            loginBtn.style.display = loggedIn ? 'none' : 'inline-block';
            logoutBtn.style.display = loggedIn ? 'inline-block' : 'none';
            userInfo.style.display = loggedIn ? 'inline-block' : 'none';
            document.querySelector('.nav-btn[data-page="page-setup"]').style.display = manage ? 'flex' : 'none';
            document.getElementById('delete-day-btn').style.display = manage ? 'inline-flex' : 'none';
            document.getElementById('members-btn').style.display = isSuperAdmin() ? 'inline-block' : 'none';
            const pendingBanner = document.getElementById('pending-approval-banner');
            if (loggedIn && userProfile && userProfile.status === 'pending') {
                pendingBanner.style.display = 'block';
                pendingBanner.textContent = '⏳ บัญชีของคุณรอการอนุมัติจาก Superadmin — ยังไม่สามารถจัดการตารางได้';
            } else if (loggedIn && userProfile && userProfile.status === 'rejected') {
                pendingBanner.style.display = 'block';
                pendingBanner.textContent = '❌ บัญชีของคุณถูกปฏิเสธ — ติดต่อ Superadmin หากต้องการใช้งาน';
            } else {
                pendingBanner.style.display = 'none';
            }

            if (loggedIn && userProfile) {
                const roleLabel = userProfile.role === 'superadmin'
                    ? 'Superadmin'
                    : (userProfile.status === 'approved' ? 'Admin' : (userProfile.status === 'rejected' ? 'ถูกปฏิเสธ' : 'รออนุมัติ'));
                userInfo.textContent = `👤 ${userProfile.display_name || currentUser.email} (${roleLabel})`;
            } else if (loggedIn) {
                userInfo.textContent = `👤 ${currentUser.email}`;
            } else {
                userInfo.textContent = '';
            }

            if (!manage && activePage === 'page-setup') {
                activePage = 'page-schedule';
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById('page-schedule').classList.add('active');
                navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.page === 'page-schedule'));
            }

            const claimBtn = document.getElementById('claim-superadmin-btn');
            if (claimBtn) {
                const showClaim = loggedIn && !hasSuperadmin && !!userProfile;
                claimBtn.style.display = showClaim ? 'inline-block' : 'none';
            }
            if (currentDateKey) renderAllPagesForDate(currentDateKey);
        }

        async function claimSuperadmin() {
            if (!currentUser) return;
            if (!confirm('ตั้งบัญชีนี้เป็น Superadmin คนแรกของระบบ?\n(ทำได้ครั้งเดียวเมื่อยังไม่มี Superadmin)')) return;
            const { data, error } = await db.rpc('claim_superadmin');
            if (error) {
                alert('ตั้ง Superadmin ไม่สำเร็จ: ' + (error.message || ''));
                return;
            }
            userProfile = data || userProfile;
            hasSuperadmin = true;
            showToast('👑 ตั้งเป็น Superadmin แล้ว');
            refreshAuthUI();
        }

// --- SECTION: REGISTRATION ---
        function getActiveRegTeamSlugs() {
            return Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug);
        }

        function buildTeamSlotsBlock(slug, startPlayerNum) {
            const info = REG_TEAM_INFO[slug] || { emoji: '⚽', label: slug };
            let text = `${info.emoji} ${info.label}\n`;
            for (let i = 0; i < 7; i++) {
                text += `${startPlayerNum + i}.\n`;
            }
            return text;
        }

        function getRegistrationMatchDateLabel() {
            const raw = document.getElementById('match-date')?.value || currentDateKey;
            if (!raw) return '';
            return new Date(raw + 'T00:00:00').toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
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
                const info = REG_TEAM_INFO[slug];
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
            const info = REG_TEAM_INFO[slug];
            const team = TEAMS.find(t => t.slug === slug);
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
            templateText += `📍 Location: https://maps.app.goo.gl/37K6rD4LqWA5Qz5KA\n`;
            if (dateLabel) {
                templateText += `📅 Date / วันที่: ${dateLabel}\n`;
            }
            templateText += `🕗 Kick-off: ${startTime} | เวลาเตะ: ${startTime} น.\n\n`;

            let playerCount = 1;
            activeTeamSlugs.forEach((slug) => {
                templateText += buildTeamSlotsBlock(slug, playerCount);
                playerCount += 7;
            });

            templateText += `\n⏱️ Match Duration / เวลาเล่น:\n`;
            templateText += `• 4 Teams = 2 Hours (เล่น 2 ชม.)\n`;
            templateText += `• 5 Teams = 3 Hours (เล่น 3 ชม.)\n\n`;
            templateText += `👇 Please add your name / ลงชื่อต่อลำดับได้เลยครับ`;
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
                    window.open('https://line.me/R/msg/text/?' + encodeURIComponent(text), '_blank');
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
                const team = TEAMS.find(t => t.slug === slug);
                const info = REG_TEAM_INFO[slug] || { emoji: '⚽', label: slug };
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
        
        function updateGenerateButtonForDate(date) {
            const generateBtn = document.getElementById('generate-schedule-btn');
            if (!generateBtn) return;
            const hasSchedule = !!(appData[date]?.schedule && appData[date].schedule.length > 0);
            if (hasSchedule) {
                generateBtn.textContent = '💾 อัปเดตตารางแข่งขัน';
                generateBtn.classList.remove('btn-primary', 'btn-secondary');
                generateBtn.classList.add('btn-warning');
            } else {
                generateBtn.textContent = '💾 บันทึกตารางแข่งขัน';
                generateBtn.classList.remove('btn-warning', 'btn-secondary');
                generateBtn.classList.add('btn-primary');
            }
        }

        async function ensureDateLoaded(date) {
            if (!date) return null;
            if (Object.prototype.hasOwnProperty.call(appData, date)) return appData[date];
            const { data, error } = await db.from('match_days').select('*').eq('match_date', date).maybeSingle();
            if (error) {
                console.error('Error fetching match day:', error);
                return null;
            }
            appData[date] = data || null;
            return appData[date];
        }

        async function prepareSetupFormForDate(date) {
            if (!date) return;
            const matchDateInput = document.getElementById('match-date');
            if (matchDateInput) matchDateInput.value = date;
            await ensureDateLoaded(date);
            updateGenerateButtonForDate(date);
            if (!canManage()) return;
            const dayData = appData[date];
            if (dayData?.settings) loadSettingsFromData(dayData.settings, date);
            else resetSettingsForm();
        }

        async function loadInitialData(options = {}) {
            const { preferDate = null } = options;
            const { data: datesData, error } = await db.from('match_days').select('match_date').order('match_date', { ascending: false });
            if (error) { console.error("Error fetching dates:", error); return; }
            const availableDates = datesData.map(d => d.match_date);
            const today = todayDateKey();
            updateDateSelectorsUI(availableDates);
            // ตารางแข่ง/ผล/คะแนน → วันที่เพิ่งบันทึก หรือวันล่าสุดที่มีข้อมูล
            const viewDate = (preferDate && availableDates.includes(preferDate))
                ? preferDate
                : (availableDates[0] || today);
            await loadDataForDate(viewDate, { syncSetupDate: false });
            // หน้าจัดการทีมใช้วันที่แยกจากหน้าตาราง — ค่าเริ่มต้นเป็นวันนี้ (หรือวันที่เพิ่งบันทึก)
            await prepareSetupFormForDate(preferDate || today);
            if(!activePage || (!canManage() && activePage === 'page-setup')) { activePage = 'page-schedule'; }
            setActivePage(activePage);
        }

        function formatAuthError(error, fallback) {
            const msg = (error && error.message) ? error.message : '';
            const lower = msg.toLowerCase();
            if (lower.includes('rate limit') || lower.includes('email rate limit')) {
                return 'ส่งอีเมลเกินโควต้าของ Supabase (ฟรีส่งได้ประมาณ 2 ฉบับ/ชม.)\n\n'
                    + 'แก้ชั่วคราว:\n'
                    + '1) รอ 1 ชม. แล้วลองใหม่ หรือ\n'
                    + '2) ใน Supabase → Authentication → Providers → Email\n'
                    + '   ปิด Confirm email (แนะนำ เพราะมีระบบอนุมัติ Admin อยู่แล้ว)\n\n'
                    + 'รายละเอียด: ' + msg;
            }
            return (fallback || 'เกิดข้อผิดพลาด') + ': ' + msg;
        }

        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const { error } = await db.auth.signInWithPassword({ email, password });
            if (error) alert(formatAuthError(error, 'เข้าสู่ระบบไม่สำเร็จ'));
        }

        async function handleSignup(e) {
            e.preventDefault();
            const displayName = sanitizeDisplayName(document.getElementById('signup-name').value);
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            if (!displayName) { alert('กรุณากรอกชื่อที่แสดง'); return; }
            const { data, error } = await db.auth.signUp({
                email,
                password,
                options: { data: { display_name: displayName } }
            });
            if (error) { alert(formatAuthError(error, 'สมัครไม่สำเร็จ')); return; }
            if (data.user && !data.session) {
                alert('สมัครสำเร็จ! กรุณายืนยันอีเมลก่อน แล้วค่อยเข้าสู่ระบบ (รอ Superadmin อนุมัติหลังล็อกอิน)\n\nถ้าไม่ได้รับเมล: ปิด Confirm email ใน Supabase เพื่อไม่ต้องยืนยันเมล');
                setAuthModalTab('login');
                document.getElementById('login-email').value = email;
                document.getElementById('signup-form').reset();
                return;
            }
            showToast('สมัครสำเร็จ — รอ Superadmin อนุมัติ');
            loginModal.style.display = 'none';
            document.getElementById('signup-form').reset();
        }

        async function handleLogout() {
            const { error } = await db.auth.signOut();
            if (error) { alert('ออกจากระบบไม่สำเร็จ: ' + error.message); return; }
            userProfile = null;
            hasSuperadmin = false;
            await tearDownScorePresence();
            document.getElementById('login-form').reset();
            document.getElementById('signup-form').reset();
            refreshAuthUI();
        }

        async function openMembersModal() {
            if (!isSuperAdmin()) return;
            await renderMembersList();
            membersModal.style.display = 'block';
        }

        async function renderMembersList() {
            const list = document.getElementById('members-list');
            list.innerHTML = '<p style="text-align:center;color:var(--text-muted);">กำลังโหลด...</p>';
            const { data, error } = await db.from('profiles').select('*').order('created_at', { ascending: true });
            if (error) {
                list.textContent = '';
                const errP = document.createElement('p');
                errP.style.cssText = 'color:var(--team-red);text-align:center;';
                errP.textContent = 'โหลดไม่สำเร็จ: ' + (error.message || '');
                list.appendChild(errP);
                return;
            }
            if (!data || data.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:var(--text-muted);">ยังไม่มีสมาชิก</p>';
                return;
            }
            list.innerHTML = data.map(p => {
                const statusLabel = p.status === 'approved' ? '✅ อนุมัติแล้ว' : (p.status === 'rejected' ? '❌ ปฏิเสธ' : '⏳ รออนุมัติ');
                const roleLabel = p.role === 'superadmin' ? '👑 Superadmin' : '🛡️ Admin';
                const isSelf = currentUser && p.id === currentUser.id;
                const safeName = escapeHtml(p.display_name || '-');
                const safeEmail = escapeHtml(p.email || '');
                const safeId = escapeHtml(p.id);
                let actions = '';
                if (p.role !== 'superadmin') {
                    if (p.status !== 'approved') {
                        actions += `<button type="button" class="export-btn member-approve-btn" data-id="${safeId}" style="background:#06C755;color:#fff;">อนุมัติ</button>`;
                    }
                    if (p.status !== 'rejected') {
                        actions += `<button type="button" class="export-btn member-reject-btn" data-id="${safeId}" style="background:#ef5350;color:#fff;">ปฏิเสธ</button>`;
                    }
                    if (p.status === 'approved') {
                        actions += `<button type="button" class="export-btn member-pending-btn" data-id="${safeId}">พักสิทธิ์</button>`;
                    }
                }
                return `<div class="card" style="margin-bottom:10px;padding:12px;">
                    <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center;">
                        <div>
                            <div style="font-weight:600;">${safeName} ${isSelf ? '(คุณ)' : ''}</div>
                            <div style="font-size:12px;color:var(--text-muted);">${safeEmail}</div>
                            <div style="font-size:12px;margin-top:4px;">${roleLabel} · ${statusLabel}</div>
                        </div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">${actions}</div>
                    </div>
                </div>`;
            }).join('');

            list.querySelectorAll('.member-approve-btn').forEach(btn => btn.onclick = () => updateMemberStatus(btn.dataset.id, 'approved'));
            list.querySelectorAll('.member-reject-btn').forEach(btn => btn.onclick = () => updateMemberStatus(btn.dataset.id, 'rejected'));
            list.querySelectorAll('.member-pending-btn').forEach(btn => btn.onclick = () => updateMemberStatus(btn.dataset.id, 'pending'));
        }

        async function updateMemberStatus(memberId, status) {
            if (!isSuperAdmin()) return;
            const payload = {
                status,
                approved_at: status === 'approved' ? new Date().toISOString() : null,
                approved_by: status === 'approved' ? currentUser.id : null
            };
            const { error } = await db.from('profiles').update(payload).eq('id', memberId);
            if (error) { alert('อัปเดตไม่สำเร็จ: ' + error.message); return; }
            showToast(status === 'approved' ? '✅ อนุมัติแล้ว' : (status === 'rejected' ? '❌ ปฏิเสธแล้ว' : 'พักสิทธิ์แล้ว'));
            await renderMembersList();
        }

        async function updateScheduleInDB(newSchedule, options = {}) {
            const { toastMessage = '✅ อัปเดตตารางแล้ว' } = options;
            saveScrollPosition();
            shouldRestoreScroll = true;
            if (!canManage()) return false;
            const { error } = await db.from('match_days').update({ schedule: newSchedule }).eq('match_date', currentDateKey);
            if (error) {
                alert('เกิดข้อผิดพลาดในการอัปเดตตาราง: ' + error.message);
                return false;
            }
            if (appData[currentDateKey]) appData[currentDateKey].schedule = newSchedule;
            renderSchedulePage(currentDateKey);
            renderScoresPage(currentDateKey);
            renderLeaderboardPage(currentDateKey);
            if (toastMessage) showToast(toastMessage);
            return true;
        }
        function renderWithMorph(container, newHtml) { morphdom(container, `<div>${newHtml}</div>`, { childrenOnly: true }); }
        
// --- SECTION: SCHEDULE ---
        let scheduleOpenerDraft = null; // { date, home, away }

        function getScheduleTeamPool(date) {
            const dayData = appData[date];
            return [...new Set(dayData?.settings?.activeTeams || [])];
        }

        function getScheduleOpenerPair(date) {
            if (scheduleOpenerDraft?.date === date) {
                return { home: scheduleOpenerDraft.home, away: scheduleOpenerDraft.away };
            }
            const opener = appData[date]?.schedule?.[0];
            if (!opener?.home || !opener?.away) return null;
            return { home: opener.home, away: opener.away };
        }

        function shuffleTeamSlugs(slugs) {
            const arr = [...slugs];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function buildTeamOrderFromOpener(teamPool, t1, t2) {
            if (!Array.isArray(teamPool) || teamPool.length < 2 || !t1 || !t2 || t1 === t2) return null;
            if (!teamPool.includes(t1) || !teamPool.includes(t2)) return null;
            const others = shuffleTeamSlugs(teamPool.filter(slug => slug !== t1 && slug !== t2));
            return [t1, t2, ...others];
        }

        function buildScheduleFromTeamOrder(finalOrder, templateId) {
            const selectedTemplate = dbTemplates.find(t => t.id === templateId);
            let schedule = [];
            if (selectedTemplate) {
                schedule = selectedTemplate.data.map(match => ({
                    home: finalOrder[match.home - 1],
                    away: finalOrder[match.away - 1]
                })).filter(m => m.home && m.away);
            } else {
                schedule = generateDoubleRoundRobin(finalOrder);
            }
            return schedule.map(match => ({ ...match, homeScore: null, awayScore: null }));
        }

        let openerSpinning = false;

        function pickRandomOpenerPair(teamPool, currentPair = null) {
            if (!Array.isArray(teamPool) || teamPool.length < 2) return null;
            let home = teamPool[0];
            let away = teamPool[1];
            for (let i = 0; i < 12; i++) {
                home = teamPool[Math.floor(Math.random() * teamPool.length)];
                const others = teamPool.filter(slug => slug !== home);
                away = others[Math.floor(Math.random() * others.length)];
                if (!currentPair || home !== currentPair.home || away !== currentPair.away) break;
            }
            return { home, away };
        }

        function setOpenerReelTeam(reelWindow, slug, { clickable = false, side = '' } = {}) {
            if (!reelWindow) return;
            const team = TEAMS.find(t => t.slug === slug);
            if (!team) return;
            const clickableClass = clickable ? ' opener-pick' : '';
            const sideAttr = side ? ` data-side="${side}"` : '';
            const title = clickable ? ` title="แตะเพื่อเปลี่ยนทีม"` : '';
            const teamHtml = clickable
                ? `<button type="button" class="team-emblem ${team.slug}${clickableClass}"${sideAttr}${title}>${escapeHtml(team.name)}</button>`
                : `<div class="team-emblem ${team.slug}">${escapeHtml(team.name)}</div>`;
            reelWindow.innerHTML = `${teamHtml}<span class="opener-reel-glass" aria-hidden="true"></span>`;
        }

        function getOpenerPairFromRoot(root) {
            const homeBtn = root.querySelector('[data-reel="home"] .team-emblem');
            const awayBtn = root.querySelector('[data-reel="away"] .team-emblem');
            const homeSlug = [...(homeBtn?.classList || [])].find(c => TEAMS.some(t => t.slug === c));
            const awaySlug = [...(awayBtn?.classList || [])].find(c => TEAMS.some(t => t.slug === c));
            if (!homeSlug || !awaySlug) return null;
            return { home: homeSlug, away: awaySlug };
        }

        function cycleOpenerPairSide(currentPair, side, teamPool) {
            if (!currentPair || !teamPool || teamPool.length < 2) return null;
            const other = side === 'home' ? currentPair.away : currentPair.home;
            const current = side === 'home' ? currentPair.home : currentPair.away;
            const candidates = teamPool.filter(slug => slug !== other);
            if (!candidates.length) return null;
            const idx = Math.max(0, candidates.indexOf(current));
            const next = candidates[(idx + 1) % candidates.length];
            return {
                home: side === 'home' ? next : currentPair.home,
                away: side === 'away' ? next : currentPair.away
            };
        }

        function buildOpenerSlotHtml(homeSlug, awaySlug, { showLever = true, clickable = true } = {}) {
            const homeTeam = TEAMS.find(t => t.slug === homeSlug);
            const awayTeam = TEAMS.find(t => t.slug === awaySlug);
            if (!homeTeam || !awayTeam) return '';
            const leverHtml = showLever
                ? `<button type="button" class="opener-lever" title="ดึงคันชักสุ่มคู่เปิดสนาม" aria-label="ดึงคันชักสุ่มคู่เปิดสนาม">
                        <span class="lever-console"></span>
                        <span class="lever-rail"></span>
                        <span class="lever-marks"></span>
                        <span class="lever-grip">
                            <span class="lever-knob" aria-hidden="true">⚽</span>
                            <span class="lever-stem"></span>
                        </span>
                   </button>`
                : '';
            const homeEl = clickable
                ? `<button type="button" class="team-emblem ${homeTeam.slug} opener-pick" data-side="home" title="แตะเพื่อเปลี่ยนทีม">${escapeHtml(homeTeam.name)}</button>`
                : `<div class="team-emblem ${homeTeam.slug}">${escapeHtml(homeTeam.name)}</div>`;
            const awayEl = clickable
                ? `<button type="button" class="team-emblem ${awayTeam.slug} opener-pick" data-side="away" title="แตะเพื่อเปลี่ยนทีม">${escapeHtml(awayTeam.name)}</button>`
                : `<div class="team-emblem ${awayTeam.slug}">${escapeHtml(awayTeam.name)}</div>`;
            return `
                <div class="opener-slot">
                    <div class="opener-slot-machine">
                        <div class="opener-reel" data-reel="home">
                            <div class="opener-reel-bezel">
                                <div class="opener-reel-window">
                                    ${homeEl}
                                    <span class="opener-reel-glass" aria-hidden="true"></span>
                                </div>
                            </div>
                        </div>
                        <span class="vs">VS</span>
                        <div class="opener-reel" data-reel="away">
                            <div class="opener-reel-bezel">
                                <div class="opener-reel-window">
                                    ${awayEl}
                                    <span class="opener-reel-glass" aria-hidden="true"></span>
                                </div>
                            </div>
                        </div>
                        ${leverHtml}
                    </div>
                </div>
            `;
        }

        function wireOpenerSlotControls(root, { teamPool, getPair, onPairChange, enableLever = true, clickable = true } = {}) {
            if (!root) return;
            const homeWindow = root.querySelector('[data-reel="home"] .opener-reel-window');
            const awayWindow = root.querySelector('[data-reel="away"] .opener-reel-window');

            const applyPair = (pair) => {
                if (!pair) return;
                setOpenerReelTeam(homeWindow, pair.home, { clickable, side: 'home' });
                setOpenerReelTeam(awayWindow, pair.away, { clickable, side: 'away' });
                if (clickable) bindPicks();
                if (typeof onPairChange === 'function') onPairChange(pair);
            };

            const bindPicks = () => {
                root.querySelectorAll('.opener-pick').forEach(btn => {
                    btn.onclick = () => {
                        if (openerSpinning) return;
                        const pool = typeof teamPool === 'function' ? teamPool() : teamPool;
                        const current = (typeof getPair === 'function' ? getPair() : null) || getOpenerPairFromRoot(root);
                        const next = cycleOpenerPairSide(current, btn.dataset.side, pool);
                        if (next) applyPair(next);
                    };
                });
            };

            if (clickable) bindPicks();

            const lever = root.querySelector('.opener-lever');
            if (lever && enableLever) {
                lever.onclick = () => {
                    const pool = typeof teamPool === 'function' ? teamPool() : teamPool;
                    const current = (typeof getPair === 'function' ? getPair() : null) || getOpenerPairFromRoot(root);
                    spinOpenerSlotMachine({
                        root,
                        teamPool: pool,
                        currentPair: current,
                        clickable,
                        onDone: (result) => applyPair(result)
                    });
                };
            }
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function spinOpenerSlotMachine({ root, teamPool, currentPair, onDone, clickable = true }) {
            if (openerSpinning || !root) return;
            if (!teamPool || teamPool.length < 2) {
                alert('ต้องมีทีมอย่างน้อย 2 ทีมเพื่อสุ่มคู่เปิดสนาม');
                return;
            }
            const machine = root.querySelector('.opener-slot-machine');
            const lever = root.querySelector('.opener-lever');
            const homeWindow = root.querySelector('[data-reel="home"] .opener-reel-window');
            const awayWindow = root.querySelector('[data-reel="away"] .opener-reel-window');
            if (!machine || !homeWindow || !awayWindow) return;

            openerSpinning = true;
            if (lever) {
                lever.disabled = true;
                // ดึงคันลงตามรางก่อน แล้วค่อยหมุนวงล้อ
                lever.classList.add('pulled');
            }
            await sleep(220);
            machine.classList.add('spinning');

            const result = pickRandomOpenerPair(teamPool, currentPair);
            const homeStopAt = 14 + Math.floor(Math.random() * 4);
            const awayStopAt = homeStopAt + 4 + Math.floor(Math.random() * 4);
            let homeSlug = currentPair?.home || teamPool[0];
            let awaySlug = currentPair?.away || teamPool[1];

            for (let step = 0; step <= awayStopAt; step++) {
                if (step <= homeStopAt) {
                    homeSlug = teamPool[Math.floor(Math.random() * teamPool.length)];
                    setOpenerReelTeam(homeWindow, homeSlug);
                } else if (step === homeStopAt + 1) {
                    homeSlug = result.home;
                    setOpenerReelTeam(homeWindow, homeSlug);
                }
                if (step < awayStopAt) {
                    const awayCandidates = teamPool.filter(slug => slug !== (step >= homeStopAt ? result.home : homeSlug));
                    awaySlug = (awayCandidates.length ? awayCandidates : teamPool)[Math.floor(Math.random() * (awayCandidates.length || teamPool.length))];
                    setOpenerReelTeam(awayWindow, awaySlug);
                } else {
                    awaySlug = result.away;
                    setOpenerReelTeam(awayWindow, awaySlug);
                }
                await sleep(step < 8 ? 45 : (step < homeStopAt ? 70 : 95));
            }

            setOpenerReelTeam(homeWindow, result.home, { clickable, side: 'home' });
            setOpenerReelTeam(awayWindow, result.away, { clickable, side: 'away' });
            machine.classList.remove('spinning');
            if (lever) {
                // ค้างด้านล่างนิดหนึ่ง แล้วเด้งกลับขึ้น
                await sleep(160);
                lever.classList.remove('pulled');
                await sleep(280);
                lever.disabled = false;
            }
            openerSpinning = false;
            if (typeof onDone === 'function') onDone(result);
        }

        async function updateScheduleFromOpenerCard() {
            if (!canManage()) return alert('ต้องเป็นผู้ดูแลที่อนุมัติแล้วเท่านั้น');
            const date = currentDateKey;
            const dayData = appData[date];
            if (!dayData?.settings) return alert('ยังไม่มีข้อมูลวันแข่งขัน');
            const opener = getScheduleOpenerPair(date);
            if (!opener) return alert('กรุณาเลือกคู่เปิดสนาม');
            const teamPool = getScheduleTeamPool(date);
            const finalOrder = buildTeamOrderFromOpener(teamPool, opener.home, opener.away);
            if (!finalOrder) return alert('กรุณาเลือกทีมเปิดสนามให้ครบ 2 ทีม (ไม่ซ้ำกัน)');

            if (dayData.schedule && dayData.schedule.length > 0) {
                const hasScores = dayData.schedule.some(m => m.homeScore !== null || m.awayScore !== null);
                const message = hasScores
                    ? 'คำเตือน: การอัปเดตตารางใหม่จะลบ "ผลการแข่งขัน" ที่มีอยู่ทั้งหมดของวันนี้!'
                    : 'คุณแน่ใจหรือไม่ว่าต้องการอัปเดตตารางใหม่ทั้งชุดทับของเดิม?';
                if (!confirm(message)) return;
            }

            const settings = { ...dayData.settings, activeTeams: finalOrder };
            const finalSchedule = buildScheduleFromTeamOrder(finalOrder, settings.templateId);
            const { error } = await db.from('match_days').upsert(
                { match_date: date, settings, schedule: finalSchedule },
                { onConflict: 'match_date' }
            );
            if (error) {
                alert('เกิดข้อผิดพลาด: ' + error.message);
                return;
            }
            scheduleOpenerDraft = null;
            showToast('✅ อัปเดตตารางแข่งขันแล้ว');
            await loadDataForDate(date, { syncSetupDate: false });
        }

        function renderScheduleOpenerCard(date) {
            const card = document.getElementById('schedule-opener-card');
            const content = document.getElementById('schedule-opener-content');
            const updateBtn = document.getElementById('schedule-update-btn');
            if (!card || !content) return;
            if (openerSpinning && content.querySelector('.opener-slot-machine')) return;
            const dayData = appData[date];
            if (!dayData?.schedule?.length) {
                card.style.display = 'none';
                content.innerHTML = '';
                if (updateBtn) updateBtn.style.display = 'none';
                if (scheduleOpenerDraft?.date === date) scheduleOpenerDraft = null;
                return;
            }
            if (scheduleOpenerDraft && scheduleOpenerDraft.date !== date) {
                scheduleOpenerDraft = null;
            }
            const opener = getScheduleOpenerPair(date);
            const homeTeam = TEAMS.find(t => t.slug === opener?.home);
            const awayTeam = TEAMS.find(t => t.slug === opener?.away);
            if (!homeTeam || !awayTeam) {
                card.style.display = 'none';
                if (updateBtn) updateBtn.style.display = 'none';
                return;
            }
            const editable = canManage();
            const hint = card.querySelector('.opener-pick-hint');
            if (hint) {
                hint.textContent = editable
                    ? 'แตะสีทีมหรือดึงคันชักสุ่ม แล้วกดอัปเดตเพื่อสร้างตารางใหม่ทั้งชุด'
                    : 'คู่เปิดสนามของวันนี้';
            }
            content.innerHTML = buildOpenerSlotHtml(homeTeam.slug, awayTeam.slug, {
                showLever: editable,
                clickable: editable
            });
            if (editable) {
                wireOpenerSlotControls(content, {
                    teamPool: () => getScheduleTeamPool(date),
                    getPair: () => getScheduleOpenerPair(date),
                    onPairChange: (pair) => {
                        scheduleOpenerDraft = { date, home: pair.home, away: pair.away };
                    }
                });
            }
            if (updateBtn) {
                updateBtn.style.display = editable ? 'block' : 'none';
                updateBtn.onclick = () => updateScheduleFromOpenerCard();
            }
            card.style.display = 'block';
        }

        function renderSchedulePage(date) {
            const container = document.getElementById('schedule-container');
            const templateInfoBadge = document.getElementById('schedule-template-info');
            const dayData = appData[date];

            if (!dayData || !dayData.schedule || dayData.schedule.length === 0) {
                renderWithMorph(container, createNoDataMessage('ยังไม่มีตารางการแข่งขันสำหรับวันนี้', '📅'));
                applyColumnMajorGrid(container);
                templateInfoBadge.textContent = '';
                templateInfoBadge.style.display = 'none';
                renderScheduleOpenerCard(date);
                return;
            }

            const { settings } = dayData;
            let templateName = 'ตารางแบบพบกันหมด';

            if (settings.templateId) {
                const tmpl = dbTemplates.find(t => t.id === settings.templateId);
                if (tmpl) templateName = tmpl.name;
            } else {
                templateName = "รูปแบบดั้งเดิม";
            }

            templateInfoBadge.textContent = `📋 ${templateName}`;
            templateInfoBadge.style.display = 'inline-block';

            const { schedule } = dayData;
            const startTime = new Date(`${date}T${settings.startTime}`);
            let html = schedule.map((match, index) => {
                const matchTime = new Date(startTime.getTime() + index * settings.timePerMatch * 60000);
                const timeStr = matchTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit'});
                const homeTeam = TEAMS.find(t => t.slug === match.home) || { name: 'N/A', slug: 'black' };
                const awayTeam = TEAMS.find(t => t.slug === match.away) || { name: 'N/A', slug: 'black' };

                let adminActions = '';
                if(canManage()) {
                    const moveTopBtn = index > 0 ? `<button class="action-btn move-top-btn" data-index="${index}" title="ตั้งเป็นคู่เปิดสนาม">${SVG_MOVE_TOP}</button>` : '';
                    const deleteBtn = `<button class="action-btn delete-match-btn" data-index="${index}" title="ลบแมตช์นี้">${SVG_TRASH}</button>`;
                    adminActions = `<div class="match-actions">${moveTopBtn}${deleteBtn}</div>`;
                }
                
                const draggableClass = canManage() ? 'draggable' : '';
                const draggableAttr = canManage() ? 'draggable="true"' : '';
                const matchLabel = `แมตช์ที่ ${index + 1}`;

                return `<div class="card match-card ${draggableClass}" data-index="${index}" ${draggableAttr}><div class="match-header"><span>${matchLabel}</span><span>⏱️ ${timeStr}</span>${adminActions}</div><div class="match-body"><div class="team-emblem ${homeTeam.slug}">${homeTeam.name}</div><span class="vs">VS</span><div class="team-emblem ${awayTeam.slug}">${awayTeam.name}</div></div></div>`;
            }).join('');
            if (canManage() && dayData.schedule) { html += `<button id="add-match-btn" class="btn btn-primary">➕ เพิ่มแมตช์ใหม่</button>`; }
            renderWithMorph(container, html);
            applyColumnMajorGrid(container);
            renderScheduleOpenerCard(date);
        }

        function applyColumnMajorGrid(container) {
            if (!container) return;
            const cards = container.querySelectorAll(':scope > .match-card');
            const addBtn = container.querySelector(':scope > #add-match-btn');
            const wide = window.matchMedia('(min-width: 768px), (orientation: landscape)').matches;
            if (!wide || cards.length === 0) {
                container.style.gridTemplateRows = '';
                if (addBtn) addBtn.style.gridRow = '';
                return;
            }
            const rows = Math.ceil(cards.length / 2);
            container.style.gridTemplateRows = `repeat(${rows}, auto)`;
            if (addBtn) addBtn.style.gridRow = String(rows + 1);
        }
        
        async function handleMainClick(event) { 
            const target = event.target; 
            const deleteBtn = target.closest('.delete-match-btn'); if (deleteBtn) { handleDeleteMatch(deleteBtn.dataset.index); return; } 
            const moveTopBtn = target.closest('.move-top-btn'); if (moveTopBtn) { handleMoveMatchToTop(moveTopBtn.dataset.index); return; }
            /* หน้าตารางแข่ง: ไม่ให้แตะเปลี่ยนทีมจากป้ายสี — ใช้เฉพาะนัดเปิดสนาม / เพิ่มแมตช์ */ 
            const addBtn = target.closest('#add-match-btn'); if (addBtn) { handleAddMatch(); return; } 
            const scoreBtn = target.closest('.score-btn'); if (scoreBtn) { await updateScoreFromButton(scoreBtn); return; } 
            const scoreInput = target.closest('.score-input'); if (scoreInput) { scoreInput.onchange = () => updateScoreFromInput(scoreInput); return; } 
            const resetBtn = target.closest('.reset-score-btn'); if (resetBtn) { await resetScore(resetBtn); return; } 
        }
        function handleDragStart(event) { const draggable = event.target.closest('.match-card.draggable'); if (!draggable) return; draggedItem = draggable; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', draggable.dataset.index); setTimeout(() => { draggedItem.classList.add('dragging'); }, 0); }
        function handleDragEnd(event) { if (!draggedItem) return; draggedItem.classList.remove('dragging'); draggedItem = null; const placeholder = document.querySelector('.drag-over-placeholder'); if (placeholder) { placeholder.remove(); } }
        function handleDragOver(event) { event.preventDefault(); const container = event.currentTarget; const afterElement = getDragAfterElement(container, event.clientY); let placeholder = container.querySelector('.drag-over-placeholder'); if (!placeholder) { placeholder = document.createElement('div'); placeholder.classList.add('drag-over-placeholder'); } container.insertBefore(placeholder, afterElement); }
        async function handleDrop(event) {
            event.preventDefault();
            const container = event.currentTarget;
            const placeholder = container.querySelector('.drag-over-placeholder');
            if (!placeholder || !draggedItem) return;
            placeholder.parentNode.insertBefore(draggedItem, placeholder);
            placeholder.remove();
            const originalIndices = Array.from(container.querySelectorAll('.match-card[data-index]')).map(card => parseInt(card.dataset.index, 10));
            const oldSchedule = appData[currentDateKey].schedule;
            const reorderedSchedule = originalIndices.map(originalIndex => oldSchedule.find((match, i) => i === originalIndex));
            const openerChanged = originalIndices[0] !== 0;
            await updateScheduleInDB(reorderedSchedule, {
                toastMessage: openerChanged ? '✅ อัปเดตคู่เปิดสนามแล้ว' : '✅ อัปเดตลำดับแมตช์แล้ว'
            });
        }
        function setupDragAndDropListeners(container) { container.addEventListener('dragstart', handleDragStart); container.addEventListener('dragend', handleDragEnd); container.addEventListener('dragover', handleDragOver); container.addEventListener('drop', handleDrop); }
        function getDragAfterElement(container, y) { const draggableElements = [...container.querySelectorAll('.match-card.draggable:not(.dragging)')]; return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } else { return closest; } }, { offset: Number.NEGATIVE_INFINITY }).element; }
        
        async function handleAddMatch() { if (!canManage()) return; const dayData = appData[currentDateKey]; if (!dayData || !dayData.settings.activeTeams || dayData.settings.activeTeams.length < 2) { alert('ต้องมีทีมที่เข้าร่วมอย่างน้อย 2 ทีมเพื่อเพิ่มแมตช์'); return; } let newSchedule = dayData.schedule ? [...dayData.schedule] : []; newSchedule.push({ home: dayData.settings.activeTeams[0], away: dayData.settings.activeTeams[1], homeScore: null, awayScore: null }); await updateScheduleInDB(newSchedule); }
        async function handleDeleteMatch(index) { const idx = parseInt(index, 10); if (!canManage()) return; const dayData = appData[currentDateKey]; if (!dayData) return; if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "แมตช์ที่ ${idx + 1}" ?`)) { let newSchedule = [...dayData.schedule]; newSchedule.splice(idx, 1); await updateScheduleInDB(newSchedule); } }
        
        async function handleMoveMatchToTop(index) {
            const idx = parseInt(index, 10);
            if (!canManage() || isNaN(idx) || idx === 0) return;
            const dayData = appData[currentDateKey];
            if (!dayData || !dayData.schedule) return;

            let currentSchedule = [...dayData.schedule];
            const matchesToBecomeLast = currentSchedule.slice(0, idx);
            const matchesToBecomeFirst = currentSchedule.slice(idx);
            
            const newSchedule = [...matchesToBecomeFirst, ...matchesToBecomeLast];
            await updateScheduleInDB(newSchedule, { toastMessage: '✅ อัปเดตคู่เปิดสนามแล้ว' });
        }

        function openTeamSelectModal(index, side) { if (!canManage()) return; currentEditingContext = { index: parseInt(index), side }; const dayData = appData[currentDateKey]; const activeTeams = dayData.settings.activeTeams; const modalList = document.getElementById('team-select-modal-list'); document.getElementById('team-select-modal-title').textContent = `เลือกทีม${side === 'home' ? 'เหย้า' : 'เยือน'}สำหรับแมตช์ที่ ${currentEditingContext.index + 1}`; modalList.innerHTML = ''; activeTeams.forEach(slug => { const team = TEAMS.find(t => t.slug === slug); if (team) { const teamEl = document.createElement('div'); teamEl.className = `team-emblem ${team.slug} clickable`; teamEl.textContent = team.name; teamEl.dataset.slug = team.slug; teamEl.onclick = () => handleTeamSelection(team.slug); modalList.appendChild(teamEl); } }); teamSelectModal.style.display = 'block'; }
        async function handleTeamSelection(newTeamSlug) {
            const { index, side } = currentEditingContext;
            if (index === null || !side) return;
            const dayData = appData[currentDateKey];
            let newSchedule = [...dayData.schedule];
            const match = newSchedule[index];
            const otherSide = side === 'home' ? 'away' : 'home';
            if (match[otherSide] === newTeamSlug) {
                alert('ไม่สามารถเลือกทีมซ้ำกันในคู่เดียวกันได้');
                return;
            }
            match[side] = newTeamSlug;
            teamSelectModal.style.display = 'none';
            await updateScheduleInDB(newSchedule, {
                toastMessage: index === 0 ? '✅ อัปเดตคู่เปิดสนามแล้ว' : '✅ อัปเดตตารางแล้ว'
            });
        }
        
        function isPhoneLikeDevice() {
            const ua = navigator.userAgent || '';
            if (/Android|iPhone|iPod|Mobile/i.test(ua)) return true;
            if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return true;
            return window.matchMedia('(max-width: 920px) and (hover: none)').matches;
        }

        function desiredOrientationForPage(pageId) {
            return pageId === 'page-leaderboard' ? 'landscape' : 'portrait';
        }

        function updateOrientHint() {
            const hint = document.getElementById('orient-hint');
            const textEl = document.getElementById('orient-hint-text');
            if (!hint || !textEl) return;
            if (!isPhoneLikeDevice()) {
                document.body.classList.remove('wrong-orient', 'force-orient-portrait', 'force-orient-landscape');
                return;
            }
            const needLandscape = document.body.classList.contains('force-orient-landscape');
            const isLandscape = window.matchMedia('(orientation: landscape)').matches;
            const wrong = needLandscape ? !isLandscape : isLandscape;
            document.body.classList.toggle('wrong-orient', wrong);
            textEl.textContent = needLandscape
                ? 'หมุนเครื่องเป็นแนวนอน\nเพื่อดูตารางคะแนน'
                : 'หมุนเครื่องเป็นแนวตั้ง';
        }

        async function applyPageOrientation(pageId = activePage) {
            const mobile = isPhoneLikeDevice();
            const want = desiredOrientationForPage(pageId);
            document.body.classList.toggle('force-orient-portrait', mobile && want === 'portrait');
            document.body.classList.toggle('force-orient-landscape', mobile && want === 'landscape');
            updateOrientHint();

            if (!mobile || !screen.orientation) return;
            try {
                if (typeof screen.orientation.lock === 'function') {
                    await screen.orientation.lock(want);
                }
            } catch (_) {
                /* iOS / บางเบราว์เซอร์ล็อกไม่ได้ — ใช้ overlay แทน */
            }
        }

        function setupOrientationGuard() {
            window.addEventListener('orientationchange', () => applyPageOrientation(activePage));
            window.addEventListener('resize', () => updateOrientHint());
            if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
                screen.orientation.addEventListener('change', () => updateOrientHint());
            }
        }

        function setActivePage(pageId) { 
            if (!canManage() && pageId === 'page-setup') { alert(currentUser ? 'บัญชีของคุณยังไม่ได้รับอนุมัติจาก Superadmin' : 'คุณต้องเข้าสู่ระบบผู้ดูแลเพื่อเข้าถึงหน้านี้'); if (!currentUser) loginModal.style.display = 'block'; return; } 
            const leavingScores = activePage === 'page-scores' && pageId !== 'page-scores';
            activePage = pageId; shouldRestoreScroll = false; 
            pages.forEach(page => page.classList.remove('active')); 
            document.getElementById(pageId).classList.add('active'); 
            navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageId)); 
            content.scrollTop = 0; 
            if (pageId === 'page-leaderboard') { renderLeaderboardPage(currentDateKey); }
            if (pageId === 'page-lineup') { renderLineupPage(); }
            if (pageId === 'page-scores') {
                ensureScorePresenceChannel(currentDateKey);
                applyScoreEditLocksUI();
            } else if (leavingScores) {
                releaseScoreEditClaim();
            }
            applyPageOrientation(pageId);
        }

// --- SECTION: LINEUP ---
        function getCurrentFormation() {
            return FORMATIONS.find(f => f.id === lineupFormationId) || FORMATIONS[0];
        }

        function getLineupTeamOptions() {
            return TEAMS.map(t => t.slug);
        }

        function emptyNamesForFormation(formation) {
            const names = {};
            (formation?.slots || []).forEach(s => { names[s.id] = ''; });
            return names;
        }

        function lineupDraftKey(teamSlug = lineupTeamSlug) {
            return teamSlug;
        }

        function rememberLineupDraft() {
            lineupDrafts[lineupDraftKey()] = {
                formationId: lineupFormationId,
                names: { ...lineupNames }
            };
        }

        function loadLineupStateForCurrent() {
            const draft = lineupDrafts[lineupDraftKey()];
            lineupFormationId = draft?.formationId || '2-3-1';
            const formation = getCurrentFormation();
            lineupNames = emptyNamesForFormation(formation);
            if (draft?.names) {
                formation.slots.forEach(s => {
                    lineupNames[s.id] = draft.names[s.id] || '';
                });
            }
            lineupActiveSlotId = null;
        }

        function renderLineupPage() {
            const teams = getLineupTeamOptions();
            if (!teams.includes(lineupTeamSlug)) lineupTeamSlug = teams[0];
            loadLineupStateForCurrent();

            const teamBox = document.getElementById('lineup-team-chips');
            teamBox.innerHTML = teams.map(slug => {
                const team = TEAMS.find(t => t.slug === slug);
                const name = team ? team.name : slug;
                const activeClass = slug === lineupTeamSlug ? 'active-team' : '';
                return `<button type="button" class="lineup-team-dot ${escapeHtml(slug)} ${activeClass}" data-slug="${escapeHtml(slug)}" title="${escapeHtml(name)}" aria-label="${escapeHtml(name)}"></button>`;
            }).join('');
            teamBox.querySelectorAll('.lineup-team-dot').forEach(el => {
                el.onclick = () => {
                    rememberLineupDraft();
                    lineupTeamSlug = el.dataset.slug;
                    renderLineupPage();
                };
            });

            const formBox = document.getElementById('formation-chips');
            formBox.innerHTML = FORMATIONS.map(f =>
                `<button type="button" class="formation-chip ${f.id === lineupFormationId ? 'active' : ''}" data-id="${f.id}">${f.name}</button>`
            ).join('');
            formBox.querySelectorAll('.formation-chip').forEach(btn => {
                btn.onclick = () => {
                    const oldNames = { ...lineupNames };
                    lineupFormationId = btn.dataset.id;
                    const formation = getCurrentFormation();
                    lineupNames = emptyNamesForFormation(formation);
                    formation.slots.forEach((s, i) => {
                        const oldVals = Object.values(oldNames);
                        lineupNames[s.id] = oldVals[i] || '';
                    });
                    rememberLineupDraft();
                    renderLineupPitchAndNames();
                    formBox.querySelectorAll('.formation-chip').forEach(b => b.classList.toggle('active', b.dataset.id === lineupFormationId));
                };
            });

            renderLineupPitchAndNames();
        }

        function beginEditLineupSlot(slotId) {
            const pitch = document.getElementById('lineup-pitch');
            if (!pitch) return;
            // ถ้ากำลังแก้ช่องอื่นอยู่ ให้บันทึกก่อน
            const existing = pitch.querySelector('.slot-name-input');
            if (existing) {
                const sid = existing.dataset.slot;
                lineupNames[sid] = sanitizeDisplayName(existing.value);
                rememberLineupDraft();
            }
            lineupActiveSlotId = slotId;
            renderLineupPitchAndNames(true);
            const input = pitch.querySelector(`.slot-name-input[data-slot="${slotId}"]`);
            if (input) {
                input.focus();
                input.select();
            }
        }

        function renderLineupPitchAndNames(editing = false) {
            const formation = getCurrentFormation();
            const pitch = document.getElementById('lineup-pitch');
            pitch.className = `pitch team-${lineupTeamSlug}`;
            pitch.innerHTML = `
                <div class="pitch-half"></div>
                <div class="pitch-box pitch-box-top"></div>
                <div class="pitch-box pitch-box-bottom"></div>
                <div class="pitch-six pitch-six-top"></div>
                <div class="pitch-six pitch-six-bottom"></div>
                <div class="pitch-goal pitch-goal-top"></div>
                <div class="pitch-goal pitch-goal-bottom"></div>
            `;
            formation.slots.forEach(slot => {
                const name = (lineupNames[slot.id] || '').trim();
                const isEditing = editing && lineupActiveSlotId === slot.id;
                const el = document.createElement('div');
                el.className = `pitch-slot${name ? ' filled' : ''}${lineupActiveSlotId === slot.id ? ' active' : ''}`;
                el.style.left = slot.x + '%';
                el.style.top = slot.y + '%';
                el.dataset.slotId = slot.id;
                el.innerHTML = `<div class="slot-dot"><span class="slot-dot-lip"></span><span class="slot-dot-face">${escapeHtml(slot.label)}</span></div>`;
                if (isEditing) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'slot-name-input';
                    input.dataset.slot = slot.id;
                    input.value = lineupNames[slot.id] || '';
                    input.maxLength = 24;
                    input.placeholder = 'ชื่อ';
                    input.onclick = (e) => e.stopPropagation();
                    const commit = () => {
                        lineupNames[slot.id] = sanitizeDisplayName(input.value);
                        rememberLineupDraft();
                        lineupActiveSlotId = null;
                        renderLineupPitchAndNames(false);
                    };
                    input.onblur = commit;
                    input.onkeydown = (e) => {
                        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            lineupActiveSlotId = null;
                            renderLineupPitchAndNames(false);
                        }
                    };
                    el.appendChild(input);
                } else {
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'slot-name';
                    nameDiv.textContent = name || 'ว่าง';
                    el.appendChild(nameDiv);
                    el.onclick = () => beginEditLineupSlot(slot.id);
                }
                pitch.appendChild(el);
            });
            applyLineupPieceStyles(pitch, lineupTeamSlug);
        }

        async function shareHelpInfographic() {
            const btn = document.getElementById('share-help-btn');
            const source = document.getElementById('help-infographic');
            if (!btn || !source) return;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⌛ กำลังสร้าง...';
            btn.disabled = true;

            const exportCard = document.createElement('div');
            exportCard.className = 'capture-stage pitch-export-bg';
            exportCard.style.width = '720px';
            exportCard.style.padding = '24px';
            const clone = source.cloneNode(true);
            clone.id = 'help-infographic-export';
            clone.style.border = 'none';
            clone.style.borderRadius = '14px';
            exportCard.appendChild(clone);
            document.body.appendChild(exportCard);

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            try {
                await loadHtml2Canvas();
                const canvas = await html2canvas(exportCard, {
                    backgroundColor: '#3d8b37',
                    useCORS: true,
                    scale: 2,
                    logging: false,
                    onclone: (doc) => prepareCaptureStage(doc.querySelector('.capture-stage'))
                });
                if (exportCard.parentNode) document.body.removeChild(exportCard);
                const blob = await canvasToBlob(canvas, 'image/png');
                if (!blob || blob.size < 500) throw new Error('รูปที่ได้ว่างหรือเล็กเกินไป');
                await shareImageBlob(blob, 'TK7-HowTo.png', 'TK7 วิธีใช้งาน');
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    showToast('ยกเลิกการแชร์');
                } else {
                    console.error('Help share failed:', err);
                    alert('สร้างรูปคู่มือไม่สำเร็จ: ' + (err.message || err));
                }
            } finally {
                if (exportCard.parentNode) document.body.removeChild(exportCard);
                purgeCaptureStages();
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        async function shareCurrentLineup() {
            rememberLineupDraft();
            const btn = document.getElementById('share-lineup-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '⌛ กำลังสร้าง...';
            btn.disabled = true;
            purgeCaptureStages();

            const pitch = document.getElementById('lineup-pitch');
            if (!pitch) {
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            const prevActive = lineupActiveSlotId;
            lineupActiveSlotId = null;
            pitch.querySelectorAll('.pitch-slot.active').forEach(el => el.classList.remove('active'));

            const formation = getCurrentFormation();
            const info = REG_TEAM_INFO[lineupTeamSlug] || { emoji: '⚽', label: lineupTeamSlug };
            const team = TEAMS.find(t => t.slug === lineupTeamSlug);
            const teamLabel = team ? team.name : (info.label || lineupTeamSlug);

            const exportCard = document.createElement('div');
            exportCard.className = 'lineup-export-card capture-stage pitch-export-bg';
            exportCard.style.width = '460px';
            const surface = document.createElement('div');
            surface.className = 'export-surface-card';
            // แยกบรรทัดด้วย div ชัด ๆ — html2canvas เรนเดอร์ <br> ใน h2 ทับกันบ่อย
            surface.innerHTML = `
                <h1>แผนการเล่น TK7</h1>
                <div class="lineup-export-meta">
                    <div class="meta-line">${escapeHtml(teamLabel)}</div>
                    <div class="meta-line">แผน ${escapeHtml(formation.name)}</div>
                </div>`;
            const pitchWrap = document.createElement('div');
            pitchWrap.className = 'pitch-wrap';
            const pitchClone = pitch.cloneNode(true);
            pitchClone.id = 'lineup-pitch-export';
            pitchClone.querySelectorAll('.pitch-slot').forEach(el => el.classList.remove('active'));
            pitchClone.querySelectorAll('.slot-name-input').forEach(inp => {
                const span = document.createElement('div');
                span.className = 'slot-name';
                span.textContent = inp.value || 'ว่าง';
                inp.replaceWith(span);
            });
            applyLineupPieceStyles(pitchClone, lineupTeamSlug);
            pitchWrap.appendChild(pitchClone);
            surface.appendChild(pitchWrap);
            exportCard.appendChild(surface);
            document.body.appendChild(exportCard);

            // รอ layout สนามก่อนแคป
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            try {
                await loadHtml2Canvas();
                const canvas = await html2canvas(exportCard, {
                    backgroundColor: '#3d8b37',
                    useCORS: true,
                    scale: 2,
                    logging: false,
                    onclone: (doc) => {
                        const stage = doc.querySelector('.capture-stage');
                        prepareCaptureStage(stage);
                        applyLineupPieceStyles(stage, lineupTeamSlug);
                    }
                });
                // ถอด stage ทันทีก่อนแชร์ — ไม่ให้รูปสนามโผล่มุมจอระหว่างรอแชร์
                if (exportCard.parentNode) document.body.removeChild(exportCard);
                const blob = await canvasToBlob(canvas, 'image/png');
                if (!blob || blob.size < 500) throw new Error('รูปที่ได้ว่างหรือเล็กเกินไป');
                const filename = `TK7-Lineup-${lineupTeamSlug}.png`;
                await shareImageBlob(blob, filename, `TK7 ${teamLabel} ${formation.name}`);
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    showToast('ยกเลิกการแชร์');
                } else {
                    console.error('Lineup share failed:', err);
                    alert('สร้างรูปแผนไม่สำเร็จ: ' + (err.message || err));
                }
            } finally {
                if (exportCard.parentNode) document.body.removeChild(exportCard);
                purgeCaptureStages();
                lineupActiveSlotId = prevActive;
                if (prevActive) {
                    const activeEl = pitch.querySelector(`[data-slot-id="${prevActive}"]`);
                    if (activeEl) activeEl.classList.add('active');
                }
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
        
// --- SECTION: SETUP ---
        function setupPageSetup() {
            const contentWrapper = document.getElementById('setup-content-wrapper');
            const loginPrompt = document.getElementById('setup-login-prompt');
            if (!canManage()) {
                contentWrapper.style.display = 'none';
                loginPrompt.style.display = 'block';
                const msg = currentUser
                    ? (userProfile?.status === 'pending' ? 'บัญชีของคุณรอการอนุมัติจาก Superadmin' : 'คุณไม่มีสิทธิ์จัดการการแข่งขัน')
                    : 'กรุณาเข้าสู่ระบบผู้ดูแลเพื่อตั้งค่าการแข่งขัน';
                loginPrompt.innerHTML = createNoDataMessage(msg, currentUser ? '⏳' : '🔐');
                return;
            }
            contentWrapper.style.display = '';
            loginPrompt.style.display = 'none';
            if (!isInitialSetupDone) {
                const container = document.getElementById('team-toggle-container');
                container.innerHTML = TEAMS.map((team, index) => {
                    const isChecked = index < 5 ? 'checked' : '';
                    return `<div class="team-toggle"><div class="team-emblem ${team.slug}">${team.name}</div><label class="switch"><input type="checkbox" class="team-switch" data-team-slug="${team.slug}" ${isChecked}><span class="slider"></span></label></div>`;
                }).join('');
                refreshOpenerDropdowns();
                document.getElementById('match-date').addEventListener('change', async (e) => {
                    shouldRestoreScroll = false;
                    const date = e.target.value;
                    if (!date) return;
                    // เปลี่ยนแค่วันในฟอร์มตั้งค่า — ไม่สลับ/ทับวันตารางที่กำลังดู
                    await prepareSetupFormForDate(date);
                });
                document.getElementById('generate-schedule-btn').addEventListener('click', generateAndSaveSchedule);
                document.getElementById('copy-reg-template-btn').addEventListener('click', openShareRegModal);
                document.querySelectorAll('.team-switch').forEach(el => el.addEventListener('change', () => {
                    refreshOpenerDropdowns();
                    updateAdvancedOptions();
                }));
                document.getElementById('template-selector').addEventListener('change', () => renderSchedulePreview(false));
                document.querySelectorAll('#page-setup .num-stepper-btn').forEach(btn => btn.addEventListener('click', handleNumberStepper));
                isInitialSetupDone = true;
            }
        }

        function updateSetupPageUI() {
            updateAdvancedOptions();
            renderSchedulePreview(false);
        }

        function renderSchedulePreview(isInitialLoad) {
            const previewCard = document.getElementById('schedule-preview-card');
            const previewContent = document.getElementById('schedule-preview-content');
            if (!previewCard || !previewContent) return;
            if (openerSpinning && previewContent.querySelector('.opener-slot-machine')) return;
            const dayData = appData[document.getElementById('match-date')?.value || currentDateKey];
            const s1 = document.getElementById('lock-team-1');
            const s2 = document.getElementById('lock-team-2');

            let firstMatch = null;

            if (isInitialLoad && dayData && dayData.schedule && dayData.schedule.length > 0) {
                firstMatch = dayData.schedule[0];
                if (s1 && s2 && firstMatch.home && firstMatch.away) {
                    if ([...s1.options].some(o => o.value === firstMatch.home)) s1.value = firstMatch.home;
                    if ([...s2.options].some(o => o.value === firstMatch.away)) s2.value = firstMatch.away;
                }
            } else {
                const teams = Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug);
                if (teams.length < 2) {
                    previewCard.style.display = 'none';
                    return;
                }
                const t1 = s1?.value;
                const t2 = s2?.value;
                if (t1 && t2) firstMatch = { home: t1, away: t2 };
            }

            if (firstMatch && firstMatch.home && firstMatch.away) {
                const homeTeam = TEAMS.find(t => t.slug === firstMatch.home);
                const awayTeam = TEAMS.find(t => t.slug === firstMatch.away);
                if (homeTeam && awayTeam) {
                    previewContent.innerHTML = buildOpenerSlotHtml(homeTeam.slug, awayTeam.slug, {
                        showLever: true,
                        clickable: true
                    });
                    wireOpenerSlotControls(previewContent, {
                        teamPool: () => Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug),
                        getPair: () => ({ home: s1?.value, away: s2?.value }),
                        onPairChange: (pair) => {
                            if (s1 && [...s1.options].some(o => o.value === pair.home)) s1.value = pair.home;
                            if (s2 && [...s2.options].some(o => o.value === pair.away)) s2.value = pair.away;
                        }
                    });
                    previewCard.style.display = 'block';
                } else {
                    previewCard.style.display = 'none';
                }
            } else {
                previewCard.style.display = 'none';
            }
        }

        function updateAdvancedOptions() { updateTemplateSelector(); }
        function handleNumberStepper(event) { const op = parseInt(event.currentTarget.dataset.op); const targetId = event.currentTarget.dataset.target; const input = document.getElementById(targetId); if (input) { const step = parseFloat(input.step) || 1; const min = parseFloat(input.min); let currentValue = parseFloat(input.value) || 0; let newValue = currentValue + (op * step); if (!isNaN(min) && newValue < min) newValue = min; input.value = parseFloat(newValue.toPrecision(12)); } }
        
        function renderAllPagesForDate(date) {
            setupPageSetup();
            const setupDate = document.getElementById('match-date')?.value || date;
            // ฟอร์มจัดการทีมตามวันที่ในฟอร์มเท่านั้น — ไม่ดึงค่าจากวันตารางที่กำลังดู
            if (setupDate === date) {
                const dayData = appData[date];
                if (dayData && dayData.settings) {
                    loadSettingsFromData(dayData.settings, date);
                } else if (canManage()) {
                    resetSettingsForm();
                }
                updateGenerateButtonForDate(date);
            }
            renderSchedulePage(date);
            renderScoresPage(date);
            renderLeaderboardPage(date);
            if (activePage === 'page-lineup') renderLineupPage();
        }

        function updateTemplateSelector() {
            const templateContainer = document.getElementById('template-selector-container');
            const selector = document.getElementById('template-selector');
            const teamCount = document.querySelectorAll('.team-switch:checked').length;
            
            const filtered = dbTemplates.filter(t => t.team_count === teamCount);

            if (filtered.length > 0) {
                selector.innerHTML = filtered.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');
                templateContainer.style.display = 'block';
            } else {
                selector.innerHTML = '<option value="">(ไม่มี Template สำหรับจำนวนทีมนี้)</option>';
                templateContainer.style.display = 'block';
            }
        }
        
        function getCanonicallySortedTeams(teamSlugs) {
            return [...teamSlugs].sort((a, b) => teamOrderMap.get(a) - teamOrderMap.get(b));
        }

        function generateDoubleRoundRobin(teams) { let teamList = getCanonicallySortedTeams(teams); const BYE = "BYE_TEAM_PLACEHOLDER"; if (teamList.length % 2 !== 0) { teamList.push(BYE); } const numTeams = teamList.length, numRounds = numTeams - 1; const leg1 = []; for (let round = 0; round < numRounds; round++) { for (let i = 0; i < numTeams / 2; i++) { const home = teamList[i], away = teamList[numTeams - 1 - i]; if (home !== BYE && away !== BYE) { leg1.push({ home, away }); } } teamList.splice(1, 0, teamList.pop()); } const leg2 = leg1.map(match => ({ home: match.away, away: match.home })); return [...leg1, ...leg2]; }
        
        async function generateAndSaveSchedule() {
            if (!canManage()) return alert('ต้องเป็นผู้ดูแลที่อนุมัติแล้วเท่านั้น');

            const date = document.getElementById('match-date').value;
            if (!date) return alert('กรุณาเลือกวันที่แข่งขัน');

            // 1. จัดลำดับทีมใหม่ (1, 2 ตามเลือก ที่เหลือสุ่ม)
            const finalOrder = getFinalShuffledOrder();
            if (!finalOrder) return;

            // ตรวจเฉพาะวันที่เลือกในฟอร์ม — ไม่ใช้วันตารางที่กำลังดูอยู่
            const targetDay = await ensureDateLoaded(date);
            if (targetDay?.schedule?.length > 0) {
                const hasScores = targetDay.schedule.some(m => m.homeScore !== null || m.awayScore !== null);
                const message = hasScores
                    ? `คำเตือน: การสร้างตารางใหม่จะลบ "ผลการแข่งขัน" ของวันที่ ${date} ทั้งหมด!`
                    : `คุณแน่ใจหรือไม่ว่าต้องการสร้างตารางใหม่ทับของวันที่ ${date}?`;
                if (!confirm(message)) return;
            }

            const templateId = document.getElementById('template-selector').value;
            const settings = {
                timePerMatch: parseInt(document.getElementById('time-per-match').value) + 1,
                startTime: document.getElementById('start-time').value,
                activeTeams: finalOrder,
                templateId: templateId
            };

            const finalSchedule = buildScheduleFromTeamOrder(finalOrder, templateId);
            const { error } = await db.from('match_days').upsert(
                { match_date: date, settings, schedule: finalSchedule },
                { onConflict: 'match_date' }
            );

            if (error) {
                alert('เกิดข้อผิดพลาด: ' + error.message);
            } else {
                scheduleOpenerDraft = null;
                appData[date] = { match_date: date, settings, schedule: finalSchedule };
                showToast(targetDay?.schedule?.length ? '✅ อัปเดตตารางเรียบร้อย!' : '✅ บันทึกตารางเรียบร้อย!');
                await loadInitialData({ preferDate: date });
                setActivePage('page-schedule');
            }
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => { toast.remove(); }, 2500);
            }, 2500);
        }
        
// --- SECTION: SHARE/EXPORT ---
        let html2canvasLoaded = false;
        function loadHtml2Canvas() {
            return new Promise((resolve, reject) => {
                if (html2canvasLoaded) { resolve(); return; }
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = () => { html2canvasLoaded = true; resolve(); };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        async function handleExport(elementId, filename, buttonElement) {
            const originalText = buttonElement.innerHTML;
            buttonElement.innerHTML = '⌛ กำลังโหลด...';
            buttonElement.disabled = true;

            try {
                await loadHtml2Canvas();
                await shareElementToLine(elementId, filename, buttonElement);
            } catch (error) {
                console.error("Failed to load html2canvas script:", error);
                alert("เกิดข้อผิดพลาดในการโหลดเครื่องมือแชร์");
            } finally {
                buttonElement.innerHTML = originalText;
                buttonElement.disabled = false;
            }
        }

        let shareImageObjectUrl = null;
        let shareImageBlobRef = null;
        let shareImageFilename = 'TK7.png';

        function canvasToBlob(canvas, type = 'image/png', quality) {
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('สร้างไฟล์รูปไม่สำเร็จ'));
                }, type, quality);
            });
        }

        const PITCH_EXPORT_STRIPE =
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='48' height='96' fill='%234fa84a'/%3E%3Crect x='48' width='48' height='96' fill='%233d8b37'/%3E%3C/svg%3E\")";

        function prepareCaptureStage(stage) {
            if (!stage) return;
            stage.style.opacity = '1';
            stage.style.zIndex = '1';
            stage.style.left = '0';
            stage.style.top = '0';
            stage.style.right = 'auto';
            stage.style.margin = '0';
            stage.style.boxSizing = 'border-box';
            stage.style.clipPath = 'none';
            stage.style.webkitClipPath = 'none';
            const isLineupExport = stage.classList.contains('lineup-export-card');
            stage.style.overflow = isLineupExport ? 'visible' : 'hidden';
            stage.style.backgroundColor = '#3d8b37';
            stage.style.backgroundImage = PITCH_EXPORT_STRIPE;
            stage.style.backgroundSize = '96px 96px';
            stage.style.backgroundRepeat = 'repeat';
            const grid = stage.querySelector('.export-mode-grid');
            if (grid) {
                grid.style.width = '100%';
                grid.style.margin = '0 auto';
                grid.style.boxSizing = 'border-box';
            }
            stage.querySelectorAll('.pitch').forEach((pitchEl) => {
                pitchEl.style.overflow = 'visible';
                pitchEl.style.background = LINEUP_PITCH_BG;
                pitchEl.style.backgroundColor = LINEUP_PITCH_BG;
                pitchEl.style.backgroundImage = 'none';
                pitchEl.style.boxShadow = 'none';
            });
            stage.querySelectorAll('.team-emblem').forEach((el) => {
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.lineHeight = '1';
                el.style.padding = '0 10px 3px';
                el.style.boxSizing = 'border-box';
            });
        }

        function closeShareImageModal() {
            const modal = document.getElementById('share-image-modal');
            if (modal) modal.style.display = 'none';
            if (shareImageObjectUrl) {
                URL.revokeObjectURL(shareImageObjectUrl);
                shareImageObjectUrl = null;
            }
            shareImageBlobRef = null;
            const preview = document.getElementById('share-image-preview');
            if (preview) preview.removeAttribute('src');
        }

        function openShareImageModal(blob, filename) {
            shareImageFilename = filename || 'TK7.png';
            shareImageBlobRef = blob;
            if (shareImageObjectUrl) URL.revokeObjectURL(shareImageObjectUrl);
            shareImageObjectUrl = URL.createObjectURL(blob);
            const preview = document.getElementById('share-image-preview');
            preview.src = shareImageObjectUrl;
            const hint = document.getElementById('share-image-hint');
            if (hint) {
                hint.innerHTML = '<b>กำลังคัดลอกรูป...</b> — รอสักครู่';
            }
            document.getElementById('share-image-modal').style.display = 'block';
        }

        async function copyShareImageToClipboard(options = {}) {
            const { quiet = false, alertOnFail = true } = options;
            if (!shareImageBlobRef && !shareImageObjectUrl) {
                if (alertOnFail) alert('ยังไม่มีรูปให้คัดลอก');
                return false;
            }
            try {
                let blob = shareImageBlobRef;
                if (!blob) {
                    const res = await fetch(shareImageObjectUrl);
                    blob = await res.blob();
                }
                // Chrome ชอบ image/png สำหรับ Copy image
                const pngBlob = blob.type === 'image/png'
                    ? blob
                    : await (async () => {
                        const imgBitmap = await createImageBitmap(blob);
                        const c = document.createElement('canvas');
                        c.width = imgBitmap.width;
                        c.height = imgBitmap.height;
                        c.getContext('2d').drawImage(imgBitmap, 0, 0);
                        return canvasToBlob(c, 'image/png');
                    })();

                if (!navigator.clipboard || !window.ClipboardItem) {
                    if (alertOnFail) alert('เบราว์เซอร์นี้คัดลอกรูปไม่ได้ — คลิกขวาที่รูปแล้วเลือก "คัดลอกรูปภาพ"');
                    return false;
                }
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': pngBlob })
                ]);
                if (!quiet) showToast('📋 คัดลอกรูปแล้ว — เปิด LINE แล้ววางได้เลย');
                return true;
            } catch (err) {
                console.error('copy image failed', err);
                if (alertOnFail) {
                    alert('คัดลอกรูปไม่สำเร็จ\nให้คลิกขวาที่รูป → คัดลอกรูปภาพ แทน\n\n' + (err.message || ''));
                }
                return false;
            }
        }

        function downloadShareImage() {
            if (!shareImageObjectUrl) {
                alert('ยังไม่มีรูปให้ดาวน์โหลด');
                return;
            }
            const link = document.createElement('a');
            link.download = shareImageFilename;
            link.href = shareImageObjectUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('📥 ดาวน์โหลดแล้ว');
        }

        function isMobileShareDevice() {
            const ua = navigator.userAgent || '';
            const coarse = typeof window.matchMedia === 'function'
                && window.matchMedia('(pointer: coarse)').matches;
            return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (coarse && 'ontouchstart' in window);
        }

        function purgeCaptureStages() {
            document.querySelectorAll('body > .capture-stage').forEach((el) => el.remove());
        }

        async function ensurePngBlob(blob) {
            if (!blob) return null;
            if (blob.type === 'image/png') return blob;
            try {
                const imgBitmap = await createImageBitmap(blob);
                const c = document.createElement('canvas');
                c.width = imgBitmap.width;
                c.height = imgBitmap.height;
                c.getContext('2d').drawImage(imgBitmap, 0, 0);
                return await canvasToBlob(c, 'image/png');
            } catch (err) {
                console.warn('ensurePngBlob failed', err);
                return blob;
            }
        }

        async function shareImageBlob(blob, filename, title) {
            // มือถือ → แชร์ไฟล์ (เลือก LINE ได้) · PC → คัดลอกคลิปบอร์ด · ไม่เปิดป็อปอัพพรีวิว
            purgeCaptureStages();
            const pngBlob = await ensurePngBlob(blob);
            shareImageFilename = filename || 'TK7.png';
            shareImageBlobRef = pngBlob;
            if (shareImageObjectUrl) URL.revokeObjectURL(shareImageObjectUrl);
            shareImageObjectUrl = URL.createObjectURL(pngBlob);

            if (isMobileShareDevice() && navigator.canShare) {
                try {
                    const file = new File([pngBlob], shareImageFilename, { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: title || 'TK7' });
                        showToast('แชร์แล้ว');
                        return 'shared';
                    }
                } catch (err) {
                    if (err && err.name === 'AbortError') {
                        showToast('ยกเลิกการแชร์');
                        return 'aborted';
                    }
                    // แชร์ไฟล์ไม่ได้ → ลองคัดลอกต่อ
                }
            }

            const ok = await copyShareImageToClipboard({ quiet: false, alertOnFail: false });
            if (ok) return 'copied';

            // fallback: ดาวน์โหลดโดยไม่เปิดโมดัล
            if (shareImageObjectUrl) {
                const link = document.createElement('a');
                link.download = shareImageFilename;
                link.href = shareImageObjectUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            showToast('คัดลอกไม่ได้ — ดาวน์โหลดรูปแทน');
            return 'download';
        }

        async function shareElementToLine(elementId, filename, buttonElement) {
            const element = document.getElementById(elementId);
            if (!element || element.innerHTML.includes('no-data-message')) { alert('ไม่มีข้อมูลให้แชร์'); return; }
            const originalText = buttonElement.innerHTML; buttonElement.innerHTML = '⌛ กำลังสร้าง...'; buttonElement.disabled = true;
            const exportWrapper = document.createElement('div');
            exportWrapper.className = 'temp-export-container capture-stage pitch-export-bg';
            exportWrapper.style.left = '0';
            const headerDiv = document.createElement('div'); headerDiv.className = 'export-header';
            let title = '';
            if (elementId === 'schedule-container') title = 'ตารางการแข่งขัน'; else if (elementId === 'scores-container') title = 'ผลการแข่งขัน'; else if (elementId === 'leaderboard-container') title = 'ตารางคะแนน';
            const formattedDate = new Date(currentDateKey + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            headerDiv.innerHTML = `<h1>⚽ ${title}</h1><h2>วันที่ ${formattedDate}</h2>`;
            exportWrapper.appendChild(headerDiv);
            const contentClone = element.cloneNode(true);
            contentClone.querySelectorAll('.match-actions, .action-btn, #add-match-btn, .interactive-controls').forEach(el => el.remove());
            contentClone.querySelectorAll('.match-card').forEach(card => card.classList.remove('draggable', 'dragging'));
            const isGridExport = (elementId === 'schedule-container' || elementId === 'scores-container');
            if (isGridExport) {
                contentClone.classList.add('export-mode-grid');
                contentClone.style.width = '100%';
                contentClone.style.margin = '0 auto';
                contentClone.style.boxSizing = 'border-box';
                const matchCards = contentClone.querySelectorAll('.match-card');
                if (matchCards.length > 0) {
                    contentClone.style.gridTemplateRows = `repeat(${Math.ceil(matchCards.length / 2)}, auto)`;
                }
            }
            exportWrapper.style.width = (elementId === 'leaderboard-container') ? '1100px' : '860px';
            exportWrapper.style.boxSizing = 'border-box';
            exportWrapper.style.overflow = 'hidden';
            exportWrapper.appendChild(contentClone);
            document.body.appendChild(exportWrapper);
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            
            try {
                const canvas = await html2canvas(exportWrapper, {
                    backgroundColor: '#3d8b37',
                    useCORS: true,
                    scale: 2.2,
                    logging: false,
                    onclone: (doc) => prepareCaptureStage(doc.querySelector('.capture-stage'))
                });
                if (exportWrapper.parentNode) document.body.removeChild(exportWrapper);
                const blob = await canvasToBlob(canvas, 'image/png');
                if (!blob || blob.size < 500) throw new Error('รูปที่ได้ว่างหรือเล็กเกินไป');
                await shareImageBlob(blob, filename, `TK7 ${title} ${formattedDate}`);
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    showToast('ยกเลิกการแชร์');
                } else {
                    console.error('Share failed:', err);
                    alert('เกิดข้อผิดพลาดในการแชร์รูปภาพ: ' + (err.message || err));
                }
            } finally {
                if (exportWrapper.parentNode) document.body.removeChild(exportWrapper);
                purgeCaptureStages();
                buttonElement.innerHTML = originalText;
                buttonElement.disabled = false;
            }
        }

// --- SECTION: DATA/REALTIME ---
        function listenToRealtimeChanges() {
            db.channel('match_days_changes', { config: { broadcast: { self: false } } })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'match_days' }, async (payload) => {
                    const changedDate = payload.new?.match_date || payload.old?.match_date;
                    if (!changedDate) return;
                    if (Object.prototype.hasOwnProperty.call(appData, changedDate)) {
                        delete appData[changedDate];
                    }
                    if (changedDate === currentDateKey) {
                        saveScrollPosition();
                        shouldRestoreScroll = true;
                        await loadDataForDate(currentDateKey, { syncSetupDate: false });
                        return;
                    }
                    // วันอื่น: รีเฟรชรายการวันที่เท่านั้น — อย่ากระโดดหน้าผู้ใช้
                    const { data: datesData } = await db.from('match_days').select('match_date').order('match_date', { ascending: false });
                    if (datesData) updateDateSelectorsUI(datesData.map(d => d.match_date));
                    const selectors = [
                        document.getElementById('schedule-date-selector'),
                        document.getElementById('scores-date-selector'),
                        document.getElementById('leaderboard-date-selector')
                    ];
                    selectors.forEach(s => {
                        if (s && [...s.options].some(o => o.value === currentDateKey)) s.value = currentDateKey;
                    });
                })
                .subscribe();
        }
        function setupNavigation() { navButtons.forEach(button => { button.addEventListener('click', () => setActivePage(button.dataset.page)); }); }
        
        async function loadDataForDate(date, options = {}) {
            const { syncSetupDate = true } = options;
            currentDateKey = date;
            [
                document.getElementById('schedule-date-selector'),
                document.getElementById('scores-date-selector'),
                document.getElementById('leaderboard-date-selector')
            ].forEach(s => { if (s && [...s.options].some(o => o.value === date)) s.value = date; });
            if (syncSetupDate && document.getElementById('match-date')) {
                document.getElementById('match-date').value = date;
            }
            
            const { data: results, error } = await db.from('match_days').select('*').eq('match_date', date);
            if (error) { console.error("Error fetching data for date:", error); alert("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + error.message); return; }
            const data = results && results.length > 0 ? results[0] : null;

            appData[date] = data;
            renderAllPagesForDate(date);
            ensureScorePresenceChannel(date);
            const setupDate = document.getElementById('match-date')?.value;
            if (setupDate) updateGenerateButtonForDate(setupDate);
            else updateGenerateButtonForDate(date);
            restoreScrollPosition();
        }
        
        function loadSettingsFromData(settings, dateKey = null) {
    if (!settings || !canManage()) return;
    document.getElementById('time-per-match').value = settings.timePerMatch ? settings.timePerMatch - 1 : 8;
    document.getElementById('start-time').value = settings.startTime || '20:00';
    
    // ติ๊กทีมที่เข้าร่วม
    document.querySelectorAll('.team-switch').forEach(sw => {
        sw.checked = settings.activeTeams ? settings.activeTeams.includes(sw.dataset.teamSlug) : true;
    });

    const openerDate = dateKey || document.getElementById('match-date')?.value || currentDateKey;
    const dayData = appData[openerDate];
    let firstTeam = null;
    let secondTeam = null;
    if (dayData && dayData.schedule && dayData.schedule.length > 0) {
        firstTeam = dayData.schedule[0].home;
        secondTeam = dayData.schedule[0].away;
    }
    refreshOpenerDropdowns(firstTeam, secondTeam);
    updateAdvancedOptions();
    document.getElementById('template-selector').value = settings.templateId || '';
    renderSchedulePreview(true);
}

        function resetSettingsForm() {
            if (!canManage()) return;
            document.getElementById('time-per-match').value = 8;
            document.getElementById('start-time').value = '20:00';
            document.querySelectorAll('.team-switch').forEach((sw, index) => {
                sw.checked = index < 5;
            });
            refreshOpenerDropdowns();
            updateAdvancedOptions();
            document.getElementById('template-selector').selectedIndex = 0;
            renderSchedulePreview(false);
        }

        async function deleteDay() { if (!canManage()) return alert('ต้องเป็นผู้ดูแลที่อนุมัติแล้วเท่านั้น'); const dateToDelete = document.getElementById('schedule-date-selector').value; if (dateToDelete && confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของวันที่ ${dateToDelete} ทั้งหมด?`)) { const { error } = await db.from('match_days').delete().eq('match_date', dateToDelete); if (error) { alert('เกิดข้อผิดพลาด: ' + error.message); } else { showToast('ลบข้อมูลเรียบร้อยแล้ว'); await loadInitialData(); } } }
        
        function updateDateSelectorsUI(dates) {
            const dateList = Array.isArray(dates) ? [...dates] : [];
            const selectors = [
                document.getElementById('schedule-date-selector'),
                document.getElementById('scores-date-selector'),
                document.getElementById('leaderboard-date-selector')
            ];
            selectors.forEach(selector => {
                if (!selector) return;
                selector.innerHTML = '';
                if (dateList.length === 0) {
                    selector.innerHTML = '<option>ยังไม่มีข้อมูล</option>';
                } else {
                    dateList.forEach(date => {
                        const option = document.createElement('option');
                        option.value = date;
                        option.textContent = new Date(date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                        selector.appendChild(option);
                    });
                }
            });
            const mainSelector = document.getElementById('schedule-date-selector');
            // วันล่าสุดที่มีข้อมูล (เรียงจาก DB แบบใหม่ → เก่า)
            if (dateList.length > 0) {
                mainSelector.value = dateList[0];
            }
            mainSelector.onchange = (e) => { shouldRestoreScroll = false; loadDataForDate(e.target.value); };
            [
                document.getElementById('scores-date-selector'),
                document.getElementById('leaderboard-date-selector')
            ].forEach(s => {
                if (!s) return;
                s.value = mainSelector.value;
                s.onchange = (e) => { mainSelector.value = e.target.value; shouldRestoreScroll = false; loadDataForDate(e.target.value); };
            });
            document.getElementById('delete-day-btn').onclick = deleteDay;
        }

        function createNoDataMessage(message, icon) { return `<div id="no-data-message"><div class="icon">${icon}</div><p>${message}</p></div>`; }
        
// --- SECTION: SCORES ---
        // Presence: บอกคนอื่นว่ามี admin กำลังบันทึกแมตช์ไหนอยู่ (soft lock)
        let scorePresenceChannel = null;
        let scorePresenceDate = null;
        let localEditingMatchIndex = null;
        let localScoreClaimAt = 0;
        let scorePresenceByMatch = {};
        let scoreEditIdleTimer = null;
        const SCORE_EDIT_IDLE_MS = 8000;

        function myPresenceName() {
            return sanitizeDisplayName(userProfile?.display_name || currentUser?.email || 'Admin') || 'Admin';
        }

        function rebuildScorePresenceMap() {
            const map = {};
            if (!scorePresenceChannel) {
                scorePresenceByMatch = map;
                return;
            }
            const state = scorePresenceChannel.presenceState() || {};
            Object.values(state).forEach((presences) => {
                (presences || []).forEach((p) => {
                    if (p?.matchIndex === undefined || p?.matchIndex === null) return;
                    const idx = Number(p.matchIndex);
                    if (Number.isNaN(idx)) return;
                    if (!map[idx]) map[idx] = [];
                    map[idx].push({
                        userId: p.userId || '',
                        name: p.name || 'Admin',
                        at: Number(p.at) || 0
                    });
                });
            });
            scorePresenceByMatch = map;
        }

        function getForeignScoreEditors(matchIndex) {
            const mine = currentUser?.id;
            return (scorePresenceByMatch[matchIndex] || []).filter((e) => e.userId && e.userId !== mine);
        }

        function applyScoreEditLocksUI() {
            const container = document.getElementById('scores-container');
            if (!container) return;
            container.querySelectorAll('.match-card[data-score-card]').forEach((card) => {
                const idx = parseInt(card.dataset.index, 10);
                const foreigners = getForeignScoreEditors(idx);
                const banner = card.querySelector('.score-edit-banner');
                const locked = foreigners.length > 0;
                card.classList.toggle('is-locked-by-other', locked);
                if (banner) {
                    banner.classList.toggle('is-self', !locked && localEditingMatchIndex === idx);
                    if (locked) {
                        banner.hidden = false;
                        banner.textContent = `⏳ ${foreigners.map((f) => f.name).join(', ')} กำลังบันทึกผลแมตช์นี้`;
                    } else if (localEditingMatchIndex === idx && canManage()) {
                        banner.hidden = false;
                        banner.textContent = 'กำลังบันทึกผลแมตช์นี้...';
                    } else {
                        banner.hidden = true;
                        banner.textContent = '';
                    }
                }
                const baseReadOnly = !canManage();
                card.querySelectorAll('.score-btn, .reset-score-btn').forEach((el) => {
                    el.disabled = baseReadOnly || locked;
                });
                card.querySelectorAll('.score-input').forEach((el) => {
                    el.disabled = baseReadOnly || locked;
                    el.readOnly = baseReadOnly || locked;
                });
            });
        }

        async function tearDownScorePresence() {
            clearTimeout(scoreEditIdleTimer);
            scoreEditIdleTimer = null;
            localEditingMatchIndex = null;
            localScoreClaimAt = 0;
            if (scorePresenceChannel) {
                try { await scorePresenceChannel.untrack(); } catch (_) { /* ignore */ }
                try { await db.removeChannel(scorePresenceChannel); } catch (_) { /* ignore */ }
                scorePresenceChannel = null;
            }
            scorePresenceDate = null;
            scorePresenceByMatch = {};
        }

        async function ensureScorePresenceChannel(date) {
            if (!date) return;
            if (scorePresenceChannel && scorePresenceDate === date) return;
            await tearDownScorePresence();
            scorePresenceDate = date;
            const presenceKey = currentUser?.id || `guest-${Math.random().toString(36).slice(2, 10)}`;
            const channel = db.channel(`score-edit:${date}`, {
                config: { presence: { key: presenceKey } }
            });
            const onPresenceChange = () => {
                rebuildScorePresenceMap();
                // ถ้าชนกันคนละเครื่อง: คนที่ claim ทีหลังยอมปล่อย
                if (localEditingMatchIndex !== null) {
                    const others = getForeignScoreEditors(localEditingMatchIndex);
                    if (others.length > 0) {
                        const earliestOther = Math.min(...others.map((o) => o.at || Number.MAX_SAFE_INTEGER));
                        if (!localScoreClaimAt || localScoreClaimAt >= earliestOther) {
                            const names = others.map((o) => o.name).join(', ');
                            localEditingMatchIndex = null;
                            localScoreClaimAt = 0;
                            clearTimeout(scoreEditIdleTimer);
                            scorePresenceChannel?.untrack?.().catch?.(() => {});
                            showToast(`⏳ ${names} กำลังบันทึกแมตช์นี้อยู่แล้ว`);
                        }
                    }
                }
                applyScoreEditLocksUI();
            };
            channel.on('presence', { event: 'sync' }, onPresenceChange);
            channel.on('presence', { event: 'join' }, onPresenceChange);
            channel.on('presence', { event: 'leave' }, onPresenceChange);
            scorePresenceChannel = channel;
            await new Promise((resolve) => {
                let done = false;
                const finish = () => { if (!done) { done = true; resolve(); } };
                channel.subscribe((status) => {
                    if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') finish();
                });
                setTimeout(finish, 2500);
            });
        }

        function bumpScoreEditIdleTimer() {
            clearTimeout(scoreEditIdleTimer);
            scoreEditIdleTimer = setTimeout(() => { releaseScoreEditClaim(); }, SCORE_EDIT_IDLE_MS);
        }

        async function releaseScoreEditClaim() {
            clearTimeout(scoreEditIdleTimer);
            scoreEditIdleTimer = null;
            localEditingMatchIndex = null;
            localScoreClaimAt = 0;
            if (scorePresenceChannel) {
                try { await scorePresenceChannel.untrack(); } catch (_) { /* ignore */ }
            }
            applyScoreEditLocksUI();
        }

        async function claimScoreEdit(matchIndex) {
            if (!canManage() || !currentUser || pendingPasswordRecovery) return false;
            const idx = parseInt(matchIndex, 10);
            if (Number.isNaN(idx)) return false;
            await ensureScorePresenceChannel(currentDateKey);
            rebuildScorePresenceMap();
            const foreigners = getForeignScoreEditors(idx);
            if (foreigners.length > 0) {
                showToast(`⏳ ${foreigners.map((f) => f.name).join(', ')} กำลังบันทึกแมตช์นี้`);
                applyScoreEditLocksUI();
                return false;
            }
            localEditingMatchIndex = idx;
            localScoreClaimAt = Date.now();
            try {
                await scorePresenceChannel.track({
                    matchIndex: idx,
                    userId: currentUser.id,
                    name: myPresenceName(),
                    at: localScoreClaimAt
                });
            } catch (err) {
                console.warn('score presence track failed', err);
            }
            bumpScoreEditIdleTimer();
            applyScoreEditLocksUI();
            return true;
        }

        function renderScoresPage(date) {
            const container = document.getElementById('scores-container');
            const dayData = appData[date];
            if (!dayData || !dayData.schedule || dayData.schedule.length === 0) {
                renderWithMorph(container, createNoDataMessage('ยังไม่มีข้อมูลการแข่งขันสำหรับวันนี้', '✏️'));
                applyColumnMajorGrid(container);
                return;
            }
            const svgMinus = `<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>`, svgPlus = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`, svgReset = `<svg viewBox="0 0 24 24"><path d="M17.65,6.35C16.2,4.9,14.21,4,12,4c-4.42,0-7.99,3.58-7.99,8s3.57,8,7.99,8c3.73,0,6.84-2.55,7.73-6h-2.08c-0.82,2.33-3.04,4-5.65,4-3.31,0-6-2.69-6-6s2.69-6,6-6c1.66,0,3.14,0.69,4.22,1.78L13,11h7V4L17.65,6.35z"/></svg>`;
            const { schedule, settings } = dayData, startTime = new Date(`${date}T${settings.startTime}`);
            const isReadOnly = !canManage(), disabledAttr = isReadOnly ? 'disabled' : '';
            const html = schedule.map((match, index) => {
                const timeStr = new Date(startTime.getTime() + index * settings.timePerMatch * 60000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit'});
                const homeTeam = TEAMS.find(t => t.slug === match.home) || { name: 'N/A', slug: 'black' }, awayTeam = TEAMS.find(t => t.slug === match.away) || { name: 'N/A', slug: 'black' };
                const readonlyAttr = isReadOnly ? 'readonly' : '';
                const homeScoreText = match.homeScore !== null ? match.homeScore : ' ', awayScoreText = match.awayScore !== null ? match.awayScore : ' ';
                const separator = (match.homeScore !== null && match.awayScore !== null) ? '-' : 'vs';
                return `<div class="card match-card" data-score-card="1" data-index="${index}"><div class="score-edit-banner" hidden></div><div class="match-header"><span>แมตช์ที่ ${index + 1}</span><span>⏱️ ${timeStr}</span></div><div class="score-line-export"><div class="team-emblem ${homeTeam.slug}">${homeTeam.name}</div><div class="score-block"><span class="score-value">${homeScoreText}</span><span class="vs-export">${separator}</span><span class="score-value">${awayScoreText}</span></div><div class="team-emblem ${awayTeam.slug}">${awayTeam.name}</div></div><div class="interactive-controls"><div class="team-score-wrapper"><div class="team-emblem ${homeTeam.slug}">${homeTeam.name}</div><div class="score-control"><button class="score-btn" data-index="${index}" data-team="home" data-op="-1" ${disabledAttr}>${svgMinus}</button><input type="number" class="score-input" value="${match.homeScore === null ? '' : match.homeScore}" data-index="${index}" data-team="home" ${readonlyAttr}><button class="score-btn" data-index="${index}" data-team="home" data-op="1" ${disabledAttr}>${svgPlus}</button></div></div><div class="match-center-controls"><span class="vs">VS</span><button class="reset-score-btn" data-index="${index}" ${disabledAttr}>${svgReset}</button></div><div class="team-score-wrapper"><div class="team-emblem ${awayTeam.slug}">${awayTeam.name}</div><div class="score-control"><button class="score-btn" data-index="${index}" data-team="away" data-op="-1" ${disabledAttr}>${svgMinus}</button><input type="number" class="score-input" value="${match.awayScore === null ? '' : match.awayScore}" data-index="${index}" data-team="away" ${readonlyAttr}><button class="score-btn" data-index="${index}" data-team="away" data-op="1" ${disabledAttr}>${svgPlus}</button></div></div></div></div>`;
            }).join('');
            renderWithMorph(container, html);
            applyColumnMajorGrid(container);
            applyScoreEditLocksUI();
            ensureScorePresenceChannel(date);
        }

        function renderLeaderboardPage(date) { 
            const container = document.getElementById('leaderboard-container'), dayData = appData[date]; 
            if (!dayData || !dayData.settings || !dayData.settings.activeTeams) { renderWithMorph(container, createNoDataMessage('ยังไม่มีข้อมูลตารางคะแนน', '📊')); return; } 
            const stats = calculateLeaderboard(date); 
            const sortedTeams = Object.values(stats).sort((a, b) => { if (b.pts !== a.pts) return b.pts - a.pts; if (b.gd !== a.gd) return b.gd - a.gd; if (b.gf !== a.gf) return b.gf - a.gf; return a.name.localeCompare(b.name); }); 
            const medals = ['🥇', '🥈', '🥉']; 
            const html = `<table class="leaderboard-table"><thead><tr><th>#</th><th class="team-name">ทีม</th><th>แข่ง</th><th>ชนะ</th><th>เสมอ</th><th>แพ้</th><th>ได้</th><th>เสีย</th><th>+/-</th><th>คะแนน</th></tr></thead><tbody>${sortedTeams.map((team, index) => `<tr><td>${medals[index] || index + 1}</td><td class="team-name"><div class="team-emblem ${team.slug}">${team.name}</div></td><td>${team.p}</td><td>${team.w}</td><td>${team.d}</td><td>${team.l}</td><td>${team.gf}</td><td>${team.ga}</td><td>${team.gd}</td><td><strong>${team.pts}</strong></td></tr>`).join('')}</tbody></table>`;
            renderWithMorph(container, html); 
        }

        async function updateScore(index, team, value) {
            if (!canManage() || pendingPasswordRecovery) return;
            const date = currentDateKey, dayData = appData[date];
            if (!dayData?.schedule) return;
            const idx = parseInt(index, 10);
            if (Number.isNaN(idx) || !dayData.schedule[idx]) return;
            if (getForeignScoreEditors(idx).length > 0) {
                showToast('⏳ มีคนกำลังบันทึกแมตช์นี้อยู่');
                applyScoreEditLocksUI();
                return;
            }
            let safeValue = value;
            if (safeValue !== null) {
                safeValue = Number.parseInt(safeValue, 10);
                if (Number.isNaN(safeValue) || safeValue < 0) safeValue = 0;
            }
            const newSchedule = dayData.schedule.map((m, i) => i === idx ? { ...m } : m);
            const match = newSchedule[idx];
            if (team === 'home') match.homeScore = safeValue; else match.awayScore = safeValue;
            appData[date].schedule = newSchedule;
            try {
                const { error } = await db.from('match_days').update({ schedule: newSchedule }).eq('match_date', currentDateKey);
                if (error) throw error;
                bumpScoreEditIdleTimer();
                renderScoresPage(date);
                renderLeaderboardPage(date);
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการบันทึกคะแนน: ' + error.message);
            }
        }
        async function updateScoreFromButton(button) {
            const { index, team, op } = button.dataset;
            if (!(await claimScoreEdit(index))) return;
            const input = document.querySelector(`.score-input[data-index="${index}"][data-team="${team}"]`);
            const currentValue = Number.parseInt(input?.value || '0', 10) || 0;
            const newValue = (op === '1') ? currentValue + 1 : Math.max(0, currentValue - 1);
            await updateScore(index, team, newValue);
        }
        async function updateScoreFromInput(input) {
            const { index, team } = input.dataset;
            if (!(await claimScoreEdit(index))) return;
            if (input.value === '') { await updateScore(index, team, null); return; }
            const parsed = Number.parseInt(input.value, 10);
            await updateScore(index, team, Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
        }
        async function resetScore(button) {
            const { index } = button.dataset;
            if (!canManage() || pendingPasswordRecovery) return;
            if (!(await claimScoreEdit(index))) return;
            const date = currentDateKey, dayData = appData[date];
            if (!dayData?.schedule) return;
            const idx = parseInt(index, 10);
            if (Number.isNaN(idx) || !dayData.schedule[idx]) return;
            if (getForeignScoreEditors(idx).length > 0) {
                showToast('⏳ มีคนกำลังบันทึกแมตช์นี้อยู่');
                return;
            }
            const newSchedule = dayData.schedule.map((m, i) => i === idx ? { ...m, homeScore: null, awayScore: null } : m);
            appData[date].schedule = newSchedule;
            try {
                const { error } = await db.from('match_days').update({ schedule: newSchedule }).eq('match_date', currentDateKey);
                if (error) throw error;
                bumpScoreEditIdleTimer();
                renderScoresPage(date);
                renderLeaderboardPage(date);
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการรีเซ็ตคะแนน: ' + error.message);
            }
        }

        function calculateLeaderboard(date) { const dayData = appData[date]; if (!dayData || !dayData.schedule) return {}; const stats = {}; dayData.settings.activeTeams.forEach(slug => { const teamInfo = TEAMS.find(t => t.slug === slug); if(teamInfo) { stats[slug] = { name: teamInfo.name, slug: teamInfo.slug, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; }}); dayData.schedule.forEach(match => { const { home, away, homeScore, awayScore } = match; if (homeScore === null || awayScore === null || !stats[home] || !stats[away]) return; stats[home].p++; stats[away].p++; stats[home].gf += homeScore; stats[home].ga += awayScore; stats[away].gf += awayScore; stats[away].ga += homeScore; if (homeScore > awayScore) { stats[home].w++; stats[away].l++; stats[home].pts += 3; } else if (awayScore > homeScore) { stats[away].w++; stats[home].l++; stats[away].pts += 3; } else { stats[home].d++; stats[away].d++; stats[home].pts += 1; stats[away].pts += 1; } }); Object.values(stats).forEach(team => { team.gd = team.gf - team.ga; }); return stats; }

// --- SECTION: TEMPLATES ---
        async function fetchTemplates() {
            const { data, error } = await db.from('match_templates').select('*').order('created_at', { ascending: true });
            if (!error) dbTemplates = data;
        }

        async function openTemplateManager() {
            const activeTeams = Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug);
            if (activeTeams.length < 2) return alert('โปรดเลือกทีมก่อนอย่างน้อย 2 ทีม');
            
            document.getElementById('current-team-count-label').textContent = activeTeams.length;
            document.getElementById('template-manager-modal').style.display = 'block';
            document.getElementById('match-input-list').innerHTML = '';
            addMatchInputRow(); 
            renderTemplateList(activeTeams.length);
        }

        function addMatchInputRow(h = "", a = "") {
            const container = document.getElementById('match-input-list');
            const div = document.createElement('div');
            div.className = "match-input-row";
            div.style = "display:flex; gap:10px; margin-bottom:8px; align-items:center;";
            div.innerHTML = `
                <input type="number" class="h-n" placeholder="ทีมที่" style="width:70px" value="${h}"> 
                <span style="color:var(--text-muted)">VS</span> 
                <input type="number" class="a-n" placeholder="ทีมที่" style="width:70px" value="${a}">
                <button class="remove-row-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; padding:0 5px;">✕</button>
            `;
            // กด x เพื่อลบแถวนี้
            div.querySelector('.remove-row-btn').onclick = () => div.remove();
            container.appendChild(div);
        }

        async function saveTemplate() {
            const name = document.getElementById('new-template-name').value;
            const teamCount = parseInt(document.getElementById('current-team-count-label').textContent);
            const rows = document.querySelectorAll('.match-input-row');
            const data = [];
            rows.forEach(r => {
                const h = parseInt(r.querySelector('.h-n').value), a = parseInt(r.querySelector('.a-n').value);
                if(h && a) data.push({home: h, away: a});
            });
            if(!name || data.length === 0) return alert('กรุณากรอกข้อมูลให้ครบ');

            const { error } = await db.from('match_templates').insert([{ name, team_count: teamCount, data }]);
            if(!error) { 
                alert('บันทึกสำเร็จ!'); 
                await fetchTemplates(); 
                openTemplateManager(); 
                updateTemplateSelector();
            }
        }

        function renderTemplateList(teamCount) {
            const listArea = document.getElementById('template-list-area');
            const filtered = dbTemplates.filter(t => t.team_count === teamCount);
            
            if (filtered.length === 0) {
                listArea.innerHTML = '<p style="color: var(--text-muted); text-align:center;">ยังไม่มี Template สำหรับ ' + teamCount + ' ทีม</p>';
                return;
            }

            listArea.innerHTML = filtered.map(t => {
                const safeId = escapeHtml(t.id);
                const safeName = escapeHtml(t.name);
                const pairs = (t.data || []).map((m, idx) =>
                    `<div>คู่ที่ ${idx + 1}: <b>${escapeHtml(m.home)}-${escapeHtml(m.away)}</b></div>`
                ).join('');
                return `
                <div style="background:#dce8d6; border-radius:10px; margin-bottom:8px; border: 1px solid rgba(27,94,32,0.16); overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px;">
                        <span style="font-weight:600;">${safeName} <small style="color:var(--text-muted)">(${(t.data || []).length} คู่)</small></span>
                        <div style="display:flex; gap:8px;">
                            <button class="action-btn view-detail-btn" data-id="${safeId}" title="ดูรายละเอียด" style="background:none; border:none; cursor:pointer;">👁️</button>
                            <button class="action-btn copy-template-btn" data-id="${safeId}" title="คัดลอกมาแก้ไข" style="background:none; border:none; cursor:pointer;">📋</button>
                            <button class="action-btn delete-template-btn" data-id="${safeId}" style="color:var(--team-red)">${SVG_TRASH}</button>
                        </div>
                    </div>
                    <div id="detail-${safeId}" style="display:none; padding:12px; background:#1a1a1a; border-top:1px solid #333; font-size:13px; color:#bbb;">
                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:8px;">
                            ${pairs}
                        </div>
                    </div>
                </div>`;
            }).join('');

            // ผูกเหตุการณ์ปุ่มต่างๆ
            listArea.querySelectorAll('.view-detail-btn').forEach(btn => {
                btn.onclick = () => {
                    const detailDiv = document.getElementById(`detail-${btn.dataset.id}`);
                    detailDiv.style.display = detailDiv.style.display === 'none' ? 'block' : 'none';
                };
            });

            listArea.querySelectorAll('.copy-template-btn').forEach(btn => {
                btn.onclick = () => {
                    const t = dbTemplates.find(x => x.id === btn.dataset.id);
                    if (t) copyToEditForm(t);
                };
            });

            listArea.querySelectorAll('.delete-template-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Template นี้?')) {
                        const { error } = await db.from('match_templates').delete().eq('id', btn.dataset.id);
                        if (!error) {
                            showToast('ลบสำเร็จ');
                            await fetchTemplates();
                            renderTemplateList(teamCount);
                            updateTemplateSelector();
                        }
                    }
                };
            });
        }
function copyToEditForm(template) {
            // 1. ใส่ชื่อเดิมต่อท้ายด้วย (Copy)
            document.getElementById('new-template-name').value = template.name + " (Copy)";
            
            // 2. ล้างรายการคู่แข่งเดิมในฟอร์มออก
            const container = document.getElementById('match-input-list');
            container.innerHTML = '';
            
            // 3. วนลูปเอาคู่แข่งจาก Template มาเพิ่มเป็นแถว
            template.data.forEach(match => {
                addMatchInputRow(match.home, match.away);
            });
            
            showToast('คัดลอกข้อมูลลงฟอร์มแล้ว');
            
            // เลื่อนลงไปที่ฟอร์มด้านล่างให้เห็นชัดๆ
            document.getElementById('new-template-name').scrollIntoView({ behavior: 'smooth' });
        }

function refreshOpenerDropdowns(forceT1 = null, forceT2 = null) {
    const activeTeams = Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug);
    const s1 = document.getElementById('lock-team-1');
    const s2 = document.getElementById('lock-team-2');
    const previewCard = document.getElementById('schedule-preview-card');
    if (!s1 || !s2) return;

    if (activeTeams.length < 2) {
        if (previewCard) previewCard.style.display = 'none';
        s1.innerHTML = '';
        s2.innerHTML = '';
        return;
    }

    const oldVal1 = s1.value;
    const oldVal2 = s2.value;
    const optionsHtml = activeTeams.map(slug => {
        const team = TEAMS.find(t => t.slug === slug);
        return `<option value="${slug}">${team ? team.name : slug}</option>`;
    }).join('');
    s1.innerHTML = optionsHtml;
    s2.innerHTML = optionsHtml;

    if (forceT1 && activeTeams.includes(forceT1)) s1.value = forceT1;
    else if (activeTeams.includes(oldVal1)) s1.value = oldVal1;
    else s1.value = activeTeams[0];

    if (forceT2 && activeTeams.includes(forceT2) && forceT2 !== s1.value) s2.value = forceT2;
    else if (activeTeams.includes(oldVal2) && oldVal2 !== s1.value) s2.value = oldVal2;
    else s2.value = activeTeams.find(slug => slug !== s1.value) || activeTeams[1];

    renderSchedulePreview(false);
}

function getFinalShuffledOrder() {
    const allSelected = Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug);
    const s1 = document.getElementById('lock-team-1');
    const s2 = document.getElementById('lock-team-2');
    const t1 = s1?.value || allSelected[0];
    const t2 = s2?.value || allSelected[1];
    const finalOrder = buildTeamOrderFromOpener(allSelected, t1, t2);
    if (!finalOrder) {
        alert('กรุณาเลือกทีมเปิดสนามให้ครบ 2 ทีม (ไม่ซ้ำกัน)');
        return null;
    }
    return finalOrder;
}

document.getElementById('forgot-password-link').onclick = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        alert('กรุณากรอกอีเมลในช่องด้านบนก่อนกดลืมรหัสผ่าน');
        return;
    }

    const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://puimanagerfootball.github.io/TK7/',
    });

    if (error) {
        alert(formatAuthError(error, 'ส่งลิงก์รีเซ็ตรหัสไม่สำเร็จ'));
    } else {
        alert('ถ้ามีบัญชีนี้ ระบบจะส่งลิงก์ไปที่อีเมล\n\nขั้นตอนถัดไป:\n1) เปิดอีเมล แล้วคลิกลิงก์\n2) เว็บจะเปิดพร้อมฟอร์ม "ตั้งรหัสผ่านใหม่"\n3) กรอกรหัสใหม่ → กดบันทึก → ล็อกอินใหม่\n\n(เช็ค Junk Mail ด้วย / โควต้าเมล ~2 ฉบับต่อชม.)');
        loginModal.style.display = 'none';
    }
};

// --- บันทึกรหัสผ่านใหม่หลังคลิกลิงก์จากอีเมล ---
document.getElementById('reset-password-form').onsubmit = async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('new-password-confirm').value;
    if (!newPassword || newPassword.length < 6) {
        alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
    }

    const { error } = await db.auth.updateUser({ password: newPassword });

    if (error) {
        alert('เปลี่ยนรหัสไม่สำเร็จ: ' + error.message + '\n\nให้กดลืมรหัสผ่านใหม่ แล้วคลิกลิงก์จากอีเมลอีกครั้ง (ลิงก์ใช้ได้ครั้งเดียว)');
    } else {
        alert('เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว!\nกรุณาเข้าสู่ระบบด้วยรหัสใหม่');
        pendingPasswordRecovery = false;
        document.getElementById('reset-password-modal').style.display = 'none';
        document.getElementById('reset-password-form').reset();
        await db.auth.signOut();
        if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/\?.*$/, ''));
            // เก็บ path ของ GitHub Pages ให้ถูกต้อง
            const base = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname.replace(/\/[^/]*$/, '/');
            window.history.replaceState(null, '', base || '/');
        }
        location.href = 'https://puimanagerfootball.github.io/TK7/';
    }
};

// --- SECTION: BOOT ---
        initializeApp();
    });
