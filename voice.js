// ================= VOICE.JS (v3.0 REAL AUDIO VOICE NOTE + PHOTO/MEDIA SENDER & BLANK BUBBLE FIXER): 🎙️ DIRECT FIRESTORE AUDIO VOICE NOTES WITH PLAY/PAUSE & 1x/1.5x/2x SPEED + 📷 FIXES BLANK PHOTO BUBBLES (05:30 ✓ FIX) & '+' TRAY PHOTO/VIEW-ONCE UPLOAD =================

(function() {
    let activeMediaRecorder = null;
    let recordedChunks = [];
    let recStartTime = 0;
    let recTimerInterval = null;
    let recTargetMode = 'dm'; // 'dm' | 'group'
    let voiceSpeedMap = {};
    let dmDocsMediaCache = {};
    let grpDocsMediaCache = {};
    let dmMediaUnsub = null;
    let grpMediaUnsub = null;

    if (!document.getElementById('nx-voice-media-styles-v3')) {
        const st = document.createElement('style');
        st.id = 'nx-voice-media-styles-v3';
        st.innerHTML = `
            .nx-vn-card {
                display: flex; align-items: center; gap: 9px;
                background: rgba(15, 23, 42, 0.92); border: 1.5px solid #10b981;
                border-radius: 14px; padding: 7px 10px; min-width: 210px; max-width: 265px;
                margin: 4px 0; box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            }
            .nx-vn-play {
                width: 34px; height: 34px; border-radius: 50%;
                background: linear-gradient(135deg, #10b981, #059669); color: #020617;
                border: none; font-size: 14px; font-weight: 900; cursor: pointer;
                display: flex; align-items: center; justify-content: center; flex-shrink: 0;
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
            .nx-chat-inline-photo {
                max-width: 235px; width: 100%; max-height: 280px; object-fit: cover;
                border-radius: 12px; border: 1.5px solid rgba(56, 189, 248, 0.5);
                display: block; margin: 4px 0 6px; cursor: pointer;
            }
        `;
        document.head.appendChild(st);
    }

    // =========================================================================
    // 1. 📡 WATCH FIRESTORE MEDIA DOCS TO REPAIR BLANK BUBBLES (LIKE 05:30 ✓) & RENDER AUDIO
    // =========================================================================
    function startMediaAndVoiceFirestoreSync() {
        if (!window.Nexus || !Nexus.db) return;

        if (!dmMediaUnsub) {
            dmMediaUnsub = Nexus.db.collection("nexus_private_dms")
                .orderBy("createdAt", "desc")
                .limit(80)
                .onSnapshot(snap => {
                    snap.forEach(doc => {
                        let d = doc.data();
                        if (d && !d.deleted) {
                            dmDocsMediaCache[doc.id] = d;
                        } else {
                            delete dmDocsMediaCache[doc.id];
                        }
                    });
                    renderAudioAndPhotosInChatDOM();
                }, () => {});
        }

        if (!grpMediaUnsub) {
            grpMediaUnsub = Nexus.db.collection("nexus_real_msgs")
                .orderBy("createdAt", "desc")
                .limit(80)
                .onSnapshot(snap => {
                    snap.forEach(doc => {
                        let d = doc.data();
                        if (d && !d.deleted) {
                            grpDocsMediaCache[doc.id] = d;
                        }
                    });
                    renderAudioAndPhotosInChatDOM();
                }, () => {});
        }
    }

    function buildVoicePlayerHTML(audioSrc, durationLabel, uniqueKey) {
        let pid = 'nx_aud_' + uniqueKey.replace(/[^a-zA-Z0-9]/g, '_');
        return `
            <div class="nx-vn-card" onclick="event.stopPropagation();">
                <audio id="${pid}" src="${audioSrc}" preload="metadata"></audio>
                <button type="button" class="nx-vn-play" onclick="NexusVoice.togglePlay('${pid}', this)">▶️</button>
                <div style="flex:1; min-width:0;">
                    <div style="height:5px; background:#1e293b; border-radius:4px; overflow:hidden; margin-bottom:4px;">
                        <div id="${pid}_bar" style="width:0%; height:100%; background:linear-gradient(90deg,#10b981,#38bdf8);"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:#93c5fd; font-weight:800;">
                        <span>🎤 Voice Note</span>
                        <span id="${pid}_dur">${durationLabel || '0:05'}</span>
                    </div>
                </div>
                <button type="button" class="nx-vn-spd" onclick="NexusVoice.cycleSpeed('${pid}', this)">1x</button>
            </div>
        `;
    }

    function renderAudioAndPhotosInChatDOM() {
        // A. Check all 1:1 DM Bubbles (#nx-dm-msgs-box)
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach((row, idx) => {
            let msgId = row.getAttribute('data-message-id') || '';
            let docData = msgId ? dmDocsMediaCache[msgId] : null;
            if (docData && docData.deleted) return;

            // Find the inner bubble box (usually the first div inside row)
            let bubbleBox = row.querySelector('div') || row;

            // 1. Check if Firestore doc has real audioData or 🎵VOICE|
            let rawText = (docData && docData.text) ? docData.text : (row.innerText || '');
            let audioSrc = (docData && (docData.audioData || docData.audioUrl || docData.voiceUrl)) || '';
            let durLbl = (docData && docData.voiceDuration) || '0:05';

            if (!audioSrc && rawText.includes('🎵VOICE|')) {
                let parts = rawText.split('🎵VOICE|')[1].split('|');
                durLbl = parts[0] || '0:05';
                audioSrc = parts.slice(1).join('|').split(/\s/)[0];
            }

            if (audioSrc && !row.querySelector('.nx-vn-card')) {
                // Remove plain "🎤 Voice Note" text if present and inject real audio player!
                bubbleBox.querySelectorAll('span, div').forEach(el => {
                    if (el.children.length === 0 && ((el.innerText || '').includes('🎤 Voice Note') || (el.innerText || '').startsWith('🎵VOICE|'))) {
                        el.innerHTML = '';
                    }
                });
                let holder = document.createElement('div');
                holder.innerHTML = buildVoicePlayerHTML(audioSrc, durLbl, msgId || ('dm_' + idx));
                bubbleBox.insertBefore(holder.firstElementChild, bubbleBox.firstChild);
            }

            // 2. Check if Firestore doc has a Photo/Image that failed to render (Fixes Blank 05:30 ✓ Bubble!)
            let imgSrc = docData && (docData.imgUrl || docData.img || docData.image || docData.photo || (Array.isArray(docData.imgUrls) && docData.imgUrls[0])) || '';
            if (!imgSrc && rawText.startsWith('📷PHOTO|')) {
                imgSrc = rawText.replace('📷PHOTO|', '').trim();
            }

            if (imgSrc && !row.querySelector('img.nx-chat-inline-photo') && !row.querySelector('img[src^="data:image"]')) {
                let imgEl = document.createElement('img');
                imgEl.src = imgSrc;
                imgEl.className = 'nx-chat-inline-photo';
                imgEl.onclick = (e) => {
                    e.stopPropagation();
                    window.open(imgSrc, '_blank');
                };
                bubbleBox.insertBefore(imgEl, bubbleBox.firstChild);
            }
        });

        // B. Also parse any inline 🎵VOICE| or 📷PHOTO| inside Group Chat (#nx-room-messages)
        document.querySelectorAll('#nx-room-messages span, #nx-room-messages div').forEach((el, idx) => {
            if (el.children.length > 0) return;
            let txt = (el.innerText || '').trim();
            if (txt.startsWith('🎵VOICE|') && !el.getAttribute('data-vn-done')) {
                el.setAttribute('data-vn-done', '1');
                let parts = txt.split('|');
                let dur = parts[1] || '0:05';
                let src = parts.slice(2).join('|');
                el.innerHTML = buildVoicePlayerHTML(src, dur, 'grp_' + idx);
            } else if (txt.startsWith('📷PHOTO|') && !el.getAttribute('data-ph-done')) {
                el.setAttribute('data-ph-done', '1');
                let src = txt.replace('📷PHOTO|', '').trim();
                el.innerHTML = `<img src="${src}" class="nx-chat-inline-photo" onclick="event.stopPropagation(); window.open('${src}', '_blank');">`;
            }
        });
    }

    // =========================================================================
    // 2. 🎙️ OVERRIDE MIC BUTTONS & '+' TRAY PHOTO BUTTONS IN 1:1 DM & GROUP CHAT
    // =========================================================================
    function hijackMicAndPhotoButtons() {
        if (window.NexusDM) {
            NexusDM.startVoiceDM = () => window.NexusVoice.startRecording('dm');
        }
        if (window.NexusChat) {
            NexusChat.startVoiceInput = () => window.NexusVoice.startRecording('group');
        }
        if (window.NexusPower) {
            NexusPower.startVoiceRecord = () => window.NexusVoice.startRecording('dm');
            NexusPower.triggerDmPhoto = () => window.NexusVoice.openPhotoPicker('dm', false);
            NexusPower.triggerViewOncePhoto = () => window.NexusVoice.openPhotoPicker('dm', true);
        }

        // Directly bind the Mic button (🎙️ / 🎤) in 1:1 DM & Group Chat bottom bar so it NEVER sends plain text!
        document.querySelectorAll('#nx-dm-dedicated-root button, #nx-chat-room button').forEach(btn => {
            let txt = (btn.innerText || '').trim();
            let oc = btn.getAttribute('onclick') || '';
            if ((txt === '🎙️' || txt === '🎤' || oc.includes('startVoice')) && !btn.getAttribute('data-real-mic-v3')) {
                btn.setAttribute('data-real-mic-v3', '1');
                btn.removeAttribute('onclick');
                let isDm = Boolean(btn.closest('#nx-dm-dedicated-root'));
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.NexusVoice.startRecording(isDm ? 'dm' : 'group');
                };
            }
        });

        // Directly bind the "Photo" & "View-Once" buttons inside #nx-dm-bottom-tray (Screenshot 1000073553.jpg)
        ['nx-dm-bottom-tray', 'nx-grp-bottom-tray'].forEach(trayId => {
            const tray = document.getElementById(trayId);
            if (!tray) return;
            let isDm = (trayId === 'nx-dm-bottom-tray');

            tray.querySelectorAll('button, div').forEach(btn => {
                let label = (btn.innerText || '').trim();
                if ((label.includes('Photo') || label === '📷\nPhoto') && !btn.getAttribute('data-real-photo-v3')) {
                    btn.setAttribute('data-real-photo-v3', '1');
                    btn.removeAttribute('onclick');
                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        tray.style.display = 'none';
                        window.NexusVoice.openPhotoPicker(isDm ? 'dm' : 'group', false);
                    };
                }
                if (label.includes('View-Once') && !btn.getAttribute('data-real-vo-v3')) {
                    btn.setAttribute('data-real-vo-v3', '1');
                    btn.removeAttribute('onclick');
                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        tray.style.display = 'none';
                        window.NexusVoice.openPhotoPicker(isDm ? 'dm' : 'group', true);
                    };
                }
            });
        });
    }

    // Helper: Resolve active 1:1 DM Partner Username reliably
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

    // Compress any selected photo to fast HD JPEG (~60KB) so Firestore saves it in 0.2s without failing!
    function compressImageFileToDataUrl(file, maxDim, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    let max = maxDim || 850;
                    if (w > max || h > max) {
                        if (w > h) { h = Math.round((h * max) / w); w = max; }
                        else { w = Math.round((w * max) / h); h = max; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality || 0.78));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // =========================================================================
    // 3. PUBLIC API: NEXUSVOICE (REAL VOICE RECORDER + REAL PHOTO UPLOADER)
    // =========================================================================
    window.NexusVoice = {
        startRecording: async function(targetType) {
            recTargetMode = targetType || 'dm';
            let bar = document.getElementById('nx-voice-rec-bar');
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'nx-voice-rec-bar';
                document.body.appendChild(bar);
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recordedChunks = [];
                let mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
                         : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
                activeMediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 }) : new MediaRecorder(stream);

                activeMediaRecorder.ondataavailable = e => {
                    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
                };

                recStartTime = Date.now();
                bar.style.display = 'flex';
                bar.innerHTML = `
                    <div style="display:flex; align-items:center; gap:9px;">
                        <span style="width:12px; height:12px; border-radius:50%; background:#ef4444; display:inline-block; box-shadow:0 0 10px #ef4444;"></span>
                        <span style="font-size:13px; font-weight:900; color:#f8fafc;">🎙️ Recording Audio: <b id="nx-vn-timer" style="color:#fde047;">0:00</b></span>
                    </div>
                    <div style="display:flex; gap:7px;">
                        <button type="button" onclick="NexusVoice.cancelRecording()" style="background:#1e293b; border:1px solid #334155; color:#fca5a5; padding:7px 11px; border-radius:12px; font-size:11.5px; font-weight:800; cursor:pointer;">✕ Cancel</button>
                        <button type="button" onclick="NexusVoice.sendRecording()" style="background:linear-gradient(135deg,#10b981,#059669); border:none; color:#020617; padding:7px 14px; border-radius:12px; font-size:12px; font-weight:900; cursor:pointer;">Send ➤</button>
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
                if (window.Nexus) Nexus.toast("⚠️ Please allow Microphone permission in browser!");
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
                        if (!partnerU) { Nexus.toast("⚠️ Partner not found"); return; }
                        let myU = me.username.toLowerCase().trim();
                        let pU = partnerU.toLowerCase().trim();

                        Nexus.toast("🎤 Sending Voice Note...");
                        try {
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
                            dmDocsMediaCache[docRef.id] = {
                                text: `🎤 Voice Note (${finalDur})`,
                                audioData: base64Audio,
                                voiceDuration: finalDur
                            };
                            setTimeout(renderAudioAndPhotosInChatDOM, 120);
                            Nexus.toast("✅ Voice Note Sent!");
                        } catch (e) {
                            Nexus.toast("⚠️ Voice note too long, try a shorter note!");
                        }
                    } else {
                        let roomId = (window.NexusChat && NexusChat.activeRoom) || 'casual_chat';
                        Nexus.toast("🎤 Sending Group Voice Note...");
                        try {
                            await Nexus.db.collection("nexus_real_msgs").add({
                                roomId: roomId,
                                sender: me.name || me.username,
                                username: me.username,
                                text: `🎵VOICE|${finalDur}|${base64Audio}`,
                                audioData: base64Audio,
                                voiceDuration: finalDur,
                                createdAt: Date.now()
                            });
                            setTimeout(renderAudioAndPhotosInChatDOM, 120);
                            Nexus.toast("✅ Voice Note Sent to Group!");
                        } catch (e) {}
                    }
                };
                reader.readAsDataURL(blob);
            };
            try { rec.stop(); } catch (e) {}
        },

        // 📷 100% Working Photo & View-Once Picker for 1:1 DM & Group Chat
        openPhotoPicker: function(targetMode, isViewOnce) {
            let fileInp = document.getElementById('nx-universal-photo-picker');
            if (!fileInp) {
                fileInp = document.createElement('input');
                fileInp.type = 'file';
                fileInp.id = 'nx-universal-photo-picker';
                fileInp.accept = 'image/*';
                fileInp.style.display = 'none';
                document.body.appendChild(fileInp);
            }

            fileInp.value = '';
            fileInp.onchange = async (ev) => {
                const file = ev.target.files && ev.target.files[0];
                if (!file) return;
                let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
                if (!me || !Nexus.db) return;

                Nexus.toast("📷 Compressing & sending photo...");
                try {
                    const compressedDataUrl = await compressImageFileToDataUrl(file, 850, 0.78);

                    if (targetMode === 'dm') {
                        let partnerU = resolveActiveDmPartner();
                        if (!partnerU) return;
                        let myU = me.username.toLowerCase().trim();
                        let pU = partnerU.toLowerCase().trim();

                        const docRef = await Nexus.db.collection("nexus_private_dms").add({
                            roomKey: [myU, pU].sort().join('__'),
                            fromUser: me.username,
                            fromName: me.name || me.username,
                            toUser: partnerU,
                            text: isViewOnce ? '🔥 1-Time View-Once Photo' : '📷 Photo',
                            imgUrl: compressedDataUrl,
                            img: compressedDataUrl,
                            image: compressedDataUrl,
                            imgUrls: [compressedDataUrl],
                            isViewOnce: Boolean(isViewOnce),
                            createdAt: Date.now(),
                            seen: false
                        });
                        dmDocsMediaCache[docRef.id] = {
                            text: isViewOnce ? '🔥 1-Time View-Once Photo' : '📷 Photo',
                            imgUrl: compressedDataUrl
                        };
                        setTimeout(renderAudioAndPhotosInChatDOM, 100);
                        Nexus.toast("✅ Photo Sent!");
                    } else {
                        let roomId = (window.NexusChat && NexusChat.activeRoom) || 'casual_chat';
                        await Nexus.db.collection("nexus_real_msgs").add({
                            roomId: roomId,
                            sender: me.name || me.username,
                            username: me.username,
                            text: '📷 Shared a Photo',
                            imgUrl: compressedDataUrl,
                            img: compressedDataUrl,
                            imgUrls: [compressedDataUrl],
                            createdAt: Date.now()
                        });
                        setTimeout(renderAudioAndPhotosInChatDOM, 100);
                        Nexus.toast("✅ Photo Sent to Group!");
                    }
                } catch (err) {
                    Nexus.toast("⚠️ Could not send photo, please try another image.");
                }
            };
            fileInp.click();
        },

        togglePlay: function(audioId, btnEl) {
            const aud = document.getElementById(audioId);
            const bar = document.getElementById(audioId + '_bar');
            if (!aud) return;
            if (!aud.paused) {
                aud.pause();
                if (btnEl) btnEl.innerText = '▶️';
                return;
            }
            aud.playbackRate = voiceSpeedMap[audioId] || 1;
            aud.ontimeupdate = () => {
                if (aud.duration && bar) {
                    bar.style.width = Math.min(100, Math.round((aud.currentTime / aud.duration) * 100)) + '%';
                }
            };
            aud.onended = () => {
                if (btnEl) btnEl.innerText = '▶️';
                if (bar) bar.style.width = '0%';
            };
            aud.play().then(() => {
                if (btnEl) btnEl.innerText = '⏸️';
            }).catch(() => {});
        },

        cycleSpeed: function(audioId, btnEl) {
            const speeds = [1, 1.5, 2];
            let cur = voiceSpeedMap[audioId] || 1;
            let next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
            voiceSpeedMap[audioId] = next;
            if (btnEl) btnEl.innerText = next + 'x';
            const aud = document.getElementById(audioId);
            if (aud) aud.playbackRate = next;
            if (window.Nexus) Nexus.toast(`⚡ Voice Speed: ${next}x`);
        }
    };

    if (!window.__nxVoiceLoopV3) {
        window.__nxVoiceLoopV3 = setInterval(() => {
            startMediaAndVoiceFirestoreSync();
            hijackMicAndPhotoButtons();
            renderAudioAndPhotosInChatDOM();
        }, 550);
    }
    startMediaAndVoiceFirestoreSync();
    hijackMicAndPhotoButtons();
})(); // === END OF VOICE.JS ===
