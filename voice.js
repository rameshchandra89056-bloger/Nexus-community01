// === VOICE.JS (v27.0 WORKS WITH ORIGINAL DM.JS & POWER.JS TRAY — SENDS & RENDERS 1-10 PHOTOS + AUDIO) ===
(function() {
    let mediaRec = null, chunks = [], startTs = 0, recTimer = null, recMode = 'dm';
    let dmMediaCache = {}, dmUnsub = null;
    const rKey = (a, b) => [String(a || '').toLowerCase().trim(), String(b || '').toLowerCase().trim()].sort().join('__');

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        return (window.Nexus && Nexus.currentUser) || { username: 'mohiy', name: 'Mohit_01' };
    }

    function getPartner() {
        if (window.NexusDM && NexusDM.activePartner) return NexusDM.activePartner;
        let pName = (document.getElementById('nx-dm-partner-name')?.innerText || '').trim();
        let u = (window.Nexus && Nexus.users || []).find(x => x && ((x.name && x.name.toLowerCase() === pName.toLowerCase()) || (x.username && x.username.toLowerCase() === pName.toLowerCase())));
        return u ? u.username : pName.replace(/^@/, '');
    }

    // Watch Firestore DMs and inject missing photos/audio into original dm.js bubbles (Fixes 05:30 ✓ blank bubble!)
    function syncMediaIntoOriginalBubbles() {
        if (window.Nexus && Nexus.db && !dmUnsub) {
            dmUnsub = Nexus.db.collection("nexus_private_dms").orderBy("createdAt", "desc").limit(80).onSnapshot(snap => {
                snap.forEach(doc => { if (!doc.data().deleted) dmMediaCache[doc.id] = doc.data(); });
                mountMediaDOM();
            }, () => {});
        }
        mountMediaDOM();
    }

    function mountMediaDOM() {
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            let id = row.getAttribute('data-message-id') || '', d = id ? dmMediaCache[id] : null;
            if (!d || d.deleted) return;
            let bubble = row.querySelector('div') || row;

            let pics = (Array.isArray(d.imgUrls) && d.imgUrls.length) ? d.imgUrls : ((d.imgUrl || d.img) ? [d.imgUrl || d.img] : []);
            if (pics.length && !row.querySelector('.nx-v27-photo-wrap')) {
                let wrap = document.createElement('div');
                wrap.className = 'nx-v27-photo-wrap';
                wrap.onclick = e => e.stopPropagation();
                wrap.style.cssText = 'display:flex;gap:6px;overflow-x:auto;max-width:235px;margin-bottom:5px;';
                wrap.innerHTML = pics.map((u, i) => `<div style="position:relative;flex:0 0 190px;"><img src="${u}" onclick="window.open('${u}','_blank')" style="width:190px;height:195px;object-fit:cover;border-radius:10px;border:1.5px solid #38bdf8;display:block;cursor:pointer;">${pics.length>1?`<span style="position:absolute;top:5px;right:5px;background:#090d16;color:#10b981;font-size:10px;font-weight:900;padding:2px 6px;border-radius:99px;">${i+1}/${pics.length}</span>`:''}</div>`).join('');
                bubble.insertBefore(wrap, bubble.firstChild);
            }

            if (d.audioData && !row.querySelector('audio')) {
                let audWrap = document.createElement('div');
                audWrap.onclick = e => e.stopPropagation();
                audWrap.style.margin = '4px 0';
                audWrap.innerHTML = `<audio src="${d.audioData}" controls style="height:34px;max-width:210px;"></audio>`;
                bubble.insertBefore(audWrap, bubble.firstChild);
            }
        });
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
            let inp = document.getElementById('nx-v27-photo-in');
            if (!inp) {
                inp = document.createElement('input'); inp.type = 'file'; inp.id = 'nx-v27-photo-in';
                inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none';
                document.body.appendChild(inp);
            }
            inp.value = '';
            inp.onchange = async ev => {
                const files = Array.from(ev.target.files || []).slice(0, 10);
                if (!files.length || !window.Nexus || !Nexus.db) return;
                let me = getMe();
                if (Nexus.toast) Nexus.toast(`📸 Sending ${files.length} photo(s)...`);
                try {
                    let urls = [];
                    for (let f of files) urls.push(await compressPhoto(f, files.length > 3 ? 520 : 680, files.length > 3 ? 0.58 : 0.72));
                    if (mode === 'dm') {
                        let pU = getPartner();
                        if (!pU) return;
                        let ref = await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: rKey(me.username, pU), fromUser: me.username, fromName: me.name || me.username,
                            toUser: pU, text: '', imgUrl: urls[0], imgUrls: urls, createdAt: Date.now(), seen: false
                        });
                        dmMediaCache[ref.id] = { imgUrl: urls[0], imgUrls: urls };
                        setTimeout(mountMediaDOM, 80);
                    } else {
                        let rId = (window.NexusChat && NexusChat.activeRoom) || 'casual_chat';
                        await Nexus.db.collection("nexus_real_msgs").add({
                            roomId: rId, sender: me.name || me.username, username: me.username,
                            text: '', imgUrl: urls[0], imgUrls: urls, createdAt: Date.now()
                        });
                    }
                    if (Nexus.toast) Nexus.toast(`✅ ${files.length} Photo(s) Sent!`);
                } catch (e) {
                    if (Nexus.toast) Nexus.toast("⚠️ Try selecting fewer photos!");
                }
            };
            inp.click();
        },
        startRec: async function(mode) {
            recMode = mode || 'dm';
            let bar = document.getElementById('nx-v27-rec-bar');
            if (!bar) {
                bar = document.createElement('div'); bar.id = 'nx-v27-rec-bar';
                bar.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);width:92%;max-width:400px;background:#0f172a;border:2px solid #ef4444;border-radius:16px;padding:10px 14px;z-index:200500;display:none;align-items:center;justify-content:space-between;box-shadow:0 16px 40px rgba(0,0,0,0.95);';
                document.body.appendChild(bar);
            }
            try {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                chunks = []; mediaRec = new MediaRecorder(s);
                mediaRec.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                startTs = Date.now(); bar.style.display = 'flex';
                bar.innerHTML = `<span style="color:#fff;font-size:13px;font-weight:900;">🎙️ Recording: <b id="nx-v27-tm" style="color:#fde047;">0:00</b></span>
                    <div style="display:flex;gap:6px;">
                        <button type="button" onclick="NexusVoice.stopRec(false)" style="background:#1e293b;color:#fca5a5;border:none;padding:6px 10px;border-radius:8px;font-weight:800;">Cancel</button>
                        <button type="button" onclick="NexusVoice.stopRec(true)" style="background:#10b981;color:#020617;border:none;padding:6px 12px;border-radius:8px;font-weight:900;">Send ➤</button>
                    </div>`;
                clearInterval(recTimer);
                recTimer = setInterval(() => {
                    let sec = Math.floor((Date.now() - startTs) / 1000);
                    const el = document.getElementById('nx-v27-tm');
                    if (el) el.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                }, 400);
                mediaRec.start(250);
            } catch (e) { if (window.Nexus && Nexus.toast) Nexus.toast("⚠️ Allow Microphone permission!"); }
        },
        stopRec: function(sendIt) {
            clearInterval(recTimer);
            const bar = document.getElementById('nx-v27-rec-bar'), el = document.getElementById('nx-v27-tm');
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
                        let pU = getPartner(); if (!pU) return;
                        let ref = await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: rKey(me.username, pU), fromUser: me.username, fromName: me.name || me.username,
                            toUser: pU, text: `🎤 Voice Note (${dur})`, audioData: rd.result, voiceDuration: dur, createdAt: Date.now(), seen: false
                        });
                        dmMediaCache[ref.id] = { audioData: rd.result, voiceDuration: dur };
                        setTimeout(mountMediaDOM, 80);
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

    // Connect ONLY Photo, View-Once & Voice in power.js while keeping 2P Game, 30s Quiz, Sketch, Pass-Lock, Status Card & Send Code 100% original!
    setInterval(() => {
        if (window.NexusPower) {
            NexusPower.triggerDmPhoto = () => NexusVoice.pickPhotos('dm');
            NexusPower.triggerViewOncePhoto = () => NexusVoice.pickPhotos('dm');
            NexusPower.startVoiceRecord = () => NexusVoice.startRec('dm');
        }
        if (window.NexusDM) NexusDM.startVoiceDM = () => NexusVoice.startRec('dm');
        if (window.NexusChat) NexusChat.startVoiceInput = () => NexusVoice.startRec('group');
        syncMediaIntoOriginalBubbles();
    }, 450);
})();
// === END VOICE.JS ===
