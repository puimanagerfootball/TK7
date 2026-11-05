/* ==========================================================================
   TK7 app logic (Ver 5.1.3)
   แยกจาก index.html เพื่อแก้/ค้นหาง่ายขึ้น
   Sections (ค้นหาด้วย // --- SECTION:):
     CONFIG, AUTH, REGISTRATION, SCHEDULE, LINEUP, SETUP,
     SHARE/EXPORT, DATA/REALTIME, SCORES, TEMPLATES, BOOT
   ========================================================================== */
    document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        globalThis.TK7BrowserSafety.retireOwnWorker(navigator.serviceWorker, document.baseURI).then(function(removed) {
            if(removed) {
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
                // URLSearchParams already decodes percent escapes and plus signs.
                description: description || ''
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
        let appData = {}, activePage = 'page-schedule', currentDateKey = todayDateKey(), isInitialSetupDone = false;
        let lastScrollPosition = 0, shouldRestoreScroll = false;
        const contentContainer = document.getElementById('content');
        const pages = document.querySelectorAll('.page'), navButtons = document.querySelectorAll('.nav-btn'), loginBtn = document.getElementById('login-btn'), logoutBtn = document.getElementById('logout-btn'), userInfo = document.getElementById('user-info'), loginModal = document.getElementById('login-modal'), membersModal = document.getElementById('members-modal');
        let dbTemplates = [];

        function canManage() {
            if (pendingPasswordRecovery) return false;
            return !!(currentUser && userProfile && userProfile.id === currentUser.id && userProfile.status === 'approved' && (userProfile.role === 'admin' || userProfile.role === 'superadmin'));
        }
        function isSuperAdmin() {
            return !!(canManage() && userProfile.role === 'superadmin');
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
        const TEAM_SHIRT_INFO = {
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
            window.TK7LegacyRegistrationLoader.bind({getCurrentDate:()=>currentDateKey,teamInfo:TEAM_SHIRT_INFO,teams:TEAMS,showToast});
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
            document.querySelector('#members-modal .close-modal-btn').addEventListener('click', () => membersModal.style.display = 'none');
            window.addEventListener('click', (event) => {
                if (event.target == loginModal || event.target == membersModal) {
                    event.target.style.display = "none";
                }
            });
            contentContainer.addEventListener('click', handleMainClick);
            
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

            // Return before querying the database: Auth holds a session lock here.
            let authRefreshSequence = 0;
            db.auth.onAuthStateChange((event, session) => {
                const sequence = ++authRefreshSequence;
                if (event === 'PASSWORD_RECOVERY') {
                    currentUser = session ? session.user : null;
                    openResetPasswordModal();
                    return;
                }
                const prevId = currentUser?.id || null;
                currentUser = session ? session.user : null;
                const nextId = currentUser?.id || null;
                if (prevId !== nextId) { userProfile = null; refreshAuthUI(); }
                setTimeout(async () => {
                    if (sequence !== authRefreshSequence) return;
                    try {
                        if (prevId !== nextId) {
                            if (currentUser && !pendingPasswordRecovery) loginModal.style.display = 'none';
                            await refreshUserAccess();
                            if (sequence === authRefreshSequence) await loadInitialData();
                        } else if (currentUser) {
                            await refreshUserAccess();
                        }
                    } catch { showToast('ตรวจสถานะเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'); }
                }, 0);
            });
            listenToRealtimeChanges();
            document.getElementById('retry-score-save-btn').onclick = () => flushScoreSave();
            window.addEventListener('beforeunload', event => {
                if (scoreWriter.hasPending()) { event.preventDefault(); event.returnValue = ''; }
            });
            window.addEventListener('pagehide', () => { flushScoreSave(); });
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') flushScoreSave();
            });
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

        let profileLoadSequence = 0;
        async function loadUserProfile() {
            const sequence = ++profileLoadSequence;
            const user = currentUser;
            userProfile = null;
            if (!user) return;
            const { data, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (sequence !== profileLoadSequence || currentUser?.id !== user.id) return;
            if (error) {
                console.error('profiles error:', error);
                if (error.code === '42P01' || (error.message || '').includes('profiles')) {
                    showToast('⚠️ ยังไม่ได้รัน SQL ระบบสมาชิกใน Supabase');
                }
                return;
            }
            if (!data) {
                const { data: created, error: insertErr } = await db.from('profiles').insert({
                    id: user.id,
                    email: user.email,
                    display_name: sanitizeDisplayName(user.user_metadata?.display_name || (user.email || '').split('@')[0]),
                    role: 'admin',
                    status: 'pending'
                }).select('*').maybeSingle();
                if (sequence !== profileLoadSequence || currentUser?.id !== user.id) return;
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
            if (matchDateInput && matchDateInput.value !== date) return;
            updateGenerateButtonForDate(date);
            if (!canManage()) return;
            const dayData = appData[date];
            if (dayData?.settings) loadSettingsFromData(dayData.settings, date);
            else resetSettingsForm();
            document.dispatchEvent(new CustomEvent('tk7:setup-date-ready', { detail: { date } }));
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
                return 'ส่งอีเมลเกินโควต้าหรือถี่เกินไป กรุณารอสักครู่แล้วลองใหม่\n\n'
                    + 'หากยังไม่สำเร็จ ให้ผู้ดูแลตรวจ Auth rate limits และ SMTP โดยคงการยืนยันอีเมลไว้\n\n'
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
            if (password.length < 15) return alert('กรุณาใช้รหัสผ่านอย่างน้อย 15 ตัวอักษร หรือวลีผ่านที่จำได้');
            if (!displayName) { alert('กรุณากรอกชื่อที่แสดง'); return; }
            const { data, error } = await db.auth.signUp({
                email,
                password,
                options: { data: { display_name: displayName } }
            });
            if (error) { alert(formatAuthError(error, 'สมัครไม่สำเร็จ')); return; }
            if (data.user && !data.session) {
                alert('สมัครสำเร็จ! กรุณายืนยันอีเมลก่อน แล้วค่อยเข้าสู่ระบบ (รอ Superadmin อนุมัติหลังล็อกอิน)\n\nหากไม่ได้รับอีเมล ให้ตรวจโฟลเดอร์สแปมหรือติดต่อผู้ดูแล');
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
            if (!await flushScoreSave()) {
                if (!confirm('คะแนนยังไม่บันทึก ต้องการออกจากระบบและยกเลิกคะแนนที่แก้ในเครื่องหรือไม่?')) return;
                scoreWriter.discard();
                showScoreSaveStatus('');
            }
            const { error } = await db.auth.signOut();
            if (error) { alert('ออกจากระบบไม่สำเร็จ: ' + error.message); return; }
            userProfile = null;
            hasSuperadmin = false;
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
            const date = currentDateKey;
            if (!await flushScoreSave(date)) return false;
            const day = appData[date];
            let result;
            try {
                result = await window.TK7ScoreWriter.persist(db, {date,schedule:newSchedule,version:day?.updated_at,baseline:day?.schedule});
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการอัปเดตตาราง: ' + error.message);
                return false;
            }
            if (appData[date]) { appData[date].schedule = newSchedule; appData[date].updated_at = result.updated_at; }
            if (currentDateKey === date) renderVisiblePage(date);
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

        function openerPairKey(pair) {
            return pair?.home && pair?.away && pair.home !== pair.away ? [pair.home, pair.away].sort().join('|') : '';
        }
        function pickRandomOpenerPair(teamPool, currentPair = null, previousPairs = [], random = Math.random) {
            const pool = [...new Set((teamPool || []).filter(t => typeof t === 'string' && t))];
            const pairs = [];
            for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) pairs.push({ home: pool[i], away: pool[j] });
            if (!pairs.length) return null;
            const currentKey = openerPairKey(currentPair);
            // Prefer neither team from the latest saved opener; relax only when necessary.
            const previous = previousPairs.find(pair => openerPairKey(pair)) || currentPair;
            const previousTeams = new Set(previous ? [previous.home, previous.away] : []);
            const overlap = pair => Number(previousTeams.has(pair.home)) + Number(previousTeams.has(pair.away));
            const minimumOverlap = Math.min(...pairs.map(overlap));
            let choices = pairs.filter(pair => overlap(pair) === minimumOverlap);
            const different = choices.filter(pair => openerPairKey(pair) !== currentKey);
            if (different.length) choices = different;
            const history = previousPairs.map(openerPairKey).filter(Boolean);
            const unseen = choices.filter(pair => !history.includes(openerPairKey(pair)));
            if (unseen.length) choices = unseen;
            else {
                // If every available pair has been used, choose the least recently used.
                const oldest = Math.max(...choices.map(pair => history.indexOf(openerPairKey(pair))));
                choices = choices.filter(pair => history.indexOf(openerPairKey(pair)) === oldest);
            }
            const pair = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
            return random() < 0.5 ? { ...pair } : { home: pair.away, away: pair.home };
        }
        async function readPreviousOpenerPairs(date) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('กรุณาเลือกวันที่ก่อนสุ่ม');
            const { data, error } = await db.from('match_days').select('match_date,schedule').lt('match_date', date).order('match_date', { ascending: false }).limit(12);
            if (error) throw new Error('อ่านคู่เปิดสนามครั้งก่อนยังไม่สำเร็จ กรุณาลองสุ่มอีกครั้ง');
            const saved = appData[date]?.schedule?.[0];
            return [saved, ...(data || []).map(day => day.schedule?.[0])].filter(pair => openerPairKey(pair));
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
            const idx = candidates.indexOf(current);
            const next = candidates[(idx + 1) % candidates.length];
            return {
                home: side === 'home' ? next : currentPair.home,
                away: side === 'away' ? next : currentPair.away
            };
        }

        function buildOpenerSlotHtml(homeSlug, awaySlug, { showLever = true, clickable = true } = {}) {
            const homeTeam = TEAMS.find(t => t.slug === homeSlug) || { name: 'รอสุ่ม', slug: 'opener-pending' };
            const awayTeam = TEAMS.find(t => t.slug === awaySlug) || { name: 'รอสุ่ม', slug: 'opener-pending' };
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

        function wireOpenerSlotControls(root, { teamPool, getPair, onPairChange, getDate = () => document.getElementById('match-date')?.value || currentDateKey, enableLever = true, clickable = true } = {}) {
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
                root.tk7SpinOpener = () => {
                    const pool = typeof teamPool === 'function' ? teamPool() : teamPool;
                    const current = (typeof getPair === 'function' ? getPair() : null) || getOpenerPairFromRoot(root);
                    return spinOpenerSlotMachine({
                        root,
                        teamPool: pool,
                        currentPair: current,
                        matchDate: getDate(),
                        isCurrent: (date) => getDate() === date && root.isConnected !== false,
                        clickable,
                        onDone: (result) => applyPair(result)
                    });
                };
                lever.onclick = root.tk7SpinOpener;
            }
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function spinOpenerSlotMachine({ root, teamPool, currentPair, onDone, matchDate, isCurrent = () => true, clickable = true }) {
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
            try {
            const history = await readPreviousOpenerPairs(matchDate);
            await sleep(220);
            machine.classList.add('spinning');

            const result = pickRandomOpenerPair(teamPool, currentPair, history);
            if (!isCurrent(matchDate)) return;
            const homeStopAt = 14 + Math.floor(Math.random() * 4);
            const awayStopAt = homeStopAt + 4 + Math.floor(Math.random() * 4);
            let homeSlug = currentPair?.home || teamPool[0];
            let awaySlug = currentPair?.away || teamPool[1];

            for (let step = 0; step <= awayStopAt; step++) {
                if (!isCurrent(matchDate)) return;
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
            if (isCurrent(matchDate) && typeof onDone === 'function') onDone(result);
            } catch (error) {
                if (isCurrent(matchDate)) showToast(error.message || 'สุ่มคู่เปิดสนามไม่สำเร็จ');
            } finally {
                machine.classList.remove('spinning');
                if (lever) { lever.classList.remove('pulled'); lever.disabled = false; }
                openerSpinning = false;
                if (!isCurrent(matchDate)) { renderSchedulePreview(true); renderScheduleOpenerCard(currentDateKey); }
            }
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
                    getDate: () => currentDateKey,
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
                
                const matchLabel = `แมตช์ที่ ${index + 1}`;

                return `<div class="card match-card" data-index="${index}"><div class="match-header"><span>${matchLabel}</span><span>⏱️ ${timeStr}</span>${adminActions}</div><div class="match-body"><div class="team-emblem ${homeTeam.slug}">${homeTeam.name}</div><span class="vs">VS</span><div class="team-emblem ${awayTeam.slug}">${awayTeam.name}</div></div></div>`;
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
            const scoreBtn = target.closest('.score-btn'); if (scoreBtn) { updateScoreFromButton(scoreBtn); return; } 
            const scoreInput = target.closest('.score-input'); if (scoreInput) { scoreInput.onchange = () => updateScoreFromInput(scoreInput); return; } 
            const resetBtn = target.closest('.reset-score-btn'); if (resetBtn) { resetScore(resetBtn); return; } 
        }
        
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
            if (activePage === 'page-scores' && pageId !== 'page-scores') flushScoreSave();
            activePage = pageId; shouldRestoreScroll = false; 
            pages.forEach(page => page.classList.remove('active')); 
            document.getElementById(pageId).classList.add('active'); 
            navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageId)); 
            contentContainer.scrollTop = 0;
            renderVisiblePage(currentDateKey);
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
            const info = TEAM_SHIRT_INFO[lineupTeamSlug] || { emoji: '⚽', label: lineupTeamSlug };
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
                document.querySelectorAll('.team-switch').forEach(el => el.addEventListener('change', () => {
                    refreshOpenerDropdowns();
                    updateAdvancedOptions();
                }));
                document.getElementById('template-selector').addEventListener('change', () => renderSchedulePreview(false));
                document.querySelectorAll('#page-setup .num-stepper-btn').forEach(btn => btn.addEventListener('click', handleNumberStepper));
                isInitialSetupDone = true;
            }
        }

        function renderSchedulePreview(isInitialLoad) {
            const previewCard = document.getElementById('schedule-preview-card');
            const previewContent = document.getElementById('schedule-preview-content');
            if (!previewCard || !previewContent) return;
            if (openerSpinning && previewContent.querySelector('.opener-slot-machine')) return;
            const date = document.getElementById('match-date')?.value || currentDateKey;
            const dayData = appData[date];
            const s1 = document.getElementById('lock-team-1'), s2 = document.getElementById('lock-team-2');
            const teams = [...document.querySelectorAll('.team-switch:checked')].map(sw => sw.dataset.teamSlug);
            if (teams.length < 2) { previewCard.style.display = 'none'; return; }
            if (isInitialLoad && dayData?.schedule?.length) {
                const saved = dayData.schedule[0];
                if (s1 && teams.includes(saved.home)) s1.value = saved.home;
                if (s2 && teams.includes(saved.away)) s2.value = saved.away;
            }
            const home = teams.includes(s1?.value) ? s1.value : null;
            const away = teams.includes(s2?.value) && s2.value !== home ? s2.value : null;
            previewContent.innerHTML = buildOpenerSlotHtml(home, away, { showLever: true, clickable: true });
            wireOpenerSlotControls(previewContent, {
                teamPool: () => [...document.querySelectorAll('.team-switch:checked')].map(sw => sw.dataset.teamSlug),
                getDate: () => document.getElementById('match-date')?.value || currentDateKey,
                getPair: () => ({ home: s1?.value, away: s2?.value }),
                onPairChange: pair => {
                    if (s1) s1.value = teams.includes(pair.home) ? pair.home : '';
                    if (s2) s2.value = teams.includes(pair.away) ? pair.away : '';
                }
            });
            previewCard.style.display = 'block';
        }

        function updateAdvancedOptions() { updateTemplateSelector(); }
        function handleNumberStepper(event) { const op = parseInt(event.currentTarget.dataset.op); const targetId = event.currentTarget.dataset.target; const input = document.getElementById(targetId); if (input) { const step = parseFloat(input.step) || 1; const min = parseFloat(input.min); let currentValue = parseFloat(input.value) || 0; let newValue = currentValue + (op * step); if (!isNaN(min) && newValue < min) newValue = min; input.value = parseFloat(newValue.toPrecision(12)); } }
        
        function renderVisiblePage(date) {
            if (activePage === 'page-schedule') renderSchedulePage(date);
            else if (activePage === 'page-scores') renderScoresPage(date);
            else if (activePage === 'page-leaderboard') renderLeaderboardPage(date);
            else if (activePage === 'page-lineup') renderLineupPage();
        }

        function renderAllPagesForDate(date, {syncSetup = false} = {}) {
            setupPageSetup();
            const setupDate = document.getElementById('match-date')?.value || date;
            // ฟอร์มจัดการทีมตามวันที่ในฟอร์มเท่านั้น — ไม่ดึงค่าจากวันตารางที่กำลังดู
            if (syncSetup && setupDate === date) {
                const dayData = appData[date];
                if (dayData && dayData.settings) {
                    loadSettingsFromData(dayData.settings, date);
                } else if (canManage()) {
                    resetSettingsForm();
                }
                updateGenerateButtonForDate(date);
            }
            renderVisiblePage(date);
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
        
        let creatingSchedule = false;
        async function generateAndSaveSchedule() {
            if (!canManage()) return alert('ต้องเป็นผู้ดูแลที่อนุมัติแล้วเท่านั้น');
            if (creatingSchedule || openerSpinning) return;
            const input = document.getElementById('match-date');
            const date = input.value;
            if (!date) return alert('กรุณาเลือกวันที่แข่งขัน');
            const duration = Number(document.getElementById('time-per-match').value);
            const startTime = document.getElementById('start-time').value;
            if (!Number.isInteger(duration) || duration < 1 || duration > 60) return alert('เวลาแข่งขันต้องเป็นจำนวนเต็ม 1–60 นาที');
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return alert('กรุณากำหนดเวลาเริ่มแข่งขันให้ถูกต้อง');
            const button = document.getElementById('generate-schedule-btn');
            const formSnapshot = () => JSON.stringify([input.value, [...document.querySelectorAll('.team-switch:checked')].map(sw => sw.dataset.teamSlug), document.getElementById('template-selector').value, document.getElementById('start-time').value, document.getElementById('time-per-match').value]);
            const snapshot = formSnapshot();
            creatingSchedule = true;
            if (button) { button.disabled = true; button.textContent = 'กำลังเตรียมตาราง…'; }
            try {
                // Confirm against the latest saved data before spinning or replacing anything.
                const { data: targetDay, error: readError } = await db.from('match_days').select('*').eq('match_date', date).maybeSingle();
                if (readError) throw new Error('ตรวจตารางเดิมไม่สำเร็จ กรุณาลองใหม่');
                if (formSnapshot() !== snapshot) return;
                if (targetDay?.schedule?.length) {
                    const hasScores = targetDay.schedule.some(m => m.homeScore != null || m.awayScore != null);
                    const message = hasScores
                        ? 'คำเตือน: การสร้างตารางใหม่จะลบผลการแข่งขันของวันที่ '+date+' ทั้งหมด!'
                        : 'คุณแน่ใจหรือไม่ว่าต้องการสร้างตารางใหม่ทับของวันที่ '+date+'?';
                    if (!confirm(message)) return;
                }
                const s1 = document.getElementById('lock-team-1'), s2 = document.getElementById('lock-team-2');
                if (!s1.value || !s2.value || s1.value === s2.value) {
                    renderSchedulePreview(false);
                    const root = document.getElementById('schedule-preview-content');
                    if (!root?.tk7SpinOpener) return alert('ต้องเลือกอย่างน้อย 2 ทีมก่อนสร้างตาราง');
                    if (button) button.textContent = 'กำลังดึงคันชักสุ่มคู่เปิดสนาม…';
                    await root.tk7SpinOpener();
                    if (formSnapshot() !== snapshot) return;
                    if (!s1.value || !s2.value || s1.value === s2.value) return;
                }
                const finalOrder = getFinalShuffledOrder();
                if (!finalOrder) return;
                const templateId = document.getElementById('template-selector').value;
                const settings = { timePerMatch: duration, startTime, activeTeams: finalOrder, templateId };
                const finalSchedule = buildScheduleFromTeamOrder(finalOrder, templateId);
                if (button) button.textContent = 'กำลังบันทึกตาราง…';
                const { error } = await db.from('match_days').upsert({ match_date: date, settings, schedule: finalSchedule }, { onConflict: 'match_date' });
                if (error) throw error;
                scheduleOpenerDraft = null;
                appData[date] = { match_date: date, settings, schedule: finalSchedule };
                showToast(targetDay?.schedule?.length ? '✅ อัปเดตตารางเรียบร้อย!' : '✅ บันทึกตารางเรียบร้อย!');
                if (input.value === date) { await loadInitialData({ preferDate: date }); setActivePage('page-schedule'); }
            } catch (error) {
                alert('เกิดข้อผิดพลาด: '+error.message);
            } finally {
                creatingSchedule = false;
                if (button) button.disabled = false;
                updateGenerateButtonForDate(input.value);
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
                script.src = 'line-registration/vendor/html2canvas-1.4.1.min.js';
                script.integrity = 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H';
                script.crossOrigin = 'anonymous';
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
            let imgBitmap, canvas;
            try {
                imgBitmap = await createImageBitmap(blob);
                canvas = document.createElement('canvas');
                canvas.width = imgBitmap.width;
                canvas.height = imgBitmap.height;
                canvas.getContext('2d').drawImage(imgBitmap, 0, 0);
                return await canvasToBlob(canvas, 'image/png');
            } catch (err) {
                console.warn('ensurePngBlob failed', err);
                return blob;
            } finally {
                imgBitmap?.close?.();
                if (canvas) { canvas.width = 0; canvas.height = 0; }
            }
        }

        async function shareImageBlob(blob, filename = 'TK7.png', title = 'TK7') {
            // มือถือแชร์ไฟล์ · คอมคัดลอก PNG · ดาวน์โหลดเมื่อเบราว์เซอร์ไม่รองรับ
            purgeCaptureStages();
            const pngBlob = await ensurePngBlob(blob);
            if (!pngBlob) throw Error('ไม่มีรูปให้แชร์');
            if (isMobileShareDevice() && navigator.canShare) {
                try {
                    const file = new File([pngBlob], filename, {type:'image/png'});
                    if (navigator.canShare({files:[file]})) {
                        await navigator.share({files:[file],title});
                        showToast('แชร์แล้ว');
                        return 'shared';
                    }
                } catch (error) {
                    if (error?.name === 'AbortError') { showToast('ยกเลิกการแชร์'); return 'aborted'; }
                }
            }
            if (navigator.clipboard?.write && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([new ClipboardItem({'image/png':pngBlob})]);
                    showToast('📋 คัดลอกรูปแล้ว — เปิด LINE แล้ววางได้เลย');
                    return 'copied';
                } catch { /* Fall back to a download without retaining the image in app state. */ }
            }
            const url = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.download = filename; link.href = url;
            document.body.appendChild(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
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
            contentClone.querySelectorAll('.match-card').forEach(card => card.classList.remove('dragging'));
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
                    if (scoreWriter.hasPending(changedDate) || scoreWriter.isSaving(changedDate)) {
                        deferredScoreRefresh.add(changedDate);
                        return;
                    }
                    if (changedDate === currentDateKey) {
                        // กำลังแก้คะแนนอยู่ / เพิ่งบันทึกเอง → อย่ารีโหลดทับ UI
                        if (Object.prototype.hasOwnProperty.call(appData, changedDate)) {
                            delete appData[changedDate];
                        }
                        saveScrollPosition();
                        shouldRestoreScroll = true;
                        await loadDataForDate(currentDateKey, { syncSetupDate: false });
                        return;
                    }
                    if (Object.prototype.hasOwnProperty.call(appData, changedDate)) {
                        delete appData[changedDate];
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
        
        let matchDayLoadSeq=0;
        async function loadDataForDate(date, options = {}) {
            const requestSeq=++matchDayLoadSeq;
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
            if (requestSeq!==matchDayLoadSeq||currentDateKey!==date) return;
            if (typeof scoreWriter !== 'undefined' && scoreWriter.hasPending(date)) {
                deferredScoreRefresh.add(date);
                renderAllPagesForDate(date);
                return;
            }
            if (error) { console.error("Error fetching data for date:", error); alert("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + error.message); return; }
            const data = results && results.length > 0 ? results[0] : null;

            appData[date] = data;
            renderAllPagesForDate(date, {syncSetup:syncSetupDate});
            const setupDate = document.getElementById('match-date')?.value;
            if (setupDate) updateGenerateButtonForDate(setupDate);
            else updateGenerateButtonForDate(date);
            restoreScrollPosition();
        }
        
        function loadSettingsFromData(settings, dateKey = null) {
    if (!settings || !canManage()) return;
    document.getElementById('time-per-match').value = settings.timePerMatch || 8;
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
        // กด +/−/รีเซ็ต ทันที → หยุดกด ~0.5s ค่อยบันทึก DB (ไม่วาดทั้งหน้า / ไม่มีแบนเนอร์)
        const deferredScoreRefresh = new Set();
        const SCORE_SAVE_DEBOUNCE_MS = 500;
        function showScoreSaveStatus(message) {
            const status = document.getElementById('score-save-status');
            if (!status) return;
            status.hidden = !message;
            status.querySelector('span').textContent = message || '';
        }
        const scoreWriter = window.TK7ScoreWriter.create({
            delay: SCORE_SAVE_DEBOUNCE_MS,
            save: input => {
                if (!canManage() || pendingPasswordRecovery) throw Error('ต้องเข้าสู่ระบบผู้ดูแลก่อนบันทึกคะแนน');
                return window.TK7ScoreWriter.persist(db, input);
            },
            onError: (error, date) => showScoreSaveStatus('คะแนนวันที่ '+date+' ยังไม่บันทึก: '+error.message),
            onSaved: (date, result) => {
                if (appData[date]) appData[date].updated_at = result.updated_at;
                if (!scoreWriter.hasPending()) showScoreSaveStatus('');
                if (!scoreWriter.hasPending(date) && deferredScoreRefresh.delete(date)) {
                    if (date === currentDateKey) loadDataForDate(date, {syncSetupDate:false});
                    else delete appData[date];
                }
            }
        });
        let leaderboardRefreshTimer = null;

        function patchMatchScoreCardUI(index) {
            const match = appData[currentDateKey]?.schedule?.[index];
            if (!match) return;
            const card = document.querySelector(`#scores-container .match-card[data-score-card][data-index="${index}"]`);
            if (!card) return;
            const homeInput = card.querySelector('.score-input[data-team="home"]');
            const awayInput = card.querySelector('.score-input[data-team="away"]');
            if (homeInput) homeInput.value = match.homeScore === null ? '' : String(match.homeScore);
            if (awayInput) awayInput.value = match.awayScore === null ? '' : String(match.awayScore);
            const scoreValues = card.querySelectorAll('.score-line-export .score-value');
            const vs = card.querySelector('.score-line-export .vs-export');
            if (scoreValues[0]) scoreValues[0].textContent = match.homeScore !== null ? String(match.homeScore) : '\u00a0';
            if (scoreValues[1]) scoreValues[1].textContent = match.awayScore !== null ? String(match.awayScore) : '\u00a0';
            if (vs) vs.textContent = (match.homeScore !== null && match.awayScore !== null) ? '-' : 'vs';
        }

        function scheduleLeaderboardRefresh(date = currentDateKey) {
            clearTimeout(leaderboardRefreshTimer);
            leaderboardRefreshTimer = setTimeout(() => {
                if (activePage === 'page-leaderboard' && date === currentDateKey) renderLeaderboardPage(date);
            }, 350);
        }

        function queueScoreSave(date = currentDateKey, baseline) {
            const day = appData[date];
            scoreWriter.mark(date, day.schedule, day.updated_at, baseline);
            showScoreSaveStatus('กำลังรอบันทึกคะแนน…');
        }

        function flushScoreSave(date) {
            return scoreWriter.flush(date);
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
            const html = schedule.map((rawMatch, index) => {
                const match = {...rawMatch,homeScore:window.TK7MatchStats.score(rawMatch.homeScore),awayScore:window.TK7MatchStats.score(rawMatch.awayScore)};
                const timeStr = new Date(startTime.getTime() + index * settings.timePerMatch * 60000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit'});
                const homeTeam = TEAMS.find(t => t.slug === match.home) || { name: 'N/A', slug: 'black' }, awayTeam = TEAMS.find(t => t.slug === match.away) || { name: 'N/A', slug: 'black' };
                const readonlyAttr = isReadOnly ? 'readonly' : '';
                const homeScoreText = match.homeScore !== null ? match.homeScore : ' ', awayScoreText = match.awayScore !== null ? match.awayScore : ' ';
                const separator = (match.homeScore !== null && match.awayScore !== null) ? '-' : 'vs';
                return `<div class="card match-card" data-score-card="1" data-index="${index}"><div class="match-header"><span>แมตช์ที่ ${index + 1}</span><span>⏱️ ${timeStr}</span></div><div class="score-line-export"><div class="team-emblem ${homeTeam.slug}">${homeTeam.name}</div><div class="score-block"><span class="score-value">${homeScoreText}</span><span class="vs-export">${separator}</span><span class="score-value">${awayScoreText}</span></div><div class="team-emblem ${awayTeam.slug}">${awayTeam.name}</div></div><div class="interactive-controls"><div class="team-score-wrapper"><div class="team-emblem ${homeTeam.slug}">${homeTeam.name}</div><div class="score-control"><button class="score-btn" data-index="${index}" data-team="home" data-op="-1" ${disabledAttr}>${svgMinus}</button><input type="number" class="score-input" value="${match.homeScore === null ? '' : match.homeScore}" data-index="${index}" data-team="home" ${readonlyAttr}><button class="score-btn" data-index="${index}" data-team="home" data-op="1" ${disabledAttr}>${svgPlus}</button></div></div><div class="match-center-controls"><span class="vs">VS</span><button class="reset-score-btn" data-index="${index}" ${disabledAttr}>${svgReset}</button></div><div class="team-score-wrapper"><div class="team-emblem ${awayTeam.slug}">${awayTeam.name}</div><div class="score-control"><button class="score-btn" data-index="${index}" data-team="away" data-op="-1" ${disabledAttr}>${svgMinus}</button><input type="number" class="score-input" value="${match.awayScore === null ? '' : match.awayScore}" data-index="${index}" data-team="away" ${readonlyAttr}><button class="score-btn" data-index="${index}" data-team="away" data-op="1" ${disabledAttr}>${svgPlus}</button></div></div></div></div>`;
            }).join('');
            renderWithMorph(container, html);
            applyColumnMajorGrid(container);
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

        function updateScore(index, team, value) {
            if (!canManage() || pendingPasswordRecovery) return;
            const date = currentDateKey, dayData = appData[date];
            if (!dayData?.schedule) return;
            const idx = parseInt(index, 10);
            if (Number.isNaN(idx) || !dayData.schedule[idx]) return;
            let safeValue = value;
            if (safeValue !== null) {
                safeValue = Number.parseInt(safeValue, 10);
                if (Number.isNaN(safeValue) || safeValue < 0) safeValue = 0;
            }
            if (!['home','away'].includes(team) || dayData.schedule[idx][team+'Score'] === safeValue) return;
            const previousSchedule = dayData.schedule;
            const newSchedule = previousSchedule.map((m, i) => i === idx ? { ...m } : m);
            if (team === 'home') newSchedule[idx].homeScore = safeValue;
            else newSchedule[idx].awayScore = safeValue;
            appData[date].schedule = newSchedule;
            patchMatchScoreCardUI(idx);
            scheduleLeaderboardRefresh(date);
            queueScoreSave(date, previousSchedule);
        }
        function updateScoreFromButton(button) {
            const { index, team, op } = button.dataset;
            const dayData = appData[currentDateKey];
            const idx = parseInt(index, 10);
            const match = dayData?.schedule?.[idx];
            const currentValue = match
                ? (Number.parseInt(team === 'home' ? match.homeScore : match.awayScore, 10) || 0)
                : 0;
            const newValue = (op === '1') ? currentValue + 1 : Math.max(0, currentValue - 1);
            updateScore(index, team, newValue);
        }
        function updateScoreFromInput(input) {
            const { index, team } = input.dataset;
            if (input.value === '') { updateScore(index, team, null); return; }
            const parsed = Number.parseInt(input.value, 10);
            updateScore(index, team, Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
        }
        function resetScore(button) {
            const { index } = button.dataset;
            if (!canManage() || pendingPasswordRecovery) return;
            const date = currentDateKey, dayData = appData[date];
            if (!dayData?.schedule) return;
            const idx = parseInt(index, 10);
            if (Number.isNaN(idx) || !dayData.schedule[idx]) return;
            if (dayData.schedule[idx].homeScore == null && dayData.schedule[idx].awayScore == null) return;
            const previousSchedule = dayData.schedule;
            appData[date].schedule = previousSchedule.map((m, i) => (
                i === idx ? { ...m, homeScore: null, awayScore: null } : m
            ));
            patchMatchScoreCardUI(idx);
            scheduleLeaderboardRefresh(date);
            queueScoreSave(date, previousSchedule);
        }

        function calculateLeaderboard(date) {
            return window.TK7MatchStats.calculate(appData[date], TEAMS);
        }

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

let openerFormDate = '';
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

    const date = document.getElementById('match-date')?.value || currentDateKey;
    const sameDate = openerFormDate === date;
    openerFormDate = date;
    const oldVal1 = sameDate ? s1.value : '';
    const oldVal2 = sameDate ? s2.value : '';
    const optionsHtml = activeTeams.map(slug => {
        const team = TEAMS.find(t => t.slug === slug);
        return `<option value="${slug}">${team ? team.name : slug}</option>`;
    }).join('');
    s1.innerHTML = '<option value="">รอสุ่ม / เลือกทีม</option>' + optionsHtml;
    s2.innerHTML = '<option value="">รอสุ่ม / เลือกทีม</option>' + optionsHtml;

    if (forceT1 && activeTeams.includes(forceT1)) s1.value = forceT1;
    else if (activeTeams.includes(oldVal1)) s1.value = oldVal1;
    else s1.value = '';

    if (forceT2 && activeTeams.includes(forceT2) && forceT2 !== s1.value) s2.value = forceT2;
    else if (activeTeams.includes(oldVal2) && oldVal2 !== s1.value) s2.value = oldVal2;
    else s2.value = '';

    renderSchedulePreview(false);
}

function getFinalShuffledOrder() {
    const allSelected = Array.from(document.querySelectorAll('.team-switch:checked')).map(sw => sw.dataset.teamSlug);
    const s1 = document.getElementById('lock-team-1');
    const s2 = document.getElementById('lock-team-2');
    const t1 = s1?.value;
    const t2 = s2?.value;
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
    if (!newPassword || newPassword.length < 15) {
        alert('รหัสผ่านต้องมีอย่างน้อย 15 ตัวอักษร');
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
        window.TK7Admin?.mount({db,canManage,getDisplayName:()=>userProfile?.display_name||''});
        initializeApp();
    });
