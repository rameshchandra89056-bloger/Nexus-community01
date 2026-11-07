// === VOICE.JS (v25.0 DIRECT FIRESTORE 1-10 PHOTO UPLOADER & VOICE NOTE RECORDER) ===
(function() {
    let mediaRec = null, chunks = [], startTs = 0, recTimer = null, recMode = 'dm';
    const rKey = (a, b) => [String(a || '').toLowerCase().trim(), String(b || '').toLowerCase().trim()].sort().join('__');

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        try { let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user'); if (s) return JSON.parse(s); } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function getPartnerUsername() {
        if (window.NexusDM && NexusDM.activePartner) return NexusDM.activePartner;
        let pName = (document.getElementById('nx-dm-partner-name')?.innerText || '').trim();
        let u = (window.Nexus && Nexus.users || []).find(x => x && ((x.name && x.name.toLowerCase() === pName.toLowerCase()) || (x.username && x.username.toLowerCase() === pName.toLowerCase())));
        return u ? u.username : pName.replace(/^@/, '');
    }

    function compressPhoto(file, maxD, qual) {
        return new Promise((res, rej) => {
            const rd = new FileReader();
            rd.onload = e => {
                const im = new Image();
                im.onload = () => {
                    let w = im.width, h = im.height;
                    if (w > maxD || h > maxD) {
                        if (w > h) { h = Math.round((h * maxD) / w); w = maxD; }
                        else { w = Math.round((w * maxD) / h); h = maxD; }
                    }
                    const c = document.createElement('canvas'); c.width = w; c.height = h;
                    c.getContext('2d').drawImage(im, 0, 0, w, h);
                    res(c.toDataURL('image/jpeg', qual));
                };
                im.onerror = rej; im.src = e.target.result;
            };
            rd.onerror = rej; rd.readAsDataURL(file);
        });
    }

    window.NexusVoice = {
        pickPhotos: function(mode) {
            let inp = document.getElementById('nx-v25-photo-input');
            if (!inp) {
                inp = document.createElement('input'); inp.type = 'file'; inp.id = 'nx-v25-photo-input';
                inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none';
                document.body.appendChild(inp);
            }
            inp.value = '';
            inp.onchange = async ev => {
                const files = Array.from(ev.target.files || []).slice(0, 10);
                if (!files.length || !window.Nexus || !Nexus.db) return;
                let me = getMe();
                if (Nexus.toast) Nexus.toast(`📸 Uploading ${files.length} photo(s)...`);
                try {
                    let urls = [];
                    let maxDim = files.length > 3 ? 520 : 680;
                    let qual = files.length > 3 ? 0.58 : 0.72;
                    for (let f of files) urls.push(await compressPhoto(f, maxDim, qual));

                    if (mode === 'dm') {
                        let pU = getPartnerUsername();
                        if (!pU) return;
                        await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: rKey(me.username, pU),
                            fromUser: me.username,
                            fromName: me.name || me.username,
                            toUser: pU,
                            text: '',
                            imgUrl: urls[0],
                            imgUrls: urls,
                            createdAt: Date.now(),
                            seen: false
                        });
                    } else {
                        let rId = (window.NexusChat && NexusChat.activeRoom) || 'casual_chat';
                        await Nexus.db.collection("nexus_real_msgs").add({
                            roomId: rId,
                            sender: me.name || me.username,
                            username: me.username,
                            text: '',
                            imgUrl: urls[0],
                            imgUrls: urls,
                            createdAt: Date.now()
                        });
                    }
                    if (Nexus.toast) Nexus.toast(`✅ ${files.length} Photo(s) Sent!`);
                } catch (err) {
                    if (Nexus.toast) Nexus.toast("⚠️ Photo too large, select fewer photos!");
                }
            };
            inp.click();
        },

        startRec: async function(mode) {
            recMode = mode || 'dm';
            let bar = document.getElementById('nx-v25-rec-bar');
            if (!bar) {
                bar = document.createElement('div'); bar.id = 'nx-v25-rec-bar';
                bar.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);width:92%;max-width:400px;background:#0f172a;border:2px solid #ef4444;border-radius:16px;padding:10px 14px;z-index:100650;display:none;align-items:center;justify-content:space-between;box-shadow:0 16px 40px rgba(0,0,0,0.95);';
                document.body.appendChild(bar);
            }
            try {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                chunks = []; mediaRec = new MediaRecorder(s);
                mediaRec.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                startTs = Date.now(); bar.style.display = 'flex';
                bar.innerHTML = `<span style="color:#fff;font-size:13px;font-weight:900;">🎙️ Recording: <b id="nx-v25-tm" style="color:#fde047;">0:00</b></span>
                    <div style="display:flex;gap:6px;">
                        <button type="button" onclick="NexusVoice.stopRec(false)" style="background:#1e293b;color:#fca5a5;border:none;padding:6px 10px;border-radius:8px;font-weight:800;">Cancel</button>
                        <button type="button" onclick="NexusVoice.stopRec(true)" style="background:#10b981;color:#020617;border:none;padding:6px 12px;border-radius:8px;font-weight:900;">Send ➤</button>
                    </div>`;
                clearInterval(recTimer);
                recTimer = setInterval(() => {
                    let sec = Math.floor((Date.now() - startTs) / 1000);
                    const el = document.getElementById('nx-v25-tm');
                    if (el) el.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                }, 400);
                mediaRec.start(250);
            } catch (e) {
                if (window.Nexus && Nexus.toast) Nexus.toast("⚠️ Allow Microphone permission!");
            }
        },

        stopRec: function(sendIt) {
            clearInterval(recTimer);
            const bar = document.getElementById('nx-v25-rec-bar'), el = document.getElementById('nx-v25-tm');
            let dur = el ? el.innerText : '0:04';
            if (bar) bar.style.display = 'none';
            if (!mediaRec) return;
            const rec = mediaRec; mediaRec = null;
            rec.onstop = () => {
                try { rec.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
                if (!sendIt) return;
                const rd = new FileReader();
                rd.onloadend = async () => {
                    let me = getMe();
                    if (!window.Nexus || !Nexus.db) return;
                    if (recMode === 'dm') {
                        let pU = getPartnerUsername();
                        if (!pU) return;
                        await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: rKey(me.username, pU), fromUser: me.username, fromName: me.name || me.username,
                            toUser: pU, text: `🎤 Voice Note (${dur})`, audioData: rd.result, voiceDuration: dur, createdAt: Date.now(), seen: false
                        });
                    } else {
                        let rId = (window.NexusChat && NexusChat.activeRoom) || 'casual_chat';
                        await Nexus.db.collection("nexus_real_msgs").add({
                            roomId: rId, sender: me.name || me.username, username: me.username,
                            text: `🎤 Voice Note (${dur})`, audioData: rd.result, voiceDuration: dur, createdAt: Date.now()
                        });
                    }
                    if (Nexus.toast) Nexus.toast("✅ Voice Note Sent!");
                };
                rd.readAsDataURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
            };
            try { rec.stop(); } catch (e) {}
        }
    };
})();
// === END VOICE.JS ===
