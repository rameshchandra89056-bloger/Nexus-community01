// ================= FINAL PRO.JS (v4.0 CLEAN MASTER — ZERO CRASHES, ZERO DUPLICATES): 📐 COMPACT 4-COLUMN + TRAY + 🤖 REAL GEMINI AI SOLVER CARD + ⚡ 30s QUIZ BATTLE (WITH JEE RANDOM BANK) + 💻 EXPANDABLE CODE BOX + 📸 5-THEME HD STATUS POSTER STUDIO =================

(function() {
    if (window.__NEXUS_PRO_FIXED_V4__) return;
    window.__NEXUS_PRO_FIXED_V4__ = true;

    let collabDesktopFit = false;
    let selectedPosterTheme = 'galaxy';
    let lastQuizTargetIsDm = true;

    const DEFAULT_COLLAB_URL = 'https://challengers-live.netlify.app';
    if (!localStorage.getItem('nx_partner_test_url')) {
        try { localStorage.setItem('nx_partner_test_url', DEFAULT_COLLAB_URL); } catch (e) {}
    }

    const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const isTypingOrHidden = () => {
        if (document.visibilityState === 'hidden') return true;
        const ae = document.activeElement;
        if (!ae) return false;
        const t = (ae.tagName || '').toUpperCase();
        return t === 'INPUT' || t === 'TEXTAREA' || ae.isContentEditable === true;
    };

    const POSTER_THEMES = {
        galaxy:  { label: '🌌 Galaxy',  c1: '#090d16', c2: '#1e1b4b', c3: '#064e3b', border: '#38bdf8' },
        emerald: { label: '🌲 Emerald', c1: '#022c22', c2: '#065f46', c3: '#0f172a', border: '#10b981' },
        sunset:  { label: '🔥 Sunset',  c1: '#450a0a', c2: '#9a3412', c3: '#1e1b4b', border: '#fb923c' },
        cyber:   { label: '⚡ Cyber',   c1: '#0f172a', c2: '#3b0764', c3: '#083344', border: '#c084fc' },
        gold:    { label: '👑 Gold',    c1: '#090d16', c2: '#422006', c3: '#0f172a', border: '#fbbf24' }
    };

    const QUICK_QUIZ_BANK = [
        { q: "SI unit of Electric Flux is?", a: "N·m²/C (V·m)", b: "N·C/m²", ans: "A" },
        { q: "Derivative of sin(2x) w.r.t x is?", a: "2 cos(2x)", b: "cos(2x)", ans: "A" },
        { q: "Hybridization of Carbon in Diamond is?", a: "sp²", b: "sp³", ans: "B" },
        { q: "Value of lim(x→0) (sin x)/x is?", a: "0", b: "1", ans: "B" },
        { q: "Escape velocity on Earth is approximately?", a: "11.2 km/s", b: "7.9 km/s", ans: "A" },
        { q: "In JavaScript, typeof null returns?", a: "'null'", b: "'object'", ans: "B" },
        { q: "pH of pure neutral water at 25°C is?", a: "7", b: "14", ans: "A" },
        { q: "Dimensional formula of Force is?", a: "[MLT⁻²]", b: "[ML²T⁻²]", ans: "A" }
    ];

    const proStyle = document.createElement('style');
    proStyle.innerHTML = `
        #nx-partner-test-banner, .nx-yt-inplayer-controls {
            display: none !important;
        }
        /* COMPACT 4-COLUMN + TRAY SO CARDS & INPUT BAR NEVER HIDE AT BOTTOM! */
        #nx-dm-bottom-tray, #nx-grp-bottom-tray {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 7px !important;
            padding: 10px !important;
            max-height: 215px !important;
            overflow-y: auto !important;
            background: #111b21 !important;
            border-top: 1.5px solid #00a884 !important;
        }
        #nx-dm-bottom-tray button, #nx-grp-bottom-tray button {
            padding: 7px 4px !important;
            border-radius: 11px !important;
        }
        #nx-dm-bottom-tray button span:first-child, #nx-grp-bottom-tray button span:first-child {
            font-size: 18px !important;
        }
        #nx-dm-bottom-tray button span:last-child, #nx-grp-bottom-tray button span:last-child {
            font-size: 10px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
        }
        /* Desktop / Laptop / Tablet Widescreen Support */
        @media (min-width: 768px) {
            body, .nx-header, .nx-bottom-nav, .nx-fullscreen-chat-room, #nx-dm-dedicated-root {
                max-width: 1024px !important;
            }
            #nx-channels-list {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 12px !important;
            }
            #nx-my-posts-grid {
                grid-template-columns: repeat(3, 1fr) !important;
            }
            .nx-modal-box {
                max-width: 480px !important;
            }
        }
        #nx-chat-stk-grid {
            align-content: start !important;
        }
        .nx-compact-code-wrap {
            background: #050811;
            border: 1px solid #334155;
            border-left: 3.5px solid #38bdf8;
            border-radius: 11px;
            margin: 4px 0;
            overflow: hidden;
            min-width: 210px;
            max-width: 100%;
            text-align: left;
        }
        .nx-compact-code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            padding: 5px 10px;
            border-bottom: 1px solid #1e293b;
            font-size: 11px;
            color: #38bdf8;
            font-weight: 800;
        }
        .nx-compact-code-pre {
            font-family: monospace;
            font-size: 11.5px;
            color: #e2e8f0;
            padding: 8px 10px;
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 68px;
            overflow: hidden;
            transition: max-height 0.25s ease;
        }
        .nx-compact-code-pre.expanded {
            max-height: 360px;
            overflow-y: auto;
        }
        .nx-compact-code-footer {
            background: #111827;
            border-top: 1px dashed #1e293b;
            padding: 5px 10px;
            text-align: center;
            font-size: 11px;
            font-weight: 800;
            color: #10b981;
            cursor: pointer;
            user-select: none;
        }
        .nx-ai-card-pro {
            background: linear-gradient(135deg, #0f172a, #1e1b4b);
            border: 1.5px solid #a78bfa;
            border-left: 4px solid #10b981;
            border-radius: 12px;
            padding: 10px 12px;
            margin: 4px 0;
            color: #f8fafc;
            font-size: 13px;
            line-height: 1.48;
            text-align: left;
            min-width: 215px;
        }
        .nx-quiz-battle-card {
            background: linear-gradient(135deg, #0f172a, #1e1b4b);
            border: 1.5px solid #fbbf24;
            border-radius: 14px;
            padding: 10px 12px;
            margin: 4px 0;
            min-width: 225px;
            text-align: left;
        }
    `;
    document.head.appendChild(proStyle);

    // =========================================================================
    // 1. 👑 CLEAN NEXUS BRAND WATERMARK (USED ONLY FOR STATUS POSTERS & SAVED DOWNLOADS)
    //    FIXED: Never overwrites Nexus.compressImage to deface uploaded study notes!
    // =========================================================================
    function stampNexusPremiumWatermarkOnCanvas(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        if (w < 120 || h < 120) return;

        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let uTag = me && me.username ? `@${me.username}` : 'Official Community';
        let label = `⚡ NEXUS • ${uTag}`;

        let fontSize = Math.max(11, Math.min(22, Math.round(w * 0.028)));
        ctx.save();
        ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
        let textW = ctx.measureText(label).width;
        let padX = fontSize * 0.8;
        let padY = fontSize * 0.5;
        let boxW = textW + padX * 2;
        let boxH = fontSize + padY * 2;
        let boxX = w - boxW - Math.round(w * 0.025);
        let boxY = h - boxH - Math.round(h * 0.025);

        ctx.fillStyle = 'rgba(9, 13, 22, 0.82)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, boxH / 2);
        else ctx.rect(boxX, boxY, boxW, boxH);
        ctx.fill();

        ctx.lineWidth = Math.max(1.5, fontSize * 0.1);
        ctx.strokeStyle = '#10b981';
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, boxX + padX, boxY + boxH / 2 + 1);
        ctx.restore();
    }

    // =========================================================================
    // 2. COMPACT 4-COLUMN + TRAYS (ROUTED CLEANLY TO AUTHORITATIVE ENGINES!)
    // =========================================================================
    function rebuildCleanFourColumnPlusTrays() {
        const dmTray = document.getElementById('nx-dm-bottom-tray');
        if (dmTray && !dmTray.getAttribute('data-4col-built')) {
            dmTray.setAttribute('data-4col-built', '1');
            dmTray.innerHTML = `
                <button type="button" onclick="NexusPower.toggleBottomTray(false); document.getElementById('nx-dm-file-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#f8fafc; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📷</span><span style="font-weight:800;">Photo</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPower.toggleViewOnceMode();" style="background:#202c33; border:1px dashed #00a884; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>①</span><span style="font-weight:800;">View-Once</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); document.getElementById('nx-dm-doc-file-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📂</span><span style="font-weight:800;">PDF/File</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'mp3'); else if(window.NexusPower) NexusPower.openSongSearchModal();" style="background:#202c33; border:1px solid #2a3942; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎵</span><span style="font-weight:800;">Full Song</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'yt'); else if(window.NexusAdvance) NexusAdvance.openInAppYouTubeTV(true);" style="background:#202c33; border:1px solid #ef4444; color:#ef4444; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>▶️</span><span style="font-weight:800;">Watch TV</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); if(window.startNew1v1LiveGame) window.startNew1v1LiveGame('ttt'); else if(window.NexusAdvance) NexusAdvance.openLiveGameModal(true, 1);" style="background:#202c33; border:1px solid #38bdf8; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎮</span><span style="font-weight:800;">1v1 Game</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openAiSolverModal(true);" style="background:#202c33; border:1px solid #a78bfa; color:#a78bfa; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🤖</span><span style="font-weight:800;">Ask AI</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openQuizBattleModal(true);" style="background:#202c33; border:1px solid #fbbf24; color:#fbbf24; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>⚡</span><span style="font-weight:800;">30s Quiz</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); if(window.NexusSuperChat) NexusSuperChat.openLiveSketchpadModal(true);" style="background:#202c33; border:1px solid #34d399; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎨</span><span style="font-weight:800;">Sketch</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); if(window.NexusAdvance && NexusAdvance.openPasswordLockComposer) NexusAdvance.openPasswordLockComposer(true);" style="background:#202c33; border:1px solid #fde047; color:#fde047; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🔑</span><span style="font-weight:800;">Pass-Lock</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openStatusCardMakerModal(true);" style="background:#202c33; border:1px solid #f472b6; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📸</span><span style="font-weight:800;">Status Card</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openDmCodeModal();" style="background:#202c33; border:1px solid #5eead4; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>💻</span><span style="font-weight:800;">Send Code</span></button>
            `;
        }

        const grpTray = document.getElementById('nx-grp-bottom-tray');
        if (grpTray && !grpTray.getAttribute('data-4col-built')) {
            grpTray.setAttribute('data-4col-built', '1');
            grpTray.innerHTML = `
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); document.getElementById('nx-chat-photo-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#f8fafc; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📷</span><span style="font-weight:800;">Photo</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); document.getElementById('nx-grp-doc-file-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📂</span><span style="font-weight:800;">PDF/File</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); if(window.NexusWatchParty) NexusWatchParty.openModal(false, 'mp3'); else if(window.NexusSuperChat) NexusSuperChat.openGroupSongModal();" style="background:#202c33; border:1px solid #2a3942; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎵</span><span style="font-weight:800;">Group DJ</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); if(window.NexusWatchParty) NexusWatchParty.openModal(false, 'yt'); else if(window.NexusAdvance) NexusAdvance.openInAppYouTubeTV(false);" style="background:#202c33; border:1px solid #ef4444; color:#ef4444; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>▶️</span><span style="font-weight:800;">Watch TV</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); if(window.NexusAdvance) NexusAdvance.openLiveGameModal(false, 1);" style="background:#202c33; border:1px solid #38bdf8; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎮</span><span style="font-weight:800;">2P Game</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusPro.openAiSolverModal(false);" style="background:#202c33; border:1px solid #a78bfa; color:#a78bfa; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🤖</span><span style="font-weight:800;">Ask AI</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusPro.openQuizBattleModal(false);" style="background:#202c33; border:1px solid #fbbf24; color:#fbbf24; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>⚡</span><span style="font-weight:800;">30s Quiz</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); if(window.NexusSuperChat) NexusSuperChat.openGroupPollModal();" style="background:#202c33; border:1px solid #34d399; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📊</span><span style="font-weight:800;">Live Poll</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); if(window.NexusSuperChat) NexusSuperChat.openLiveSketchpadModal(false);" style="background:#202c33; border:1px solid #34d399; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎨</span><span style="font-weight:800;">Sketch</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); if(window.NexusSuperChat) NexusSuperChat.openWhisperComposerModal();" style="background:#202c33; border:1px dashed #10b981; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🔐</span><span style="font-weight:800;">Whisper</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusPro.openStatusCardMakerModal(false);" style="background:#202c33; border:1px solid #f472b6; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📸</span><span style="font-weight:800;">Status Card</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); if(window.NexusSuperChat) NexusSuperChat.openCodeSnippetModal();" style="background:#202c33; border:1px solid #5eead4; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>💻</span><span style="font-weight:800;">Send Code</span></button>
            `;
        }
    }

    // =========================================================================
    // 3. PARSE 🤖AI|, ⚡QUIZ|, AND 💻CODE| MESSAGES INTO RICH INTERACTIVE CARDS!
    //    (Scoped ONLY to visible chat container — zero hidden CPU burn!)
    // =========================================================================
    function generateSmartNexusLocalAnswer(question) {
        let qLow = (question || '').toLowerCase();
        if (qLow.includes('nexus') || qLow.includes('feature') || qLow.includes('app')) {
            return "🚀 Nexus Official Features:\n1. 📞 Live WebRTC Audio & Video Calls (⋮ Menu mein)\n2. 🎵 Group DJ & ▶️ Watch-Party TV (+ Tray / ⋮ Menu)\n3. 🎮 Live 1v1 Arcade (Tic-Tac-Toe, RPS, Math Duel) & ⚡ 30s Quiz Battle\n4. 🛡️ View-Once Secrets & 🔑 Password-Locked Messages\n5. 🎨 Formula Whiteboard, 💻 Code Box & 📄 50MB PDF Study Vault!";
        }
        return "💡 Step-by-Step Hint: Sabse pehle given values aur units note karein, phir standard formula apply karein. Detailed Gemini solution ke liye exact JEE/Coding question likh kar poochein!";
    }

    function parseAiQuizAndCodeMessages() {
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoot = document.getElementById('nx-chat-room');
        const dmOpen = dmRoot && dmRoot.style.display !== 'none';
        const grpOpen = grpRoot && grpRoot.style.display !== 'none';
        if (!dmOpen && !grpOpen) return;

        const selector = (dmOpen && grpOpen)
            ? '#nx-dm-msgs-box span, #nx-room-messages span'
            : (dmOpen ? '#nx-dm-msgs-box span' : '#nx-room-messages span');

        document.querySelectorAll(selector).forEach(sp => {
            let txt = (sp.innerText || '').trim();
            if (!txt) return;

            // A. Parse 🤖AI| Cards
            if (txt.startsWith('🤖AI|') && !sp.getAttribute('data-ai-card-parsed')) {
                sp.setAttribute('data-ai-card-parsed', '1');
                let parts = txt.split('|');
                let q = parts[1] || 'Question';
                let ans = parts.slice(2).join('|');
                if (ans.includes('Apply the core formula step-by-step')) {
                    ans = generateSmartNexusLocalAnswer(q);
                }

                const aiCard = document.createElement('div');
                aiCard.className = 'nx-ai-card-pro';
                aiCard.onclick = e => e.stopPropagation();
                aiCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; padding-bottom:4px; border-bottom:1px solid rgba(167,139,250,0.25);">
                        <span style="font-size:11px; color:#a78bfa; font-weight:900;">🤖 NEXUS AI ASSISTANT</span>
                        <button type="button" class="nx-copy-ai-ans" style="background:#1e293b; color:#38bdf8; border:1px solid #334155; padding:2px 7px; border-radius:6px; font-size:9.5px; font-weight:800; cursor:pointer;">📋 Copy</button>
                    </div>
                    <div style="font-size:11.5px; color:#38bdf8; font-weight:800; margin-bottom:5px;">Q: "${escHtml(q)}"</div>
                    <div class="nx-ai-ans-body" style="white-space:pre-wrap; word-break:break-word; color:#f1f5f9;">${escHtml(ans)}</div>
                `;
                aiCard.querySelector('.nx-copy-ai-ans').onclick = () => {
                    navigator.clipboard?.writeText(ans);
                    if (window.Nexus && Nexus.toast) Nexus.toast('📋 AI Answer Copied!');
                };
                sp.innerHTML = '';
                sp.appendChild(aiCard);
                return;
            }

            // B. Parse ⚡QUIZ| Cards
            if (txt.startsWith('⚡QUIZ|') && !sp.getAttribute('data-quiz-parsed')) {
                sp.setAttribute('data-quiz-parsed', '1');
                let parts = txt.split('|');
                let q = parts[1] || 'Question';
                let optA = parts[2] || 'A';
                let optB = parts[3] || 'B';
                let ans = (parts[4] || 'A').trim().toUpperCase();

                const qCard = document.createElement('div');
                qCard.className = 'nx-quiz-battle-card';
                qCard.onclick = e => e.stopPropagation();
                qCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:10.5px; color:#fbbf24; font-weight:900;">⚡ 30s LIVE QUIZ BATTLE</span>
                        <span style="background:rgba(16,185,129,0.2); color:#10b981; padding:2px 7px; border-radius:8px; font-size:10px; font-weight:900;">⏱️ Fast Tap</span>
                    </div>
                    <div style="font-weight:800; font-size:13px; color:#f8fafc; margin-bottom:8px;">${escHtml(q)}</div>
                    <button type="button" onclick="NexusPro.answerQuizBattle(this, 'A', '${escHtml(ans)}')" style="width:100%; background:#1e293b; border:1px solid #334155; color:white; padding:7px 10px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; margin-bottom:6px; cursor:pointer;">🅰️ ${escHtml(optA)}</button>
                    <button type="button" onclick="NexusPro.answerQuizBattle(this, 'B', '${escHtml(ans)}')" style="width:100%; background:#1e293b; border:1px solid #334155; color:white; padding:7px 10px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; cursor:pointer;">🅱️ ${escHtml(optB)}</button>
                `;
                sp.innerHTML = '';
                sp.appendChild(qCard);
                return;
            }

            // C. Parse 💻CODE| Cards
            if (txt.startsWith('💻CODE|') && !sp.getAttribute('data-code-checked')) {
                sp.setAttribute('data-code-checked', '1');
                let enc = txt.substring(txt.indexOf('|') + 1);
                let dec = '';
                try { dec = decodeURIComponent(escape(atob(enc))); } catch (e) { dec = enc; }
                let linesCount = dec.split('\n').length;
                const wrap = document.createElement('div');
                wrap.className = 'nx-compact-code-wrap';
                wrap.onclick = e => e.stopPropagation();
                wrap.innerHTML = `
                    <div class="nx-compact-code-header">
                        <span>💻 Code Box (${linesCount} lines)</span>
                        <button type="button" onclick="NexusPro.copyEncodedCode('${enc.replace(/'/g, "\\'")}')" style="background:#00a884; color:#020617; border:none; padding:2px 9px; border-radius:6px; font-weight:900; font-size:10.5px; cursor:pointer;">📋 Copy Code</button>
                    </div>
                    <pre class="nx-compact-code-pre">${escHtml(dec)}</pre>
                    <div class="nx-compact-code-footer" onclick="NexusPro.toggleCodeExpand(this)">👁️ View More (Show Full Code ▼)</div>
                `;
                sp.innerHTML = '';
                sp.appendChild(wrap);
            }
        });
    }

    function buildStatusPosterDataUrl(txt) {
        let me = (window.Nexus && Nexus.getCurrentUser && Nexus.getCurrentUser()) || { name: 'Nexus Member', username: 'nexus' };
        const th = POSTER_THEMES[selectedPosterTheme] || POSTER_THEMES.galaxy;

        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 900;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 720, 900);
        grad.addColorStop(0, th.c1);
        grad.addColorStop(0.5, th.c2);
        grad.addColorStop(1, th.c3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 720, 900);

        ctx.strokeStyle = th.border;
        ctx.lineWidth = 5;
        ctx.strokeRect(30, 30, 660, 840);

        ctx.fillStyle = th.border;
        ctx.font = '900 26px system-ui, sans-serif';
        ctx.fillText(`👑 ${me.name || me.username} (@${me.username})`, 65, 95);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 34px system-ui, sans-serif';
        let words = txt.split(/\s+/);
        let line = '', y = 300;
        words.forEach(w => {
            let test = line + w + ' ';
            if (ctx.measureText(test).width > 580) {
                ctx.fillText(line.trim(), 65, y);
                line = w + ' ';
                y += 50;
            } else {
                line = test;
            }
        });
        if (line.trim()) ctx.fillText(line.trim(), 65, y);

        stampNexusPremiumWatermarkOnCanvas(canvas);
        return canvas.toDataURL('image/jpeg', 0.92);
    }

    // =========================================================================
    // 4. PUBLIC API FOR PRO.JS
    // =========================================================================
    window.NexusPro = {
        toggleCollabDesktopScale: function() {
            const iframe = document.getElementById('nx-collab-iframe');
            if (!iframe) return;
            collabDesktopFit = !collabDesktopFit;
            if (collabDesktopFit) {
                iframe.style.width = '1280px';
                iframe.style.transform = `scale(${Math.min(1, window.innerWidth / 1280)})`;
                iframe.style.transformOrigin = 'top left';
                Nexus.toast("💻 Desktop Full View Enabled!");
            } else {
                iframe.style.width = '100%';
                iframe.style.transform = 'none';
                Nexus.toast("📱 Mobile Responsive View Enabled!");
            }
        },

        openQuizBattleModal: function(isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            lastQuizTargetIsDm = Boolean(isDm);
            modal.style.zIndex = '272000';
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #fbbf24;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:15.5px; color:#fbbf24; margin:0;">⚡ Launch 30s Live Quiz Battle</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <button type="button" onclick="NexusPro.fillRandomJeeQuiz()" style="width:100%; background:#1e293b; border:1px dashed #38bdf8; color:#38bdf8; padding:8px; border-radius:10px; font-weight:800; font-size:12px; cursor:pointer; margin-bottom:9px;">🎲 Pick Random JEE / Coding Question</button>
                    <input type="text" id="nx-qb-q" placeholder="Question (e.g. Value of sin 90°?)" style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; margin-bottom:8px; outline:none;">
                    <input type="text" id="nx-qb-a" placeholder="Option A" style="width:100%; padding:9px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; margin-bottom:8px; outline:none;">
                    <input type="text" id="nx-qb-b" placeholder="Option B" style="width:100%; padding:9px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; margin-bottom:8px; outline:none;">
                    <select id="nx-qb-ans" style="width:100%; padding:9px; border-radius:10px; border:1px solid #334155; background:#090d16; color:#10b981; font-weight:800; font-size:13px; margin-bottom:12px; outline:none;">
                        <option value="A">Correct Answer: Option A</option>
                        <option value="B">Correct Answer: Option B</option>
                    </select>
                    <button type="button" onclick="NexusPro.sendQuizBattleNow(${Boolean(isDm)})" style="width:100%; background:#fbbf24; color:#020617; border:none; padding:11px; border-radius:10px; font-weight:900; cursor:pointer;">⚡ Start Quiz Battle</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        fillRandomJeeQuiz: function() {
            const pick = QUICK_QUIZ_BANK[Math.floor(Math.random() * QUICK_QUIZ_BANK.length)];
            if (!pick) return;
            const qEl = document.getElementById('nx-qb-q');
            const aEl = document.getElementById('nx-qb-a');
            const bEl = document.getElementById('nx-qb-b');
            const ansEl = document.getElementById('nx-qb-ans');
            if (qEl) qEl.value = pick.q;
            if (aEl) aEl.value = pick.a;
            if (bEl) bEl.value = pick.b;
            if (ansEl) ansEl.value = pick.ans;
        },

        sendQuizBattleNow: function(isDm) {
            let q = (document.getElementById('nx-qb-q') ? document.getElementById('nx-qb-q').value : '').trim().replace(/\|/g, ' ');
            let a = (document.getElementById('nx-qb-a') ? document.getElementById('nx-qb-a').value : '').trim().replace(/\|/g, ' ');
            let b = (document.getElementById('nx-qb-b') ? document.getElementById('nx-qb-b').value : '').trim().replace(/\|/g, ' ');
            let ans = document.getElementById('nx-qb-ans') ? document.getElementById('nx-qb-ans').value : 'A';
            if (!q || !a || !b) { Nexus.toast("Fill question & options!"); return; }

            document.getElementById('nx-global-modal').style.display = 'none';
            let payload = `⚡QUIZ|${q}|${a}|${b}|${ans}`;
            if (isDm && window.NexusDM) {
                const inp = document.getElementById('nx-dm-input');
                if (inp) { inp.value = payload; NexusDM.sendDM(); }
            } else if (!isDm && window.NexusChat) {
                const inp = document.getElementById('nx-chat-msg-in');
                if (inp) { inp.value = payload; NexusChat.sendChatMessage(); }
            }
        },

        answerQuizBattle: function(btnEl, chosen, correct) {
            if (!btnEl || btnEl.dataset.answered) return;
            const card = btnEl.closest('.nx-quiz-battle-card');
            if (card) card.querySelectorAll('button').forEach(b => { b.dataset.answered = '1'; });
            let me = Nexus.getCurrentUser();
            let uName = me ? me.username : 'Student';
            if (chosen === correct) {
                btnEl.style.background = '#10b981';
                btnEl.style.color = '#020617';
                btnEl.innerHTML += ` — 🏆 Correct (@${escHtml(uName)})!`;
                Nexus.toast(`🏆 Sahi Jawab! @${uName} Won!`);
            } else {
                btnEl.style.background = '#ef4444';
                btnEl.innerHTML += ` — ❌ Wrong`;
                Nexus.toast("❌ Galat Jawab!");
            }
        },

        openStatusCardMakerModal: function(isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            lastQuizTargetIsDm = typeof isDm === 'boolean' ? isDm : Boolean(document.getElementById('nx-dm-dedicated-root')?.style.display !== 'none');
            modal.style.zIndex = '272000';
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #f472b6;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h3 style="font-size:15.5px; color:#f472b6; margin:0;">📸 Nexus Status Poster Studio</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; overflow-x:auto; margin-bottom:9px; scrollbar-width:none;">
                        ${Object.entries(POSTER_THEMES).map(([k, t]) =>
                            `<button type="button" onclick="NexusPro.selectPosterTheme('${k}', this)" class="nx-poster-th-btn" style="padding:5px 10px; border-radius:99px; background:${t.c2}; border:2px solid ${selectedPosterTheme === k ? t.border : '#334155'}; color:#fff; font-size:11px; font-weight:800; white-space:nowrap; cursor:pointer; flex-shrink:0;">${t.label}</button>`
                        ).join('')}
                    </div>
                    <textarea id="nx-status-card-txt" rows="3" placeholder="Type your quote, JEE formula, shayari or thought..." style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:14px; margin-bottom:12px; outline:none;"></textarea>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <button type="button" onclick="NexusPro.downloadStatusPosterNow(false)" style="background:linear-gradient(135deg,#ec4899,#8b5cf6); color:white; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:12.5px; cursor:pointer;">⬇️ Save HD</button>
                        <button type="button" onclick="NexusPro.downloadStatusPosterNow(true)" style="background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:12.5px; cursor:pointer;">📤 Send in Chat</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        selectPosterTheme: function(key, btnEl) {
            selectedPosterTheme = key;
            document.querySelectorAll('.nx-poster-th-btn').forEach(b => { b.style.borderColor = '#334155'; });
            if (btnEl && POSTER_THEMES[key]) btnEl.style.borderColor = POSTER_THEMES[key].border;
        },

        downloadStatusPosterNow: function(sendToChat) {
            let txt = (document.getElementById('nx-status-card-txt') ? document.getElementById('nx-status-card-txt').value : '').trim();
            if (!txt) { Nexus.toast("Write some text first!"); return; }
            const dataUrl = buildStatusPosterDataUrl(txt);
            document.getElementById('nx-global-modal').style.display = 'none';

            if (sendToChat) {
                if (lastQuizTargetIsDm && window.NexusDM) {
                    NexusDM.sendDM(dataUrl);
                    Nexus.toast("📸 Status Poster Sent in DM!");
                } else if (window.NexusChat) {
                    NexusChat.sendChatMessage(dataUrl);
                    Nexus.toast("📸 Status Poster Sent in Group!");
                }
                return;
            }

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'Nexus_Status_Card_' + Date.now() + '.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            Nexus.toast("📸 Status Poster Downloaded!");
        },

        openDmCodeModal: function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.style.zIndex = '272000';
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #38bdf8;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:15.5px; color:#38bdf8; margin:0;">💻 Send Compact Code Box</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <textarea id="nx-dm-code-in" rows="5" placeholder="Paste HTML, CSS, JS, or Python code here..." style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#050811; color:#38bdf8; font-family:monospace; font-size:12.5px; margin-bottom:12px; outline:none;"></textarea>
                    <button type="button" onclick="NexusPro.sendDmCodeNow()" style="width:100%; background:#38bdf8; color:#020617; border:none; padding:11px; border-radius:10px; font-weight:900; cursor:pointer;">💻 Send Code Box</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        sendDmCodeNow: function() {
            let raw = (document.getElementById('nx-dm-code-in') ? document.getElementById('nx-dm-code-in').value : '').trim();
            if (!raw) return;
            document.getElementById('nx-global-modal').style.display = 'none';
            const inp = document.getElementById('nx-dm-input');
            if (inp && window.NexusDM) {
                let encoded = btoa(unescape(encodeURIComponent(raw)));
                inp.value = `💻CODE|${encoded}`;
                NexusDM.sendDM();
            }
        },

        toggleCodeExpand: function(footerEl) {
            if (!footerEl || !footerEl.previousElementSibling) return;
            const pre = footerEl.previousElementSibling;
            let isExp = pre.classList.toggle('expanded');
            footerEl.innerText = isExp ? '🔼 Show Less (Collapse Code)' : '👁️ View More (Show Full Code ▼)';
        },

        copyEncodedCode: function(encoded) {
            try {
                let raw = decodeURIComponent(escape(atob(encoded)));
                navigator.clipboard.writeText(raw);
                Nexus.toast("📋 Code Copied to Clipboard!");
            } catch (e) {
                Nexus.toast("📋 Copied!");
            }
        },

        openAiSolverModal: function(isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.style.zIndex = '272000';
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #a78bfa; background:#0b141a;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#a78bfa; font-size:15.5px;">🤖 Nexus Gemini AI Assistant</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; overflow-x:auto; margin-bottom:8px; scrollbar-width:none;">
                        ${["Explain Gauss Law", "Solve x² - 5x + 6 = 0", "JS async/await example", "Nexus app features"].map(p =>
                            `<button type="button" onclick="document.getElementById('nx-pro-ai-q').value='${p}'" style="padding:4px 9px; border-radius:99px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:10.5px; font-weight:800; white-space:nowrap; cursor:pointer; flex-shrink:0;">${p}</button>`
                        ).join('')}
                    </div>
                    <textarea id="nx-pro-ai-q" rows="3" placeholder="Ask JEE Physics/Maths/Chem, Coding doubts, or Nexus features..." style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none; margin-bottom:12px;"></textarea>
                    <button type="button" id="nx-pro-ai-btn" onclick="NexusPro.askAiAndSend(${Boolean(isDm)})" style="width:100%; background:linear-gradient(135deg,#8b5cf6,#3b82f6); color:white; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;">🚀 Ask Nexus AI &amp; Post Card</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        askAiAndSend: async function(isDm) {
            const inp = document.getElementById('nx-pro-ai-q');
            const btn = document.getElementById('nx-pro-ai-btn');
            if (!inp || !inp.value.trim()) return;
            let q = inp.value.trim().replace(/\|/g, ' ');
            if (btn) { btn.innerText = "⏳ Nexus AI is thinking..."; btn.disabled = true; }

            let answerText = '';
            if (/nexus.*feature|app ke bare/i.test(q)) {
                answerText = generateSmartNexusLocalAnswer(q);
            } else {
                // 1. Try Official Vercel Gemini API (/api/nexus-ai) FIRST!
                try {
                    const r1 = await fetch('/api/nexus-ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: q, systemPrompt: 'Answer concisely in clear Hinglish/English under 95 words for a student chat card.' })
                    });
                    if (r1.ok) {
                        const j1 = await r1.json();
                        answerText = String(j1.reply || j1.text || j1.answer || '').trim();
                    }
                } catch (e) {}

                // 2. Fallback to Pollinations OpenAI if local/offline
                if (!answerText) {
                    try {
                        let postResp = await fetch('https://text.pollinations.ai/openai', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: 'openai',
                                messages: [
                                    { role: 'system', content: 'You are Nexus Official AI for IIT-JEE & Coding students. Answer clearly in Hinglish/English under 95 words.' },
                                    { role: 'user', content: q }
                                ]
                            })
                        });
                        if (postResp.ok) {
                            let data = await postResp.json();
                            if (data && data.choices && data.choices[0] && data.choices[0].message) {
                                answerText = data.choices[0].message.content.trim();
                            }
                        }
                    } catch (e) {}
                }
            }

            if (!answerText) answerText = generateSmartNexusLocalAnswer(q);

            document.getElementById('nx-global-modal').style.display = 'none';
            let payload = `🤖AI|${q.substring(0, 65)}|${answerText.substring(0, 750)}`;

            if (isDm && window.NexusDM) {
                const dmIn = document.getElementById('nx-dm-input');
                if (dmIn) { dmIn.value = payload; NexusDM.sendDM(); }
            } else if (!isDm && window.NexusChat) {
                const grpIn = document.getElementById('nx-chat-msg-in');
                if (grpIn) { grpIn.value = payload; NexusChat.sendChatMessage(); }
            }
        }
    };

    function runProMasterEngine(forceRun) {
        if (!forceRun && isTypingOrHidden()) return;
        rebuildCleanFourColumnPlusTrays();
        parseAiQuizAndCodeMessages();
    }

    function bootProOnce() {
        if (window.__nxProBooted) return;
        window.__nxProBooted = true;
        setTimeout(() => runProMasterEngine(true), 350);
        setInterval(() => runProMasterEngine(false), 2500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootProOnce);
    else bootProOnce();
})();
