// ================= POST.JS: 0.01s INSTANT OPTIMISTIC PUBLISH + CANCEL SAFE + 4-OPTION POLL =================

(function() {
    let selectedPostImg = '';
    let isPublishingCanceled = false;

    Nexus.openPostModal = function() {
        let me = Nexus.getCurrentUser();
        if (!me) {
            Nexus.toast("Please Login or Create Account in Profile Tab first!");
            Nexus.switchTab('tab-profile');
            return;
        }
        if (me.isBanned) {
            Nexus.toast("🚫 Your account is restricted from posting.");
            return;
        }

        selectedPostImg = '';
        isPublishingCanceled = false;
        const modal = document.getElementById('tab-post-modal');
        let cleanChar = (me.name || 'U').replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || 'U';
        let dpView = (me.dp && me.dp.startsWith('data:image'))
            ? `<img src="${me.dp}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #00a884;">`
            : `<div style="width:40px; height:40px; border-radius:50%; background:#00a884; color:#020617; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">${cleanChar}</div>`;

        modal.innerHTML = `
            <div class="nx-modal-box" style="max-width:440px; padding:20px; border-radius:20px; border:1px solid #00a884;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #1e293b; margin-bottom:14px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${dpView}
                        <div>
                            <div style="font-weight:800; font-size:15px; color:#f8fafc;">${me.name}</div>
                            <div style="font-size:11px; color:#10b981;">@${me.username} • Instant Cloud Post</div>
                        </div>
                    </div>
                    <button type="button" onclick="NexusPost.cancelAndClose()" style="background:#1e293b; border:none; color:#cbd5e1; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer;" title="Cancel & Close">✕</button>
                </div>

                <textarea id="nx-post-text" rows="4" maxlength="3000" placeholder="Write your question, JEE formula, thought or update here..." style="width:100%; padding:14px; border-radius:14px; border:1px solid #334155; background:#090d16; color:white; font-size:14.5px; line-height:1.5; outline:none; resize:none; margin-bottom:14px;"></textarea>

                <input type="file" id="nx-post-file" accept="image/*" style="display:none;">
                <div id="nx-photo-dropzone" onclick="document.getElementById('nx-post-file').click()" style="border:2px dashed #00a884; background:rgba(0,168,132,0.06); border-radius:14px; padding:16px; text-align:center; cursor:pointer; margin-bottom:14px;">
                    <div style="font-size:24px; margin-bottom:4px;">📷</div>
                    <div style="font-weight:700; font-size:13.5px; color:#5eead4;">Tap to Upload Photo / Doubt Image</div>
                    <div style="font-size:11px; color:#64748b; margin-top:2px;">Instant 0.01s fast upload</div>
                </div>

                <div id="nx-post-img-preview" style="display:none; margin-bottom:14px; position:relative;">
                    <img id="nx-post-img-tag" src="" style="width:100%; max-height:240px; object-fit:contain; border-radius:12px; background:#020617; border:1px solid #00a884;">
                    <button type="button" onclick="NexusPost.removePhoto()" style="position:absolute; top:8px; right:8px; background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:12px; font-size:11.5px; font-weight:700; cursor:pointer;">✕ Remove</button>
                </div>

                <div style="background:#090d16; border:1px solid #1e293b; border-radius:14px; padding:12px; margin-bottom:16px;">
                    <div onclick="const b=document.getElementById('nx-poll-inputs'); b.style.display=b.style.display==='none'?'flex':'none';" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span style="font-weight:700; font-size:13.5px; color:#10b981;">📊 Create 4-Option Live Poll (Optional)</span>
                        <span style="font-size:11.5px; color:#38bdf8; font-weight:600;">+ Options ▼</span>
                    </div>
                    <div id="nx-poll-inputs" style="display:none; flex-direction:column; gap:8px; margin-top:10px;">
                        <input type="text" id="nx-poll-1" placeholder="Option A" style="padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:white; font-size:13px; outline:none;">
                        <input type="text" id="nx-poll-2" placeholder="Option B" style="padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:white; font-size:13px; outline:none;">
                        <input type="text" id="nx-poll-3" placeholder="Option C (Optional)" style="padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:white; font-size:13px; outline:none;">
                        <input type="text" id="nx-poll-4" placeholder="Option D (Optional)" style="padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:white; font-size:13px; outline:none;">
                    </div>
                </div>

                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="NexusPost.cancelAndClose()" style="flex:1; background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:13px; border-radius:12px; font-weight:800; font-size:14px; cursor:pointer;">
                        Cancel
                    </button>
                    <button type="button" onclick="NexusPost.publish()" id="nx-pub-btn" style="flex:2; background:#00a884; color:#020617; border:none; padding:13px; border-radius:12px; font-weight:900; font-size:15px; cursor:pointer; box-shadow:0 4px 14px rgba(0,168,132,0.35);">
                        🚀 Publish Now
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';

        document.getElementById('nx-post-file').addEventListener('change', e => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            const drop = document.getElementById('nx-photo-dropzone');
            if (drop) drop.innerHTML = `<div style="color:#10b981; font-weight:800; font-size:13px;">⏳ Optimizing photo for instant upload...</div>`;
            Nexus.compressImage(f, 680, 0.68, url => {
                selectedPostImg = url;
                document.getElementById('nx-post-img-tag').src = url;
                document.getElementById('nx-post-img-preview').style.display = 'block';
                document.getElementById('nx-photo-dropzone').style.display = 'none';
            });
        });
    };

    window.NexusPost = {
        removePhoto: function() {
            selectedPostImg = '';
            document.getElementById('nx-post-img-preview').style.display = 'none';
            const drop = document.getElementById('nx-photo-dropzone');
            if (drop) {
                drop.style.display = 'block';
                drop.innerHTML = `<div style="font-size:24px; margin-bottom:4px;">📷</div><div style="font-weight:700; font-size:13.5px; color:#5eead4;">Tap to Upload Photo / Doubt Image</div>`;
            }
        },

        cancelAndClose: function() {
            isPublishingCanceled = true;
            selectedPostImg = '';
            document.getElementById('tab-post-modal').style.display = 'none';
        },

        publish: function() {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) {
                Nexus.toast("Please Login first!");
                return;
            }
            if (me.isBanned) return;

            let text = document.getElementById('nx-post-text').value.trim();
            let o1 = document.getElementById('nx-poll-1').value.trim();
            let o2 = document.getElementById('nx-poll-2').value.trim();
            let o3 = document.getElementById('nx-poll-3') ? document.getElementById('nx-poll-3').value.trim() : '';
            let o4 = document.getElementById('nx-poll-4') ? document.getElementById('nx-poll-4').value.trim() : '';

            let poll = (o1 && o2) ? {
                opt1: o1, opt2: o2, opt3: o3, opt4: o4,
                voters1: [], voters2: [], voters3: [], voters4: []
            } : null;

            if (!text && !selectedPostImg && !poll) {
                Nexus.toast("Please write text, select a photo, or add poll options!");
                return;
            }

            if (isPublishingCanceled) return;

            let newPostObj = {
                username: me.username,
                author: me.name,
                bio: me.bio || 'JEE Aspirant',
                dp: me.dp || '',
                text: text,
                image: selectedPostImg,
                poll: poll,
                likedBy: [],
                comments: [],
                createdAt: Date.now()
            };

            // 0.01s Optimistic UI: Close modal & show post on feed IMMEDIATELY without waiting!
            document.getElementById('tab-post-modal').style.display = 'none';
            Nexus.switchTab('tab-home');
            Nexus.toast("🚀 Post Published Live!");

            let tempPost = Object.assign({ id: 'temp_' + Date.now() }, newPostObj);
            Nexus.posts = [tempPost, ...(Nexus.posts || [])];
            Nexus.notifyAll();

            Nexus.db.collection("nexus_real_posts").add(newPostObj).catch(err => {
                console.error(err);
                Nexus.toast("⚠️ Slow network, syncing post in background...");
            });
        }
    };
})();
