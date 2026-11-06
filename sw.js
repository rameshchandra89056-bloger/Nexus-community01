// ================= SW.JS (v21.0 TURBO SPEED & ZERO-404 AI SERVICE WORKER): ⚡ INSTANT PWA & ASSET SPEED + 🧹 AUTO-CLEARS OLD STALE CACHES + 🤖 INTERCEPTS /.netlify/functions/ai AT NETWORK LEVEL SO HTTP 404 NEVER HAPPENS =================

const TURBO_CACHE = 'nexus-turbo-v21';
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

    const sys = "You are Nexus AI Tutor for JEE (Physics, Chemistry, Maths) and Coding (HTML, CSS, JS, Python). Reply clearly in friendly Hinglish.";
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
        aiReply = "Namaste! Main Nexus AI Tutor hoon. Aap Physics, Chemistry, Maths (JEE) ya HTML, CSS, JS, Python ka koi bhi sawal puchh sakte hain!";
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

    // 1. Intercept /.netlify/functions/ai so HTTP 404 NEVER happens!
    if (url.pathname.includes('/.netlify/functions/ai') || url.pathname.includes('/api/ai')) {
        event.respondWith(handleAiRequestInWorker(event.request));
        return;
    }

    if (event.request.method !== 'GET') return;

    // 2. For HTML & JS files: Always fetch fresh from Network first so updates apply without clearing cache!
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .then(netRes => {
                    const clone = netRes.clone();
                    caches.open(TURBO_CACHE).then(c => c.put(event.request, clone)).catch(() => {});
                    return netRes;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. For Images, Fonts & Icons: Fast Stale-While-Revalidate for instant loading speed
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|woff2?|ttf|css)$/i)) {
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
