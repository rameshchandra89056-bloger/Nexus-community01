// ================= AIFIX.JS (v60.0): RESTORES MISSING MESSAGE INPUT BAR IN DM & GROUP CHAT + SAFELY HIDES NETLIFY BADGE + INSTANT LOGIN =================

(function() {
    if (!document.getElementById('nx-aifix-v60-css')) {
        const st = document.createElement('style');
        st.id = 'nx-aifix-v60-css';
        st.innerHTML = `
            /* 1. FORCE MESSAGE INPUT BARS TO ALWAYS STAY VISIBLE IN DM & GROUP CHAT! */
            #nx-dm-composer,
            #nx-chat-room > div:last-child {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                z-index: 99999 !important;
            }
            #nx-dm-input,
            #nx-chat-msg-in {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }

            /* 2. ONLY TARGET NETLIFY BADGE LINKS (NEVER TOUCH APP DIVS OR CHAT BOXES!) */
            a[href*="netlify.com"],
            iframe[src*="netlify.com"] {
                display: none !important;
                opacity: 0 !important;
                pointer-events: none !important;
                width: 0 !important;
                height: 0 !important;
            }

            /* 3. HIDE DUPLICATE PURPLE AI BANNER IN COMMUNITY TAB */
            #nx-ai-community-banner,
            #nx-ai-promo-card,
            #tab-community div[onclick*="NexusAI.openStudio"]:not(.nx-half-card) {
                display: none !important;
            }
        `;
        document.head.appendChild(st);
    }

    // Safely remove ONLY the "Powered by Netlify" anchor/element without touching any chat or footer buttons
    function removeOnlyNetlifyBadge() {
        document.querySelectorAll('a, iframe').forEach(el => {
            const href = (el.getAttribute('href') || el.getAttribute('src') || '').toLowerCase();
            const txt = (el.innerText || '').trim();
            if (href.includes('netlify.com') || txt === 'Powered by Netlify') {
                el.style.setProperty('display', 'none', 'important');
                try { el.remove(); } catch (e) {}
            }
        });

        // Ensure DM & Group Chat input bars are never hidden
        const dmComp = document.getElementById('nx-dm-composer');
        if (dmComp) dmComp.style.setProperty('display', 'flex', 'important');
    }

    // Keep user session alive across all keys
    function syncUserSession() {
        try {
            let raw = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user') || localStorage.getItem('nx_user');
            if (raw && window.Nexus) {
                let u = JSON.parse(raw);
                if (u && u.username) {
                    Nexus.currentUser = u;
                    Nexus.getCurrentUser = () => u;
                }
            }
        } catch (e) {}
    }

    removeOnlyNetlifyBadge();
    syncUserSession();
    setInterval(() => {
        removeOnlyNetlifyBadge();
        syncUserSession();
    }, 400);
})();
// === END OF AIFIX.JS ===
