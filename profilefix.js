// ================= PROFILEFIX.JS (v2.0 SINGLE CLEAN MESSAGE BUTTON & GLOBAL SEARCH): 👤 ENSURES STRICTLY 1 '+ FOLLOW' AND 1 '💬 MESSAGE' BUTTON ON EVERY PROFILE (FIXES DOUBLE MESSAGE BUTTON IN SCREENSHOT 1000073548.jpg) =================

(function() {
    function enforceSingleFollowAndMessageButton() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none') return;

        const allBtns = Array.from(modal.querySelectorAll('button'));
        const followBtn = allBtns.find(b => {
            let t = (b.innerText || '').replace(/\s+/g, ' ').trim();
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

        // Remove ANY duplicate "Message" buttons inside the modal first!
        allBtns.forEach(b => {
            if (b !== followBtn && !b.classList.contains('nx-single-msg-btn-v2')) {
                let txt = (b.innerText || '').trim();
                let id = b.id || '';
                if (txt.includes('Message') || id === 'nx-dm-trigger-btn') {
                    b.remove();
                }
            }
        });

        let parent = followBtn.parentElement;
        if (!parent) return;

        parent.style.setProperty('display', 'flex', 'important');
        parent.style.setProperty('gap', '10px', 'important');
        parent.style.setProperty('width', '100%', 'important');
        parent.style.setProperty('align-items', 'center', 'important');

        followBtn.style.setProperty('flex', '1', 'important');
        followBtn.style.setProperty('width', 'auto', 'important');
        followBtn.style.setProperty('margin', '0', 'important');
        followBtn.style.setProperty('height', '44px', 'important');

        let existingMsgBtn = parent.querySelector('.nx-single-msg-btn-v2');
        if (!existingMsgBtn) {
            existingMsgBtn = document.createElement('button');
            existingMsgBtn.type = 'button';
            existingMsgBtn.className = 'nx-single-msg-btn-v2';
            existingMsgBtn.style.cssText = 'flex:1 !important; height:44px !important; background:linear-gradient(135deg,#10b981,#059669) !important; color:#020617 !important; border:none !important; padding:0 12px !important; border-radius:12px !important; font-weight:900 !important; font-size:13.5px !important; cursor:pointer !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; gap:6px !important; box-shadow:0 4px 14px rgba(16,185,129,0.3) !important;';
            existingMsgBtn.innerHTML = `💬 Message`;
            parent.appendChild(existingMsgBtn);
        }

        existingMsgBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.style.display = 'none';
            if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
        };

        // Keep a hidden dummy span so legacy dm.js never throws a null error
        if (!document.getElementById('nx-dm-trigger-btn')) {
            const dummy = document.createElement('span');
            dummy.id = 'nx-dm-trigger-btn';
            dummy.style.display = 'none';
            modal.appendChild(dummy);
        }
    }

    if (!window.__nxProfileFixV2Interval) {
        window.__nxProfileFixV2Interval = setInterval(enforceSingleFollowAndMessageButton, 400);
    }
    enforceSingleFollowAndMessageButton();
})(); // === END OF PROFILEFIX.JS ===
