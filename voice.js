// ================= VOICE.JS (v45.0): 🎬 20MB–50MB HD VIDEO SENDER + 📸 1-10 PHOTO CAROUSEL + 🎙️ VOICE NOTES IN 1:1 DM & GROUP CHAT =================

(function() {
    let mediaRec = null, chunks = [], startTs = 0, recTimer = null, recMode = 'dm';
    let dmMediaCache = {}, dmUnsub = null;
    const rKey = (a, b) => [String(a || '').toLowerCase().trim(), String(b || '').toLowerCase().trim()].sort().join('__');

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        try { let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user'); if (s) return JSON.parse(s); } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function getPartner() {
        if (window.NexusDM && NexusDM.activePartner) return NexusDM.activePartner;
        let pName = (document.getElementById('nx-dm-partner-name')?.innerText || '').trim();
        let u = (window.Nexus && Nexus.users || []).find(x => x && ((x.name && x.name.toLowerCase() === pName.toLowerCase()) || (x.username && x.username.toLowerCase() === pName.toLowerCase())));
        return u ? u.username : pName.replace(/^@/, '');
    }

    // Upload 20MB-50MB Video to Free Cloud Stream Host with Progress Bar
    function uploadLargeVideoFile(file, onProgress) {
        return new Promise((resolve, reject) => {
            // If small video (< 750KB), can use direct dataURL instantly
            if (file.size <= 750 * 1024) {
                const rd = new FileReader();
                rd.onload = e => resolve(e.target.result);
                rd.onerror = reject;
                rd.readAsDataURL(file);
                return;
            }

            const xhr = new XMLHttpRequest();
            const fd = new FormData();
            fd.append('reqtype', 'fileupload');
            fd.append('time', '72h');
            fd.append('fileToUpload', file);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && typeof onProgress === 'function') {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText && xhr.responseText.startsWith('http')) {
                    resolve(xhr.responseText.trim());
                } else {
                    reject(new Error('Cloud upload busy'));
                }
            };
            xhr.onerror = () => reject(new Error('Network error during video upload'));
            xhr.open('POST', 'https://litterbox.catbox.moe/resources/internals/api.php', true);
            xhr.send(fd);
        });
    }

    function showUploadProgressBanner(text, pct) {
        let bar = document.getElementById('nx-v45-upload-prog');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'nx-v45-upload-prog';
            bar.style.cssText = 'position:fixed; top:14px; left:50%; transform:translateX(-50%); width:90%; max-width:380px; background:#0f172a; border:1.5px solid #10b981; border-radius:14px; padding:10px 14px; z-index:260000; color:#fff; box-shadow:0 12px 30px rgba(0,0,0,0.9);';
            document.body.appendChild(bar);
        }
        if (pct === null) { bar.remove(); return; }
        bar.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:900; margin-bottom:6px;">
                <span style="color:#6ee7b7;">${text}</span>
                <span style="color:#fde047;">${pct}%</span>
            </div>
            <div style="width:100%; height:6px; background:#1e293b; border-radius:99px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:linear-gradient(90deg,#10b981,#38bdf8); transition:width 0.2s;"></div>
            </div>
        `;
    }

    // Automatically render Videos, Photos & Voice Notes inside both 1:1 DM & Group Chat bubbles!
    function syncMediaIntoBubbles() {
        if (window.Nexus && Nexus.db && !dmUnsub) {
            dmUnsub = Nexus.db.collection("nexus_private_dms").orderBy("createdAt", "desc").limit(80).onSnapshot(snap => {
                snap.forEach(doc => { if (!doc.data().deleted) dmMediaCache[doc.id] = doc.data(); });
                mountAllMediaDOM();
            }, () => {});
        }
        mountAllMediaDOM();
    }

    function mountAllMediaDOM() {
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            let id = row.getAttribute('data-message-id') || '', d = id ? dmMediaCache[id] : null;
            if (!d || d.deleted) return;
            let bubble = row.querySelector('div') || row;

            // Render Video Player if videoUrl exists
            if (d.videoUrl && !row.querySelector('.nx-v45-video-wrap')) {
                let vWrap = document.createElement('div');
                vWrap.className = 'nx-v45-video-wrap';
                vWrap.onclick = e => e.stopPropagation();
                vWrap.style.cssText = 'margin-bottom:6px; border-radius:12px; overflow:hidden; border:1.5px solid #10b981; background:#000; max-width:245px;';
                vWrap.innerHTML = `<video src="${d.videoUrl}" controls playsinline preload="metadata" style="width:100%; max-height:260px; display:block;"></video>`;
                bubble.insertBefore(vWrap, bubble.firstChild);
            }

            // Render Photos if missing
            let pics = (Array.isArray(d.imgUrls) && d.imgUrls.length) ? d.imgUrls : (d.imgUrl ? [d.imgUrl] : []);
            let validPics = pics.filter(u => typeof u === 'string' && u.length > 24);
            if (validPics.length && !row.querySelector('[data-nx-dm-gallery]') && !row.querySelector('.nx-v45-photo-wrap')) {
                let pWrap = document.createElement('div');
                pWrap.className = 'nx-v45-photo-wrap';
                pWrap.onclick = e => e.stopPropagation();
                pWrap.style.cssText = 'display:flex; gap:6px; overflow-x:auto; max-width:235px; margin-bottom:5px;';
                pWrap.innerHTML = validPics.map(u => `<img src="${u}" onclick="window.open('${u}','_blank')" style="width:185px; height:185px; object-fit:cover; border-radius:10px; border:1px solid #38bdf8; cursor:pointer;">`).join('');
                bubble.insertBefore(pWrap, bubble.firstChild);
            }

            // Render Voice Note if missing
            if (d.audioData && !row.querySelector('audio')) {
                let aWrap = document.createElement('div');
                aWrap.onclick = e => e.stopPropagation();
                aWrap.style.margin = '4px 0';
                aWrap.innerHTML = `<audio src="${d.audioData}" controls style="height:34px; max-width:210px;"></audio>`;
                bubble.insertBefore(aWrap, bubble.firstChild);
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
        // Supports BOTH Photos (1-10) AND Large Videos (20MB-50MB)!
        pickPhotos: function(mode) {
            let inp = document.getElementById('nx-v45-media-in');
            if (!inp) {
                inp = document.createElement('input');
                inp.type = 'file';
                inp.id = 'nx-v45-media-in';
                inp.accept = 'image/*,video/mp4,video/webm,video/quicktime,video/*';
                inp.multiple = true;
                inp.style.display = 'none';
                document.body.appendChild(inp);
            }
            inp.value = '';
            inp.onchange = async ev => {
                const files = Array.from(ev.target.files || []).slice(0, 10);
                if (!files.length || !window.Nexus || !Nexus.db) return;
                let me = getMe();

                const videoFile = files.find(f => f.type && f.type.startsWith('video/'));
                if (videoFile) {
                    const sizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);
                    if (videoFile.size > 65 * 1024 * 1024) {
                        if (Nexus.toast) Nexus.toast("⚠️ Max video size is 60 MB!");
                        return;
                    }
                    try {
                        showUploadProgressBanner(`🎬 Uploading Video (${sizeMB} MB)...`, 5);
                        const videoUrl = await uploadLargeVideoFile(videoFile, pct => {
                            showUploadProgressBanner(`🎬 Uploading Video (${sizeMB} MB)...`, pct);
                        });
                        showUploadProgressBanner('', null);

                        if (mode === 'dm') {
                            let pU = getPartner();
                            if (!pU) return;
                            let ref = await Nexus.db.collection("nexus_private_dms").add({
                                roomKey: rKey(me.username, pU),
                                participants: [me.username.toLowerCase(), pU.toLowerCase()],
                                fromUser: me.username,
                                fromName: me.name || me.username,
                                toUser: pU,
                                text: `🎬 Video (${sizeMB} MB)`,
                                videoUrl: videoUrl,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                createdAt: Date.now(),
                                seen: false
                            });
                            dmMediaCache[ref.id] = { videoUrl: videoUrl };
                            setTimeout(mountAllMediaDOM, 100);
                        } else {
                            let rId = (window.NexusChat && NexusChat.getActiveRoomId && NexusChat.getActiveRoomId()) || 'casual_chat';
                            await Nexus.db.collection("nexus_real_msgs").add({
                                roomId: rId,
                                sender: me.name || me.username,
                                username: me.username,
                                text: `🎬 Video (${sizeMB} MB)`,
                                videoUrl: videoUrl,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                createdAt: Date.now()
                            });
                        }
                        if (Nexus.toast) Nexus.toast(`✅ Video (${sizeMB} MB) Sent!`);
                    } catch (err) {
                        showUploadProgressBanner('', null);
                        if (Nexus.toast) Nexus.toast("⚠️ Video upload interrupted. Please check internet & retry.");
                    }
                    return;
                }

                // Otherwise handle 1-10 Photos
                const imgFiles = files.filter(f => f.type && f.type.startsWith('image/'));
                if (!imgFiles.length) return;
                if (Nexus.toast) Nexus.toast(`📸 Sending ${imgFiles.length} photo(s)...`);
                try {
                    let urls = [];
                    for (let f of imgFiles) urls.push(await compressPhoto(f, imgFiles.length > 3 ? 520 : 680, imgFiles.length > 3 ? 0.56 : 0.70));
                    if (mode === 'dm') {
                        let pU = getPartner(); if (!pU) return;
                        let ref = await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: rKey(me.username, pU),
                            participants: [me.username.toLowerCase(), pU.toLowerCase()],
                            fromUser: me.username,
                            fromName: me.name || me.username,
                            toUser: pU,
                            text: '',
                            imgUrl: urls[0],
                            imgUrls: urls,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            createdAt: Date.now(),
                            seen: false
                        });
                        dmMediaCache[ref.id] = { imgUrl: urls[0], imgUrls: urls };
                        setTimeout(mountAllMediaDOM, 80);
                    } else {
                        let rId = (window.NexusChat && NexusChat.getActiveRoomId && NexusChat.getActiveRoomId()) || 'casual_chat';
                        await Nexus.db.collection("nexus_real_msgs").add({
                            roomId: rId, sender: me.name || me.username, username: me.username,
                            text: '', imgUrl: urls[0], imgUrls: urls,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            createdAt: Date.now()
                        });
                    }
                    if (Nexus.toast) Nexus.toast(`✅ ${imgFiles.length} Photo(s) Sent!`);
                } catch (e) {}
            };
            inp.click();
        },

        pickVideo: function(mode) {
            this.pickPhotos(mode);
        },

        uploadCustomMediaFile: async function(file, onProg) {
            if (file.type && file.type.startsWith('video/')) {
                return { type: 'video', url: await uploadLargeVideoFile(file, onProg) };
            }
            return { type: 'image', url: await compressPhoto(file, 720, 0.74) };
        },

        startRec: async function(mode) {
            recMode = mode || 'dm';
            let bar = document.getElementById('nx-v45-rec-bar');
            if (!bar) {
                bar = document.createElement('div'); bar.id = 'nx-v45-rec-bar';
                bar.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);width:92%;max-width:400px;background:#0f172a;border:2px solid #ef4444;border-radius:16px;padding:10px 14px;z-index:200500;display:none;align-items:center;justify-content:space-between;box-shadow:0 16px 40px rgba(0,0,0,0.95);';
                document.body.appendChild(bar);
            }
            try {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                chunks = []; mediaRec = new MediaRecorder(s);
                mediaRec.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
                startTs = Date.now(); bar.style.display = 'flex';
                bar.innerHTML = `<span style="color:#fff;font-size:13px;font-weight:900;">🎙️ Recording: <b id="nx-v45-tm" style="color:#fde047;">0:00</b></span>
                    <div style="display:flex;gap:6px;">
                        <button type="button" onclick="NexusVoice.stopRec(false)" style="background:#1e293b;color:#fca5a5;border:none;padding:6px 10px;border-radius:8px;font-weight:800;">Cancel</button>
                        <button type="button" onclick="NexusVoice.stopRec(true)" style="background:#10b981;color:#020617;border:none;padding:6px 12px;border-radius:8px;font-weight:900;">Send ➤</button>
                    </div>`;
                clearInterval(recTimer);
                recTimer = setInterval(() => {
                    let sec = Math.floor((Date.now() - startTs) / 1000);
                    const el = document.getElementById('nx-v45-tm');
                    if (el) el.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                }, 400);
                mediaRec.start(250);
            } catch (e) { if (window.Nexus && Nexus.toast) Nexus.toast("⚠️ Allow Microphone permission!"); }
        },

        stopRec: function(sendIt) {
            clearInterval(recTimer);
            const bar = document.getElementById('nx-v45-rec-bar'), el = document.getElementById('nx-v45-tm');
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
                            toUser: pU, text: `🎤 Voice Note (${dur})`, audioData: rd.result, voiceDuration: dur,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), createdAt: Date.now(), seen: false
                        });
                        dmMediaCache[ref.id] = { audioData: rd.result, voiceDuration: dur };
                        setTimeout(mountAllMediaDOM, 80);
                    } else {
                        let rId = (window.NexusChat && NexusChat.getActiveRoomId && NexusChat.getActiveRoomId()) || 'casual_chat';
                        await Nexus.db.collection("nexus_real_msgs").add({
                            roomId: rId, sender: me.name || me.username, username: me.username,
                            text: `🎤 Voice Note (${dur})`, audioData: rd.result, voiceDuration: dur,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), createdAt: Date.now()
                        });
                    }
                    if (Nexus.toast) Nexus.toast("✅ Voice Note Sent!");
                };
                rd.readAsDataURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
            };
            try { rec.stop(); } catch (e) {}
        }
    };

    setInterval(() => {
        if (window.NexusPower) {
            NexusPower.triggerDmPhoto = () => NexusVoice.pickPhotos('dm');
            NexusPower.triggerViewOncePhoto = () => NexusVoice.pickPhotos('dm');
            NexusPower.startVoiceRecord = () => NexusVoice.startRec('dm');
        }
        if (window.NexusDM) NexusDM.startVoiceDM = () => NexusVoice.startRec('dm');
        if (window.NexusChat) NexusChat.startVoiceInput = () => NexusVoice.startRec('group');
        syncMediaIntoBubbles();
    }, 450);
})();
// === END OF VOICE.JS ===
