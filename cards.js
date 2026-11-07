// ================= CARDS.JS (v3.0 NO ANIMATIONS + REAL IN-APP PDF STUDY VAULT & CHALLENGER PORTAL — FIXES SCREENSHOTS 1000073608.jpg & 1000073607.jpg) =================

(function() {
    const CHALLENGER_URL = 'https://challengers-live.netlify.app';
    let pdfVaultList = [];
    let pdfVaultUnsub = null;

    // Built-in Starter JEE/NEET Study PDFs + Syncs user-uploaded PDFs from Firestore!
    const DEFAULT_STUDY_PDFS = [
        { title: '📐 JEE Main & Advanced Complete Formula Handbook (PCM)', subject: 'JEE PCM', pages: 'Full Revision PDF', url: 'https://ncert.nic.in/textbook/pdf/keph103.pdf' },
        { title: '⚡ Physics Class 11 & 12 Mechanics + Electrostatics Notes', subject: 'Physics', pages: 'Chapterwise Notes', url: 'https://ncert.nic.in/textbook/pdf/leph101.pdf' },
        { title: '🧪 Organic & Physical Chemistry Named Reactions Sheet', subject: 'Chemistry', pages: 'Quick Chart PDF', url: 'https://ncert.nic.in/textbook/pdf/lech201.pdf' },
        { title: '🧬 NEET Biology NCERT Line-by-Line High Yield Notes', subject: 'NEET Bio', pages: 'Revision Sheet', url: 'https://ncert.nic.in/textbook/pdf/kebo101.pdf' }
    ];

    if (!document.getElementById('nx-cards-mod-style-v3')) {
        const st = document.createElement('style');
        st.id = 'nx-cards-mod-style-v3';
        st.innerHTML = `
            /* Kill all animations on community/chat cards as requested */
            .nx-card-glow-beam { display: none !important; }
            #nx-dm-inbox-banner > *:not(#nx-structured-4card-grid), #nx-pro-dm-home-card { display: none !important; }
            #nx-structured-4card-grid {
                display: grid !important; grid-template-columns: 1fr 1fr !important;
                gap: 10px !important; width: 100% !important; margin-bottom: 10px !important;
            }
            .nx-half-card {
                position: relative; background: #111827;
                border: 1.5px solid #1e293b; border-radius: 18px; padding: 13px 12px;
                display: flex; flex-direction: column; justify-content: space-between;
                min-height: 108px; cursor: pointer; overflow: hidden;
            }
        `;
        document.head.appendChild(st);
    }

    function hideDuplicateRowCompletely() {
        const comm = document.getElementById('tab-community');
        if (!comm) return;
        Array.from(comm.querySelectorAll('div')).forEach(div => {
            if (div.id === 'nx-dm-inbox-banner' || div.id === 'nx-structured-4card-grid' || div.closest('#nx-structured-4card-grid')) return;
            if (div.id === 'nx-community-rooms-list' || div.id === 'nx-channel-filters') return;
            if (div.querySelector('#nx-dm-inbox-banner') || div.querySelector('#nx-community-rooms-list')) return;
            let txt = (div.innerText || '').trim();
            if (txt.includes('Live Test Series') || txt.includes('PDF Study Vault')) {
                div.style.setProperty('display', 'none', 'important');
            }
        });
    }

    function renderFourStaticCards() {
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
            <div class="nx-half-card" style="border-color:rgba(16,185,129,0.45);" onclick="if(window.NexusDmInbox && NexusDmInbox.openFullScreenDmHub) NexusDmInbox.openFullScreenDmHub();">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(16,185,129,0.18); border:1px solid #10b981; display:flex; align-items:center; justify-content:center; font-size:18px;">💬</div>
                    <span style="background:rgba(16,185,129,0.2); color:#10b981; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">${onlineCount} Live</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">1:1 Personal DM</div>
                    <div style="font-size:10.5px; color:#6ee7b7; margin-top:2px; font-weight:700;">${allUsers.length} Friends • Calls &amp; DJ →</div>
                </div>
            </div>

            <div class="nx-half-card" style="border-color:rgba(167,139,250,0.45);" onclick="if(window.NexusAI) NexusAI.openStudio();">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(139,92,246,0.2); border:1px solid #a78bfa; display:flex; align-items:center; justify-content:center; font-size:18px;">🤖</div>
                    <span style="background:rgba(167,139,250,0.2); color:#d8b4fe; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">11 Servers</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Private AI Studio</div>
                    <div style="font-size:10.5px; color:#d8b4fe; margin-top:2px; font-weight:700;">🔊 Swara • 🎨 Image Gen →</div>
                </div>
            </div>

            <div class="nx-half-card" style="border-color:rgba(245,158,11,0.45);" onclick="NexusCards.openChallengerApp()">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(245,158,11,0.18); border:1px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:18px;">📝</div>
                    <span style="background:rgba(245,158,11,0.2); color:#fde047; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">🔥 Challenger</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Live Test Series</div>
                    <div style="font-size:10.5px; color:#fde047; margin-top:2px; font-weight:700;">JEE / NEET Mock Arena →</div>
                </div>
            </div>

            <div class="nx-half-card" style="border-color:rgba(56,189,248,0.45);" onclick="NexusCards.openPdfVaultApp()">
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
        },

        // 📚 Dedicated Real In-App PDF Study Vault (Never opens notes_lib chat room!)
        openPdfVaultApp: function() {
            let vModal = document.getElementById('nx-dedicated-pdf-vault');
            if (!vModal) {
                vModal = document.createElement('div');
                vModal.id = 'nx-dedicated-pdf-vault';
                vModal.style.cssText = 'position:fixed; inset:0; width:100%; max-width:640px; height:100dvh; margin:0 auto; background:#090d16; z-index:100260; display:none; flex-direction:column; overflow:hidden;';
                document.body.appendChild(vModal);
            }

            if (window.Nexus && Nexus.db && !pdfVaultUnsub) {
                pdfVaultUnsub = Nexus.db.collection("nexus_pdf_vault").orderBy("createdAt", "desc").limit(30).onSnapshot(snap => {
                    let cloudPdfs = [];
                    snap.forEach(d => cloudPdfs.push(d.data()));
                    pdfVaultList = [...cloudPdfs, ...DEFAULT_STUDY_PDFS];
                    NexusCards.renderPdfListUI();
                }, () => {
                    pdfVaultList = [...DEFAULT_STUDY_PDFS];
                    NexusCards.renderPdfListUI();
                });
            } else if (pdfVaultList.length === 0) {
                pdfVaultList = [...DEFAULT_STUDY_PDFS];
            }

            vModal.innerHTML = `
                <div style="height:56px; background:#0f172a; border-bottom:1.5px solid #38bdf8; display:flex; align-items:center; justify-content:space-between; padding:0 14px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:9px;">
                        <button type="button" onclick="document.getElementById('nx-dedicated-pdf-vault').style.display='none'" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">←</button>
                        <div>
                            <div style="font-size:15px; font-weight:900; color:#f8fafc;">📚 Nexus PDF Study Vault</div>
                            <div style="font-size:10.5px; color:#38bdf8; font-weight:700;">JEE / NEET Notes, Formula Sheets &amp; PYQs</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="NexusCards.promptAddPdf()" style="background:#10b981; color:#020617; border:none; padding:6px 11px; border-radius:9px; font-size:11px; font-weight:900; cursor:pointer;">+ Add PDF</button>
                        <button type="button" onclick="document.getElementById('nx-dedicated-pdf-vault').style.display='none'" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:6px 10px; border-radius:9px; font-size:11px; font-weight:800; cursor:pointer;">✕</button>
                    </div>
                </div>
                <div id="nx-pdf-vault-items-box" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px;"></div>
            `;
            vModal.style.display = 'flex';
            this.renderPdfListUI();
        },

        renderPdfListUI: function() {
            const box = document.getElementById('nx-pdf-vault-items-box');
            if (!box) return;
            box.innerHTML = pdfVaultList.map(item => `
                <div style="background:#111827; border:1px solid #1e293b; border-left:4px solid #38bdf8; border-radius:14px; padding:12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div style="min-width:0; flex:1;">
                        <div style="font-size:13.5px; font-weight:900; color:#f8fafc; margin-bottom:3px;">${(item.title || 'Study PDF').replace(/</g, '&lt;')}</div>
                        <div style="font-size:11px; color:#10b981; font-weight:800;">🏷️ ${(item.subject || 'Notes').replace(/</g, '&lt;')} • 📄 ${(item.pages || 'PDF').replace(/</g, '&lt;')}</div>
                    </div>
                    <a href="${item.url}" target="_blank" style="background:#38bdf8; color:#020617; text-decoration:none; padding:8px 13px; border-radius:10px; font-size:11.5px; font-weight:900; flex-shrink:0;">Open PDF ↗</a>
                </div>
            `).join('');
        },

        promptAddPdf: async function() {
            let title = prompt("Enter PDF / Study Note Title (e.g. Rotational Motion Short Notes):");
            if (!title || !title.trim()) return;
            let url = prompt("Paste Google Drive or Direct PDF Link (https://...):");
            if (!url || !url.trim().startsWith('http')) return;
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_pdf_vault").add({
                    title: title.trim(),
                    subject: me ? `Shared by @${me.username}` : 'Community PDF',
                    pages: 'Cloud PDF',
                    url: url.trim(),
                    createdAt: Date.now()
                });
                Nexus.toast("📚 PDF Added to Vault!");
            }
        }
    };

    // Also hook top-right "📄 PDF" button inside Group Chat header so it opens this PDF Vault!
    function bindGroupHeaderPdfBtn() {
        document.querySelectorAll('#nx-chat-room button').forEach(b => {
            if ((b.innerText || '').includes('PDF') && !b.getAttribute('data-pdf-v3')) {
                b.setAttribute('data-pdf-v3', '1');
                b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); NexusCards.openPdfVaultApp(); };
            }
        });
    }

    if (!window.__nxCardsIntervalV3) {
        window.__nxCardsIntervalV3 = setInterval(() => {
            hideDuplicateRowCompletely();
            renderFourStaticCards();
            bindGroupHeaderPdfBtn();
        }, 600);
    }
    hideDuplicateRowCompletely();
    renderFourStaticCards();
})(); // === END OF CARDS.JS ===
