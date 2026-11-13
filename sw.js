// ================= SW.JS (v26.0 ULTRA TURBO SPEED, ZERO-CACHE LIVE SYNC & UNIVERSAL + NEXUS OFFICIAL AI) =================

const TURBO_CACHE = 'nexus-turbo-v26';
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
    let userPrompt = '';
    const reqUrl = new URL(request.url);

    // 1. Check URL Query Params first (For GET requests like /api/ai?prompt=...)
    userPrompt = reqUrl.searchParams.get('prompt') || reqUrl.searchParams.get('q') || reqUrl.searchParams.get('text') || '';

    // 2. Check JSON or Text Body (For POST requests)
    if (!userPrompt && request.method === 'POST') {
        try {
            const clone = request.clone();
            const body = await clone.json();
            userPrompt = body.prompt || body.message || body.query || body.text ||
                         (Array.isArray(body.messages) && body.messages.length ? body.messages[body.messages.length - 1].content : '');
        } catch (e) {
            try {
                const textBody = await request.clone().text();
                if (textBody) userPrompt = textBody;
            } catch (err) {}
        }
    }

    if (!userPrompt) userPrompt = 'Hello';
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

    // Fast 4.5s Timeout Controller so AI never hangs
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);

        const r1 = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: 'openai',
                messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: String(userPrompt) }
                ]
            })
        });
        clearTimeout(timer);
        if (r1.ok) {
            const cType = r1.headers.get('content-type') || '';
            if (cType.includes('application/json')) {
                const d1 = await r1.json();
                aiReply = d1?.choices?.[0]?.message?.content || d1?.reply || '';
            } else {
                aiReply = (await r1.text()).trim();
            }
        }
    } catch (e) {}

    // Instant Fallback GET Request
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
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. Intercept /.netlify/functions/ai & /api/ai (Both GET & POST)
    if (url.pathname.includes('/.netlify/functions/ai') || url.pathname.includes('/api/ai')) {
        event.respondWith(handleAiRequestInWorker(event.request));
        return;
    }

    if (event.request.method !== 'GET') return;

    // 2. Always fetch HTML, CSS & JS 100% fresh from Network (No stale cache)
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

    // 3. Images, Fonts & Icons: Fast Stale-While-Revalidate
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
