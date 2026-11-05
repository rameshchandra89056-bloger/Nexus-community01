// ================= VOICE.JS (DEDICATED MIC & REAL AUDIO VOICE NOTE MODULE): 🎙️ HOLD/TAP VOICE RECORDER FOR 1:1 DM & GROUP CHAT + ⚡ 1x / 1.5x / 2x SPEED PLAYER =================

(function() {
    let activeMediaRecorder = null;
    let recordedAudioChunks = [];
    let recordingStartTime = 0;
    let recordingTickInterval = null;
    let currentRecordingTarget = 'dm';
    let voicePlaySpeedMap = {};

    const vnStyle = document.createElement('style');
    vnStyle.innerHTML = `
        .nx-vn-player-card {
            display: flex; align-items: center; gap: 9px; background: rgba(15, 23, 42, 0.88);
            border: 1.5px solid #38bdf8; border-radius: 14px; padding: 7px 10px; min-width: 215px; max-width: 265px; margin: 3px 0;
        }
        .nx-vn-play-btn {
            width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#10b981,#059669); color: #020617;
            border: none; font-size: 14px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .nx-vn-speed-pill {
            background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; font-size: 10.5px; font-weight: 900; padding: 3px 7px; border-radius: 999px; cursor: pointer;
        }
        #nx-voice-rec-dock {
            position: fixed; bottom: 68px; left: 50%; transform: translateX(-50%); width: 94%; max-width: 420px;
            background: #0f172a; border: 2px solid #ef4444; border-radius: 20px; padding: 11px 14px;
            z-index: 100150; display: none; align-items: center; justify-content: space-between; gap: 10px; box-shadow: 0 15px 40px rgba(0,0,0,0.9);
        }
    `;
    document.head.appendChild(vnStyle);

    function bindVoiceButtonsAndRenderPlayers() {
        if (window.NexusDM) {
            NexusDM.startVoiceDM = () => window.NexusVoice.startRecording('dm');
        }
        if (window.NexusChat) {
            NexusChat.startVoiceInput = () => window.NexusVoice.startRecording('group');
        }

        document.querySelectorAll('#nx-dm-msgs-box span, #nx-room-messages span').forEach((sp, idx) => {
            let raw = (sp.innerText || '').trim();
            if (raw.startsWith('🎵VOICE|') && !sp.getAttribute('data-vn-rendered')) {
                sp.setAttribute('data-vn-rendered', '1');
                let parts = raw.split('|');
                let dur = parts[1] || '0:05';
                let audioDataUrl = parts.slice(2).join('|');
                let playerId = 'nx_vn_aud_' + idx + '_' + Math.floor(Math.random() * 9999);

                sp.innerHTML = `
                    <div class="nx-vn-player-card" onclick="event.stopPropagation();">
                        <audio id="${playerId}" src="${audioDataUrl}" preload="metadata"></audio>
                        <button type="button" class="nx-vn-play-btn" onclick="NexusVoice.togglePlay('${playerId}', this)">▶️</button>
                        <div style="flex:1; min-width:0;">
                            <div style="height:5px; background:#1e293b; border-radius:4px; overflow:hidden; margin-bottom:4px;">
                                <div id="${playerId}_bar" style="width:0%; height:100%; background:linear-gradient(90deg,#10b981,#38bdf8);"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:10px; color:#93c5fd; font-weight:800;">
                                <span>🎤 Voice Note</span>
                                <span id="${playerId}_time">${dur}</span>
                            </div>
                        </div>
                        <button type="button" class="nx-vn-speed-pill" onclick="NexusVoice.cycleSpeed('${playerId}', this)">1x</button>
                    </div>
                `;
            }
        });
    }

    window.NexusVoice = {
        startRecording: async function(targetType) {
            currentRecordingTarget = targetType || 'dm';
            let dock = document.getElementById('nx-voice-rec-dock');
            if (!dock) {
                dock = document.createElement('div');
                dock.id = 'nx-voice-rec-dock';
                document.body.appendChild(dock);
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recordedAudioChunks = [];
                activeMediaRecorder = new MediaRecorder(stream);
                activeMediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) recordedAudioChunks.push(e.data); };
                recordingStartTime = Date.now();
                dock.style.display = 'flex';
                dock.innerHTML = `
                    <div style="display:flex; align-items:center; gap:9px;">
                        <span style="width:12px; height:12px; border-radius:50%; background:#ef4444; display:inline-block; box-shadow:0 0 8px #ef4444;"></span>
                        <span style="font-size:13px; font-weight:900; color:#f8fafc;">🎙️ Recording: <b id="nx-vn-rec-timer" style="color:#fde047;">0:00</b></span>
                    </div>
                    <div style="display:flex; gap:7px;">
                        <button type="button" onclick="NexusVoice.cancelRecording()" style="background:#1e293b; border:1px solid #334155; color:#fca5a5; padding:7px 11px; border-radius:12px; font-size:11.5px; font-weight:800; cursor:pointer;">✕ Cancel</button>
                        <button type="button" onclick="NexusVoice.sendRecording()" style="background:#10b981; border:none; color:#020617; padding:7px 13px; border-radius:12px; font-size:12px; font-weight:900; cursor:pointer;">Send ➤</button>
                    </div>
                `;
                clearInterval(recordingTickInterval);
                recordingTickInterval = setInterval(() => {
                    let sec = Math.floor((Date.now() - recordingStartTime) / 1000);
                    const tEl = document.getElementById('nx-vn-rec-timer');
                    if (tEl) tEl.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                    if (sec >= 40) NexusVoice.sendRecording();
                }, 500);
                activeMediaRecorder.start(250);
            } catch (e) {
                if (window.Nexus) Nexus.toast("⚠️ Allow Microphone permission!");
            }
        },

        cancelRecording: function() {
            clearInterval(recordingTickInterval);
            const dock = document.getElementById('nx-voice-rec-dock');
            if (dock) dock.style.display = 'none';
            if (activeMediaRecorder) {
                try { activeMediaRecorder.stream.getTracks().forEach(t => t.stop()); activeMediaRecorder.stop(); } catch (e) {}
                activeMediaRecorder = null;
            }
            recordedAudioChunks = [];
        },

        sendRecording: function() {
            clearInterval(recordingTickInterval);
            const dock = document.getElementById('nx-voice-rec-dock');
            const timerEl = document.getElementById('nx-vn-rec-timer');
            let finalDuration = timerEl ? timerEl.innerText : '0:04';
            if (dock) dock.style.display = 'none';
            if (!activeMediaRecorder) return;
            const rec = activeMediaRecorder;
            activeMediaRecorder = null;

            rec.onstop = () => {
                try { rec.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
                const blob = new Blob(recordedAudioChunks, { type: rec.mimeType || 'audio/webm' });
                recordedAudioChunks = [];
                const reader = new FileReader();
                reader.onloadend = () => {
                    let payload = `🎵VOICE|${finalDuration}|${reader.result}`;
                    if (currentRecordingTarget === 'dm' && window.NexusDM) {
                        const dmInp = document.getElementById('nx-dm-input');
                        if (dmInp) { dmInp.value = payload; NexusDM.sendDM(); }
                    } else if (window.NexusChat) {
                        const grpInp = document.getElementById('nx-chat-msg-in');
                        if (grpInp) { grpInp.value = payload; NexusChat.sendChatMessage(); }
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
            aud.playbackRate = voicePlaySpeedMap[audioId] || 1;
            aud.ontimeupdate = () => {
                if (aud.duration && bar) bar.style.width = Math.min(100, Math.round((aud.currentTime / aud.duration) * 100)) + '%';
            };
            aud.onended = () => { if (btnEl) btnEl.innerText = '▶️'; if (bar) bar.style.width = '0%'; };
            aud.play().then(() => { if (btnEl) btnEl.innerText = '⏸️'; }).catch(() => {});
        },

        cycleSpeed: function(audioId, speedBtn) {
            const speeds = [1, 1.5, 2];
            let cur = voicePlaySpeedMap[audioId] || 1;
            let next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
            voicePlaySpeedMap[audioId] = next;
            if (speedBtn) speedBtn.innerText = next + 'x';
            const aud = document.getElementById(audioId);
            if (aud) aud.playbackRate = next;
            if (window.Nexus) Nexus.toast(`⚡ Voice Speed: ${next}x`);
        }
    };

    setInterval(bindVoiceButtonsAndRenderPlayers, 800);
    setTimeout(bindVoiceButtonsAndRenderPlayers, 150);
})();
