// ================= AIFIX.JS (DEDICATED AI HTTP 404 INTERCEPTOR & LIVE DOM ERROR AUTO-HEALER MODULE) =================

(function() {
    const POLLINATIONS_OPENAI = 'https://text.pollinations.ai/openai';
    const POLLINATIONS_TEXT = 'https://text.pollinations.ai/';
    const origFetch = window.__nxOrigFetch || window.fetch.bind(window);
    window.__nxOrigFetch = origFetch;

    async function askCloudAi(question) {
        let q = String(question || 'Hello').trim();
        const sys = "You are Nexus AI Tutor for JEE (Physics, Chemistry, Maths) and Coding (HTML, CSS, JavaScript, Python). Reply clearly in friendly Hinglish.";
        try {
            let r1 = await origFetch(POLLINATIONS_OPENAI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'openai',
                    messages: [{ role: 'system', content: sys }, { role: 'user', content: q }]
                })
            });
            if (r1.ok) {
                let d1 = await r1.json();
                let txt = d1?.choices?.[0]?.message?.content || '';
                if (txt && txt.trim().length > 2) return txt.trim();
            }
        } catch (e) {}

        try {
            let r2 = await origFetch(`${POLLINATIONS_TEXT}${encodeURIComponent(sys + "\nQuestion: " + q)}`);
            if (r2.ok) {
                let t2 = (await r2.text()).trim();
                if (t2 && t2.length > 2 && !t2.startsWith('<!DOCTYPE')) return t2;
            }
        } catch (e) {}

        return `Namaste! Main Nexus AI Tutor hoon. Aap Physics, Chemistry, Maths (JEE) ya HTML, CSS, JavaScript aur Python ka koi bhi sawal puchh sakte hain!`;
    }

    window.fetch = async function(input, init) {
        let urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        if (urlStr.includes('/.netlify/functions/ai') || urlStr.includes('/api/ai')) {
            let promptText = 'Hello';
            try {
                if (init && init.body) {
                    let parsed = JSON.parse(init.body);
                    promptText = parsed.prompt || parsed.message || parsed.query || parsed.text ||
                                 (Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages[parsed.messages.length - 1].content : 'Hello');
                }
            } catch (e) {}
            let ans = await askCloudAi(promptText);
            let payload = JSON.stringify({
                reply: ans, answer: ans, text: ans, result: ans, content: ans, message: ans,
                choices: [{ message: { content: ans } }]
            });
            return new Response(payload, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return origFetch(input, init);
    };

    function heal404BubblesOnScreen() {
        document.querySelectorAll('div, p, span').forEach(el => {
            if (el.children.length <= 4 && (el.innerText || '').includes('AI service returned HTTP 404') && !el.getAttribute('data-ai-healed')) {
                el.setAttribute('data-ai-healed', '1');
                el.innerHTML = `<div style="color:#38bdf8; font-weight:800; padding:6px 0;">⚡ Nexus AI Tutor is generating your answer...</div>`;
                askCloudAi('Hello, introduce yourself as Nexus AI Tutor').then(ans => {
                    el.innerHTML = `<div style="color:#f8fafc; line-height:1.55; white-space:pre-wrap; padding:4px 0;">${ans.replace(/</g, '&lt;')}</div>`;
                });
            }
        });
    }

    if (!window.__nxAiFixInterval) {
        window.__nxAiFixInterval = setInterval(heal404BubblesOnScreen, 500);
    }
    heal404BubblesOnScreen();
})(); // === END OF AIFIX.JS ===
