// ================= ABOUT.JS: DEDICATED "ABOUT NEXUS" & NEW VISITOR AUTO-GUIDE =================

(function() {
    const GUIDE_STORAGE_KEY = 'nx_official_guide_v10';

    // 👉 ROZ KE NAYE FEATURES YAHAN ADD KAREIN (Auto-updates Settings & Welcome Popup!)
    const NEXUS_ALL_FEATURES = [
        {
            icon: "🤖",
            title: "1. Private 1:1 Nexus AI Studio (With Swara Voice 🔊 & Code Copy 📋)",
            where: "Kahan hai: Top Header ke 🤖 AI Button, Community Tab aur DM Inbox mein",
            desc: "Ab Group Chat mein bheed kiye bina apne Private 1:1 AI Studio mein Physics, Chemistry, Maths ya Coding ka koi bhi सवाल poochein. Har jawab ko 🔊 Swara Voice mein sunein aur 1-click mein 📋 Code Copy karein (Hacking/Illegal sawal strictly blocked hain)."
        },
        {
            icon: "📞",
            title: "2. Bina Mobile Number Ke Live Voice & Video Call",
            where: "Kahan hai: 1:1 Chat aur Group Chat ke upar ⋮ (3-Dots) Menu mein",
            desc: "Apna mobile number share kiye bina internet se kisi bhi dost ko Live Audio Call ya Face-to-Face Video Call lagayein (asli ringtone aur vibration ke sath)."
        },
        {
            icon: "🟢",
            title: "3. 0.01s Instant Live Status (Green ➔ Blue Circle)",
            where: "Kahan hai: Home Screen ke Stories Bar aur Chat Header mein",
            desc: "Jab tak user app par active hai tab tak Green Circle 🟢 chamkega, aur app band karte hi 0.01 second mein Blue Circle 🔵 aur exact Last Seen time aa jayega."
        },
        {
            icon: "🎵",
            title: "4. Full-Length Song Sync (Group DJ) & ▶️ Watch-Party TV",
            where: "Kahan hai: Chat ke + Button -> Full Song & Watch TV mein",
            desc: "Bina link copy kiye koi bhi Hindi song ya video search karein aur doston ke sath ek sath sunein/dekhein (Show/Hide Screen ke sath)."
        },
        {
            icon: "🎭",
            title: "5. Studio Voice Changer & Fast Voice Notes",
            where: "Kahan hai: Chat ke 🎙️ Mic Button ke bagal mein (🎭 FX)",
            desc: "Voice Note bhejne se pehle apni aawaz ko Deep Boss 👹, Cyber Robot 🤖, ya Fast ⚡ mode mein badlein!"
        },
        {
            icon: "🎮",
            title: "6. 4-Table 2-Player Game Arena & ⚡ 30s Live Quiz Battle",
            where: "Kahan hai: Chat ke + Button -> 2P Game & 30s Quiz mein",
            desc: "4 alag-alag tables par dost ke sath Live Tic-Tac-Toe khelein ya 30-second ka MCQ Quiz fenk kar topper banein."
        },
        {
            icon: "🛡️",
            title: "7. Anti-Screenshot View-Once (①) & 🔑 Pass-Lock",
            where: "Kahan hai: Chat ke + Button -> View-Once & Pass-Lock mein",
            desc: "Secret photo/message bhejein jo sirf 1 ungli daba kar rakhne par dikhta hai aur dekhte hi destroy ho jata hai."
        },
        {
            icon: "📝",
            title: "8. Challengers Live Test Series & 👑 Nexus Watermark",
            where: "Kahan hai: Community Tab -> Live Test Series mein",
            desc: "App ke andar hi live JEE mock tests dein, aur Nexus se bheji ya save ki gayi har photo par official '⚡ NEXUS' watermark payein."
        }
    ];

    const aboutStyle = document.createElement('style');
    aboutStyle.innerHTML = `
        .nx-about-overlay {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.92);
            backdrop-filter: blur(10px);
            z-index: 100110;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 14px;
        }
        .nx-about-box {
            width: 100%;
            max-width: 430px;
            max-height: 90dvh;
            background: linear-gradient(180deg, #0f172a 0%, #090d16 100%);
            border: 2px solid #38bdf8;
            border-radius: 24px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 70px rgba(0,0,0,0.95);
        }
        .nx-about-item {
            background: #111827;
            border: 1px solid #1e293b;
            border-left: 4px solid #10b981;
            border-radius: 14px;
            padding: 11px 12px;
            margin-bottom: 9px;
            text-align: left;
        }
        .nx-about-item h4 {
            font-size: 13.5px;
            color: #f8fafc;
            margin: 0 0 3px 0;
        }
        .nx-about-loc {
            font-size: 10.5px;
            color: #38bdf8;
            font-weight: 800;
            margin-bottom: 4px;
            display: block;
        }
        .nx-about-item p {
            font-size: 12px;
            color: #cbd5e1;
            line-height: 1.48;
            margin: 0;
        }
    `;
    document.head.appendChild(aboutStyle);

    function getAboutModal() {
        let m = document.getElementById('nx-master-about-modal');
        if (!m) {
            m = document.createElement('div');
            m.id = 'nx-master-about-modal';
            m.className = 'nx-about-overlay';
            document.body.appendChild(m);
        }
        return m;
    }

    window.NexusAbout = {
        openGuide: function() {
            const modal = getAboutModal();
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            let topIntro = me
                ? `👋 Welcome <b>${me.name} (@${me.username})</b>! Aapke Nexus App ke saare features ki puri jankari niche di gayi hai:`
                : `🚀 <b>Welcome to Nexus Official!</b> Account banane se pehle dekhiye is app mein aapko kaun-kaun se special features milte hain:`;

            modal.innerHTML = `
                <div class="nx-about-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #1e293b; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:9px;">
                            <div style="width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:20px;">N</div>
                            <div>
                                <span style="font-size:10px; color:#10b981; font-weight:900; text-transform:uppercase;">📘 Official Nexus Guide</span>
                                <h3 style="font-size:16px; color:#f8fafc; margin:0;">About Nexus &amp; All Features</h3>
                            </div>
                        </div>
                        <button type="button" onclick="NexusAbout.closeGuide()" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:5px 10px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">Skip ✕</button>
                    </div>

                    <div style="background:rgba(56,189,248,0.12); border:1px dashed #38bdf8; border-radius:12px; padding:9px 12px; font-size:12px; color:#e2e8f0; margin-bottom:10px; line-height:1.45;">
                        ${topIntro}
                    </div>

                    <div style="overflow-y:auto; flex:1; padding-right:4px;">
                        ${NEXUS_ALL_FEATURES.map(f => `
                            <div class="nx-about-item">
                                <h4>${f.icon}${f.title}</h4>
                                <span class="nx-about-loc">📍 ${f.where}</span>
                                <p>${f.desc}</p>
                            </div>
                        `).join('')}
                    </div>

                    <div style="display:flex; gap:8px; padding-top:10px; border-top:1px solid #1e293b; margin-top:8px;">
                        ${!me ? `
                            <button type="button" onclick="NexusAbout.closeGuide(); Nexus.switchTab('tab-profile');" style="flex:2; background:linear-gradient(135deg,#2563eb,#4f46e5); color:white; border:none; padding:12px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;">🚀 Create Account / Login</button>
                        ` : ''}
                        <button type="button" onclick="NexusAbout.closeGuide()" style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:12px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;">Done / Got It ✓</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
            localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
            if (me && me.username) {
                localStorage.setItem(GUIDE_STORAGE_KEY + '_' + me.username.toLowerCase(), 'true');
            }
        },

        closeGuide: function() {
            localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (me && me.username) {
                localStorage.setItem(GUIDE_STORAGE_KEY + '_' + me.username.toLowerCase(), 'true');
            }
            const m = document.getElementById('nx-master-about-modal');
            if (m) m.style.display = 'none';
        }
    };

    function bindAboutInSettingsAndAutoShow() {
        if (window.NexusPower) {
            NexusPower.openNexusGuideModal = function() {
                NexusAbout.openGuide();
            };
        }
        const wrap = document.getElementById('nx-about-guide-btn-wrap');
        if (wrap) {
            const btn = wrap.querySelector('button');
            if (btn) btn.onclick = () => NexusAbout.openGuide();
        }

        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me && !localStorage.getItem(GUIDE_STORAGE_KEY)) {
            localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
            setTimeout(() => NexusAbout.openGuide(), 650);
        } else if (me && me.username && !localStorage.getItem(GUIDE_STORAGE_KEY + '_' + me.username.toLowerCase())) {
            localStorage.setItem(GUIDE_STORAGE_KEY + '_' + me.username.toLowerCase(), 'true');
            setTimeout(() => NexusAbout.openGuide(), 550);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(bindAboutInSettingsAndAutoShow, 400);
        setInterval(bindAboutInSettingsAndAutoShow, 1400);
    });
})();
