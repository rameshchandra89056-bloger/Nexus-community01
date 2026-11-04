// ================= PROFILE.JS: ULTRA-CLEAN INSTAGRAM-STYLE LAYOUT + ZERO DUPLICATE TABS =================

(function() {
    const profTab = document.getElementById('tab-profile');
    if (!profTab) return;

    // Block dm.js from ever injecting a duplicate second tab bar (#nx-clean-prof-tabs)!
    const cleanProfStyle = document.createElement('style');
    cleanProfStyle.innerHTML = `
        #nx-clean-prof-tabs, #nx-saved-posts-grid {
            display: none !important;
        }
    `;
    document.head.appendChild(cleanProfStyle);

    let authMode = 'register';
    let timerSeconds = 25 * 60;
    let timerInterval = null;
    let activeGridTab = 'my';

    function getUnifiedSavedPostIds() {
        let a = [], b = [];
        try { a = JSON.parse(localStorage.getItem('nx_saved_posts') || '[]'); } catch (e) {}
        try { b = JSON.parse(localStorage.getItem('nx_saved') || '[]'); } catch (e) {}
        let merged = Array.from(new Set([...a, ...b]));
        if (Nexus.posts && Nexus.posts.length > 0) {
            let validIds = new Set(Nexus.posts.map(p => p.id));
            merged = merged.filter(id => validIds.has(id));
        }
        return merged;
    }

    function renderProfileScreen(forceRedrawAuth) {
        let me = Nexus.getCurrentUser();

        if (!me) {
            if (!forceRedrawAuth && document.getElementById('nx-auth-card-box')) {
                return;
            }
            profTab.innerHTML = `
                <div style="padding:18px 14px;" id="nx-auth-card-box">
                    <div style="background:#0f172a; border:1px solid #1e293b; border-radius:18px; padding:20px 16px;">
                        <div style="display:flex; background:#090d16; padding:4px; border-radius:12px; margin-bottom:16px; border:1px solid #1e293b;">
                            <button type="button" onclick="NexusProfile.setAuthMode('register')" style="flex:1; padding:9px; border-radius:9px; border:none; font-weight:700; font-size:13px; cursor:pointer; background:${authMode === 'register' ? '#2563eb' : 'transparent'}; color:${authMode === 'register' ? 'white' : '#94a3b8'};">Create Cloud Account</button>
                            <button type="button" onclick="NexusProfile.setAuthMode('login')" style="flex:1; padding:9px; border-radius:9px; border:none; font-weight:700; font-size:13px; cursor:pointer; background:${authMode === 'login' ? '#2563eb' : 'transparent'}; color:${authMode === 'login' ? 'white' : '#94a3b8'};">Login Existing</button>
                        </div>

                        ${authMode === 'register' ? `
                            <div style="display:flex; flex-direction:column; gap:11px;">
                                <input type="text" id="nx-reg-user" placeholder="Unique Username (e.g. mohit_01)" autocomplete="off" style="width:100%; padding:11px 13px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none;">
                                <input type="text" id="nx-reg-name" placeholder="Full Display Name" autocomplete="off" style="width:100%; padding:11px 13px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none;">
                                <input type="text" id="nx-reg-bio" placeholder="Bio / Target (e.g. IIT-JEE 2027)" autocomplete="off" style="width:100%; padding:11px 13px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none;">
                                <input type="password" id="nx-reg-pin" onkeydown="if(event.key==='Enter') NexusProfile.registerCloudAccount()" placeholder="Secret 4-Digit PIN" maxlength="8" style="width:100%; padding:11px 13px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none;">
                                <button type="button" onclick="NexusProfile.registerCloudAccount()" style="background:#2563eb; color:white; border:none; padding:12px; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; margin-top:4px;">Create Cloud Account</button>
                            </div>
                        ` : `
                            <div style="display:flex; flex-direction:column; gap:11px;">
                                <input type="text" id="nx-log-user" placeholder="Your Username (e.g. mohit_01)" autocomplete="off" style="width:100%; padding:11px 13px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none;">
                                <input type="password" id="nx-log-pin" onkeydown="if(event.key==='Enter') NexusProfile.loginCloudAccount()" placeholder="Secret PIN" style="width:100%; padding:11px 13px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none;">
                                <button type="button" onclick="NexusProfile.loginCloudAccount()" style="background:#10b981; color:#020617; border:none; padding:12px; border-radius:10px; font-weight:800; font-size:14px; cursor:pointer; margin-top:4px;">Login to My Account</button>
                            </div>
                        `}
                    </div>
                </div>
            `;
            return;
        }

        let myPosts = (Nexus.posts || []).filter(p =>
            !p.isOfficialPinned && (
                (p.username && p.username.toLowerCase() === me.username.toLowerCase()) ||
                (p.author && p.author.trim().toLowerCase() === me.name.trim().toLowerCase())
            )
        );
        let savedIds = getUnifiedSavedPostIds();
        let savedPosts = (Nexus.posts || []).filter(p => p && savedIds.includes(p.id));

        let cloudUser = (Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === me.username.toLowerCase()) || me;
        let followersArr = Array.isArray(cloudUser.followersList) ? cloudUser.followersList : [];
        let followingArr = Array.isArray(cloudUser.followingList) ? cloudUser.followingList : [];
        let visitorsArr = Array.isArray(cloudUser.recentVisitors) ? cloudUser.recentVisitors : (Array.isArray(me.recentVisitors) ? me.recentVisitors : []);
        let safeMyUname = me.username.replace(/'/g, "\\'");

        let firstLetter = (me.name || 'U').charAt(0).toUpperCase() || 'U';
        let dpView = (me.dp && me.dp.startsWith('data:image'))
            ? `<img src="${me.dp}" style="width:68px; height:68px; border-radius:50%; object-fit:cover; border:2.5px solid #3b82f6;">`
            : `<div style="width:68px; height:68px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#7c3aed); color:white; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:700; border:2.5px solid #3b82f6;">${firstLetter}</div>`;

        let m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
        let s = String(timerSeconds % 60).padStart(2, '0');

        let displayList = activeGridTab === 'my' ? myPosts : savedPosts;
        let postsGridHTML = displayList.length === 0
            ? `<div style="grid-column:1/-1; text-align:center; padding:26px; color:#64748b; font-size:13px; background:#0f172a; border-radius:14px; border:1px dashed #1e293b;">${activeGridTab === 'my' ? "You haven't shared any posts yet." : "🔖 No saved notes yet. Tap the bookmark icon on any post!"}</div>`
            : displayList.map(p => `
                <div onclick="Nexus.openSinglePostModal('${p.id}')" style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; overflow:hidden; aspect-ratio:1/1; display:flex; flex-direction:column; justify-content:space-between; padding:8px; cursor:pointer; position:relative;">
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        ${p.image ? `<img src="${p.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` : `<div style="font-size:12px; color:#e2e8f0; text-align:center; padding:6px;">${p.text}</div>`}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px; font-size:11px; color:#94a3b8;">
                        <span onclick="event.stopPropagation(); Nexus.openPostLikesModal('${p.id}')">❤️ ${(p.likedBy || []).length} • 💬 ${(p.comments || []).length}</span>
                        <span style="color:#38bdf8; font-weight:700;">Open ↗</span>
                    </div>
                </div>
            `).join('');

        profTab.innerHTML = `
            <div style="padding:12px 14px;">
                <!-- Clean All-In-One Profile Card -->
                <div style="background:#0f172a; border:1px solid #1e293b; border-radius:18px; padding:15px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                        <div style="position:relative; cursor:pointer; flex-shrink:0;" onclick="document.getElementById('nx-dp-file').click()" title="Tap to change profile photo">
                            ${dpView}
                            <input type="file" id="nx-dp-file" accept="image/*" style="display:none;">
                            <span style="position:absolute; bottom:0; right:0; background:#2563eb; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; border:2px solid #0f172a;">📷</span>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <h2 style="font-size:17px; color:#f8fafc; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${me.name}</h2>
                            <div style="font-size:11.5px; color:#10b981; font-weight:700; margin-bottom:2px;">@${me.username} ${me.moodNote ? `• 💭 ${me.moodNote}` : ''}</div>
                            <p style="font-size:12px; color:#38bdf8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${me.bio || 'JEE Aspirant'}</p>
                        </div>
                        <button type="button" onclick="if(window.NexusSuperChat) NexusSuperChat.openMoodNoteModal()" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:6px 10px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer; flex-shrink:0;">💭 Note</button>
                    </div>

                    <!-- Clickable Posts / Followers / Following Row -->
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; background:#090d16; padding:7px; border-radius:12px; text-align:center; border:1px solid #1e293b; margin-bottom:10px;">
                        <div class="nx-stat-click-box" onclick="NexusProfile.switchGridTab('my')">
                            <div style="font-size:15px; font-weight:800; color:white;">${myPosts.length}</div>
                            <div style="font-size:10.5px; color:#94a3b8;">Posts</div>
                        </div>
                        <div class="nx-stat-click-box" onclick="Nexus.openProfileFollowers('${safeMyUname}')" style="border-left:1px solid #1e293b; border-right:1px solid #1e293b;">
                            <div style="font-size:15px; font-weight:800; color:#38bdf8;">${followersArr.length}</div>
                            <div style="font-size:10.5px; color:#93c5fd; font-weight:700;">Followers ↗</div>
                        </div>
                        <div class="nx-stat-click-box" onclick="Nexus.openProfileFollowing('${safeMyUname}')">
                            <div style="font-size:15px; font-weight:800; color:#38bdf8;">${followingArr.length}</div>
                            <div style="font-size:10.5px; color:#93c5fd; font-weight:700;">Following ↗</div>
                        </div>
                    </div>

                    <!-- Sleek 2-Column Compact Tools Bar (Timer + Profile Views in 1 Neat Row!) -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div style="background:#090d16; border:1px solid #1e293b; border-radius:11px; padding:7px 10px; display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-size:12px; font-weight:800; color:#10b981;" id="nx-pomo-display">⏱️ ${m}:${s}</span>
                            <button type="button" id="nx-pomo-btn" onclick="NexusProfile.toggleTimer()" style="background:#10b981; color:#020617; border:none; padding:4px 9px; border-radius:7px; font-weight:900; font-size:11px; cursor:pointer;">${timerInterval ? 'Pause' : 'Start'}</button>
                        </div>
                        <button type="button" id="nx-who-viewed-btn" onclick="if(window.NexusSuperChat) NexusSuperChat.openProfileVisitorsModal()" style="background:#090d16; border:1px solid #1e293b; border-radius:11px; padding:7px 10px; color:#f8fafc; font-weight:800; font-size:11.5px; cursor:pointer; display:flex; align-items:center; justify-content:space-between;">
                            <span>👀 Views</span>
                            <span style="color:#38bdf8; font-weight:900;">${visitorsArr.length} →</span>
                        </button>
                    </div>
                </div>

                <!-- SINGLE Clean Switcher Bar (My Posts vs Saved Notes) -->
                <div style="display:flex; background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:4px; margin-bottom:12px; gap:6px;">
                    <button type="button" onclick="NexusProfile.switchGridTab('my')" style="flex:1; padding:9px; border-radius:10px; border:none; font-weight:800; font-size:12.5px; cursor:pointer; background:${activeGridTab === 'my' ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'transparent'}; color:${activeGridTab === 'my' ? 'white' : '#94a3b8'};">⊞ My Posts (${myPosts.length})</button>
                    <button type="button" onclick="NexusProfile.switchGridTab('saved')" style="flex:1; padding:9px; border-radius:10px; border:none; font-weight:800; font-size:12.5px; cursor:pointer; background:${activeGridTab === 'saved' ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'transparent'}; color:${activeGridTab === 'saved' ? 'white' : '#94a3b8'};">🔖 Saved Notes (${savedPosts.length})</button>
                </div>

                <!-- Posts Grid -->
                <div id="nx-my-posts-grid" data-nx-mygrid="1" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">${postsGridHTML}</div>
            </div>
        `;

        const dpIn = document.getElementById('nx-dp-file');
        if (dpIn) {
            dpIn.addEventListener('change', e => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                Nexus.compressImage(f, 300, 0.75, url => {
                    me.dp = url;
                    localStorage.setItem('nx_active_account', JSON.stringify(me));
                    if (Nexus.db) {
                        Nexus.db.collection("nexus_accounts").doc(me.username).set({ dp: url }, { merge: true });
                    }
                    renderProfileScreen(true);
                    Nexus.notifyAll();
                    Nexus.toast("📸 Profile photo updated!");
                });
            });
        }
    }

    window.NexusProfile = {
        setAuthMode: function(m) { authMode = m; renderProfileScreen(true); },
        switchGridTab: function(tab) { activeGridTab = tab; renderProfileScreen(true); },
        registerCloudAccount: function() {
            if (!Nexus.db) { Nexus.toast("Connecting to cloud, wait 1 sec..."); return; }
            let uname = document.getElementById('nx-reg-user').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
            let name = document.getElementById('nx-reg-name').value.trim();
            let bio = document.getElementById('nx-reg-bio').value.trim() || 'JEE Aspirant';
            let pin = document.getElementById('nx-reg-pin').value.trim();
            if (uname.length < 3 || name.length < 2 || pin.length < 4) { Nexus.toast("Enter valid Username, Name & 4-digit PIN"); return; }

            Nexus.db.collection("nexus_accounts").doc(uname).get().then(doc => {
                if (doc.exists) { Nexus.toast("Username already taken! Switch to Login."); return; }
                let newAcc = { username: uname, name: name, bio: bio, pin: pin, dp: '', followersList: [], followingList: [], createdAt: Date.now() };
                Nexus.db.collection("nexus_accounts").doc(uname).set(newAcc).then(() => {
                    localStorage.setItem('nx_active_account', JSON.stringify(newAcc));
                    renderProfileScreen(true);
                    Nexus.notifyAll();
                    Nexus.toast("🎉 Account Created!");
                });
            });
        },
        loginCloudAccount: function() {
            if (!Nexus.db) { Nexus.toast("Connecting to cloud, wait 1 sec..."); return; }
            let uname = document.getElementById('nx-log-user').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
            let pin = document.getElementById('nx-log-pin').value.trim();
            if (!uname || !pin) { Nexus.toast("Enter both Username and PIN!"); return; }

            Nexus.db.collection("nexus_accounts").doc(uname).get().then(doc => {
                if (!doc.exists) { Nexus.toast("Account not found!"); return; }
                let data = doc.data();
                if (String(data.pin) !== String(pin)) { Nexus.toast("Wrong Secret PIN!"); return; }
                localStorage.setItem('nx_active_account', JSON.stringify(data));
                renderProfileScreen(true);
                Nexus.notifyAll();
                Nexus.toast("✅ Logged in as " + data.name + "!");
            });
        },
        toggleTimer: function() {
            const btn = document.getElementById('nx-pomo-btn');
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
                if (btn) btn.innerText = "Resume";
            } else {
                if (btn) btn.innerText = "Pause";
                timerInterval = setInterval(() => {
                    timerSeconds--;
                    if (timerSeconds <= 0) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                        timerSeconds = 25 * 60;
                        Nexus.toast("🎉 25-Min Study Session Complete!");
                    }
                    const disp = document.getElementById('nx-pomo-display');
                    if (disp) {
                        let m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
                        let s = String(timerSeconds % 60).padStart(2, '0');
                        disp.innerText = `⏱️ ${m}:${s}`;
                    }
                }, 1000);
            }
        }
    };

    Nexus.listeners.onPosts.push(() => renderProfileScreen(false));
    Nexus.listeners.onUsers.push(() => renderProfileScreen(false));
    renderProfileScreen(true);
})();
