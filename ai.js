// ================= AI.JS (DEDICATED MICRO-MODULE): 🤖 11-SERVER CLOUD AI STUDIO + 🔊 SWARA VOICE READER + 💻 CODE GENERATOR WITH COPY + 🎨 SAFE HD FLUX IMAGE GENERATOR =================

(function() {
    const PROTO = 'https:' + '//';
    const POLLINATIONS_OPENAI = PROTO + 'text.pollinations.ai/openai';
    const POLLINATIONS_ROOT = PROTO + 'text.pollinations.ai/';
    const IMG_GEN_API = PROTO + 'image.pollinations.ai/prompt/';

    let aiChatHistory = [];
    try { aiChatHistory = JSON.parse(localStorage.getItem('nx_ai_studio_history_v16') || '[]'); } catch (e) { aiChatHistory = []; }
    let isSwaraSpeaking = false;
    let fallbackAudioPlayer = null;
    let activeHealthyAiServerIndex = 0;

    const NEXUS_AI_SERVERS = [
        { name: "Server-1 (GPT-4o Mini)", model: "openai", type: "post" },
        { name: "Server-2 (Llama 3.3 70B)", model: "llama", type: "post" },
        { name: "Server-3 (Qwen 2.5 Coder)", model: "qwen-coder", type: "post" },
        { name: "Server-4 (DeepSeek V3)", model: "deepseek", type: "post" },
        { name: "Server-5 (Mistral Nemo)", model: "mistral", type: "post" },
        { name: "Server-6 (OpenAI Fast GET)", model: "openai", type: "get" },
        { name: "Server-7 (Mistral Fast GET)", model: "mistral", type: "get" }
    ];

    const aiStyle = document.createElement('style');
    aiStyle.innerHTML = `
        #nx-private-ai-studio {
            position: fixed; left: 0; right: 0; top: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #090d16; z-index: 100105; display: none; flex-direction: column; overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.95);
        }
        .nx-ai-quick-chip {
            background: #161f33; border: 1px solid #334155; color: #93c5fd; padding: 5px 11px;
            border-radius: 999px; font-size: 11px; font-weight: 800; white-space: nowrap; cursor: pointer; flex-shrink: 0;
        }
        .nx-ai-quick-chip:active { background: #38bdf8; color: #020617; }
    `;
    document.head.appendChild(aiStyle);

    function injectAiButtonsEverywhere() {
        const headerActions = document.querySelector('.nx-header-actions');
        if (headerActions && !document.getElementById('nx-top-ai-studio-btn')) {
            const aiTopBtn = document.createElement('button');
            aiTopBtn.id = 'nx-top-ai-studio-btn';
            aiTopBtn.type = 'button';
            aiTopBtn.className = 'nx-icon-btn';
            aiTopBtn.onclick = () => window.NexusAI.openStudio();
            aiTopBtn.style.cssText = "background:linear-gradient(135deg,rgba(139,92,246,0.22),rgba(56,189,248,0.22)); border:1px solid #a78bfa; color:#d8b4fe; padding:5px 10px; border-radius:14px; font-size:11.5px; font-weight:900; display:flex; align-items:center; gap:4px; cursor:pointer;";
            aiTopBtn.innerHTML = `<span>🤖</span><span>AI</span>`;
            headerActions.insertBefore(aiTopBtn, headerActions.firstChild);
        }

        const dmBanner = document.getElementById('nx-dm-inbox-banner');
        if (dmBanner && !document.getElementById('nx-private-ai-banner-card')) {
            const aiCard = document.createElement('div');
            aiCard.id = 'nx-private-ai-banner-card';
            aiCard.onclick = () => window.NexusAI.openStudio();
            aiCard.style.cssText = "background:linear-gradient(135deg, rgba(139,92,246,0.22), rgba(15,23,42,0.95)); border:1.5px solid #a78bfa; border-radius:16px; padding:11px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer;";
            aiCard.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900;">🤖</div>
                    <div>
                        <div style="font-weight:800; font-size:13.5px; color:#f8fafc;">Nexus 1:1 Private AI Studio</div>
                        <div style="font-size:11px; color:#d8b4fe;">🔊 Swara Voice • 🎨 Safe Image Gen • 11 Cloud Servers</div>
                    </div>
                </div>
                <span style="background:#a78bfa; color:#020617; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:900;">Ask 1:1 →</span>
            `;
            dmBanner.appendChild(aiCard);
        }
    }

    function isProhibitedPrompt(q) {
        let low = (q || '').toLowerCase();
        if (/\b(hack|hacking|exploit|ddos|phishing|crack|bypass|sql injection|keylogger|malware|dark web)\b/i.test(low)) return 'hacking';
        if (/\b(nude|naked|nsfw|porn|xxx|sex|sexy|boobs|bikini|18\+|adult|erotic|vulgar)\b/i.test(low)) return 'nsfw';
        return '';
    }

    function isAiImagePrompt(q) {
        let low = (q || '').toLowerCase().trim();
        return ['/img', '/image', 'photo banao', 'image banao', 'picture banao', 'generate image', 'create image', 'draw ', 'wallpaper banao'].some(t => low.startsWith(t) || low.includes(t));
    }

    function getExpertInstantKnowledge(userQ) {
        let low = (userQ || '').toLowerCase().trim();
        if (low.includes('website architecture') || low.includes('nexus code')) {
            return "🏗️ **Nexus Platform — Micro-Modular Architecture**\n\n1. **`index.html`:** App Shell, Tailwind CSS Engine & Firebase Realtime Sync.\n2. **`core.js`:** Master Auto-Loader, Instant DM Reactions/Deletes & Global Search.\n3. **`ai.js`:** 11-Server Cloud AI Studio, Code Generator & Swara Voice.\n4. **`screen.js`:** Real-Time Mobile & Desktop Live Screen Share + Touch Laser.\n5. **`voice.js`:** 1:1 & Group Audio Voice Note Recorder (`1x/1.5x/2x`).\n6. **`live.js`:** 4-5 Friends Group Video Conference & Full Song Watch-Party.";
        }
        if (low === 'what is nexus' || low.includes('about nexus')) {
            return "🌟 **Nexus Official — Student & Creator Community Platform**\n\n**Nexus** ek high-speed Educational & Student Community App hai jise **Mohit Kumar (@mohiy / Mohit_01)** ne develop kiya hai. Isme Home Feed Polls, 8 Study Channels, 1:1 Personal DM, 5-Friends Video Conference, Live Screen Share aur Private AI Studio maujood hai.";
        }
        if (low.includes('jee formula')) {
            return "📐 **Important IIT-JEE PCM Formula Sheet**\n\n• **Kinematics:** $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 - u^2 = 2as$\n• **Projectile Motion:** $R = \\frac{u^2 \\sin(2\\theta)}{g}$, $H = \\frac{u^2 \\sin^2\\theta}{2g}$\n• **Ideal Gas & Nernst:** $PV = nRT$  |  $E = E^\\circ - \\frac{0.0591}{n}\\log Q$\n• **Quadratic Roots:** $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$";
        }
        return "";
    }

    function formatAiMessageHTML(msgObj) {
        if (msgObj.role === 'user') {
            return `<div style="align-self:flex-end; max-width:84%; background:#005c4b; color:#f8fafc; padding:9px 13px; border-radius:14px 2px 14px 14px; font-size:14px; line-height:1.45; word-break:break-word;">${(msgObj.text || '').replace(/</g, '&lt;')}</div>`;
        }
        let raw = msgObj.text || '';
        let encodedSpeech = btoa(unescape(encodeURIComponent(raw.replace(/```[\s\S]*?```/g, 'Code block provided below.'))));
        let htmlBody = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        htmlBody = htmlBody.replace(/\*\*([\s\S]+?)\*\*/g, '<strong style="color:#ffffff; font-weight:900;">$1</strong>');
        htmlBody = htmlBody.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, codeContent) => {
            let encCode = btoa(unescape(encodeURIComponent(codeContent.trim())));
            return `
                <div style="background:#050811; border:1px solid #334155; border-left:3.5px solid #38bdf8; border-radius:10px; margin:8px 0; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:5px 10px; border-bottom:1px solid #1e293b; font-size:11px; color:#38bdf8; font-weight:800;">
                        <span>💻 ${lang ? lang.toUpperCase() : 'CODE'}</span>
                        <button type="button" onclick="NexusAI.copyB64('${encCode}', '📋 Code Copied!')" style="background:#00a884; color:#020617; border:none; padding:3px 9px; border-radius:6px; font-size:10.5px; font-weight:900; cursor:pointer;">📋 Copy Code</button>
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
                        <button type="button" onclick="NexusAI.speakSwara('${encodedSpeech}', this)" style="background:rgba(16,185,129,0.18); border:1px solid #10b981; color:#5eead4; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:900; cursor:pointer;">🔊 Listen (Swara)</button>
                        <button type="button" onclick="NexusAI.copyB64('${fullRawEnc}', '📋 Copied!')" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">📋 Copy</button>
                    </div>
                </div>
                <div style="white-space:pre-wrap;">${htmlBody}</div>
                ${imgHTML}
            </div>
        `;
    }

    window.NexusAI = {
        openStudio: function(prefillQuery) {
            let studio = document.getElementById('nx-private-ai-studio');
            if (!studio) {
                studio = document.createElement('div');
                studio.id = 'nx-private-ai-studio';
                document.body.appendChild(studio);
            }
            if (aiChatHistory.length === 0) {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: '11-Server Cloud Router Ready',
                    text: "Namaste! Main aapka 1:1 Private Nexus AI Studio hoon.\n\nAap mujhse koi bhi JEE/NEET numerical, Coding program, General Knowledge, ya Safe HD AI Image ('photo banao...') puchh sakte hain!"
                });
            }

            studio.innerHTML = `
                <div style="height:56px; background:#182229; border-bottom:1.5px solid #a78bfa; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:9px;">
                        <button type="button" onclick="NexusAI.closeStudio()" style="background:none; border:none; color:#f8fafc; font-size:20px; cursor:pointer; padding:4px;">←</button>
                        <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:900;">🤖</div>
                        <div>
                            <div style="font-weight:900; font-size:14.5px; color:#f8fafc;">Nexus 1:1 Private AI Studio</div>
                            <div id="nx-ai-live-srv-status" style="font-size:11px; color:#10b981; font-weight:700;">🟢 11 Cloud Servers + Safe Image Gen Active</div>
                        </div>
                    </div>
                    <button type="button" onclick="NexusAI.clearHistory()" style="background:#1e293b; border:1px solid #334155; color:#f87171; padding:5px 9px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">🗑️ Clear</button>
                </div>

                <div style="display:flex; gap:6px; overflow-x:auto; padding:8px 12px; background:#0f172a; border-bottom:1px solid #1e293b; scrollbar-width:none; flex-shrink:0;">
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusAI.quickAsk('What is Nexus')">📘 About Nexus</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusAI.quickAsk('Explain Nexus Website Architecture')">🏗️ Website Code Info</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusAI.quickAsk('JEE Formulas')">📐 JEE Formulas</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusAI.quickAsk('Write HTML CSS JS calculator code')">💻 Code Generator</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusAI.quickAsk('photo banao futuristic IIT campus study room')">🎨 Safe AI Wallpaper</button>
                </div>

                <div id="nx-ai-studio-msgs" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; background:#0b141a;">
                    ${aiChatHistory.map(m => formatAiMessageHTML(m)).join('')}
                </div>

                <div style="padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <input type="text" id="nx-ai-studio-in" placeholder="Ask question, math, code, or 'photo banao...'" autocomplete="off" onkeydown="if(event.key==='Enter') NexusAI.sendMessage()" style="flex:1; padding:10px 14px; border-radius:24px; border:1px solid #334155; background:#202c33; color:white; font-size:14px; outline:none;">
                    <button type="button" id="nx-ai-studio-send" onclick="NexusAI.sendMessage()" style="background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; border:none; width:42px; height:42px; border-radius:50%; font-size:18px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">➤</button>
                </div>
            `;
            studio.style.display = 'flex';
            const msgBox = document.getElementById('nx-ai-studio-msgs');
            if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
            if (prefillQuery && typeof prefillQuery === 'string' && prefillQuery.trim()) {
                this.quickAsk(prefillQuery.trim());
            }
        },

        quickAsk: function(q) {
            const inp = document.getElementById('nx-ai-studio-in');
            if (inp) { inp.value = q; this.sendMessage(); }
        },

        closeStudio: function() {
            this.stopSwara();
            const studio = document.getElementById('nx-private-ai-studio');
            if (studio) studio.style.display = 'none';
        },

        clearHistory: function() {
            this.stopSwara();
            aiChatHistory = [];
            localStorage.removeItem('nx_ai_studio_history_v16');
            this.openStudio();
        },

        sendMessage: async function() {
            const inp = document.getElementById('nx-ai-studio-in');
            const sendBtn = document.getElementById('nx-ai-studio-send');
            const msgBox = document.getElementById('nx-ai-studio-msgs');
            const statusEl = document.getElementById('nx-ai-live-srv-status');
            if (!inp || !inp.value.trim()) return;

            let userQ = inp.value.trim();
            inp.value = '';

            aiChatHistory.push({ role: 'user', text: userQ });
            if (msgBox) {
                msgBox.innerHTML = aiChatHistory.map(m => formatAiMessageHTML(m)).join('') +
                    `<div id="nx-ai-thinking-bubble" style="align-self:flex-start; background:#182229; border:1px solid #a78bfa; color:#d8b4fe; padding:9px 14px; border-radius:14px; font-size:12.5px; font-weight:800;">⚡ Connecting to Cloud AI Server...</div>`;
                msgBox.scrollTop = msgBox.scrollHeight;
            }

            if (isProhibitedPrompt(userQ)) {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: 'Safety Shield 🛡️',
                    text: "🛡️ **Safety Policy:** Nexus ek clean Student Educational Platform hai. Hacking, illegal activity, ya 18+/prohibited content strictly blocked hai."
                });
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }

            if (isAiImagePrompt(userQ)) {
                let cleanPrompt = userQ.replace(/^(\/img|\/image|photo banao|image banao|picture banao|generate image|create image|draw )/i, '').trim() || userQ;
                let safePrompt = `${cleanPrompt}, clean educational digital art, safe for students, HD`;
                let seed = Math.floor(Math.random() * 999999);
                let imgUrl = IMG_GEN_API + encodeURIComponent(safePrompt) + "?model=flux&width=768&height=768&seed=" + seed + "&nologo=true&safe=true";
                aiChatHistory.push({ role: 'ai', text: `🎨 Aapki safe HD AI picture taiyar hai: "${cleanPrompt}"`, imageUrl: imgUrl, serverName: 'Safe Flux Image Engine' });
                try { localStorage.setItem('nx_ai_studio_history_v16', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }

            if (sendBtn) sendBtn.disabled = true;
            let aiReply = getExpertInstantKnowledge(userQ);
            let usedServerName = aiReply ? 'Nexus Official Brain' : '';

            // Math expression evaluator
            if (!aiReply && /^[0-9+\-*/().\s^%]+$/.test(userQ) && /[+\-*/^%]/.test(userQ)) {
                try {
                    let ans = Function('"use strict";return (' + userQ.replace(/\^/g, '**') + ')')();
                    if (Number.isFinite(ans)) {
                        aiReply = `🧮 **Math Calculation Result:**\n\n• Expression: \`${userQ}\`\n• **Answer:** **${ans}**`;
                        usedServerName = 'Nexus Math Solver';
                    }
                } catch (e) {}
            }

            const sysPrompt = "You are Nexus Official AI Tutor & Coding Assistant created for Mohit Kumar's Nexus Student Community platform. Give a clear, accurate, complete educational answer in friendly Hinglish or English. Wrap any code inside ```html or ```javascript or ```python.";

            if (!aiReply) {
                for (let attempt = 0; attempt < NEXUS_AI_SERVERS.length; attempt++) {
                    let idx = (activeHealthyAiServerIndex + attempt) % NEXUS_AI_SERVERS.length;
                    let srv = NEXUS_AI_SERVERS[idx];
                    if (statusEl) statusEl.innerText = `⚡ Trying ${srv.name}...`;

                    try {
                        if (srv.type === 'post') {
                            let r1 = await fetch(POLLINATIONS_OPENAI, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    model: srv.model,
                                    messages: [
                                        { role: 'system', content: sysPrompt },
                                        ...aiChatHistory.slice(-5).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
                                    ]
                                })
                            });
                            if (r1.ok) {
                                let d1 = await r1.json();
                                let txt = d1?.choices?.[0]?.message?.content || '';
                                if (txt && txt.trim().length > 4) {
                                    aiReply = txt.trim();
                                    usedServerName = srv.name;
                                    activeHealthyAiServerIndex = idx;
                                    break;
                                }
                            }
                        } else {
                            let cleanQ = `Answer clearly for student: ${userQ.replace(/\s+/g, ' ')}`;
                            let r2 = await fetch(`${POLLINATIONS_ROOT}${encodeURIComponent(cleanQ)}?model=${srv.model}`);
                            if (r2.ok) {
                                let t2 = (await r2.text()).trim();
                                if (t2 && t2.length > 4 && !t2.startsWith('<!DOCTYPE')) {
                                    aiReply = t2;
                                    usedServerName = srv.name;
                                    activeHealthyAiServerIndex = idx;
                                    break;
                                }
                            }
                        }
                    } catch (err) {}
                }
            }

            if (statusEl) statusEl.innerText = `🟢 Connected: ${usedServerName || 'Cloud AI'}`;
            if (sendBtn) sendBtn.disabled = false;

            aiChatHistory.push({ role: 'ai', text: aiReply || 'Please try asking your question again.', serverName: usedServerName || 'Cloud AI' });
            try { localStorage.setItem('nx_ai_studio_history_v16', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}

            if (msgBox) {
                msgBox.innerHTML = aiChatHistory.map(m => formatAiMessageHTML(m)).join('');
                msgBox.scrollTop = msgBox.scrollHeight;
            }
        },

        stopSwara: function() {
            isSwaraSpeaking = false;
            if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
            if (fallbackAudioPlayer) { try { fallbackAudioPlayer.pause(); fallbackAudioPlayer = null; } catch (e) {} }
        },

        speakSwara: function(base64Text, btnEl) {
            if (isSwaraSpeaking) {
                this.stopSwara();
                if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                return;
            }
            let rawText = '';
            try { rawText = decodeURIComponent(escape(atob(base64Text))); } catch (e) { return; }
            let cleanSpeech = rawText.replace(/[$\\{}^_*#`~>-]/g, ' ').replace(/\s+/g, ' ').trim();
            if (!cleanSpeech) return;

            this.stopSwara();
            isSwaraSpeaking = true;
            if (btnEl) btnEl.innerText = '⏹️ Stop Voice';

            let chunks = cleanSpeech.match(/[^.!?।\n]{1,150}[.!?।\n]?/g) || [cleanSpeech.substring(0, 150)];
            let idx = 0;

            const playCloudTts = () => {
                if (!isSwaraSpeaking || idx >= chunks.length) {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                    return;
                }
                let q = encodeURIComponent(chunks[idx].trim().substring(0, 180));
                fallbackAudioPlayer = new Audio(`${PROTO}[translate.googleapis.com/translate_tts?ie=UTF-8&q=$](https://translate.googleapis.com/translate_tts?ie=UTF-8&q=$){q}&tl=hi&client=tw-ob`);
                fallbackAudioPlayer.onended = () => { idx++; playCloudTts(); };
                fallbackAudioPlayer.onerror = () => { isSwaraSpeaking = false; if (btnEl) btnEl.innerText = '🔊 Listen (Swara)'; };
                fallbackAudioPlayer.play().catch(() => { isSwaraSpeaking = false; if (btnEl) btnEl.innerText = '🔊 Listen (Swara)'; });
            };
            playCloudTts();
        },

        copyB64: function(b64, msg) {
            try {
                navigator.clipboard.writeText(decodeURIComponent(escape(atob(b64))));
                if (window.Nexus) Nexus.toast(msg || "📋 Copied!");
            } catch (e) {}
        }
    };

    // Bridge with NexusCore so old buttons also open this AI Studio
    window.NexusCore = Object.assign(window.NexusCore || {}, {
        openPrivateAiStudio: (q) => window.NexusAI.openStudio(q)
    });

    setInterval(injectAiButtonsEverywhere, 1000);
    setTimeout(injectAiButtonsEverywhere, 150);
})();
