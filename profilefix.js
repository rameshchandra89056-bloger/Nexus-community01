// ================= PROFILEFIX.JS (DEDICATED PUBLIC PROFILE '+ FOLLOW' & '💬 MESSAGE' BUTTONS + TOP GLOBAL SEARCH MODULE) =================

(function() {
    function enforceFollowAndMessageButtons() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none') return;

        const allBtns = Array.from(modal.querySelectorAll('button'));
        const followBtn = allBtns.find(b => {
            let t = (b.innerText || '').trim();
            let oc = b.getAttribute('onclick') || '';
            return t === '+ Follow' || t === 'Following' || t === '✓ Following' || t === 'Unfollow' || oc.includes('toggleFollow');
        });
        if (!followBtn) return;

        let targetUser = '';
        let oc = followBtn.getAttribute('onclick') || '';
        let m = oc.match(/'([^']+)'/);
        if (m && m[1]) targetUser = m[1];
        if (!targetUser) {
            let atMatch = (modal.innerText || '').match(/@([a-zA-Z0-9_.-]+)/);
            if (atMatch && atMatch[1]) targetUser = atMatch[1];
        }
        if (!targetUser) return;

        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetUser.toLowerCase());
        let targetName = (uObj && uObj.name) ? uObj.name : targetUser;
        let safeU = targetUser.replace(/'/g, "\\'");
        let safeN = targetName.replace(/'/g, "\\'");

        let parent = followBtn.parentElement;
        if (!parent) return;
        parent.querySelectorAll('#nx-dm-trigger-btn').forEach(el => el.removeAttribute('id'));

        if (!modal.querySelector('.nx-profile-msg-partner-btn')) {
            let wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex !important; gap:10px !important; width:100% !important; margin:10px 0 !important; align-items:center !important;';
            followBtn.parentNode.insertBefore(wrapper, followBtn);
            wrapper.appendChild(followBtn);

            followBtn.style.setProperty('flex', '1', 'important');
            followBtn.style.setProperty('width', 'auto', 'important');
            followBtn.style.setProperty('margin', '0', 'important');

            const msgBtn = document.createElement('button');
            msgBtn.type = 'button';
            msgBtn.className = 'nx-profile-msg-partner-btn';
            msgBtn.style.cssText = 'flex:1 !important; background:linear-gradient(135deg,#10b981,#059669) !important; color:#020617 !important; border:none !important; padding:11px !important; border-radius:12px !important; font-weight:900 !important; font-size:13.5px !important; cursor:pointer !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; gap:6px !important; box-shadow:0 4px 14px rgba(16,185,129,0.35) !important;';
            msgBtn.innerHTML = `💬 Message`;
            msgBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                modal.style.display = 'none';
                if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
            };
            wrapper.appendChild(msgBtn);
        }
    }

    function installGlobalSearchModal() {
        if (!window.Nexus) return;
        Nexus.openSearch = function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #38bdf8; max-width:420px; width:100%; max-height:82dvh; display:flex; flex-direction:column; background:#090d16; padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="font-size:15.5px; color:#f8fafc;">🔍 Search Members, Friends &amp; Posts</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                    </div>
                    <input type="text" id="nx-global-search-in" oninput="NexusProfileFix.runSearch(this.value)" placeholder="Type member name, @username, or study post..." autocomplete="off" style="width:100%; padding:11px 14px; border-radius:12px; border:1.5px solid #38bdf8; background:#111827; color:white; font-size:13.5px; outline:none; margin-bottom:10px;">
                    <div id="nx-global-search-results" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; max-height:60dvh;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-global-search-in');
            if (inp) inp.focus();
            NexusProfileFix.runSearch('');
        };
    }

    window.NexusProfileFix = {
        runSearch: function(rawQuery) {
            const resBox = document.getElementById('nx-global-search-results');
            if (!resBox) return;
            let q = (rawQuery || '').toLowerCase().trim().replace(/^@/, '');
            let users = (Nexus.users || []).filter(u =>
                u && u.username && u.username !== 'nexus_official' && (
                    !q || u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q)) || (u.bio && u.bio.toLowerCase().includes(q))
                )
            ).slice(0, 12);

            let posts = (Nexus.posts || []).filter(p =>
                p && p.id && (
                    !q || (p.text && p.text.toLowerCase().includes(q)) || (p.author && p.author.toLowerCase().includes(q)) || (p.username && p.username.toLowerCase().includes(q))
                )
            ).slice(0, 10);

            let uHTML = users.map(u => {
                let safeU = u.username.replace(/'/g, "\\'");
                let safeN = (u.name || u.username).replace(/'/g, "\\'");
                let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();
                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 11px; background:#161f33; border:1px solid #1e293b; border-radius:12px;">
                        <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');" style="display:flex; align-items:center; gap:10px; flex:1; cursor:pointer;">
                            <div style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; overflow:hidden;">
                                ${u.dp ? `<img src="${u.dp}" style="width:100%; height:100%; object-fit:cover;">` : ch}
                            </div>
                            <div>
                                <div style="font-size:13.5px; font-weight:800; color:#f8fafc;">${u.name || u.username}</div>
                                <div style="font-size:11px; color:#38bdf8;">@${u.username} • ${u.bio || 'Student'}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:5px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">👤 Profile</button>
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusDM) NexusDM.openDirectChat('${safeU}', '${safeN}', '');" style="background:#10b981; border:none; color:#020617; padding:5px 9px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer;">💬 Chat</button>
                        </div>
                    </div>
                `;
            }).join('');

            let pHTML = posts.map(p => `
                <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openSinglePostModal('${p.id}');" style="padding:10px 12px; background:#101726; border:1px solid #1e293b; border-left:3px solid #38bdf8; border-radius:12px; cursor:pointer;">
                    <div style="font-size:11.5px; color:#38bdf8; font-weight:800; margin-bottom:3px;">📸 @${p.username || p.author}</div>
                    <div style="font-size:13px; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(p.text || 'Photo Note').replace(/</g, '&lt;')}</div>
                </div>
            `).join('');

            resBox.innerHTML = `
                ${uHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800;">👤 MEMBERS (${users.length})</div>${uHTML}` : ''}
                ${pHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-top:6px;">📝 POSTS (${posts.length})</div>${pHTML}` : ''}
                ${(!uHTML && !pHTML) ? `<div style="text-align:center; padding:18px; color:#64748b; font-size:13px;">No results found for "${rawQuery}"</div>` : ''}
            `;
        }
    };

    if (!window.__nxProfileFixInterval) {
        window.__nxProfileFixInterval = setInterval(() => {
            enforceFollowAndMessageButtons();
            installGlobalSearchModal();
        }, 450);
    }
    enforceFollowAndMessageButtons();
    installGlobalSearchModal();
})(); // === END OF PROFILEFIX.JS ===
