// ================= SW.JS (v25.0 TURBO SPEED, ZERO-CACHE LIVE SYNC & UNIVERSAL + NEXUS OFFICIAL AI): ⚡ INSTANT PWA SPEED + 🧹 AUTO-CLEARS OLD CACHES + 🤖 INTERCEPTS /.netlify/functions/ai & /api/ai =================

const TURBO_CACHE = 'nexus-turbo-v25';
const STATIC_ASSETS = [
    'manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(TURBO_CACHE).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => {
                if (k !== TURBO_CACHE) return caches.delete(k);
            })
        )).then(() => self.clients.claim())
    );
});

async function handleAiRequestInWorker(request) {
    let userPrompt = 'Hello';
    try {
        const clone = request.clone();
        const body = await clone.json();
        userPrompt = body.prompt || body.message || body.query || body.text ||
                     (Array.isArray(body.messages) && body.messages.length ? body.messages[body.messages.length - 1].content : 'Hello');
    } catch (e) {}

    const qLower = String(userPrompt).toLowerCase();

    // Instant Official Response for Nexus Owner / Server Questions
    if (qLower.includes('owner') || qLower.includes('founder') || qLower.includes('kisne banaya') || qLower.includes('creator')) {
        const ownerMsg = "👑 **Nexus Official Info:** Nexus Student Community Platform ke Founder, Owner aur Lead Developer **Mohit** (`@mohit_01`) hain!";
        return new Response(JSON.stringify({
            reply: ownerMsg, answer: ownerMsg, text: ownerMsg, result: ownerMsg, content: ownerMsg, message: ownerMsg,
            choices: [{ message: { content: ownerMsg } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const sys = "You are Nexus Official AI Tutor & Platform Assistant (created by Founder & Owner Mohit @mohit_01 for Nexus Student Community). You help students with IIT-JEE / NEET (Physics, Chemistry, Maths, Biology), Coding (HTML, CSS, JS, Python), and Nexus Platform features (1:1 Personal DM, 20MB Video/Photo sharing, Live YouTube Watch Party, PDF Study Vault, and Live Test Series). If someone asks about server status or any issue, tell them all Nexus servers are 100% Online and advise them to keep patience during live updates. Reply clearly in friendly Hinglish.";
    let aiReply = '';

    try {
        const r1 = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai',
                messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: String(userPrompt) }
                ]
            })
        });
        if (r1.ok) {
            const d1 = await r1.json();
            aiReply = d1?.choices?.[0]?.message?.content || '';
        }
    } catch (e) {}

    if (!aiReply) {
        try {
            const r2 = await fetch('https://text.pollinations.ai/' + encodeURIComponent(sys + "\nUser: " + userPrompt));
            if (r2.ok) aiReply = (await r2.text()).trim();
        } catch (e) {}
    }

    if (!aiReply) {
        aiReply = "Namaste! Main Nexus Official AI Tutor hoon (by Mohit @mohit_01). Aap Physics, Chemistry, Maths (JEE), Coding ya Nexus Platform ke kisi bhi feature ka sawal puchh sakte hain!";
    }

    const payload = JSON.stringify({
        reply: aiReply,
        answer: aiReply,
        text: aiReply,
        result: aiReply,
        content: aiReply,
        message: aiReply,
        choices: [{ message: { content: aiReply } }]
    });

    return new Response(payload, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. Intercept /.netlify/functions/ai & /api/ai so HTTP 404 NEVER happens on Vercel or Netlify!
    if (url.pathname.includes('/.netlify/functions/ai') || url.pathname.includes('/api/ai')) {
        event.respondWith(handleAiRequestInWorker(event.request));
        return;
    }

    if (event.request.method !== 'GET') return;

    // 2. For HTML, CSS & JS files: Always fetch 100% fresh from Network first so GitHub commits show IMMEDIATELY!
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname === '/') {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .then(netRes => {
                    const clone = netRes.clone();
                    caches.open(TURBO_CACHE).then(c => c.put(event.request, clone)).catch(() => {});
                    return netRes;
                })
                .catch(() => caches.match(event.request, { ignoreSearch: true }))
        );
        return;
    }

    // 3. For Images, Fonts & Icons: Fast Stale-While-Revalidate for 0.01s loading speed
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|woff2?|ttf)$/i)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                const netFetch = fetch(event.request).then(netRes => {
                    const clone = netRes.clone();
                    caches.open(TURBO_CACHE).then(c => c.put(event.request, clone)).catch(() => {});
                    return netRes;
                }).catch(() => cached);
                return cached || netFetch;
            })
        );
        return;
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow('/');
        })
    );
});
// === END OF SW.JS ===
