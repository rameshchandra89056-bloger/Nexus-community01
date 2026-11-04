// ================= SETTINGS.JS: 🔄 1-TAP MULTI-ACCOUNT SWITCHER + 🗑️ DELETE OWN ACCOUNT + ⏱️ CHAT CLOCK-SYNC FIX (NO OFFLINE MODE) =================

(function() {
    const setTab = document.getElementById('tab-settings');
    if (!setTab) return;

    // Force-clear any old offline/ghost mode flag so user is always Online
    localStorage.removeItem('nx_ghost_stealth_mode');

    function getSavedAccountsVault() {
        let list = [];
        try { list = JSON.parse(localStorage.getItem('nx_saved_accounts_vault') || '[]'); } catch (e) {}
        let me = Nexus.getCurrentUser();
        if (me && me.username) {
            let exists = list.find(a => a && a.username && a.username.toLowerCase() === me.username.toLowerCase());
            if (!exists) {
                list.unshift({
                    username: me.username,
                    name: me.name,
                    bio: me.bio || 'JEE Aspirant',
                    pin: me.pin || '',
                    dp: me.dp || ''
                });
            } else {
                exists.name = me.name;
                exists.bio = me.bio || exists.bio;
                exists.dp = me.dp || exists.dp;
                if (me.pin) exists.pin = me.pin;
            }
            try { localStorage.setItem('nx_saved_accounts_vault', JSON.stringify(list.slice(0, 6))); } catch (e) {}
        }
        return list;
    }

    // SMART CLOCK-SYNC ENGINE (Fixes message order if a friend's phone clock is wrong)
    function installSmartClockSyncForChats() {
        if (!Nexus.db || Nexus.db.__nxClockSyncInstalled) return;
        Nexus.db.__nxClockSyncInstalled = true;

        const origCollection = Nexus.db.collection.bind(Nexus.db);
        let highestRoomTimestamp = Date.now();

        Nexus.db.collection = function(colName) {
            const colRef = origCollection(colName);
            if ((colName === "nexus_private_dms" || colName === "nexus_real_msgs") && !colRef.__nxAddPatched) {
                colRef.__nxAddPatched = true;
                const origAdd = colRef.add.bind(colRef);

                if (colRef.where && !colRef.__nxWherePatched) {
                    colRef.__nxWherePatched = true;
                    const origWhere = colRef.where.bind(colRef);
                    colRef.where = function(field, op, val) {
                        const queryRef = origWhere(field, op, val);
                        const origQuerySnap = queryRef.onSnapshot.bind(queryRef);
                        queryRef.onSnapshot = function(cb) {
                            return origQuerySnap(snap => {
                                snap.forEach(d => {
                                    let data = d.data();
                                    if (data && data.createdAt && data.createdAt > highestRoomTimestamp) {
                                        highestRoomTimestamp = data.createdAt;
                                    }
                                });
                                cb(snap);
                            });
                        };
                        return queryRef;
                    };
                }

                colRef.add = function(dataObj) {
                    if (dataObj && typeof dataObj === 'object') {
                        let now = Date.now();
                        if (highestRoomTimestamp >= now) {
                            highestRoomTimestamp = highestRoomTimestamp + 1000;
                            dataObj.createdAt = highestRoomTimestamp;
                        } else {
                            highestRoomTimestamp = now;
                            dataObj.createdAt = now;
                        }
                    }
                    return origAdd(dataObj);
                };
            }
            return colRef;
        };
    }
    setInterval(installSmartClockSyncForChats, 800);

    function renderSettings() {
        let me = Nexus.getCurrentUser();
        let savedAccounts = getSavedAccountsVault();

        let accountsListHTML = savedAccounts.length === 0
            ? `<div style="font-size:12px; color:#64748b; padding:6px 0;">No saved accounts on this device yet.</div>`
            : savedAccounts.map(acc => {
                let isCurrent = me && acc.username.toLowerCase() === me.username.toLowerCase();
                let safeU = acc.username.replace(/'/g, "\\'");
                let ch = (acc.name || acc.username || 'U').charAt(0).toUpperCase();
                let av = (acc.dp && acc.dp.startsWith('data:image'))
                    ? `<img src="${acc.dp}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1.5px solid ${isCurrent ? '#10b981' : '#334155'};">`
                    : `<div style="width:38px; height:38px; border-radius:50%; background:${isCurrent ? '#10b981' : '#2563eb'}; color:${isCurrent ? '#020617' : 'white'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px;">${ch}</div>`;

                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 11px; background:#090d16; border:1px solid ${isCurrent ? '#10b981' : '#1e293b'}; border-radius:12px;">
                        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1; cursor:pointer;" onclick="NexusSettings.quickSwitchAccount('${safeU}')">
                            ${av}
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:800; font-size:13.5px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${acc.name} ${isCurrent ? '<span style="color:#10b981; font-size:11px;">● Active</span>' : ''}
                                </div>
                                <div style="font-size:11px; color:#38bdf8;">@${acc.username}</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            ${!isCurrent ? `<button type="button" onclick="NexusSettings.quickSwitchAccount('${safeU}')" style="background:#2563eb; color:white; border:none; padding:5px 10px; border-radius:8px; font-size:11.5px; font-weight:800; cursor:pointer;">Switch</button>` : ''}
                            <button type="button" onclick="NexusSettings.removeSavedAccountFromDevice('${safeU}')" style="background:none; border:none; color:#64748b; font-size:14px; cursor:pointer; padding:4px;" title="Remove">✕</button>
                        </div>
                    </div>
                `;
            }).join('');

        setTab.innerHTML = `
            <div style="padding:14px; display:flex; flex-direction:column; gap:14px;">
                <div style="background:#0f172a; border:1px solid #1e293b; border-radius:16px; padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div>
                            <h3 style="font-size:15.5px; color:#f8fafc;">🔄 Switch Accounts (1-Tap)</h3>
                            <p style="font-size:11.5px; color:#94a3b8;">Bina bar-bar PIN dale apni IDs switch karein</p>
                        </div>
                        <button type="button" onclick="NexusSettings.addNewAccountFlow()" style="background:rgba(56,189,248,0.15); border:1px solid #38bdf8; color:#38bdf8; padding:5px 10px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">+ Add ID</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${accountsListHTML}
                    </div>
                </div>

                <div style="background:#0f172a; border:1px solid #1e293b; border-radius:16px; padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div>
                            <h3 style="font-size:15.5px; color:#f8fafc;">⚙️ Account Controls</h3>
                            <p style="font-size:11.5px; color:#10b981; font-weight:700;">${me ? `🟢 Logged in as @${me.username}` : 'Not logged in'}</p>
                        </div>
                        <span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid #10b981; padding:4px 9px; border-radius:12px; font-size:10.5px; font-weight:800;">Cloud Synced</span>
                    </div>

                    ${me ? `
                        <div style="display:flex; flex-direction:column; gap:9px;">
                            <button type="button" onclick="NexusSettings.openEditProfileModal()" style="background:#1e293b; color:white; border:1px solid #334155; padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between;">
                                <span>✏️ Edit Display Name &amp; Bio</span><span>→</span>
                            </button>
                            <button type="button" onclick="NexusSettings.openChangePinModal()" style="background:#1e293b; color:white; border:1px solid #334155; padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between;">
                                <span>🔐 Change Secret Login PIN</span><span>→</span>
                            </button>
                            ${me.dp ? `
                                <button type="button" onclick="NexusSettings.removeMyDp()" style="background:#1e293b; color:#fca5a5; border:1px solid #334155; padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between;">
                                    <span>🖼️ Remove Current Profile Photo</span><span>✕</span>
                                </button>
                            ` : ''}
                            <button type="button" onclick="NexusSettings.logoutAccount()" style="background:rgba(245,158,11,0.12); color:#fbbf24; border:1px solid rgba(245,158,11,0.35); padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:800; cursor:pointer; display:flex; justify-content:space-between;">
                                <span>🚪 Log Out of @${me.username}</span><span>→</span>
                            </button>
                            <button type="button" onclick="NexusSettings.openDeleteAccountModal()" style="background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.35); padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:800; cursor:pointer; display:flex; justify-content:space-between;">
                                <span>🗑️ Delete My Account Permanently</span><span>⚠️</span>
                            </button>
                        </div>
                    ` : `
                        <button type="button" onclick="Nexus.switchTab('tab-profile')" style="width:100%; background:#00a884; color:#020617; border:none; padding:12px; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer;">
                            Go to Profile to Login / Register
                        </button>
                    `}
                </div>

                <div style="background:#0f172a; border:1px solid #1e293b; border-radius:16px; padding:15px;">
                    <h3 style="font-size:15px; color:#f8fafc; margin-bottom:10px;">📲 Official App &amp; Speed Controls</h3>
                    <button type="button" onclick="if(window.NexusPower) NexusPower.installPWA();" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:12px 14px; border-radius:12px; text-align:left; font-size:13.5px; font-weight:900; cursor:pointer; display:flex; justify-content:space-between; margin-bottom:9px;">
                        <span>📲 1-Click Download Official Nexus App</span><span>Download ↓</span>
                    </button>
                    <button type="button" onclick="NexusSettings.boostAppSpeed()" style="width:100%; background:#1e293b; color:#10b981; border:1px solid #334155; padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; margin-bottom:9px;">
                        <span>⚡ 1-Tap Speed Boost (Clear Lag Cache)</span><span>🚀</span>
                    </button>
                    <button type="button" onclick="NexusSettings.shareWebsite()" style="width:100%; background:#1e293b; color:#38bdf8; border:1px solid #334155; padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; margin-bottom:9px;">
                        <span>📤 Copy &amp; Share Website Link</span><span>↗</span>
                    </button>
                    <button type="button" onclick="NexusSettings.refreshSync()" style="width:100%; background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:11px 14px; border-radius:12px; text-align:left; font-size:13px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between;">
                        <span>🔄 Refresh Cloud Sync</span><span>↻</span>
                    </button>
                </div>
            </div>
        `;
    }

    window.NexusSettings = {
        quickSwitchAccount: function(targetUsername) {
            let saved = getSavedAccountsVault();
            let found = saved.find(a => a.username && a.username.toLowerCase() === targetUsername.toLowerCase());
            if (!found) return;
            let cloudMatch = (Nexus.cloudAccounts || []).find(u => u.username && u.username.toLowerCase() === targetUsername.toLowerCase());
            let activeObj = Object.assign({}, found, cloudMatch || {}, { isOnlineNow: true, lastOnline: Date.now() });

            localStorage.setItem('nx_active_account', JSON.stringify(activeObj));
            if (Nexus.rebuildAllUsersMasterList) Nexus.rebuildAllUsersMasterList();
            if (Nexus.notifyAll) Nexus.notifyAll();
            renderSettings();
            Nexus.toast(`🔄 Switched to @${activeObj.username}!`);
        },

        removeSavedAccountFromDevice: function(targetUsername) {
            let list = getSavedAccountsVault().filter(a => a.username.toLowerCase() !== targetUsername.toLowerCase());
            localStorage.setItem('nx_saved_accounts_vault', JSON.stringify(list));
            renderSettings();
            Nexus.toast(`Removed @${targetUsername} from list`);
        },

        addNewAccountFlow: function() {
            getSavedAccountsVault();
            localStorage.removeItem('nx_active_account');
            if (Nexus.notifyAll) Nexus.notifyAll();
            renderSettings();
            Nexus.switchTab('tab-profile');
            Nexus.toast("➕ Login or Create your 2nd Account now!");
        },

        openDeleteAccountModal: function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #ef4444; text-align:center;">
                    <div style="font-size:32px; margin-bottom:6px;">⚠️</div>
                    <h3 style="font-size:16.5px; color:#f87171; margin-bottom:6px;">Delete @${me.username} Permanently?</h3>
                    <p style="font-size:12px; color:#94a3b8; margin-bottom:12px;">Confirm your Secret PIN to delete account:</p>
                    <input type="password" id="nx-del-acc-pin" placeholder="Enter Your Secret PIN..." style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:14px; text-align:center; outline:none; margin-bottom:14px;">
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="flex:1; background:#1e293b; color:white; border:none; padding:10px; border-radius:10px; font-weight:700; cursor:pointer;">Cancel</button>
                        <button type="button" onclick="NexusSettings.confirmDeleteMyAccount()" style="flex:1; background:#ef4444; color:white; border:none; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">🗑️ Delete</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        confirmDeleteMyAccount: function() {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            let enteredPin = (document.getElementById('nx-del-acc-pin') ? document.getElementById('nx-del-acc-pin').value : '').trim();

            Nexus.db.collection("nexus_accounts").doc(me.username).get().then(doc => {
                if (doc.exists && doc.data().pin && String(doc.data().pin) !== String(enteredPin)) {
                    Nexus.toast("❌ Wrong Secret PIN!");
                    return;
                }
                let delUname = me.username;
                Nexus.db.collection("nexus_accounts").doc(delUname).delete().then(() => {
                    let list = getSavedAccountsVault().filter(a => a.username.toLowerCase() !== delUname.toLowerCase());
                    localStorage.setItem('nx_saved_accounts_vault', JSON.stringify(list));
                    localStorage.removeItem('nx_active_account');
                    document.getElementById('nx-global-modal').style.display = 'none';
                    if (list.length > 0) this.quickSwitchAccount(list[0].username);
                    else { renderSettings(); Nexus.switchTab('tab-profile'); }
                    Nexus.toast(`🗑️ Account @${delUname} Deleted!`);
                });
            });
        },

        openEditProfileModal: function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box">
                    <h3 style="font-size:16px; margin-bottom:12px;">✏️ Edit Your Profile</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <input type="text" id="nx-set-name" value="${me.name}" placeholder="Display Name" style="padding:10px 12px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:white; outline:none;">
                        <input type="text" id="nx-set-bio" value="${me.bio || ''}" placeholder="Bio / Target Exam" style="padding:10px 12px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:white; outline:none;">
                        <div style="display:flex; gap:8px; margin-top:6px;">
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="flex:1; background:#1e293b; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">Cancel</button>
                            <button type="button" onclick="NexusSettings.saveProfileChanges()" style="flex:1; background:#00a884; color:#020617; border:none; padding:10px; border-radius:8px; font-weight:800; cursor:pointer;">Save</button>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        saveProfileChanges: function() {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            let n = document.getElementById('nx-set-name').value.trim();
            let b = document.getElementById('nx-set-bio').value.trim();
            if (n.length < 2) { Nexus.toast("Enter a valid name"); return; }

            me.name = n;
            me.bio = b || 'JEE Aspirant';
            localStorage.setItem('nx_active_account', JSON.stringify(me));
            getSavedAccountsVault();

            Nexus.db.collection("nexus_accounts").doc(me.username).set({
                name: me.name,
                bio: me.bio,
                isOnlineNow: true,
                lastOnline: Date.now()
            }, { merge: true }).then(() => {
                document.getElementById('nx-global-modal').style.display = 'none';
                renderSettings();
                Nexus.notifyAll();
                Nexus.toast("✅ Profile Updated!");
            });
        },

        removeMyDp: function() {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            if (!confirm("Remove your current profile photo?")) return;
            me.dp = '';
            localStorage.setItem('nx_active_account', JSON.stringify(me));
            getSavedAccountsVault();
            Nexus.db.collection("nexus_accounts").doc(me.username).set({ dp: '' }, { merge: true }).then(() => {
                renderSettings();
                Nexus.notifyAll();
                Nexus.toast("🖼️ Profile Photo Removed");
            });
        },

        openChangePinModal: function() {
            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box">
                    <h3 style="font-size:16px; margin-bottom:12px;">🔐 Change Secret PIN</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <input type="password" id="nx-new-pin" placeholder="Enter New 4+ Digit PIN" maxlength="8" style="padding:10px 12px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:white; outline:none;">
                        <div style="display:flex; gap:8px; margin-top:6px;">
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="flex:1; background:#1e293b; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">Cancel</button>
                            <button type="button" onclick="NexusSettings.saveNewPin()" style="flex:1; background:#10b981; color:#020617; border:none; padding:10px; border-radius:8px; font-weight:800; cursor:pointer;">Update PIN</button>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        saveNewPin: function() {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            let p = document.getElementById('nx-new-pin').value.trim();
            if (p.length < 4) { Nexus.toast("PIN must be at least 4 digits"); return; }
            me.pin = p;
            localStorage.setItem('nx_active_account', JSON.stringify(me));
            getSavedAccountsVault();
            Nexus.db.collection("nexus_accounts").doc(me.username).set({ pin: p }, { merge: true }).then(() => {
                document.getElementById('nx-global-modal').style.display = 'none';
                Nexus.toast("🔐 Secret PIN Updated!");
            });
        },

        boostAppSpeed: function() {
            let meRaw = localStorage.getItem('nx_active_account');
            let savedRaw = localStorage.getItem('nx_saved_posts');
            let vaultRaw = localStorage.getItem('nx_saved_accounts_vault');
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('nx_dm_room_') || k.startsWith('nx_light_posts')) localStorage.removeItem(k);
            });
            if (meRaw) localStorage.setItem('nx_active_account', meRaw);
            if (savedRaw) localStorage.setItem('nx_saved_posts', savedRaw);
            if (vaultRaw) localStorage.setItem('nx_saved_accounts_vault', vaultRaw);
            Nexus.toast("⚡ App Cache Cleaned! Max Speed!");
        },

        shareWebsite: function() {
            if (navigator.share) {
                navigator.share({ title: 'Nexus Student Community', text: 'Join Nexus Live Student Community!', url: window.location.href });
            } else {
                navigator.clipboard.writeText(window.location.href);
                Nexus.toast("🔗 Website link copied!");
            }
        },

        refreshSync: function() { window.location.reload(); },

        logoutAccount: function() {
            if (!confirm("Log out from your current account?")) return;
            getSavedAccountsVault();
            let me = Nexus.getCurrentUser();
            if (me && Nexus.db) {
                Nexus.db.collection("nexus_accounts").doc(me.username).set({
                    isOnlineNow: false,
                    lastOnline: 0,
                    lastSeenAt: Date.now()
                }, { merge: true });
            }
            localStorage.removeItem('nx_active_account');
            renderSettings();
            Nexus.switchTab('tab-profile');
            Nexus.toast("Logged out! Tap any saved ID in Settings to switch back.");
        }
    };

    Nexus.listeners.onUsers.push(renderSettings);
    renderSettings();
})();
