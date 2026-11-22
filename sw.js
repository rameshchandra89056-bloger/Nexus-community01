// ================= SW.JS (v27.0 ANTI-HANG TURBO, SAME-ORIGIN ETAG SYNC, CAPPED CACHE & NEXUS AI WORKER) =================

const CORE_CACHE = 'nexus-core-v27';
const MEDIA_CACHE = 'nexus-media-v27';
const MAX_MEDIA_ENTRIES = 40;
const STATIC_ASSETS = [
    'manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CORE_CACHE).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => {
                if (k !== CORE_CACHE && k !== MEDIA_CACHE) return caches.delete(k);
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Helper: Fetch with strict timeout so slow mobile networks NEVER freeze the app
function fetchWithTimeout(request, init, timeoutMs) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            try { controller.abort(); } catch (e) {}
            reject(new Error('SW_TIMEOUT'));
        }, timeoutMs);

        fetch(request, Object.assign({}, init || {}, { signal: controller.signal }))
            .then(res => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

// Helper: Keep media cache capped so mobile storage & Chrome RAM never bloat
async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length > maxItems) {
            const excess = keys.length - maxItems;
            for (let i = 0; i < excess; i++) {
                await cache.delete(keys[i]);
            }
        }
    } catch (e) {}
}

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
        }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const sys = "You are Nexus Official AI Tutor & Platform Assistant (created by Founder & Owner Mohit @mohit_01 for Nexus Student Community). You help students with IIT-JEE / NEET (Physics, Chemistry, Maths, Biology), Coding (HTML, CSS, JS, Python), and Nexus Platform features (1:1 Personal DM, 50MB Video/Photo sharing, Live YouTube Watch Party, PDF Study Vault, and Live Test Series). If someone asks about server status or any issue, tell them all Nexus servers are 100% Online and advise them to keep patience during live updates. Reply clearly in friendly Hinglish.";
    let aiReply = '';

    // Fast 4.5s Timeout Controller on Primary POST
    try {
        const r1 = await fetchWithTimeout('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai',
                messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: String(userPrompt) }
                ]
            })
        }, 4500);

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

    // FIXED: Fallback GET Request ALSO protected with 4.5s Timeout (Never Hangs!)
    if (!aiReply) {
        try {
            const r2 = await fetchWithTimeout(
                'https://text.pollinations.ai/' + encodeURIComponent(sys + "\nUser: " + userPrompt),
                { method: 'GET' },
                4500
            );
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
    const req = event.request;
    const url = new URL(req.url);

    // 1. Intercept Same-Origin /.netlify/functions/ai & /api/ai (Both GET & POST)
    if (url.origin === self.location.origin && (url.pathname.includes('/.netlify/functions/ai') || url.pathname.includes('/api/ai'))) {
        event.respondWith(handleAiRequestInWorker(req));
        return;
    }

    // 2. NEVER intercept non-GET or Cross-Origin requests (Supabase, Firebase, Brevo, CDNs, YouTube, Signed URLs)
    //    This prevents 2MB+ re-downloads, CORS failures, and View-Once media cache leaks!
    if (req.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // 3. Same-Origin HTML, JS & CSS: Fast ETag Network-First (cache: 'no-cache' uses 0-byte 304!) with 4s timeout fallback
    if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetchWithTimeout(req, { cache: 'no-cache' }, 4000)
                .then(netRes => {
                    if (netRes && netRes.ok && netRes.type === 'basic') {
                        const clone = netRes.clone();
                        caches.open(CORE_CACHE).then(c => c.put(req, clone)).catch(() => {});
                    }
                    return netRes;
                })
                .catch(async () => {
                    const cached = await caches.match(req, { ignoreSearch: true });
                    return cached || new Response('', { status: 503, statusText: 'Offline' });
                })
        );
        return;
    }

    // 4. Same-Origin Static Images, Fonts & Icons: Fast Stale-While-Revalidate (Capped at 40 items)
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|woff2?|ttf)$/i)) {
        event.respondWith(
            caches.open(MEDIA_CACHE).then(async cache => {
                const cached = await cache.match(req);
                const netFetch = fetch(req).then(netRes => {
                    if (netRes && netRes.ok && netRes.type === 'basic') {
                        cache.put(req, netRes.clone()).then(() => trimCache(MEDIA_CACHE, MAX_MEDIA_ENTRIES)).catch(() => {});
                    }
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
    const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow(targetUrl);
        })
    );
});
