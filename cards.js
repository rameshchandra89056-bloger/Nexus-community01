// ================= CARDS.JS (DEDICATED 4 GLOWING COMMUNITY CARDS + CHALLENGER LIVE TEST PORTAL https://challengers-live.netlify.app + DUPLICATE REMOVER) =================

(function() {
    const CHALLENGER_URL = 'https://challengers-live.netlify.app';

    if (!document.getElementById('nx-cards-mod-style')) {
        const st = document.createElement('style');
        st.id = 'nx-cards-mod-style';
        st.innerHTML = `
            #nx-dm-inbox-banner > *:not(#nx-structured-4card-grid), #nx-pro-dm-home-card { display: none !important; }
            #nx-structured-4card-grid {
                display: grid !important; grid-template-columns: 1fr 1fr !important;
                gap: 10px !important; width: 100% !important; margin-bottom: 10px !important;
            }
            .nx-half-card {
                position: relative; background: linear-gradient(145deg, #111827 0%, #090d16 100%);
                border: 1.5px solid #1e293b; border-radius: 18px; padding: 13px 12px;
                display: flex; flex-direction: column; justify-content: space-between;
                min-height: 110px; cursor: pointer; overflow: hidden;
                transition: transform 0.16s ease; box-shadow: 0 8px 22px rgba(0,0,0,0.55);
            }
            .nx-half-card:active { transform: scale(0.96); }
            @keyframes nxBeamRun {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
            .nx-card-glow-beam {
                position: absolute; top: 0; left: 0; right: 0; height: 3px;
                background: rgba(255, 255, 255, 0.08); overflow: hidden;
            }
            .nx-card-glow-beam::after {
                content: ''; position: absolute; top: 0; left: 0; width: 55%; height: 100%;
                background: linear-gradient(90deg, transparent, var(--beam-color, #10b981), #ffffff, transparent);
                animation: nxBeamRun 2.5s linear infinite;
            }
        `;
        document.head.appendChild(st);
    }

    function hideDuplicateBottomCards() {
        const comm = document.getElementById('tab-community');
        if (!comm) return;
        comm.querySelectorAll('div, button, a').forEach(el => {
            if (el.closest('#nx-structured-4card-grid') || el.id === 'nx-structured-4card-grid') return;
            let txt = (el.innerText || '').trim();
            if ((txt === 'Live Test Series' || txt.startsWith('PDF Study Vault')) && el.tagName !== 'BODY') {
                let p = el.parentElement;
                if (p && p.id !== 'tab-community' && (p.innerText || '').includes('Live Test Series') && (p.innerText || '').includes('PDF Study Vault')) {
                    p.style.setProperty('display', 'none', 'important');
                } else {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        });
    }

    function renderFourCommunityCards() {
        const banner = document.getElementById('nx-dm-inbox-banner');
        if (!banner) return;

        let grid = document.getElementById('nx-structured-4card-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.id = 'nx-structured-4card-grid';
            banner.insertBefore(grid, banner.firstChild);
        }

        let allUsers = (window.Nexus && Nexus.users || []).filter(u => u && u.username && u.username !== 'nexus_official');
        let onlineCount = allUsers.filter(u => (Date.now() - (u.lastOnline || 0)) < 180000).length;

        grid.innerHTML = `
            <div class="nx-half-card" style="border-color:rgba(16,185,129,0.5);" onclick="if(window.NexusDmInbox && NexusDmInbox.openFullScreenDmHub) NexusDmInbox.openFullScreenDmHub(); else if(window.NexusDM && allUsers.length) NexusDM.openDirectChat('${allUsers[0] ? allUsers[0].username : 'mohiy'}', '${allUsers[0] ? (allUsers[0].name || allUsers[0].username) : 'Chat'}', '');">
                <div class="nx-card-glow-beam" style="--beam-color:#10b981;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(16,185,129,0.18); border:1px solid #10b981; display:flex; align-items:center; justify-content:center; font-size:18px;">💬</div>
                    <span style="background:rgba(16,185,129,0.2); color:#10b981; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">${onlineCount} Live</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">1:1 Personal DM</div>
                    <div style="font-size:10.5px; color:#6ee7b7; margin-top:2px; font-weight:700;">${allUsers.length} Friends • Calls &amp; DJ →</div>
                </div>
            </div>

            <div class="nx-half-card" style="border-color:rgba(167,139,250,0.5);" onclick="if(window.NexusAI) NexusAI.openStudio();">
                <div class="nx-card-glow-beam" style="--beam-color:#a78bfa;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(139,92,246,0.2); border:1px solid #a78bfa; display:flex; align-items:center; justify-content:center; font-size:18px;">🤖</div>
                    <span style="background:rgba(167,139,250,0.2); color:#d8b4fe; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">11 Servers</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Private AI Studio</div>
                    <div style="font-size:10.5px; color:#d8b4fe; margin-top:2px; font-weight:700;">🔊 Swara • 🎨 Image Gen →</div>
                </div>
            </div>

            <div class="nx-half-card" style="border-color:rgba(245,158,11,0.5);" onclick="NexusCards.openChallengerApp()">
                <div class="nx-card-glow-beam" style="--beam-color:#f59e0b;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(245,158,11,0.18); border:1px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:18px;">📝</div>
                    <span style="background:rgba(245,158,11,0.2); color:#fde047; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">🔥 Challenger</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Live Test Series</div>
                    <div style="font-size:10.5px; color:#fde047; margin-top:2px; font-weight:700;">Open Challenger App →</div>
                </div>
            </div>

            <div class="nx-half-card" style="border-color:rgba(56,189,248,0.5);" onclick="if(window.NexusUltra && NexusUltra.openPdfLibraryModal) NexusUltra.openPdfLibraryModal(); else if(window.NexusChat) NexusChat.openChatRoom('notes_lib', '📚 PDF Study Vault', 'Notes, Books & PYQs');">
                <div class="nx-card-glow-beam" style="--beam-color:#38bdf8;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(56,189,248,0.18); border:1px solid #38bdf8; display:flex; align-items:center; justify-content:center; font-size:18px;">📚</div>
                    <span style="background:rgba(56,189,248,0.2); color:#38bdf8; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">Free PDFs</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">PDF Study Vault</div>
                    <div style="font-size:10.5px; color:#38bdf8; margin-top:2px; font-weight:700;">Notes, Books &amp; PYQs →</div>
                </div>
            </div>
        `;
    }

    window.NexusCards = {
        openChallengerApp: function() {
            let portal = document.getElementById('nx-challenger-inapp-portal');
            if (!portal) {
                portal = document.createElement('div');
                portal.id = 'nx-challenger-inapp-portal';
                portal.style.cssText = 'position:fixed; inset:0; width:100%; max-width:640px; height:100dvh; margin:0 auto; background:#090d16; z-index:100250; display:none; flex-direction:column; overflow:hidden;';
                document.body.appendChild(portal);
            }
            portal.innerHTML = `
                <div style="height:54px; background:#0f172a; border-bottom:1.5px solid #f59e0b; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button type="button" onclick="document.getElementById('nx-challenger-inapp-portal').style.display='none'" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">←</button>
                        <div>
                            <div style="font-size:14px; font-weight:900; color:#fde047;">🔥 Challenger Live Test Series</div>
                            <div style="font-size:10px; color:#10b981; font-weight:700;">challengers-live.netlify.app</div>
                        </div>
                    </div>
                    <button type="button" onclick="document.getElementById('nx-challenger-inapp-portal').style.display='none'" style="background:#ef4444; border:none; color:white; padding:6px 12px; border-radius:9px; font-size:11px; font-weight:900; cursor:pointer;">Close ✕</button>
                </div>
                <iframe src="${CHALLENGER_URL}" style="flex:1; width:100%; border:none; background:#090d16;" allow="fullscreen; clipboard-write"></iframe>
            `;
            portal.style.display = 'flex';
        }
    };

    if (!window.__nxCardsInterval) {
        window.__nxCardsInterval = setInterval(() => {
            hideDuplicateBottomCards();
            renderFourCommunityCards();
        }, 700);
    }
    hideDuplicateBottomCards();
    renderFourCommunityCards();
})(); // === END OF CARDS.JS ===
