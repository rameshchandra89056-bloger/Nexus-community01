// === CARDS.JS (v27.0 PURE 4-CARDS, CHALLENGER TEST & PDF VAULT — NEVER OVERWRITES NEXUSCHAT!) ===
(function() {
    const PDFS = [
        { title: '📐 JEE Main & Advanced Formula Handbook (PCM)', sub: 'JEE PCM', url: 'https://ncert.nic.in/textbook/pdf/keph103.pdf' },
        { title: '⚡ Physics Class 11 & 12 Revision Notes', sub: 'Physics', url: 'https://ncert.nic.in/textbook/pdf/leph101.pdf' },
        { title: '🧪 Organic & Physical Chemistry Sheet', sub: 'Chemistry', url: 'https://ncert.nic.in/textbook/pdf/lech201.pdf' },
        { title: '🧬 NEET Biology NCERT Short Notes', sub: 'NEET Bio', url: 'https://ncert.nic.in/textbook/pdf/kebo101.pdf' }
    ];

    window.NexusCards = {
        openChallengerApp: function() {
            const cr = document.getElementById('nx-chat-room'); if (cr) cr.style.display = 'none';
            let p = document.getElementById('nx-challenger-v27');
            if (!p) { p = document.createElement('div'); p.id = 'nx-challenger-v27'; p.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:200100;display:none;flex-direction:column;'; document.body.appendChild(p); }
            p.innerHTML = `<div style="height:52px;background:#0f172a;border-bottom:1.5px solid #f59e0b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><strong style="color:#fde047;font-size:14px;">🔥 Challenger Live Test Series</strong><button onclick="document.getElementById('nx-challenger-v27').style.display='none'" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:8px;font-weight:900;">Close ✕</button></div><iframe src="https://challengers-live.netlify.app" style="flex:1;width:100%;border:none;background:#090d16;" allow="fullscreen"></iframe>`;
            p.style.display = 'flex';
        },
        openPdfVaultApp: function() {
            const cr = document.getElementById('nx-chat-room'); if (cr) cr.style.display = 'none';
            let v = document.getElementById('nx-pdf-v27');
            if (!v) { v = document.createElement('div'); v.id = 'nx-pdf-v27'; v.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:200100;display:none;flex-direction:column;'; document.body.appendChild(v); }
            v.innerHTML = `<div style="height:52px;background:#0f172a;border-bottom:1.5px solid #38bdf8;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><strong style="color:#38bdf8;font-size:14px;">📚 Nexus PDF Study Vault</strong><button onclick="document.getElementById('nx-pdf-v27').style.display='none'" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:8px;font-weight:900;">Close ✕</button></div><div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;">${PDFS.map(it => `<div style="background:#111827;border:1px solid #1e293b;border-left:4px solid #38bdf8;border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:13px;font-weight:900;color:#fff;">${it.title}</div><div style="font-size:11px;color:#10b981;">🏷️ ${it.sub}</div></div><a href="${it.url}" target="_blank" style="background:#38bdf8;color:#020617;text-decoration:none;padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:900;">Open PDF ↗</a></div>`).join('')}</div>`;
            v.style.display = 'flex';
        }
    };

    function syncFourCardsOnly() {
        const banner = document.getElementById('nx-dm-inbox-banner');
        if (banner && !document.getElementById('nx-structured-4card-grid')) {
            banner.innerHTML = `<div id="nx-structured-4card-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div onclick="if(window.NexusDmInbox)NexusDmInbox.openFullScreenDmHub();" style="background:#111827;border:1.5px solid #10b981;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">💬</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">1:1 Personal DM</div><div style="font-size:10.5px;color:#6ee7b7;font-weight:700;">Friends • Calls & DJ →</div></div>
                <div onclick="if(window.NexusAI)NexusAI.openStudio();" style="background:#111827;border:1.5px solid #a78bfa;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">🤖</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">Private AI Studio</div><div style="font-size:10.5px;color:#d8b4fe;font-weight:700;">Swara • Image Gen →</div></div>
                <div onclick="NexusCards.openChallengerApp()" style="background:#111827;border:1.5px solid #f59e0b;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">📝</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">Live Test Series</div><div style="font-size:10.5px;color:#fde047;font-weight:700;">JEE / NEET Arena →</div></div>
                <div onclick="NexusCards.openPdfVaultApp()" style="background:#111827;border:1.5px solid #38bdf8;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">📚</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">PDF Study Vault</div><div style="font-size:10.5px;color:#38bdf8;font-weight:700;">Notes, Books & PYQs →</div></div>
            </div>`;
        }
        // Only intercept jee_pcm and notes_lib without touching original NexusChat!
        if (window.NexusChat && NexusChat.openChatRoom && !NexusChat.__nxCardHookV27) {
            const origOpen = NexusChat.openChatRoom.bind(NexusChat);
            NexusChat.openChatRoom = function(roomId, title, sub) {
                if (roomId === 'jee_pcm') return NexusCards.openChallengerApp();
                if (roomId === 'notes_lib') return NexusCards.openPdfVaultApp();
                return origOpen(roomId, title, sub);
            };
            NexusChat.__nxCardHookV27 = true;
        }
    }

    syncFourCardsOnly();
    setInterval(syncFourCardsOnly, 400);
})();
// === END CARDS.JS ===
