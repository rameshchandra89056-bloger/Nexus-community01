// === PROFILEFIX.JS (v5.0 RESTORES ORIGINAL 13 FOLLOWERS MODAL + 1 MESSAGE BUTTON) ===
(function() {
    // 1. Delete the broken 0-followers modal from Screenshot 1000073615
    const badModal = document.getElementById('nx-vip-profile-modal');
    if (badModal) badModal.remove();

    function fixOriginalProfileModal() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none') return;
        if (!(modal.innerText || '').includes('Member Full Profile')) return;

        const btns = Array.from(modal.querySelectorAll('button'));
        const followBtn = btns.find(b => {
            let t = (b.innerText || '').trim();
            let oc = b.getAttribute('onclick') || '';
            return oc.includes('toggleFollow') || t === '+ Follow' || t === '✓ Following' || t === 'Following';
        });
        if (!followBtn) return;

        let uMatch = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/) || (modal.innerText || '').match(/@([a-zA-Z0-9_.-]+)/);
        if (!uMatch || !uMatch[1]) return;
        let targetU = uMatch[1].trim();
        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetU.toLowerCase());
        let safeU = targetU.replace(/'/g, "\\'");
        let safeN = ((uObj && uObj.name) ? uObj.name : targetU).replace(/'/g, "\\'");

        // Remove any extra duplicate Message buttons
        btns.forEach(b => {
            if (b !== followBtn && !b.classList.contains('nx-clean-msg-v5')) {
                if ((b.innerText || '').includes('Message') || b.id === 'nx-dm-trigger-btn') b.remove();
            }
        });

        let row = followBtn.parentElement;
        if (!row) return;
        row.style.cssText = 'display:grid !important; grid-template-columns:1fr 1fr !important; gap:10px !important; width:100% !important;';
        followBtn.style.cssText += ';width:100% !important; height:44px !important; margin:0 !important;';

        let msgBtn = row.querySelector('.nx-clean-msg-v5');
        if (!msgBtn) {
            msgBtn = document.createElement('button');
            msgBtn.type = 'button';
            msgBtn.className = 'nx-clean-msg-v5';
            msgBtn.style.cssText = 'width:100% !important; height:44px !important; background:#10b981 !important; color:#020617 !important; border:none !important; border-radius:12px !important; font-weight:900 !important; font-size:13.5px !important; cursor:pointer !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:6px !important;';
            msgBtn.innerHTML = '💬 Message';
            row.appendChild(msgBtn);
        }
        msgBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            modal.style.display = 'none';
            if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
        };
    }

    setInterval(fixOriginalProfileModal, 250);
    fixOriginalProfileModal();
})();
// === END OF PROFILEFIX.JS ===
