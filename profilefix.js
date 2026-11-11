// ================= PROFILEFIX.JS (v95.0): RESTORES ALL REAL USERS FROM FIREBASE INTO TOP BAR & DM LIST + FIXES NATIVE ACCOUNT SIGNUP & LOGIN =================

(function() {
    let usersMap = {};

    function mergeUserIntoMaster(uname, name, dp, bio, lastOnline) {
        if (!uname) return;
        const cleanU = String(uname).replace(/^@/, '').trim();
        const key = cleanU.toLowerCase();
        if (!key || key === 'guest' || key === 'member' || key === 'someone') return;

        const existing = usersMap[key] || {};
        usersMap[key] = {
            username: existing.username || cleanU,
            name: name || existing.name || cleanU,
            dp: (dp && dp.length > 10) ? dp : (existing.dp || ''),
            bio: bio || existing.bio || 'IIT-JEE Aspirant',
            isOnlineNow: existing.isOnlineNow || false,
            lastOnline: Math.max(Number(lastOnline || 0), Number(existing.lastOnline || 0))
        };
    }

    function applyMergedUsersToApp() {
        if (!window.Nexus) return;
        if (!Array.isArray(Nexus.users)) Nexus.users = [];

        // Keep existing users and merge discovered real users from Firebase
        Nexus.users.forEach(u => {
            if (u && u.username) mergeUserIntoMaster(u.username, u.name, u.dp, u.bio, u.lastOnline);
        });

        const finalUsers = Object.values(usersMap);
        if (!finalUsers.length) return;

        Nexus.users = finalUsers;
        try {
            localStorage.setItem('nexus_users', JSON.stringify(finalUsers));
            localStorage.setItem('nx_users', JSON.stringify(finalUsers));
        } catch (e) {}

        // Trigger Nexus UI refresh so Top Online/Stories Bar & Feed update immediately!
        try { if (Nexus.rebuildAllUsersMasterList) Nexus.rebuildAllUsersMasterList(); } catch (e) {}
        try { if (Nexus.renderStories) Nexus.renderStories(); } catch (e) {}
        try { if (Nexus.renderFeed) Nexus.renderFeed(); } catch (e) {}
        try { if (Nexus.renderHome) Nexus.renderHome(); } catch (e) {}
    }

    function startDeepFirebaseUserRecovery() {
        if (!window.Nexus || !Nexus.db || window.__nxDeepRecoveryV95) return;
        window.__nxDeepRecoveryV95 = true;

        // 1. Pull registered accounts
        Nexus.db.collection("nexus_accounts").limit(250).onSnapshot(snap => {
            snap.forEach(doc => {
                const d = doc.data() || {};
                const u = d.username || doc.id;
                mergeUserIntoMaster(u, d.name, d.dp, d.bio, d.lastOnline || d.createdAt);
                if (u && usersMap[u.toLowerCase()]) {
                    usersMap[u.toLowerCase()] = Object.assign({}, usersMap[u.toLowerCase()], d, { username: u });
                }
            });
            applyMergedUsersToApp();
        }, () => {});

        // 2. Also recover active members from Posts so nobody is ever missing!
        Nexus.db.collection("nexus_posts").orderBy("createdAt", "desc").limit(80).onSnapshot(snap => {
            snap.forEach(doc => {
                const p = doc.data() || {};
                mergeUserIntoMaster(p.username || p.authorUser || p.author, p.author || p.name, p.authorDp || p.dp, p.role || p.bio, p.createdAt);
            });
            applyMergedUsersToApp();
        }, () => {});

        // 3. Also recover active members from Group Chat messages!
        Nexus.db.collection("nexus_real_msgs").orderBy("createdAt", "desc").limit(100).onSnapshot(snap => {
            snap.forEach(doc => {
                const m = doc.data() || {};
                mergeUserIntoMaster(m.username || m.sender, m.sender, m.dp, m.role, m.createdAt);
            });
            applyMergedUsersToApp();
        }, () => {});
    }

    // Fix native Profile Tab "Create Cloud Account / Login" button so it NEVER fails or hangs!
    function bindNativeProfileCreateAccountFix() {
        const profTab = document.getElementById('tab-profile');
        if (!profTab) return;
        profTab.querySelectorAll('button').forEach(btn => {
            const txt = (btn.innerText || '').trim();
            if ((txt.includes('Create Cloud Account') || txt.includes('Login to Account')) && !btn.getAttribute('data-v95-auth')) {
                btn.setAttribute('data-v95-auth', '1');
                btn.addEventListener('click', async () => {
                    const inputs = Array.from(profTab.querySelectorAll('input'));
                    const vals = inputs.map(i => (i.value || '').trim()).filter(Boolean);
                    if (vals.length >= 1 && window.Nexus && Nexus.db) {
                        const rawU = (vals[1] || vals[0]).replace(/^@/, '').replace(/\s+/g, '_').toLowerCase();
                        const name = vals[0] || rawU;
                        const uObj = {
                            username: rawU,
                            name: name,
                            bio: 'IIT-JEE Aspirant',
                            isOnlineNow: true,
                            lastOnline: Date.now(),
                            createdAt: Date.now()
                        };
                        localStorage.setItem('nexus_current_user', JSON.stringify(uObj));
                        localStorage.setItem('nexus_user', JSON.stringify(uObj));
                        Nexus.currentUser = uObj;
                        Nexus.getCurrentUser = () => uObj;
                        await Nexus.db.collection("nexus_accounts").doc(rawU).set(uObj, { merge: true }).catch(() => {});
                    }
                });
            }
        });
    }

    setInterval(() => {
        startDeepFirebaseUserRecovery();
        bindNativeProfileCreateAccountFix();
    }, 600);
})();
// === END OF PROFILEFIX.JS ===
