// ================= PROFILEFIX.JS (v4.0 CAPTURE-PHASE DP LOCK & VIP PROFILE MODAL — FIXES SCREENSHOTS 1000073610.jpg & 1000073609.jpg) =================

(function() {
    function openIsolatedVipProfile(rawUsername) {
        if (!rawUsername || !window.Nexus) return;
        let cleanU = String(rawUsername).replace(/^@/, '').trim();

        const oldModal = document.getElementById('nx-global-modal');
        if (oldModal) oldModal.style.display = 'none';

        let me = Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let uObj = (Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === cleanU.toLowerCase()) || {
            username: cleanU,
            name: cleanU,
            bio: 'Nexus Member',
            followers: 0,
            following: 0
        };

        let userPosts = (Nexus.posts || []).filter(p =>
            p && ((p.username && p.username.toLowerCase() === cleanU.toLowerCase()) ||
                  (p.author && uObj.name && p.author.toLowerCase() === uObj.name.toLowerCase()))
        );

        let isFollowing = me && Array.isArray(me.followingList) && me.followingList.some(f => String(f).toLowerCase() === cleanU.toLowerCase());
        let safeU = uObj.username.replace(/'/g, "\\'");
        let safeN = (uObj.name || uObj.username).replace(/'/g, "\\'");
        let avatarLetter = (uObj.name || uObj.username || 'U').charAt(0).toUpperCase();

        let vipModal = document.getElementById('nx-vip-profile-modal');
        if (!vipModal) {
            vipModal = document.createElement('div');
            vipModal.id = 'nx-vip-profile-modal';
            vipModal.style.cssText = 'position:fixed; inset:0; background:rgba(2,6,23,0.9); backdrop-filter:blur(8px); z-index:100420; display:none; align-items:center; justify-content:center; padding:14px;';
            vipModal.onclick = (e) => { if (e.target === vipModal) vipModal.style.display = 'none'; };
            document.body.appendChild(vipModal);
        }

        vipModal.innerHTML = `
            <div style="width:100%; max-width:410px; max-height:86dvh; background:#090d16; border:1.5px solid #38bdf8; border-radius:22px; padding:16px; display:flex; flex-direction:column; overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,0.95);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span style="font-size:13.5px; font-weight:900; color:#38bdf8;">👤 Member Full Profile</span>
                    <button type="button" onclick="document.getElementById('nx-vip-profile-modal').style.display='none'" style="width:32px; height:32px; border-radius:50%; background:#1e293b; border:none; color:#94a3b8; font-size:16px; font-weight:900; cursor:pointer;">✕</button>
                </div>

                <div style="background:#111827; border:1px solid #1e293b; border-radius:18px; padding:14px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                        <div style="width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#10b981); padding:2px; flex-shrink:0;">
                            ${uObj.dp
                                ? `<img src="${uObj.dp}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; background:#090d16;">`
                                : `<div style="width:100%; height:100%; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900;">${avatarLetter}</div>`
                            }
                        </div>
                        <div style="min-width:0; flex:1;">
                            <div style="font-size:17px; font-weight:900; color:#f8fafc; display:flex; align-items:center; gap:5px;">
                                <span>${(uObj.name || uObj.username).replace(/</g, '&lt;')}</span>
                                ${uObj.verified ? `<span style="color:#10b981; font-size:14px;">✓</span>` : ''}
                            </div>
                            <div style="font-size:12px; color:#10b981; font-weight:800;">@${uObj.username} • 💬 DM Open</div>
                            <div style="font-size:12px; color:#38bdf8; margin-top:2px;">${(uObj.bio || 'Student').replace(/</g, '&lt;')}</div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); text-align:center; background:#090d16; border:1px solid #1e293b; border-radius:12px; padding:8px 4px; margin-bottom:12px;">
                        <div>
                            <div style="font-size:15px; font-weight:900; color:#fff;">${userPosts.length}</div>
                            <div style="font-size:10.5px; color:#94a3b8;">Posts</div>
                        </div>
                        <div style="border-left:1px solid #1e293b; border-right:1px solid #1e293b;">
                            <div style="font-size:15px; font-weight:900; color:#38bdf8;">${uObj.followers || 0}</div>
                            <div style="font-size:10.5px; color:#94a3b8;">Followers</div>
                        </div>
                        <div>
                            <div style="font-size:15px; font-weight:900; color:#38bdf8;">${uObj.following || 0}</div>
                            <div style="font-size:10.5px; color:#94a3b8;">Following</div>
                        </div>
                    </div>

                    <!-- ALWAYS SHOWS BOTH BUTTONS SIDE-BY-SIDE (50% - 50%): 1 FOLLOW + 1 MESSAGE -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%;">
                        <button type="button" onclick="NexusProfileFix.toggleFollowInstant('${safeU}')" style="height:44px; background:${isFollowing ? '#1e293b' : '#2563eb'}; color:#ffffff; border:${isFollowing ? '1.5px solid #38bdf8' : 'none'}; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            ${isFollowing ? '✓ Following' : '+ Follow'}
                        </button>
                        <button type="button" onclick="document.getElementById('nx-vip-profile-modal').style.display='none'; if(window.NexusDM) NexusDM.openDirectChat('${safeU}', '${safeN}', '');" style="height:44px; background:#10b981; color:#020617; border:none; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            💬 Message
                        </button>
                    </div>
                </div>

                <div style="font-size:11.5px; font-weight:900; color:#94a3b8; margin-bottom:8px;">⊞ SHARED POSTS (${userPosts.length})</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    ${userPosts.length === 0
                        ? `<div style="grid-column:span 2; text-align:center; padding:18px; color:#64748b; font-size:12.5px;">No posts shared yet.</div>`
                        : userPosts.slice(0, 8).map(p => `
                            <div onclick="document.getElementById('nx-vip-profile-modal').style.display='none'; Nexus.openSinglePostModal('${p.id}');" style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:8px; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; min-height:110px;">
                                ${p.img
                                    ? `<img src="${p.img}" style="width:100%; height:90px; object-fit:cover; border-radius:8px; margin-bottom:6px;">`
                                    : `<div style="flex:1; display:flex; align-items:center; justify-content:center; text-align:center; font-size:11.5px; color:#e2e8f0; padding:6px;">${(p.text || '').substring(0, 55).replace(/</g, '&lt;')}</div>`
                                }
                                <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#38bdf8; font-weight:800;">
                                    <span>❤️ ${(p.likedBy && p.likedBy.length) || p.likes || 0} • 💬 ${(p.comments && p.comments.length) || 0}</span>
                                    <span>Open ↗</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        vipModal.style.display = 'flex';
    }

    // CAPTURE-PHASE CLICK INTERCEPTOR FOR ANY PROFILE / DP CLICK!
    if (!window.__nxProfileCaptureBoundV4) {
        window.__nxProfileCaptureBoundV4 = true;
        window.addEventListener('click', function(e) {
            const el = e.target.closest('[onclick*="openPublicProfile"]');
            if (el) {
                let oc = el.getAttribute('onclick') || '';
                let m = oc.match(/openPublicProfile\(['"]([^'"]+)['"]\)/);
                if (m && m[1]) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    openIsolatedVipProfile(m[1]);
                }
            }
        }, true);
    }

    function enforceVipProfileLock() {
        if (window.Nexus) {
            Nexus.openPublicProfile = openIsolatedVipProfile;
        }
        const gm = document.getElementById('nx-global-modal');
        if (gm && gm.style.display !== 'none' && (gm.innerText || '').includes('Member Full Profile')) {
            let m = (gm.innerText || '').match(/@([a-zA-Z0-9_.-]+)/);
            if (m && m[1]) {
                gm.style.display = 'none';
                openIsolatedVipProfile(m[1]);
            }
        }
    }

    window.NexusProfileFix = {
        openProfile: openIsolatedVipProfile,
        toggleFollowInstant: function(username) {
            if (window.Nexus && Nexus.toggleFollow) {
                Nexus.toggleFollow(username);
                setTimeout(() => openIsolatedVipProfile(username), 80);
            }
        }
    };

    if (!window.__nxProfileFixV4Timer) {
        window.__nxProfileFixV4Timer = setInterval(enforceVipProfileLock, 250);
    }
    enforceVipProfileLock();
})(); // === END OF PROFILEFIX.JS ===
