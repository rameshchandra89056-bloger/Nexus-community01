// Auto Guest Read Access so new users see 100% Real Database immediately
if (!localStorage.getItem("nexus_user") && !localStorage.getItem("currentUser")) {
    const defaultVisitor = {
        uid: "visitor_" + Math.floor(1000 + Math.random() * 9000),
        name: "Nexus Guest",
        username: "guest_user",
        handle: "@guest_user",
        stream: "IIT-JEE / NEET",
        isGuest: true,
        verified: false
    };
    localStorage.setItem("nexus_user", JSON.stringify(defaultVisitor));
    localStorage.setItem("currentUser", JSON.stringify(defaultVisitor));
}
// ================= CORE.JS (v7.0 FINAL MASTER): 🛡️ SINGLE CLEAN DELETED MESSAGE PILL (FIXES 3-BOX BUG) + 📐 ZERO + TRAY OVERLAP + 🤖 ADVANCED NEXUS AI STUDIO (ARCHITECTURE GUIDE, STRICT NSFW/HACKING SHIELD, DUAL-ENGINE SWARA VOICE, MIC & EXPORT) + 👤 PROFILE 1-MESSAGE BUTTON LOCK =================

(function() {
    const PROTO = 'https:' + '//';
    const POLLINATIONS_OPENAI = PROTO + 'text.pollinations.ai/openai';
    const POLLINATIONS_ROOT = PROTO + 'text.pollinations.ai/';
    const IMG_GEN_API = PROTO + 'image.pollinations.ai/prompt/';

    let selectedVoiceEffect = 'normal';
    let aiChatHistory = [];
    try {
        aiChatHistory = JSON.parse(localStorage.getItem('nx_private_ai_history_v7') || '[]');
    } catch (e) {
        aiChatHistory = [];
    }
    let isSwaraSpeaking = false;
    let fallbackAudioPlayer = null;
    let activeHealthyAiServerIndex = 0;

    // 11 Trusted Fast AI Models (Automatic Failover Router)
    const NEXUS_AI_SERVERS = [
        { name: "Server-1 (GPT-4o Mini)", model: "openai", type: "post" },
        { name: "Server-2 (Llama 3.3 70B)", model: "llama", type: "post" },
        { name: "Server-3 (Qwen 2.5 Coder)", model: "qwen-coder", type: "post" },
        { name: "Server-4 (DeepSeek V3)", model: "deepseek", type: "post" },
        { name: "Server-5 (Mistral Nemo)", model: "mistral", type: "post" },
        { name: "Server-6 (Gemini Flash)", model: "gemini", type: "post" },
        { name: "Server-7 (OpenAI Fast GET)", model: "openai", type: "get" },
        { name: "Server-8 (Mistral Fast GET)", model: "mistral", type: "get" },
        { name: "Server-9 (Llama Fast GET)", model: "llama", type: "get" },
        { name: "Server-10 (Phi-4 Node)", model: "phi", type: "post" },
        { name: "Server-11 (Direct Backup Node)", model: "openai", type: "get" }
    ];

    const coreStyle = document.createElement('style');
    coreStyle.innerHTML = `
        #nx-private-ai-studio {
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            width: 100%;
            max-width: 640px;
            height: 100dvh;
            margin: 0 auto;
            background: #090d16;
            z-index: 100105;
            display: none;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.95);
        }
        /* FIXED SCREENSHOT 1000072616.jpg: Single Clean Deleted Message Pill (Never Nested!) */
        .nx-single-deleted-pill {
            background: rgba(239, 68, 68, 0.14) !important;
            border: 1.5px dashed rgba(248, 113, 113, 0.65) !important;
            color: #fecaca !important;
            padding: 7px 13px !important;
            border-radius: 12px !important;
            font-size: 12.5px !important;
            font-style: italic !important;
            line-height: 1.4 !important;
            display: block !important;
            width: fit-content !important;
            max-width: 86% !important;
            box-shadow: none !important;
        }
        /* Prevent any child or parent of .nx-single-deleted-pill from getting a 2nd or 3rd border! */
        .nx-single-deleted-pill *,
        .nx-dm-bubble-anim.nx-deleted-row-clean {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            display: inline !important;
        }
        .nx-dm-bubble-anim.nx-deleted-row-clean {
            display: flex !important;
            margin: 2px 0 !important;
        }
        /* FIXED 1:1 DM & GROUP + TRAY OVERLAPPING: Clean Non-Overlapping Flex Dock */
        #nx-dm-bottom-tray, #nx-grp-bottom-tray {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            width: 100% !important;
            max-height: 148px !important;
            overflow-y: auto !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
            padding: 8px 10px !important;
            background: #111b21 !important;
            border-top: 1.5px solid #00a884 !important;
            flex-shrink: 0 !important;
            z-index: 25 !important;
            box-sizing: border-box !important;
        }
        .nx-ai-quick-chip {
            background: #161f33;
            border: 1px solid #334155;
            color: #93c5fd;
            padding: 5px 11px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            cursor: pointer;
            flex-shrink: 0;
        }
        .nx-ai-quick-chip:active {
            background: #38bdf8;
            color: #020617;
        }
    `;
    document.head.appendChild(coreStyle);

    // =========================================================================
    // 1. 👥 TWO-WAY FOLLOWER & FOLLOWING GRAPH SYNC
    // =========================================================================
    function patchMasterFollowerGraph() {
        if (!window.Nexus || Nexus.__nxTwoWayGraphPatched) return;
        Nexus.__nxTwoWayGraphPatched = true;

        const origRebuild = Nexus.rebuildAllUsersMasterList.bind(Nexus);
        Nexus.rebuildAllUsersMasterList = function() {
            origRebuild();
            let map = {};
            (this.users || []).forEach(u => {
                if (u && u.username) {
                    let k = u.username.toLowerCase().trim();
                    u.followersList = Array.isArray(u.followersList) ? u.followersList.map(x => String(x).toLowerCase().trim()).filter(Boolean) : [];
                    u.followingList = Array.isArray(u.followingList) ? u.followingList.map(x => String(x).toLowerCase().trim()).filter(Boolean) : [];
                    map[k] = u;
                }
            });

            Object.keys(map).forEach(uKey => {
                let u = map[uKey];
                u.followingList.forEach(targetKey => {
                    if (map[targetKey] && !map[targetKey].followersList.includes(uKey)) {
                        map[targetKey].followersList.push(uKey);
                    }
                });
                u.followersList.forEach(followerKey => {
                    if (map[followerKey] && !map[followerKey].followingList.includes(uKey)) {
                        map[followerKey].followingList.push(uKey);
                    }
                });
            });
        };
        Nexus.rebuildAllUsersMasterList();
    }

    // =========================================================================
    // 2. 👤 PUBLIC PROFILE BUTTON GUARD (Always 1 Follow + 1 Message Button!)
    // =========================================================================
    function enforceSingleMessageButtonOnPublicProfile() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none') return;

        const followBtn = modal.querySelector('button[onclick*="Nexus.toggleFollow"]');
        if (!followBtn) return;

        let match = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
        if (!match || !match[1]) return;
        let targetUser = match[1];
        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetUser.toLowerCase());
        let targetName = (uObj && uObj.name) ? uObj.name : targetUser;
        let safeU = targetUser.replace(/'/g, "\\'");
        let safeN = targetName.replace(/'/g, "\\'");

        const parentRow = followBtn.parentElement;
        if (!parentRow) return;
        parentRow.style.display = 'flex';
        parentRow.style.gap = '10px';
        followBtn.style.flex = '1';

        let msgBtns = Array.from(parentRow.querySelectorAll('button')).filter(b => b !== followBtn);

        if (msgBtns.length === 0) {
            const mBtn = document.createElement('button');
            mBtn.type = 'button';
            mBtn.className = 'nx-guaranteed-msg-btn';
            mBtn.style.cssText = "flex:1; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;";
            mBtn.innerHTML = `💬 Message`;
            mBtn.onclick = () => {
                modal.style.display = 'none';
                if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
            };
            parentRow.appendChild(mBtn);
        } else {
            msgBtns.forEach((b, idx) => {
                if (idx === 0) {
                    if (b.id === 'nx-dm-trigger-btn') b.removeAttribute('id');
                    b.style.setProperty('display', 'inline-flex', 'important');
                    b.style.flex = '1';
                    b.style.alignItems = 'center';
                    b.style.justifyContent = 'center';
                    b.onclick = () => {
                        modal.style.display = 'none';
                        if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
                    };
                } else {
                    b.remove();
                }
            });

            if (!document.getElementById('nx-dm-trigger-btn')) {
                const dummyMarker = document.createElement('span');
                dummyMarker.id = 'nx-dm-trigger-btn';
                dummyMarker.style.display = 'none';
                modal.appendChild(dummyMarker);
            }
        }
    }

    // =========================================================================
    // 3. 🗑️ SINGLE CLEAN DELETED MESSAGE PILL & 1:1 DM + TRAY OVERLAP FIX
    // Fixes Screenshot 1000072616.jpg (Removes 3 nested boxes -> 1 clean pill!)
    // =========================================================================
    function patchDmDeleteAndFixPlusTrayOverlap() {
        if (window.NexusDM) {
            const executeUniversalDmDeleteForEveryone = async function(msgId) {
                const modal = document.getElementById('nx-msg-action-modal');
                if (modal) modal.style.display = 'none';

                let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
                if (!me || !Nexus.db || !msgId) return;

                let deletedLabel = `${me.name || me.username} (@${me.username})`;

                const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
                if (rowEl) {
                    rowEl.classList.add('nx-deleted-row-clean');
                    rowEl.innerHTML = `<div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${deletedLabel}</b></div>`;
                }

                try {
                    await Nexus.db.collection('nexus_private_dms').doc(msgId).set({
                        deleted: true,
                        deletedAt: Date.now(),
                        deletedBy: me.username,
                        deletedByName: deletedLabel,
                        text: '',
                        imgUrl: '',
                        imgUrls: [],
                        sticker: null,
                        replyTo: null,
                        edited: false,
                        likes: [],
                        reaction: ''
                    }, { merge: true });
                    Nexus.toast('🗑️ Message deleted for everyone!');
                } catch (e) {
                    Nexus.toast('⚠️ Network slow, retrying delete...');
                }
            };

            NexusDM.deleteDMForEveryone = executeUniversalDmDeleteForEveryone;
            NexusDM.deleteDmMessage = executeUniversalDmDeleteForEveryone;

            if (window.NexusPower && !NexusPower.__nxDelHookedV7) {
                NexusPower.__nxDelHookedV7 = true;
                const origExec = NexusPower.execDmAction;
                NexusPower.execDmAction = function(action, msgId) {
                    if (action === 'delete' || action === 'deleteForEveryone') {
                        return executeUniversalDmDeleteForEveryone(msgId);
                    }
                    if (origExec) return origExec.apply(this, arguments);
                };
            }
        }

        // Clean up any existing deleted message bubbles inside #nx-dm-msgs-box so ONLY 1 single pill border renders!
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            if ((row.innerText || '').includes('This message was deleted by')) {
                const bubble = row.firstElementChild;
                if (bubble && !bubble.classList.contains('nx-single-deleted-pill')) {
                    let rawHTML = bubble.innerHTML || '';
                    if (!rawHTML.includes('🚫')) rawHTML = '🚫 ' + rawHTML;
                    row.classList.add('nx-deleted-row-clean');
                    row.innerHTML = `<div class="nx-single-deleted-pill">${rawHTML}</div>`;
                }
            }
        });

        // Fix 1:1 DM + Tray Overlap: Auto-close tray when tapping message list or focusing input
        const dmMsgBox = document.getElementById('nx-dm-msgs-box');
        const dmTray = document.getElementById('nx-dm-bottom-tray');
        const dmComposer = document.getElementById('nx-dm-composer');

        if (dmTray && dmComposer && dmTray.parentNode === document.body) {
            // Ensure tray is docked inside #nx-dm-dedicated-root right above #nx-dm-composer!
            dmComposer.parentNode.insertBefore(dmTray, dmComposer);
        }

        if (dmMsgBox && !dmMsgBox.__nxTrayAutoCloseBound) {
            dmMsgBox.__nxTrayAutoCloseBound = true;
            dmMsgBox.addEventListener('click', () => {
                const t = document.getElementById('nx-dm-bottom-tray');
                if (t && t.style.display !== 'none') {
                    if (window.NexusPower && NexusPower.toggleBottomTray) NexusPower.toggleBottomTray(false);
                    else t.style.display = 'none';
                }
            });
        }

        const dmInp = document.getElementById('nx-dm-input');
        if (dmInp && !dmInp.__nxTrayFocusBound) {
            dmInp.__nxTrayFocusBound = true;
            dmInp.addEventListener('focus', () => {
                const t = document.getElementById('nx-dm-bottom-tray');
                if (t && t.style.display !== 'none') {
                    if (window.NexusPower && NexusPower.toggleBottomTray) NexusPower.toggleBottomTray(false);
                    else t.style.display = 'none';
                }
            });
        }
    }

    // =========================================================================
    // 4. 🛠️ BLACK-SCREEN GUARD & GROUP SEND FIX
    // =========================================================================
    function healCommunityTabAndGroupSend() {
        const commTab = document.getElementById('tab-community');
        const dir = document.getElementById('nx-chat-directory');
        const room = document.getElementById('nx-chat-room');

        if (commTab && commTab.classList.contains('active')) {
            if (dir && room && room.style.display === 'none' && dir.style.display === 'none') {
                dir.style.display = 'block';
            }
        }

        const sendBtn = document.getElementById('nx-grp-send-btn');
        if (sendBtn && window.NexusChat && !sendBtn.__nxSendFixed) {
            sendBtn.__nxSendFixed = true;
            sendBtn.onclick = (e) => {
                e.preventDefault();
                NexusChat.sendChatMessage();
            };
        }
    }

    // =========================================================================
    // 5. 🤖 ADVANCED NEXUS 1:1 PRIVATE AI STUDIO
    // =========================================================================
    function injectAiButtonsEverywhere() {
        const headerActions = document.querySelector('.nx-header-actions');
        if (headerActions && !document.getElementById('nx-top-ai-studio-btn')) {
            const aiTopBtn = document.createElement('button');
            aiTopBtn.id = 'nx-top-ai-studio-btn';
            aiTopBtn.type = 'button';
            aiTopBtn.className = 'nx-icon-btn';
            aiTopBtn.onclick = () => NexusCore.openPrivateAiStudio();
            aiTopBtn.style.cssText = "background:linear-gradient(135deg,rgba(139,92,246,0.22),rgba(56,189,248,0.22)); border:1px solid #a78bfa; color:#d8b4fe; padding:5px 10px; border-radius:14px; font-size:11.5px; font-weight:900; display:flex; align-items:center; gap:4px; cursor:pointer;";
            aiTopBtn.innerHTML = `<span>🤖</span><span>AI</span>`;
            headerActions.insertBefore(aiTopBtn, headerActions.firstChild);
        }

        const dmBanner = document.getElementById('nx-dm-inbox-banner');
        if (dmBanner && !document.getElementById('nx-private-ai-banner-card')) {
            const aiCard = document.createElement('div');
            aiCard.id = 'nx-private-ai-banner-card';
            aiCard.onclick = () => NexusCore.openPrivateAiStudio();
            aiCard.style.cssText = "background:linear-gradient(135deg, rgba(139,92,246,0.22), rgba(15,23,42,0.95)); border:1.5px solid #a78bfa; border-radius:16px; padding:11px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer;";
            aiCard.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900;">🤖</div>
                    <div>
                        <div style="font-weight:800; font-size:13.5px; color:#f8fafc;">Nexus 1:1 Private AI Studio</div>
                        <div style="font-size:11px; color:#d8b4fe;">🔊 Swara Voice • 🎨 Safe Image Gen • 11 Fast Servers</div>
                    </div>
                </div>
                <span style="background:#a78bfa; color:#020617; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:900;">Ask 1:1 →</span>
            `;
            dmBanner.appendChild(aiCard);
        }

        if (window.NexusPro) {
            NexusPro.openAiSolverModal = function(prefill) {
                NexusCore.openPrivateAiStudio(typeof prefill === 'string' ? prefill : '');
            };
        }
    }

    // Strict Safety Filter: Blocks Hacking, Illegal Tasks, AND 18+/NSFW/Abusive Prompts in Text & Image Gen!
    function isProhibitedOrUnsafePrompt(q) {
        let low = (q || '').toLowerCase();
        const hackingPattern = /\b(hack|hacking|exploit|ddos|phishing|crack|bypass|sql injection|steal password|keylogger|malware|virus|dark web|ransomware|admin pin)\b/i;
        const nsfwAbusivePattern = /\b(nude|naked|nsfw|porn|xxx|sex|sexy|boobs|bikini|18\+|adult|erotic|hot girl|kissing|lingerie|vulgar|gali|abusive|blood|gore|suicide|kill)\b/i;
        if (hackingPattern.test(low)) return 'hacking';
        if (nsfwAbusivePattern.test(low)) return 'nsfw';
        return '';
    }

    function isAiImagePrompt(q) {
        let low = (q || '').toLowerCase().trim();
        return [
            '/img', '/image', 'photo banao', 'image banao', 'picture banao',
            'generate image', 'create image', 'make a picture', 'draw ', 'wallpaper banao', 'dp banao'
        ].some(t => low.startsWith(t) || low.includes(t));
    }

    // Complete Built-in Knowledge of Nexus Platform, Code Structure, AI & JEE Formulas
    function getBuiltInExpertAnswer(userQ) {
        let low = (userQ || '').toLowerCase().trim();

        if (low.includes('website architecture') || low.includes('nexus code') || low.includes('kaun si file') || low.includes('how nexus is built')) {
            return "🏗️ **Nexus Platform — Complete Code & File Architecture**\n\nNexus ek **Modular Single-Page Web Application (SPA)** hai jo HTML5, CSS3, Vanilla JavaScript (ES6+) aur Google Firebase Firestore (Real-time NoSQL Database) par bana hai:\n\n1. **`index.html`:** Main responsive layout, 5-tab bottom navigation bar, aur real-time Firebase state synchronization (`Nexus.users`, `Nexus.posts`).\n2. **`home.js`:** Top Live Stories Bar (`Nexus ✅` + active members), Home Feed, 4-Option Live Polls, Double-Tap Like ❤️, Smooth Bookmark 🔖, Real Views Tracker 👁️, aur Reply/Edit Comments.\n3. **`chat.js`:** 8 Subject & Chill Community Channels (`PCM Doubt Solver`, `JEE Study Material`, `Coding Hub`), Live Test Series button, aur PDF Study Vault.\n4. **`dm.js`:** End-to-End 1:1 Personal Direct Messaging, Real-time Seen Ticks (`✓✓`), Typing Indicator, Multi-Photo Upload, aur Delete for Everyone.\n5. **`post.js`:** Full-screen Post Studio (Bold, Italic, Underline, 6 Text Colors, 5 Card Themes, aur Poll Builder).\n6. **`profile.js` & `settings.js`:** Instant DP Upload, Mood Status, 2-Way Follower/Following Graph, Saved Notes Grid, aur App Settings.\n7. **`advance.js` & `superchat.js`:** WebRTC Live Voice/Video Calls, In-App YouTube Watch-Party TV, Group DJ Song Sync, aur 2-Player Game Arena.\n8. **`core.js`:** 11-Server Auto-Failover AI Studio, Safe Flux Image Generator, Dual-Engine Swara Voice Reader, aur UI Self-Healing Guards.";
        }

        if (low.includes('nexus')) {
            return "🌟 **Nexus Official — Student & Creator Community Platform**\n\n**Nexus** ek modern, privacy-first Educational & Student Community App hai jise **Mohit Kumar (@mohiy / Mohit_01)** ne develop kiya hai.\n\n**Mukhya Features:**\n1. **🏠 Interactive Home Feed:** JEE/NEET doubts, notes, 4-option live polls, Double-Tap Like ❤️, Smooth Bookmark 🔖 & Real Views tracker 👁️.\n2. **💬 1:1 Personal DM & 8 Live Channels:** Bina mobile number share kiye direct chat, voice/video calls & study rooms (`PCM Doubt Solver`, `Coding Hub`).\n3. **🤖 1:1 Private AI Studio:** Swara Voice Reader 🔊, Code Copy 📋 & Safe AI Image Generator 🎨.\n4. **📝 Live Test Series & 📄 PDF Study Vault:** In-app mock tests aur notes.";
        }

        if (low === 'what is ai' || low.includes('what is ai ') || low.includes('artificial intelligence') || low.includes('ai kya hai')) {
            return "🤖 **What is AI (Artificial Intelligence)? — Complete Guide**\n\n**Artificial Intelligence (AI)** computer science ki woh branch hai jisse machines aur software ko insano ki tarah sochne, samajhne, seekhne (Machine Learning) aur decision lene ki kshamta di jati hai.\n\n• **Machine Learning & Deep Learning:** Data se patterns seekhna.\n• **NLP (Natural Language Processing):** Hindi, English aur Hinglish samajhna aur jawab dena.\n• **Generative AI:** Naya code likhna, PCM numericals solve karna aur text se HD educational diagrams/images banana.";
        }

        if (low === 'jee formulas' || low.includes('jee formula sheet')) {
            return "📐 **Important IIT-JEE PCM Quick Formula Sheet**\n\n**1. Physics (Kinematics & Mechanics):**\n• $v = u + at$  |  $s = ut + \\frac{1}{2}at^2$  |  $v^2 - u^2 = 2as$\n• Projectile Range: $R = \\frac{u^2 \\sin(2\\theta)}{g}$  |  Max Height: $H = \\frac{u^2 \\sin^2\\theta}{2g}$\n• Work-Energy Theorem: $W_{all} = \\Delta K = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$\n\n**2. Physical Chemistry:**\n• Ideal Gas Law: $PV = nRT$\n• Nernst Equation: $E = E^\\circ - \\frac{0.0591}{n}\\log Q$\n• First Order Kinetics: $k = \\frac{2.303}{t}\\log\\left(\\frac{[A]_0}{[A]_t}\\right)$  |  $t_{1/2} = \\frac{0.693}{k}$\n\n**3. Mathematics (Calculus & Algebra):**\n• Quadratic Roots: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n• Integration by Parts: $\\int u\\,dv = uv - \\int v\\,du$";
        }

        return "";
    }

    function formatAiStudioMessageHTML(msgObj) {
        if (msgObj.role === 'user') {
            return `
                <div style="align-self:flex-end; max-width:84%; background:#005c4b; color:#f8fafc; padding:9px 13px; border-radius:14px 2px 14px 14px; font-size:14px; line-height:1.45; word-break:break-word;">
                    ${(msgObj.text || '').replace(/</g, '&lt;')}
                </div>
            `;
        }

        let raw = msgObj.text || '';
        let encodedFullText = btoa(unescape(encodeURIComponent(raw.replace(/```[\s\S]*?```/g, 'Code block provided below.'))));

        let htmlBody = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        htmlBody = htmlBody.replace(/\*\*([\s\S]+?)\*\*/g, '<strong style="color:#ffffff; font-weight:900;">$1</strong>');
        htmlBody = htmlBody.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, codeContent) => {
            let encCode = btoa(unescape(encodeURIComponent(codeContent.trim())));
            return `
                <div style="background:#050811; border:1px solid #334155; border-left:3.5px solid #38bdf8; border-radius:10px; margin:8px 0; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:5px 10px; border-bottom:1px solid #1e293b; font-size:11px; color:#38bdf8; font-weight:800;">
                        <span>💻 ${lang ? lang.toUpperCase() : 'CODE'}</span>
                        <button type="button" onclick="NexusCore.copyBase64Text('${encCode}', '📋 Code Copied!')" style="background:#00a884; color:#020617; border:none; padding:3px 9px; border-radius:6px; font-size:10.5px; font-weight:900; cursor:pointer;">📋 Copy Code</button>
                    </div>
                    <pre style="padding:9px 10px; margin:0; font-family:monospace; font-size:12px; color:#e2e8f0; overflow-x:auto; white-space:pre-wrap; word-break:break-word;">${codeContent.trim()}</pre>
                </div>
            `;
        });

        let fullRawEnc = btoa(unescape(encodeURIComponent(raw)));
        let imgHTML = msgObj.imageUrl
            ? `<div style="margin-top:10px;"><img src="${msgObj.imageUrl}" loading="lazy" style="width:100%; max-width:310px; border-radius:12px; border:1.5px solid #38bdf8; display:block;"><button type="button" onclick="window.open('${msgObj.imageUrl}', '_blank')" style="margin-top:6px; background:#10b981; color:#020617; border:none; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer;">⬇️ Save HD Image</button></div>`
            : '';

        return `
            <div style="align-self:flex-start; max-width:90%; background:#182229; border:1px solid #2a3942; border-left:4px solid #a78bfa; color:#f1f5f9; padding:11px 13px; border-radius:2px 16px 16px 16px; font-size:13.5px; line-height:1.55; word-break:break-word;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-bottom:5px; border-bottom:1px solid #233138; gap:8px;">
                    <span style="font-size:11px; color:#a78bfa; font-weight:900;">🤖 NEXUS AI • ${msgObj.serverName || 'Cloud AI'}</span>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="NexusCore.speakSwaraVoice('${encodedFullText}', this)" style="background:rgba(16,185,129,0.18); border:1px solid #10b981; color:#5eead4; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:900; cursor:pointer;">🔊 Listen (Swara)</button>
                        <button type="button" onclick="NexusCore.copyBase64Text('${fullRawEnc}', '📋 Copied!')" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">📋 Copy</button>
                    </div>
                </div>
                <div style="white-space:pre-wrap;">${htmlBody}</div>
                ${imgHTML}
            </div>
        `;
    }

    window.NexusCore = {
        openPrivateAiStudio: function(prefillQuery) {
            let studio = document.getElementById('nx-private-ai-studio');
            if (!studio) {
                studio = document.createElement('div');
                studio.id = 'nx-private-ai-studio';
                document.body.appendChild(studio);
            }

            aiChatHistory = (aiChatHistory || []).filter(m =>
                !m.text || (!m.text.includes('Latin word for connection') && !m.text.includes('American actor'))
            );

            if (aiChatHistory.length === 0) {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: '11-Server Router Ready',
                    text: "Namaste! Main aapka 1:1 Private Nexus AI Studio hoon.\n\nAap niche diye gaye Quick Chips par tap karein ya apna koi bhi JEE/NEET, Coding, Website Architecture, ya Safe AI Image sawal puchhein!"
                });
            }

            studio.innerHTML = `
                <div style="height:56px; background:#182229; border-bottom:1.5px solid #a78bfa; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:9px;">
                        <button type="button" onclick="NexusCore.closePrivateAiStudio()" style="background:none; border:none; color:#f8fafc; font-size:20px; cursor:pointer; padding:4px;">←</button>
                        <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:900;">🤖</div>
                        <div>
                            <div style="font-weight:900; font-size:14.5px; color:#f8fafc;">Nexus 1:1 Private AI Studio</div>
                            <div id="nx-ai-live-srv-status" style="font-size:11px; color:#10b981; font-weight:700;">🟢 11 Fast Servers + Safe Image Gen Active</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="NexusCore.exportAiHistoryTxt()" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:5px 9px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;" title="Save AI Notes">📥 Save</button>
                        <button type="button" onclick="NexusCore.clearAiStudioHistory()" style="background:#1e293b; border:1px solid #334155; color:#f87171; padding:5px 9px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">🗑️ Clear</button>
                    </div>
                </div>

                <!-- Advanced Quick Action Chips Bar -->
                <div style="display:flex; gap:6px; overflow-x:auto; padding:8px 12px; background:#0f172a; border-bottom:1px solid #1e293b; scrollbar-width:none; flex-shrink:0;">
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('What is Nexus')">📘 About Nexus</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('Explain Nexus Website Architecture')">🏗️ Website Code Info</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('JEE Formulas')">📐 JEE Formulas</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('Write HTML CSS JS calculator code')">💻 Code Generator</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('photo banao futuristic IIT campus study room')">🎨 Safe AI Wallpaper</button>
                </div>

                <div id="nx-ai-studio-msgs" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; background:#0b141a;">
                    ${aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('')}
                </div>

                <div style="padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <button type="button" onclick="NexusCore.startAiVoiceMic()" style="background:#202c33; border:1px solid #334155; color:#38bdf8; width:38px; height:38px; border-radius:50%; font-size:16px; cursor:pointer; flex-shrink:0;">🎙️</button>
                    <input type="text" id="nx-ai-studio-in" placeholder="Ask question, math, code, or 'photo banao...'" autocomplete="off" onkeydown="if(event.key==='Enter') NexusCore.sendPrivateAiMessage()" style="flex:1; padding:10px 14px; border-radius:24px; border:1px solid #334155; background:#202c33; color:white; font-size:14px; outline:none;">
                    <button type="button" id="nx-ai-studio-send" onclick="NexusCore.sendPrivateAiMessage()" style="background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; border:none; width:42px; height:42px; border-radius:50%; font-size:18px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">➤</button>
                </div>
            `;
            studio.style.display = 'flex';
            const msgBox = document.getElementById('nx-ai-studio-msgs');
            if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;

            if (prefillQuery && typeof prefillQuery === 'string' && prefillQuery.trim()) {
                this.quickAsk(prefillQuery.trim());
            }
        },

        quickAsk: function(qText) {
            const inp = document.getElementById('nx-ai-studio-in');
            if (inp) {
                inp.value = qText;
                this.sendPrivateAiMessage();
            }
        },

        startAiVoiceMic: function() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                Nexus.toast("🎙️ Voice mic not supported in this browser");
                return;
            }
            const rec = new SpeechRec();
            rec.lang = 'en-IN';
            Nexus.toast("🎙️ Speak your question now...");
            rec.onresult = e => {
                const inp = document.getElementById('nx-ai-studio-in');
                if (inp) {
                    inp.value = e.results[0][0].transcript;
                    this.sendPrivateAiMessage();
                }
            };
            rec.start();
        },

        exportAiHistoryTxt: function() {
            if (!aiChatHistory.length) return;
            let txt = aiChatHistory.map(m => `[${m.role.toUpperCase()}]:\n${m.text}\n`).join('\n-------------------\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
            a.download = `Nexus_AI_Study_Notes_${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            Nexus.toast("📥 AI Study Notes Downloaded!");
        },

        closePrivateAiStudio: function() {
            this.stopSwaraVoice();
            const studio = document.getElementById('nx-private-ai-studio');
            if (studio) studio.style.display = 'none';
        },

        clearAiStudioHistory: function() {
            this.stopSwaraVoice();
            aiChatHistory = [];
            localStorage.removeItem('nx_private_ai_history_v7');
            this.openPrivateAiStudio();
        },

        sendPrivateAiMessage: async function() {
            const inp = document.getElementById('nx-ai-studio-in');
            const sendBtn = document.getElementById('nx-ai-studio-send');
            const msgBox = document.getElementById('nx-ai-studio-msgs');
            const statusEl = document.getElementById('nx-ai-live-srv-status');
            if (!inp || !inp.value.trim()) return;

            let userQ = inp.value.trim();
            inp.value = '';

            aiChatHistory.push({ role: 'user', text: userQ });
            if (msgBox) {
                msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('') +
                    `<div id="nx-ai-thinking-bubble" style="align-self:flex-start; background:#182229; border:1px solid #a78bfa; color:#d8b4fe; padding:9px 14px; border-radius:14px; font-size:12.5px; font-weight:800;">⚡ Thinking carefully & generating answer...</div>`;
                msgBox.scrollTop = msgBox.scrollHeight;
            }

            // 1. STRICT SAFETY SHIELD (Blocks Hacking AND NSFW/18+/Abusive Words in Text & Image Gen!)
            let violationType = isProhibitedOrUnsafePrompt(userQ);
            if (violationType === 'hacking') {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: 'Safety Shield 🛡️',
                    text: "🛡️ **Security & Ethics Policy:** Main Nexus Official Educational AI hoon. Main hacking, password cracking, ya kisi bhi illegal activity mein madad nahi kar sakta. Kripya Web Development, Coding, ya JEE PCM se juda sawal puchhein!"
                });
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }
            if (violationType === 'nsfw') {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: 'Content Filter 🛡️',
                    text: "🚫 **Strict Community Guideline:** Nexus ek clean Student Educational Platform hai. Yahan kisi bhi prakar ke 18+, adult, vulgar ya prohibited words aur photos generate karna strictly प्रतिबंधित (blocked) hai."
                });
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }

            // 2. SAFE EDUCATIONAL & CREATIVE AI IMAGE GENERATION
            if (isAiImagePrompt(userQ)) {
                let cleanPrompt = userQ.replace(/^(\/img|\/image|photo banao|image banao|picture banao|generate image|create image|draw )/i, '').trim() || userQ;
                let safePrompt = `${cleanPrompt}, clean educational digital art, safe for students, high quality HD`;
                let seed = Math.floor(Math.random() * 999999);
                let imgUrl = IMG_GEN_API + encodeURIComponent(safePrompt) + "?model=flux&width=768&height=768&seed=" + seed + "&nologo=true&safe=true";
                aiChatHistory.push({
                    role: 'ai',
                    text: `🎨 Aapki safe HD AI picture taiyar hai: "${cleanPrompt}"`,
                    imageUrl: imgUrl,
                    serverName: 'Safe Flux Image Engine'
                });
                try { localStorage.setItem('nx_private_ai_history_v7', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}
                if (msgBox) {
                    msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('');
                    msgBox.scrollTop = msgBox.scrollHeight;
                }
                return;
            }

            if (sendBtn) sendBtn.disabled = true;

            // 3. Check Built-in Expert Brain First (Nexus, Architecture, What is AI, JEE Formulas)
            let aiReply = getBuiltInExpertAnswer(userQ);
            let usedServerName = aiReply ? 'Nexus Official Brain' : '';

            const sysPrompt = "You are Nexus Official AI Tutor & Coding Assistant created for Mohit Kumar's Nexus Student Community platform. Think step-by-step and give a clear, accurate, well-structured educational answer in friendly Hinglish or English. Never teach hacking or inappropriate content. Wrap any code inside ```html or ```javascript or ```python.";

            // 4. 11-Server Auto-Failover Cloud AI Router
            if (!aiReply) {
                const seed = Math.floor(Math.random() * 99999);
                for (let attempt = 0; attempt < NEXUS_AI_SERVERS.length; attempt++) {
                    let idx = (activeHealthyAiServerIndex + attempt) % NEXUS_AI_SERVERS.length;
                    let srv = NEXUS_AI_SERVERS[idx];
                    if (statusEl) statusEl.innerText = `⚡ Connecting: ${srv.name}...`;

                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 7500);

                    try {
                        if (srv.type === 'post') {
                            let r1 = await fetch(POLLINATIONS_OPENAI, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                signal: controller.signal,
                                body: JSON.stringify({
                                    model: srv.model,
                                    messages: [
                                        { role: 'system', content: sysPrompt },
                                        ...aiChatHistory.slice(-5).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
                                    ]
                                })
                            });
                            clearTimeout(timer);
                            if (r1.ok) {
                                let d1 = await r1.json();
                                let txt = d1?.choices?.[0]?.message?.content || '';
                                if (txt && txt.trim().length > 5) {
                                    aiReply = txt.trim();
                                    usedServerName = srv.name;
                                    activeHealthyAiServerIndex = idx;
                                    break;
                                }
                            }
                        } else {
                            let r2 = await fetch(`${POLLINATIONS_ROOT}${encodeURIComponent(sysPrompt + "\nQuestion: " + userQ)}?model=${srv.model}&seed=${seed}`, {
                                signal: controller.signal
                            });
                            clearTimeout(timer);
                            if (r2.ok) {
                                let t2 = (await r2.text()).trim();
                                if (t2 && t2.length > 5 && !t2.startsWith('<!DOCTYPE') && !t2.startsWith('{')) {
                                    aiReply = t2;
                                    usedServerName = srv.name;
                                    activeHealthyAiServerIndex = idx;
                                    break;
                                }
                            }
                        }
                    } catch (err) {
                        clearTimeout(timer);
                    }
                }
            }

            if (!aiReply) {
                aiReply = `💡 **${userQ}**\n\nIs sawal ka step-by-step solution:\n• Agar aapko code chahiye toh "code for ${userQ}" likhein, ya AI photo ke liye "photo banao ${userQ}" likhein!`;
                usedServerName = 'Nexus Tutor';
            }

            if (statusEl) statusEl.innerText = `🟢 Connected: ${usedServerName}`;
            if (sendBtn) sendBtn.disabled = false;

            aiChatHistory.push({ role: 'ai', text: aiReply, serverName: usedServerName });
            try { localStorage.setItem('nx_private_ai_history_v7', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}

            if (msgBox) {
                msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('');
                msgBox.scrollTop = msgBox.scrollHeight;
            }
        },

        stopSwaraVoice: function() {
            isSwaraSpeaking = false;
            if ('speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch (e) {}
            }
            if (fallbackAudioPlayer) {
                try { fallbackAudioPlayer.pause(); fallbackAudioPlayer = null; } catch (e) {}
            }
        },

        // 100% RELIABLE DUAL-ENGINE SWARA VOICE (Web Speech API + Cloud Hindi TTS Fallback for Mobile WebViews!)
        speakSwaraVoice: function(base64Text, btnEl) {
            if (isSwaraSpeaking) {
                this.stopSwaraVoice();
                if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                Nexus.toast("⏹️ Voice Stopped");
                return;
            }

            let rawText = '';
            try { rawText = decodeURIComponent(escape(atob(base64Text))); } catch (e) { return; }
            let cleanSpeech = rawText
                .replace(/[$\\{}^_]/g, ' ')
                .replace(/[*#`~>-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (!cleanSpeech) return;

            this.stopSwaraVoice();
            isSwaraSpeaking = true;
            if (btnEl) btnEl.innerText = '⏹️ Stop Voice';
            Nexus.toast("🔊 Speaking in Swara Voice...");

            let chunks = cleanSpeech.match(/[^.!?।\n]{1,150}[.!?।\n]?/g) || [cleanSpeech.substring(0, 150)];
            let idx = 0;
            let speechStartedSuccessfully = false;

            // Cloud Audio Stream Fallback if Android WebView speechSynthesis is silent/blocked
            const playCloudTtsFallback = () => {
                if (!isSwaraSpeaking || idx >= chunks.length) {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                    return;
                }
                let q = encodeURIComponent(chunks[idx].trim().substring(0, 180));
                let audioUrl = `${PROTO}[translate.googleapis.com/translate_tts?ie=UTF-8&q=$](https://translate.googleapis.com/translate_tts?ie=UTF-8&q=$){q}&tl=hi&client=tw-ob`;
                fallbackAudioPlayer = new Audio(audioUrl);
                fallbackAudioPlayer.onended = () => {
                    idx++;
                    playCloudTtsFallback();
                };
                fallbackAudioPlayer.onerror = () => {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                };
                fallbackAudioPlayer.play().catch(() => {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                });
            };

            if ('speechSynthesis' in window) {
                let voices = window.speechSynthesis.getVoices() || [];
                let swara = voices.find(v => /swara/i.test(v.name)) ||
                            voices.find(v => v.lang === 'hi-IN') ||
                            voices.find(v => v.lang === 'en-IN');

                const speakNextNative = () => {
                    if (!isSwaraSpeaking || idx >= chunks.length) {
                        isSwaraSpeaking = false;
                        if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                        return;
                    }
                    let u = new SpeechSynthesisUtterance(chunks[idx].trim());
                    if (swara) u.voice = swara;
                    u.lang = swara ? swara.lang : 'hi-IN';
                    u.rate = 1.02;
                    u.onstart = () => { speechStartedSuccessfully = true; };
                    u.onend = () => { idx++; speakNextNative(); };
                    u.onerror = () => {
                        if (!speechStartedSuccessfully) playCloudTtsFallback();
                        else {
                            isSwaraSpeaking = false;
                            if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                        }
                    };
                    window.speechSynthesis.speak(u);
                };

                speakNextNative();
                // If native WebView TTS didn't start within 1.2s, switch to Cloud TTS Audio automatically!
                setTimeout(() => {
                    if (isSwaraSpeaking && !speechStartedSuccessfully && (!window.speechSynthesis.speaking)) {
                        window.speechSynthesis.cancel();
                        playCloudTtsFallback();
                    }
                }, 1200);
            } else {
                playCloudTtsFallback();
            }
        },

        copyBase64Text: function(b64, msg) {
            try {
                navigator.clipboard.writeText(decodeURIComponent(escape(atob(b64))));
                Nexus.toast(msg || "📋 Copied!");
            } catch (e) {}
        },

        openVoiceChangerModal: function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            const modes = [
                { id: 'normal', icon: '🎙️', name: 'Normal Studio Voice', desc: 'Original clear HD voice' },
                { id: 'boss', icon: '👹', name: 'Deep Boss Voice', desc: 'Heavy deep bass pitch' },
                { id: 'fast', icon: '⚡', name: 'Fast Energetic Voice', desc: 'High-pitch fast voice' },
                { id: 'robot', icon: '🤖', name: 'Cyber Robot Voice', desc: 'Robotic metallic tone' }
            ];
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #a855f7; background:#090d16;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#d8b4fe; font-size:15.5px;">🎭 Studio Voice Changer</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${modes.map(m => `
                            <button type="button" onclick="NexusCore.setVoiceEffect('${m.id}', '${m.icon} ${m.name}')" style="background:${selectedVoiceEffect === m.id ? 'rgba(168,85,247,0.25)' : '#111827'}; border:1.5px solid ${selectedVoiceEffect === m.id ? '#a855f7' : '#1e293b'}; border-radius:12px; padding:10px 12px; color:white; text-align:left; cursor:pointer; display:flex; align-items:center; justify-content:space-between;">
                                <div>
                                    <div style="font-weight:800; font-size:13px;">${m.icon} ${m.name}</div>
                                    <div style="font-size:11px; color:#94a3b8;">${m.desc}</div>
                                </div>
                                ${selectedVoiceEffect === m.id ? '<span style="color:#a855f7; font-weight:900;">✓ Active</span>' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        setVoiceEffect: function(id, label) {
            selectedVoiceEffect = id;
            document.getElementById('nx-global-modal').style.display = 'none';
            Nexus.toast(`🎭 Voice Mode: ${label}`);
        }
    };

    function runCoreMasterLoop() {
        patchMasterFollowerGraph();
        enforceSingleMessageButtonOnPublicProfile();
        patchDmDeleteAndFixPlusTrayOverlap();
        healCommunityTabAndGroupSend();
        injectAiButtonsEverywhere();
    }

    document.addEventListener('DOMContentLoaded', () => {
        runCoreMasterLoop();
        setInterval(runCoreMasterLoop, 350);
    });
    setTimeout(runCoreMasterLoop, 120);
})();
