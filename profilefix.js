// === PROFILEFIX.JS (v25.0 CLEAN — ONLY ADDS SINGLE MESSAGE BUTTON TO ORIGINAL PROFILE) ===
(function() {
    function bindOriginalProfileMessageBtn() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none' || !(modal.innerText || '').includes('Member Full Profile')) return;
        const btns = Array.from(modal.querySelectorAll('button'));
        const followBtn = btns.find(b => {
            let t = (b.innerText || '').trim(), oc = b.getAttribute('onclick') || '';
            return oc.includes('toggleFollow') || t === '+ Follow' || t === '✓ Following' || t === 'Following';
        });
        if (!followBtn) return;

        let uMatch = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/) || (modal.innerText || '').match(/@([a-zA-Z0-9_.-]+)/);
        if (!uMatch || !uMatch[1]) return;
        let targetU = uMatch[1].trim();
        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetU.toLowerCase());
        let targetN = (uObj && uObj.name) ? uObj.name : targetU;

        btns.forEach(b => {
            if (b !== followBtn && !b.classList.contains('nx-msg-v25') && ((b.innerText || '').includes('Message') || b.id === 'nx-dm-trigger-btn')) {
                b.remove();
            }
        });

        let row = followBtn.parentElement;
        if (!row) return;
        row.style.cssText = 'display:grid !important; grid-template-columns:1fr 1fr !important; gap:10px !important; width:100% !important;';
        followBtn.style.cssText += ';width:100% !important; height:44px !important; margin:0 !important;';

        let msgBtn = row.querySelector('.nx-msg-v25');
        if (!msgBtn) {
            msgBtn = document.createElement('button');
            msgBtn.type = 'button';
            msgBtn.className = 'nx-msg-v25';
            msgBtn.style.cssText = 'width:100% !important; height:44px !important; background:#10b981 !important; color:#020617 !important; border:none !important; border-radius:12px !important; font-weight:900 !important; font-size:13.5px !important; cursor:pointer !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:6px !important;';
            msgBtn.innerHTML = '💬 Message';
            row.appendChild(msgBtn);
        }
        msgBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.style.display = 'none';
            if (window.NexusDM) NexusDM.openDirectChat(targetU, targetN, '');
        };
    }

    bindOriginalProfileMessageBtn();
    setInterval(bindOriginalProfileMessageBtn, 250);
})();
// === END PROFILEFIX.JS ===
