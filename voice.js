// ================= VOICE.JS (v4.0 UP TO 10 PHOTOS VIP RIGHT-SCROLL CAROUSEL + FULLSCREEN ZOOM + REAL AUDIO VOICE NOTES — FIXES SCREENSHOTS 1000073554_2 & 1000073553_2) =================

(function() {
    let activeMediaRecorder = null;
    let recordedChunks = [];
    let recStartTime = 0;
    let recTimerInterval = null;
    let recTargetMode = 'dm';
    let voiceSpeedMap = {};
    let dmDocsMediaCache = {};
    let dmMediaUnsub = null;

    if (!document.getElementById('nx-voice-media-styles-v4')) {
        const st = document.createElement('style');
        st.id = 'nx-voice-media-styles-v4';
        st.innerHTML = `
            .nx-vn-card {
                display: flex; align-items: center; gap: 9px;
                background: rgba(15, 23, 42, 0.94); border: 1.5px solid #10b981;
                border-radius: 14px; padding: 7px 10px; min-width: 210px; max-width: 265px; margin: 4px 0;
            }
            .nx-vn-play {
                width: 34px; height: 34px; border-radius: 50%;
                background: #10b981; color: #020617; border: none; font-size: 14px; font-weight: 900;
                cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            }
            .nx-vn-spd {
                background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8;
                font-size: 10.5px; font-weight: 900; padding: 3px 7px; border-radius: 99px; cursor: pointer;
            }
            #nx-voice-rec-bar {
                position: fixed; bottom: 68px; left: 50%; transform: translateX(-50%);
                width: 94%; max-width: 420px; background: #0f172a;
                border: 2px solid #ef4444; border-radius: 20px; padding: 11px 14px;
                z-index: 100300; display: none; align-items: center; justify-content: space-between;
                gap: 10px; box-shadow: 0 18px 45px rgba(0,0,0,0.95);
            }
            /* VIP Nexus Horizontal Right-Scroll Multi-Photo Carousel (1 to 10 Pics) */
            .nx-vip-photo-carousel {
                display: flex !important; flex-wrap: nowrap !important; gap: 8px;
                overflow-x: auto !important; overflow-y: hidden !important;
                -webkit-overflow-scrolling: touch !important; touch-action: pan-x !important;
                scroll-snap-type: x mandatory; scrollbar-width: none;
                max-width: 265px; padding: 4px 2px 6px; margin: 4px 0;
            }
            .nx-vip-photo-carousel::-webkit-scrollbar { display: none; }
            .nx-vip-carousel-slide {
                position: relative; flex: 0 0 215px; width: 215px; height: 225px;
                border-radius: 14px; overflow: hidden; border: 1.5px solid #38bdf8;
                scroll-snap-align: start; background: #090d16; cursor: pointer;
                box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            }
            .nx-vip-carousel-slide img {
                width: 100%; height: 100%; object-fit: cover; display: block;
            }
            .nx-vip-slide-badge {
                position: absolute; top: 7px; right: 7px;
                background: rgba(9, 13, 22, 0.85); border: 1px solid #10b981;
                color: #10b981; font-size: 10px; font-weight: 900;
                padding: 2px 8px; border-radius: 99px;
            }
        `;
        document.head.appendChild(st);
    }

    function startDmMediaListener() {
        if (!window.Nexus || !Nexus.db || dmMediaUnsub) return;
        dmMediaUnsub = Nexus.db.collection("nexus_private_dms")
            .orderBy("createdAt", "desc")
            .limit(80)
            .onSnapshot(snap => {
                snap.forEach(doc => {
                    let d = doc.data();
                    if (d && !d.deleted) dmDocsMediaCache[doc.id] = d;
                    else delete dmDocsMediaCache[doc.id];
                });
                renderAudioAndPhotoCarouselInDOM();
            }, () => {});
    }

    function buildVoicePlayerHTML(audioSrc, durationLabel, uniqueKey) {
        let pid = 'nx_aud_' + uniqueKey.replace(/[^a-zA-Z0-9]/g, '_');
        return `
            <div class="nx-vn-card" onclick="event.stopPropagation();">
                <audio id="${pid}" src="${audioSrc}" preload="metadata"></audio>
                <button type="button" class="nx-vn-play" onclick="NexusVoice.togglePlay('${pid}', this)">▶️</button>
                <div style="flex:1; min-width:0;">
                    <div style="height:5px; background:#1e293b; border-radius:4px; overflow:hidden; margin-bottom:4px;">
                        <div id="${pid}_bar" style="width:0%; height:100%; background:#10b981;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:#93c5fd; font-weight:800;">
                        <span>🎤 Voice Note</span>
                        <span>${durationLabel || '0:05'}</span>
                    </div>
                </div>
                <button type="button" class="nx-vn-spd" onclick="NexusVoice.cycleSpeed('${pid}', this)">1x</button>
            </div>
        `;
    }

    function buildVipPhotoCarouselHTML(urlsArray) {
        if (!Array.isArray(urlsArray) || urlsArray.length === 0) return '';
        if (urlsArray.length === 1) {
            let u = urlsArray[0];
            return `
                <div style="margin:4px 0;" onclick="event.stopPropagation(); NexusVoice.openFullscreenPhoto('${u}')">
                    <img src="${u}" style="max-width:230px; width:100%; max-height:260px; object-fit:cover; border-radius:14px; border:1.5px solid #38bdf8; display:block; cursor:pointer;">
                </div>
            `;
        }
        let total = urlsArray.length;
        return `
            <div onclick="event.stopPropagation();">
                <div style="font-size:10.5px; font-weight:900; color:#38bdf8; margin-bottom:2px;">📸 ${total} Photos • Swipe Right 👉</div>
                <div class="nx-vip-photo-carousel">
                    ${urlsArray.map((u, idx) => `
                        <div class="nx-vip-carousel-slide" onclick="NexusVoice.openFullscreenPhoto('${u}')">
                            <img src="${u}" loading="lazy">
                            <span class="nx-vip-slide-badge">${idx + 1}/${total} 👉</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderAudioAndPhotoCarouselInDOM() {
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach((row, idx) => {
            let msgId = row.getAttribute('data-message-id') || '';
            let docData = msgId ? dmDocsMediaCache[msgId] : null;
            if (docData && docData.deleted) return;

            let bubbleBox = row.querySelector('div') || row;
            let rawText = (docData && docData.text) ? docData.text : (row.innerText || '');

            // 1. Voice Note Rendering
            let audioSrc = (docData && (docData.audioData || docData.audioUrl)) || '';
            let durLbl = (docData && docData.voiceDuration) || '0:05';
            if (audioSrc && !row.querySelector('.nx-vn-card')) {
                bubbleBox.querySelectorAll('span, div').forEach(el => {
                    if (el.children.length === 0 && (el.innerText || '').includes('🎤 Voice Note')) el.innerHTML = '';
                });
                let holder = document.createElement('div');
                holder.innerHTML = buildVoicePlayerHTML(audioSrc, durLbl, msgId || ('dm_' + idx));
                bubbleBox.insertBefore(holder.firstElementChild, bubbleBox.firstChild);
            }

            // 2. Multi-Photo VIP Carousel Rendering (1 to 10 Photos)
            let photoList = [];
            if (docData && Array.isArray(docData.imgUrls) && docData.imgUrls.length > 0) {
                photoList = docData.imgUrls;
            } else if (docData && (docData.imgUrl || docData.img || docData.image)) {
                photoList = [docData.imgUrl || docData.img || docData.image];
            }

            if (photoList.length > 0 && !row.getAttribute('data-vip-photos-mounted')) {
                row.setAttribute('data-vip-photos-mounted', '1');
                // Remove any single broken/duplicate img inside bubbleBox before mounting VIP Carousel
                bubbleBox.querySelectorAll('img').forEach(im => im.remove());
                let holder = document.createElement('div');
                holder.innerHTML = buildVipPhotoCarouselHTML(photoList);
                bubbleBox.insertBefore(holder.firstElementChild, bubbleBox.firstChild);
            }
        });
    }

    function bindMicAndMultiPhotoButtons() {
        if (window.NexusDM) NexusDM.startVoiceDM = () => window.NexusVoice.startRecording('dm');
        if (window.NexusChat) NexusChat.startVoiceInput = () => window.NexusVoice.startRecording('group');
        if (window.NexusPower) {
            NexusPower.startVoiceRecord = () => window.NexusVoice.startRecording('dm');
            NexusPower.triggerDmPhoto = () => window.NexusVoice.openMultiPhotoPicker('dm', false);
            NexusPower.triggerViewOncePhoto = () => window.NexusVoice.openMultiPhotoPicker('dm', true);
        }

        document.querySelectorAll('#nx-dm-dedicated-root button, #nx-chat-room button').forEach(btn => {
            let txt = (btn.innerText || '').trim();
            let oc = btn.getAttribute('onclick') || '';
            if ((txt === '🎙️' || txt === '🎤' || oc.includes('startVoice')) && !btn.getAttribute('data-real-mic-v4')) {
                btn.setAttribute('data-real-mic-v4', '1');
                btn.removeAttribute('onclick');
                let isDm = Boolean(btn.closest('#nx-dm-dedicated-root'));
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.NexusVoice.startRecording(isDm ? 'dm' : 'group');
                };
            }
        });

        ['nx-dm-bottom-tray', 'nx-grp-bottom-tray'].forEach(trayId => {
            const tray = document.getElementById(trayId);
            if (!tray) return;
            let isDm = (trayId === 'nx-dm-bottom-tray');
            tray.querySelectorAll('button, div').forEach(btn => {
                let label = (btn.innerText || '').trim();
                if (label.includes('Photo') && !btn.getAttribute('data-real-photo-v4')) {
                    btn.setAttribute('data-real-photo-v4', '1');
                    btn.removeAttribute('onclick');
                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        tray.style.display = 'none';
                        window.NexusVoice.openMultiPhotoPicker(isDm ? 'dm' : 'group', false);
                    };
                }
            });
        });
    }

    function resolveActiveDmPartner() {
        if (window.NexusDM && NexusDM.activePartner) return NexusDM.activePartner;
        let pName = (document.getElementById('nx-dm-partner-name')?.innerText || '').trim();
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (pName.includes('Saved Messages') && me) return me.username;
        let uObj = (window.Nexus && Nexus.users || []).find(u =>
            u && ((u.name && u.name.toLowerCase() === pName.toLowerCase()) || (u.username && u.username.toLowerCase() === pName.toLowerCase()))
        );
        return uObj ? uObj.username : pName.replace(/^@/, '');
    }

    function compressOneImage(file, maxDim, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    let max = maxDim || 720;
                    if (w > max || h > max) {
                        if (w > h) { h = Math.round((h * max) / w); w = max; }
                        else { w = Math.round((w * max) / h); h = max; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality || 0.72));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    window.NexusVoice = {
        // 📸 Select & Send 1 to 10 Photos Together in VIP Horizontal Carousel!
        openMultiPhotoPicker: function(targetMode, isViewOnce) {
            let fileInp = document.getElementById('nx-multi-10photo-picker');
            if (!fileInp) {
                fileInp = document.createElement('input');
                fileInp.type = 'file';
                fileInp.id = 'nx-multi-10photo-picker';
                fileInp.accept = 'image/*';
                fileInp.multiple = true; // Allows selecting up to 10 photos at once!
                fileInp.style.display = 'none';
                document.body.appendChild(fileInp);
            }

            fileInp.value = '';
            fileInp.onchange = async (ev) => {
                const rawFiles = Array.from(ev.target.files || []).slice(0, 10);
                if (rawFiles.length === 0) return;
                let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
                if (!me || !Nexus.db) return;

                Nexus.toast(`📸 Sending ${rawFiles.length} photo(s)...`);
                try {
                    // Adaptive compression so even 10 photos fit well inside Firestore's 1MB limit
                    let maxDim = rawFiles.length > 4 ? 580 : 760;
                    let qual = rawFiles.length > 4 ? 0.65 : 0.76;
                    const compressedUrls = [];
                    for (let f of rawFiles) {
                        let dUrl = await compressOneImage(f, maxDim, qual);
                        compressedUrls.push(dUrl);
                    }

                    if (targetMode === 'dm') {
                        let partnerU = resolveActiveDmPartner();
                        if (!partnerU) return;
                        let myU = me.username.toLowerCase().trim();
                        let pU = partnerU.toLowerCase().trim();
                        let label = rawFiles.length > 1 ? `📸 Sent ${rawFiles.length} Photos (Swipe Right 👉)` : '📷 Photo';

                        const docRef = await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: [myU, pU].sort().join('__'),
                            fromUser: me.username,
                            fromName: me.name || me.username,
                            toUser: partnerU,
                            text: label,
                            imgUrl: compressedUrls[0],
                            imgUrls: compressedUrls,
                            createdAt: Date.now(),
                            seen: false
                        });
                        dmDocsMediaCache[docRef.id] = {
                            text: label,
                            imgUrl: compressedUrls[0],
                            imgUrls: compressedUrls
                        };
                        setTimeout(renderAudioAndPhotoCarouselInDOM, 100);
                        Nexus.toast(`✅ ${rawFiles.length} Photo(s) Sent!`);
                    } else {
                        let roomId = (window.NexusChat && NexusChat.activeRoom) || 'casual_chat';
                        await Nexus.db.collection("nexus_real_msgs").add({
                            roomId: roomId,
                            sender: me.name || me.username,
                            username: me.username,
                            text: `📸 Shared ${rawFiles.length} Photo(s)`,
                            imgUrl: compressedUrls[0],
                            imgUrls: compressedUrls,
                            createdAt: Date.now()
                        });
                        Nexus.toast(`✅ ${rawFiles.length} Photo(s) Sent!`);
                    }
                } catch (err) {
                    Nexus.toast("⚠️ Could not send photos. Try selecting fewer images.");
                }
            };
            fileInp.click();
        },

        openFullscreenPhoto: function(imgSrc) {
            let v = document.getElementById('nx-vip-photo-zoom-modal');
            if (!v) {
                v = document.createElement('div');
                v.id = 'nx-vip-photo-zoom-modal';
                v.style.cssText = 'position:fixed; inset:0; background:rgba(2,6,23,0.95); z-index:100500; display:none; flex-direction:column; align-items:center; justify-content:center; padding:14px;';
                v.onclick = () => { v.style.display = 'none'; };
                document.body.appendChild(v);
            }
            v.innerHTML = `
                <button type="button" style="position:absolute; top:16px; right:16px; background:#ef4444; color:#fff; border:none; padding:8px 14px; border-radius:10px; font-weight:900; cursor:pointer;">Close ✕</button>
                <img src="${imgSrc}" style="max-width:96%; max-height:85dvh; border-radius:16px; border:2px solid #38bdf8; object-fit:contain;">
            `;
            v.style.display = 'flex';
        },

        startRecording: async function(targetType) {
            recTargetMode = targetType || 'dm';
            let bar = document.getElementById('nx-voice-rec-bar');
            if (!bar) { bar = document.createElement('div'); bar.id = 'nx-voice-rec-bar'; document.body.appendChild(bar); }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recordedChunks = [];
                let mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
                activeMediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 }) : new MediaRecorder(stream);
                activeMediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
                recStartTime = Date.now();
                bar.style.display = 'flex';
                bar.innerHTML = `
                    <div style="display:flex; align-items:center; gap:9px;">
                        <span style="width:12px; height:12px; border-radius:50%; background:#ef4444; display:inline-block;"></span>
                        <span style="font-size:13px; font-weight:900; color:#f8fafc;">🎙️ Recording: <b id="nx-vn-timer" style="color:#fde047;">0:00</b></span>
                    </div>
                    <div style="display:flex; gap:7px;">
                        <button type="button" onclick="NexusVoice.cancelRecording()" style="background:#1e293b; border:1px solid #334155; color:#fca5a5; padding:7px 11px; border-radius:12px; font-size:11.5px; font-weight:800; cursor:pointer;">✕ Cancel</button>
                        <button type="button" onclick="NexusVoice.sendRecording()" style="background:#10b981; border:none; color:#020617; padding:7px 14px; border-radius:12px; font-size:12px; font-weight:900; cursor:pointer;">Send ➤</button>
                    </div>
                `;
                clearInterval(recTimerInterval);
                recTimerInterval = setInterval(() => {
                    let sec = Math.floor((Date.now() - recStartTime) / 1000);
                    const tEl = document.getElementById('nx-vn-timer');
                    if (tEl) tEl.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                    if (sec >= 45) NexusVoice.sendRecording();
                }, 400);
                activeMediaRecorder.start(250);
            } catch (err) {
                if (window.Nexus) Nexus.toast("⚠️ Allow Microphone permission!");
            }
        },

        cancelRecording: function() {
            clearInterval(recTimerInterval);
            const bar = document.getElementById('nx-voice-rec-bar');
            if (bar) bar.style.display = 'none';
            if (activeMediaRecorder) {
                try { activeMediaRecorder.stream.getTracks().forEach(t => t.stop()); activeMediaRecorder.stop(); } catch (e) {}
                activeMediaRecorder = null;
            }
            recordedChunks = [];
        },

        sendRecording: function() {
            clearInterval(recTimerInterval);
            const bar = document.getElementById('nx-voice-rec-bar');
            const tEl = document.getElementById('nx-vn-timer');
            let finalDur = (tEl && tEl.innerText !== '0:00') ? tEl.innerText : '0:03';
            if (bar) bar.style.display = 'none';
            if (!activeMediaRecorder) return;
            const rec = activeMediaRecorder;
            activeMediaRecorder = null;

            rec.onstop = () => {
                try { rec.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
                const blob = new Blob(recordedChunks, { type: rec.mimeType || 'audio/webm' });
                recordedChunks = [];
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result;
                    let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
                    if (!me || !Nexus.db) return;

                    if (recTargetMode === 'dm') {
                        let partnerU = resolveActiveDmPartner();
                        if (!partnerU) return;
                        let myU = me.username.toLowerCase().trim();
                        let pU = partnerU.toLowerCase().trim();
                        const docRef = await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: [myU, pU].sort().join('__'),
                            fromUser: me.username,
                            fromName: me.name || me.username,
                            toUser: partnerU,
                            text: `🎤 Voice Note (${finalDur})`,
                            audioData: base64Audio,
                            voiceDuration: finalDur,
                            createdAt: Date.now(),
                            seen: false
                        });
                        dmDocsMediaCache[docRef.id] = { text: `🎤 Voice Note (${finalDur})`, audioData: base64Audio, voiceDuration: finalDur };
                        setTimeout(renderAudioAndPhotoCarouselInDOM, 100);
                        Nexus.toast("✅ Voice Note Sent!");
                    }
                };
                reader.readAsDataURL(blob);
            };
            try { rec.stop(); } catch (e) {}
        },

        togglePlay: function(audioId, btnEl) {
            const aud = document.getElementById(audioId);
            const bar = document.getElementById(audioId + '_bar');
            if (!aud) return;
            if (!aud.paused) { aud.pause(); if (btnEl) btnEl.innerText = '▶️'; return; }
            aud.playbackRate = voiceSpeedMap[audioId] || 1;
            aud.ontimeupdate = () => {
                if (aud.duration && bar) bar.style.width = Math.min(100, Math.round((aud.currentTime / aud.duration) * 100)) + '%';
            };
            aud.onended = () => { if (btnEl) btnEl.innerText = '▶️'; if (bar) bar.style.width = '0%'; };
            aud.play().then(() => { if (btnEl) btnEl.innerText = '⏸️'; }).catch(() => {});
        },

        cycleSpeed: function(audioId, btnEl) {
            const speeds = [1, 1.5, 2];
            let cur = voiceSpeedMap[audioId] || 1;
            let next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
            voiceSpeedMap[audioId] = next;
            if (btnEl) btnEl.innerText = next + 'x';
            const aud = document.getElementById(audioId);
            if (aud) aud.playbackRate = next;
        }
    };

    if (!window.__nxVoiceLoopV4) {
        window.__nxVoiceLoopV4 = setInterval(() => {
            startDmMediaListener();
            bindMicAndMultiPhotoButtons();
            renderAudioAndPhotoCarouselInDOM();
        }, 500);
    }
    startDmMediaListener();
    bindMicAndMultiPhotoButtons();
})(); // === END OF VOICE.JS ===
