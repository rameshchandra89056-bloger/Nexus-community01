// === VOICE.JS (v7.0 SHORT 100% UNCUT: SENDS VOICE & 1-10 PHOTOS VIA NEXUSDM.SENDDM) ===
(function() {
    let mediaRec = null, chunks = [], startTs = 0, recTimer = null, recMode = 'dm', mediaCache = {};

    if (!document.getElementById('nx-v7-css')) {
        const st = document.createElement('style');
        st.id = 'nx-v7-css';
        st.innerHTML = `
            .nx-vip-row { display:flex !important; gap:8px; overflow-x:auto !important; -webkit-overflow-scrolling:touch !important; touch-action:pan-x !important; max-width:250px; padding:4px 2px; }
            .nx-vip-row::-webkit-scrollbar { display:none; }
            .nx-vip-pic { flex:0 0 195px; width:195px; height:205px; border-radius:12px; object-fit:cover; border:1.5px solid #38bdf8; cursor:pointer; }
            #nx-v7-bar { position:fixed; bottom:68px; left:50%; transform:translateX(-50%); width:92%; max-width:400px; background:#0f172a; border:2px solid #ef4444; border-radius:16px; padding:10px 14px; z-index:100450; display:none; align-items:center; justify-content:space-between; }
        `;
        document.head.appendChild(st);
    }

    function sendTokenViaNativeChat(tokenText, isDm) {
        if (isDm && window.NexusDM) {
            const inp = document.getElementById('nx-dm-input');
            if (inp) { inp.value = tokenText; NexusDM.sendDM(); }
        } else if (window.NexusChat) {
            const inp = document.getElementById('nx-chat-msg-in');
            if (inp) { inp.value = tokenText; NexusChat.sendChatMessage(); }
        }
    }

    async function renderMediaTokensInDOM() {
        document.querySelectorAll('#nx-dm-msgs-box span, #nx-dm-msgs-box div, #nx-room-messages span').forEach(async (el) => {
            if (el.children.length > 0) return;
            let txt = (el.innerText || '').trim();
            if ((txt.startsWith('🎤VN_ID|') || txt.startsWith('📸PIC_ID|')) && !el.getAttribute('data-v7-done')) {
                el.setAttribute('data-v7-done', '1');
                let parts = txt.split('|'), mId = parts[1], info = parts[2] || '';
                let d = mediaCache[mId];
                if (!d && window.Nexus && Nexus.db) {
                    let snap = await Nexus.db.collection("nexus_media_store").doc(mId).get().catch(() => null);
                    if (snap && snap.exists) { d = snap.data(); mediaCache[mId] = d; }
                }
                if (!d) return;
                if (txt.startsWith('🎤VN_ID|') && d.audio) {
                    el.innerHTML = `<div style="display:flex;align-items:center;gap:8px;background:#0f172a;border:1.5px solid #10b981;border-radius:12px;padding:6px 10px;margin:3px 0;" onclick="event.stopPropagation();">
                        <audio src="${d.audio}" controls style="height:32px;max-width:210px;"></audio>
                    </div>`;
                } else if (txt.startsWith('📸PIC_ID|') && Array.isArray(d.pics)) {
                    el.innerHTML = d.pics.length === 1
                        ? `<img src="${d.pics[0]}" onclick="event.stopPropagation();window.open('${d.pics[0]}','_blank')" class="nx-vip-pic" style="margin:4px 0;">`
                        : `<div onclick="event.stopPropagation();"><div style="font-size:10px;font-weight:900;color:#38bdf8;">📸 ${d.pics.length} Photos • Swipe Right 👉</div><div class="nx-vip-row">${d.pics.map(u => `<img src="${u}" class="nx-vip-pic" onclick="window.open('${u}','_blank')">`).join('')}</div></div>`;
                }
            }
        });
    }

    function compressFile(file, maxD, q) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = e => {
                const im = new Image();
                im.onload = () => {
                    let w = im.width, h = im.height;
                    if (w > maxD || h > maxD) { if (w > h) { h = Math.round((h * maxD) / w); w = maxD; } else { w = Math.round((w * maxD) / h); h = maxD; } }
                    const c = document.createElement('canvas'); c.width = w; c.height = h;
                    c.getContext('2d').drawImage(im, 0, 0, w, h);
                    res(c.toDataURL('image/jpeg', q));
                };
                im.onerror = rej; im.src = e.target.result;
            };
            r.onerror = rej; r.readAsDataURL(file);
        });
    }

    window.NexusVoice = {
        pickPhotos: function(mode) {
            let inp = document.getElementById('nx-v7-file');
            if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.id = 'nx-v7-file'; inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none'; document.body.appendChild(inp); }
            inp.value = '';
            inp.onchange = async ev => {
                const files = Array.from(ev.target.files || []).slice(0, 10);
                if (!files.length || !window.Nexus || !Nexus.db) return;
                Nexus.toast(`📸 Sending ${files.length} photo(s)...`);
                let urls = [];
                for (let f of files) urls.push(await compressFile(f, files.length > 4 ? 520 : 700, files.length > 4 ? 0.6 : 0.72));
                let mId = 'pic_' + Date.now();
                mediaCache[mId] = { pics: urls };
                await Nexus.db.collection("nexus_media_store").doc(mId).set({ pics: urls, createdAt: Date.now() });
                sendTokenViaNativeChat(`📸PIC_ID|${mId}|${files.length}`, mode === 'dm');
                setTimeout(renderMediaTokensInDOM, 150);
            };
            inp.click();
        },
        startRec: async function(mode) {
            recMode = mode || 'dm';
            let bar = document.getElementById('nx-v7-bar');
            if (!bar) { bar = document.createElement('div'); bar.id = 'nx-v7-bar'; document.body.appendChild(bar); }
            try {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                chunks = []; mediaRec = new MediaRecorder(s);
                mediaRec.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                startTs = Date.now(); bar.style.display = 'flex';
                bar.innerHTML = `<span style="color:#fff;font-size:13px;font-weight:900;">🎙️ Rec: <b id="nx-v7-tm" style="color:#fde047;">0:00</b></span><div style="display:flex;gap:6px;"><button type="button" onclick="NexusVoice.stopRec(false)" style="background:#1e293b;color:#fca5a5;border:none;padding:6px 10px;border-radius:8px;">✕</button><button type="button" onclick="NexusVoice.stopRec(true)" style="background:#10b981;color:#020617;border:none;padding:6px 12px;border-radius:8px;font-weight:900;">Send ➤</button></div>`;
                clearInterval(recTimer);
                recTimer = setInterval(() => {
                    let sec = Math.floor((Date.now() - startTs) / 1000);
                    const el = document.getElementById('nx-v7-tm');
                    if (el) el.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                }, 400);
                mediaRec.start(250);
            } catch (e) { Nexus.toast("⚠️ Allow Microphone!"); }
        },
        stopRec: function(sendIt) {
            clearInterval(recTimer);
            const bar = document.getElementById('nx-v7-bar'), el = document.getElementById('nx-v7-tm');
            let dur = el ? el.innerText : '0:04';
            if (bar) bar.style.display = 'none';
            if (!mediaRec) return;
            const rec = mediaRec; mediaRec = null;
            rec.onstop = () => {
                try { rec.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
                if (!sendIt) return;
                const rd = new FileReader();
                rd.onloadend = async () => {
                    let mId = 'vn_' + Date.now();
                    mediaCache[mId] = { audio: rd.result, dur: dur };
                    await Nexus.db.collection("nexus_media_store").doc(mId).set({ audio: rd.result, dur: dur, createdAt: Date.now() });
                    sendTokenViaNativeChat(`🎤VN_ID|${mId}|${dur}`, recMode === 'dm');
                    setTimeout(renderMediaTokensInDOM, 150);
                };
                rd.readAsDataURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
            };
            try { rec.stop(); } catch (e) {}
        }
    };

    setInterval(() => {
        if (window.NexusDM) NexusDM.startVoiceDM = () => NexusVoice.startRec('dm');
        if (window.NexusChat) NexusChat.startVoiceInput = () => NexusVoice.startRec('group');
        if (window.NexusPower) { NexusPower.triggerDmPhoto = () => NexusVoice.pickPhotos('dm'); NexusPower.startVoiceRecord = () => NexusVoice.startRec('dm'); }
        renderMediaTokensInDOM();
    }, 400);
})();
// === END OF VOICE.JS ===
