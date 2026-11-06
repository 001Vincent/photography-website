/**
 * PRINCE WILLIAMS — Client Dashboard Logic (API version)
 * ========================================================
 * All Backend.* calls are now async/await.
 */

const DashApp = (() => {
  'use strict';

  let session = null;
  let selectedPhotoIds = new Set();
  let chatPollInterval = null;
  let galleryCache = null;
  let paystackKey = null;
  let packagesCache = [];   // populated by renderPackages, used by initiatePayment

  // ── Boot ──────────────────────────────────────────────────────────────────
  async function init() {
    session = Auth.requireAuth('client');
    if (!session) return;

    document.getElementById('sb-name').textContent  = session.name;
    document.getElementById('sb-email').textContent = session.email;
    document.getElementById('sb-avatar').textContent = session.name.charAt(0).toUpperCase();
    document.getElementById('topbar-name').textContent = session.name.split(' ')[0];

    document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
      link.addEventListener('click', () => switchTab(link.dataset.tab));
    });
    document.getElementById('hamburger').addEventListener('click', openSidebar);

    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
    });
    chatInput.addEventListener('input', autoGrow);

    await Promise.all([loadOverview(), renderPackages(), loadBadges(), loadPaystackKey()]);
    switchTab('overview');

    // ── Event delegation for Pay buttons (avoids inline onclick issues) ────
    const grid = document.getElementById('packages-grid');
    if (grid) {
      grid.addEventListener('click', e => {
        const btn = e.target.closest('button[data-package-id]');
        if (btn && !btn.classList.contains('paid')) {
          initiatePayment(btn.dataset.packageId, btn);
        }
      });
    }
  }

  async function loadPaystackKey() {
    try {
      const res = await fetch('/api/config');
      const cfg = await res.json();
      paystackKey = cfg.paystackPublicKey || null;
    } catch {
      paystackKey = null;
    }
  }

  // ── Tab Switching ─────────────────────────────────────────────────────────
  function switchTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => l.classList.remove('active'));
    const panel = document.getElementById('tab-' + tab);
    const link  = document.getElementById('nav-' + tab);
    if (panel) panel.classList.add('active');
    if (link)  link.classList.add('active');
    const titles = { overview: 'Overview', selection: 'Photo Selection', gallery: 'Final Gallery', payments: 'Packages & Payment', chat: 'Chat with Us' };
    document.getElementById('topbar-title').textContent = titles[tab] || tab;

    if (tab === 'selection') loadSelectionGallery();
    if (tab === 'gallery')   loadFinalGallery();
    if (tab === 'payments')  loadPaymentHistory();
    if (tab === 'chat')      startChatPoll();
    else                     stopChatPoll();
    closeSidebar();
  }

  // ── Overview ──────────────────────────────────────────────────────────────
  async function loadOverview() {
    try {
      const [gallery, payments, unread] = await Promise.all([
        Backend.getGallery(session.id),
        Backend.getPayments(),
        Backend.getUnread(),
      ]);
      galleryCache = gallery;
      document.getElementById('stat-unedited').textContent = gallery.unedited.length;
      document.getElementById('stat-final').textContent    = gallery.final.length;
      document.getElementById('stat-payments').textContent = payments.length;
      document.getElementById('stat-messages').textContent = unread.total || 0;

      const list = document.getElementById('activity-list');
      const acts = [];
      if (gallery.unedited.length) acts.push({ icon: '📷', text: gallery.unedited.length + ' preview photos ready for selection', time: gallery.unedited.at(-1)?.sent_at });
      if (gallery.final.length)    acts.push({ icon: '✅', text: gallery.final.length + ' edited photos ready to download',       time: gallery.final.at(-1)?.sent_at });
      payments.forEach(p => acts.push({ icon: '💳', text: 'Payment of ' + Backend.formatCurrency(p.amount) + ' for ' + p.package_name, time: p.paid_at }));

      if (!acts.length) { list.innerHTML = '<p style="font-size:.85rem;color:var(--gray-500);">No recent activity yet.</p>'; return; }
      list.innerHTML = acts.map(a =>
        `<div style="display:flex;gap:.85rem;align-items:flex-start;padding:.75rem 0;border-bottom:1px solid var(--gray-100);">
          <span style="font-size:1.2rem;">${a.icon}</span>
          <div><p style="font-size:.86rem;color:var(--gray-800);">${a.text}</p>
          <p style="font-size:.72rem;color:var(--gray-400);margin-top:.15rem;">${Backend.timeAgo(a.time)}</p></div></div>`
      ).join('');
    } catch (err) { showToast('Could not load overview: ' + err.message, 'error'); }
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  async function loadBadges() {
    try {
      const unread = await Backend.getUnread();
      const gallery = galleryCache || await Backend.getGallery(session.id);
      setBadge('badge-selection', gallery.unedited.length);
      setBadge('badge-gallery',   gallery.final.length);
      setBadge('badge-chat',      unread.total || 0);
    } catch {}
  }

  function setBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = count > 0 ? 'flex' : 'none';
    if (count > 0) el.textContent = count;
  }

  // ── Selection Gallery ─────────────────────────────────────────────────────
  async function loadSelectionGallery() {
    const grid = document.getElementById('selection-grid');
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--gray-400);">Loading photos…</div>';
    try {
      const [gallery, sel] = await Promise.all([
        Backend.getGallery(session.id, 'unedited'),
        Backend.getSelections(session.id),
      ]);
      const photos = gallery.unedited || gallery; // API returns { unedited, final } or flat array depending on type param
      document.getElementById('sel-total').textContent = photos.length;

      if (sel?.photo_ids) {
        selectedPhotoIds = new Set(sel.photo_ids);
        if (sel.photo_ids.length) document.getElementById('selection-submitted-badge').style.display = 'flex';
      }

      if (!photos.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <h3>No preview photos yet</h3><p>Your photographer will upload preview photos here for you to select from.</p></div>`;
        return;
      }

      grid.innerHTML = photos.map(p => {
        const isSel = selectedPhotoIds.has(p.id);
        const imgUrl = Backend.getPhotoUrl(p.id);
        return `<div class="photo-card selectable${isSel ? ' selected' : ''}" data-id="${p.id}" onclick="DashApp.toggleSelect('${p.id}')">
          <img src="${imgUrl}" alt="${escHtml(p.name)}" draggable="false" oncontextmenu="return false" loading="lazy" />
          <div class="photo-select-overlay">
            <div class="select-check">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <span class="photo-badge">${escHtml(p.name)}</span>
        </div>`;
      }).join('');
      updateSelectionUI();
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Could not load photos</h3><p>${escHtml(err.message)}</p></div>`;
    }
  }

  function toggleSelect(photoId) {
    if (selectedPhotoIds.has(photoId)) selectedPhotoIds.delete(photoId);
    else selectedPhotoIds.add(photoId);
    document.querySelector(`.photo-card[data-id="${photoId}"]`)?.classList.toggle('selected', selectedPhotoIds.has(photoId));
    updateSelectionUI();
  }

  function clearSelection() {
    selectedPhotoIds.clear();
    document.querySelectorAll('.photo-card.selectable').forEach(c => c.classList.remove('selected'));
    updateSelectionUI();
  }

  function updateSelectionUI() {
    const count = selectedPhotoIds.size;
    document.getElementById('sel-count').textContent = count;
    document.getElementById('sel-bar-count').textContent = count;
    document.getElementById('selection-bar').classList.toggle('visible', count > 0);
  }

  async function submitSelection() {
    if (selectedPhotoIds.size === 0) { showToast('Please select at least one photo.', 'error'); return; }
    const btn = document.getElementById('submit-sel-btn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await Backend.submitSelections(session.id, Array.from(selectedPhotoIds));
      document.getElementById('selection-submitted-badge').style.display = 'flex';
      showToast('Selection submitted! Your photographer has been notified.', 'success');
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Submit Selection';
    }
  }

  // ── Final Gallery ─────────────────────────────────────────────────────────
  async function loadFinalGallery() {
    const grid  = document.getElementById('final-grid');
    const dlBtn = document.getElementById('download-all-btn');
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--gray-400);">Loading photos…</div>';
    try {
      const gallery = await Backend.getGallery(session.id, 'final');
      const photos  = gallery.final || gallery;
      if (!photos.length) {
        dlBtn.style.display = 'none';
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <h3>No final photos yet</h3><p>Your fully edited photos will appear here once ready.</p></div>`;
        return;
      }
      dlBtn.style.display = 'flex';
      grid.innerHTML = photos.map(p =>
        `<div class="photo-card">
          <img src="${Backend.getPhotoUrl(p.id)}" alt="${escHtml(p.name)}" loading="lazy"/>
          <span class="photo-badge">${escHtml(p.name)}</span>
          <button class="photo-download-btn" onclick="DashApp.doDownload('${p.id}','${escHtml(p.name)}')" title="Download">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>`
      ).join('');
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Could not load gallery</h3><p>${escHtml(err.message)}</p></div>`;
    }
  }

  function doDownload(photoId, name) {
    Backend.downloadPhoto(photoId, name);
    showToast('Downloading ' + name, 'success');
  }

  async function downloadAll() {
    try {
      const gallery = await Backend.getGallery(session.id, 'final');
      const photos  = gallery.final || gallery;
      photos.forEach((p, i) => setTimeout(() => Backend.downloadPhoto(p.id, p.name), i * 400));
      showToast('Downloading ' + photos.length + ' photos…', 'success');
    } catch (err) { showToast('Download failed: ' + err.message, 'error'); }
  }

  // ── Packages & Payments ──────────────────────────────────────────────────────
  async function renderPackages() {
    try {
      const [payments, packages] = await Promise.all([
        Backend.getPayments(),
        Backend.getPackages(),
      ]);
      const paidIds = payments.map(p => p.package_id);
      const grid = document.getElementById('packages-grid');
      if (!grid) return;
      if (!packages.length) {
        grid.innerHTML = '<p style="color:var(--gray-400);padding:2rem;">No packages available yet.</p>';
        return;
      }
      grid.innerHTML = packages.map(pkg => {
        packagesCache = packages; // cache for initiatePayment
        const isPaid = paidIds.includes(pkg.id);
        const features = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || '[]');
        return `<div class="package-card${pkg.badge ? ' featured' : ''}">
          ${pkg.badge ? `<div class="package-badge">${pkg.badge}</div>` : ''}
          <h3 class="package-name">${pkg.name}</h3>
          <p class="package-tagline">${pkg.tagline || ''}</p>
          <p class="package-price">${Backend.formatCurrency(pkg.price)} <span>/ full event</span></p>
          <ul class="package-features">
            ${features.map(f => `<li class="package-feature"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>${f}</li>`).join('')}
          </ul>
          <button class="btn-pay${isPaid ? ' paid' : ''}" data-package-id="${pkg.id}" ${isPaid ? 'disabled' : ''}>
            ${isPaid
              ? '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Paid'
              : '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pay with Paystack'
            }
          </button>
        </div>`;
      }).join('');
    } catch (err) {
      console.error('[renderPackages]', err);
    }
  }

  async function loadPaymentHistory() {
    await renderPackages();
    const container = document.getElementById('payment-history');
    try {
      const payments = await Backend.getPayments();
      if (!payments.length) {
        container.innerHTML = '<div class="empty-state" style="padding:3rem 2rem;"><h3>No payments yet</h3><p>Your receipts will appear here.</p></div>';
        return;
      }
      container.innerHTML = `<table class="receipts-table"><thead><tr><th>Package</th><th>Amount</th><th>Reference</th><th>Date</th><th>Status</th><th>Receipt</th></tr></thead>
        <tbody>${payments.map(p => `<tr>
          <td>${p.package_name}</td>
          <td><strong>${Backend.formatCurrency(p.amount)}</strong></td>
          <td style="font-family:monospace;font-size:.78rem;">${p.reference}</td>
          <td>${Backend.formatDate(p.paid_at)}</td>
          <td><span class="pill success">✓ Success</span></td>
          <td><button class="btn btn-outline btn-sm" onclick="DashApp.showReceipt('${p.id}')">View</button></td>
        </tr>`).join('')}</tbody></table>`;
    } catch (err) {
      container.innerHTML = `<div class="empty-state" style="padding:2rem;"><p>Could not load payments: ${escHtml(err.message)}</p></div>`;
    }
  }

  function initiatePayment(packageId, btnEl) {
    const pkg = packagesCache.find(p => p.id === packageId);
    if (!pkg) { showToast('Package not found.', 'error'); return; }

    if (typeof PaystackPop === 'undefined') {
      showToast('Paystack not loaded — check internet connection.', 'error');
      return;
    }
    if (!paystackKey) {
      showToast('Paystack key not configured — contact the photographer.', 'error');
      return;
    }

    // Visual loading state
    const originalText = btnEl?.innerHTML || '';
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Opening…'; }

    const ref = 'PW_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7).toUpperCase();
    try {
      const handler = PaystackPop.setup({
        key:      paystackKey,
        email:    session.email,
        amount:   pkg.price * 100,
        ref,
        currency: 'NGN',
        onClose: () => {
          if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = originalText; }
          showToast('Payment window closed.', 'error');
        },
        callback: function(response) {
          (async () => {
            showToast('Verifying payment…', '');
            try {
              const result = await Backend.recordPayment({
                reference:   response.reference,
                packageId:   pkg.id,
                packageName: pkg.name,
                amount:      pkg.price,
              });
              if (result.success) {
                showToast('Payment successful! 🎉 Receipt is ready.', 'success');
                await loadPaymentHistory();
                showReceipt(result.payment.id, result.payment);
              }
            } catch (err) {
              showToast('Verification failed: ' + err.message, 'error');
            }
          })();
        },
      });
      handler.openIframe();
    } catch (err) {
      console.error('[Paystack]', err);
      showToast('Paystack error: ' + err.message, 'error');
      if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = originalText; }
    }
  }

  async function showReceipt(paymentId, cached) {
    let p = cached;
    if (!p) {
      try { p = await Backend.getPayments().then(ps => ps.find(x => x.id === paymentId)); } catch {}
    }
    if (!p) return;
    document.getElementById('receipt-body').innerHTML = buildReceiptHTML(p);
    document.getElementById('receipt-modal').classList.add('open');
  }

  function closeReceipt() { document.getElementById('receipt-modal').classList.remove('open'); }

  function buildReceiptHTML(p) {
    return `<div class="receipt-header">
      <div class="receipt-brand">Prince Williams</div>
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-status-badge"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Payment Successful</div>
    </div>
    <div class="receipt-grid">
      <div class="receipt-field"><label>Receipt No.</label><p>#${(p.id||'').slice(0,8).toUpperCase()}</p></div>
      <div class="receipt-field"><label>Date</label><p>${Backend.formatDateTime(p.paid_at)}</p></div>
      <div class="receipt-field"><label>Client Name</label><p>${escHtml(p.client_name || session.name)}</p></div>
      <div class="receipt-field"><label>Email</label><p>${escHtml(p.client_email || session.email)}</p></div>
      <div class="receipt-field"><label>Package</label><p>${escHtml(p.package_name)}</p></div>
      <div class="receipt-field"><label>Reference</label><p style="font-family:monospace;font-size:.78rem;">${p.reference}</p></div>
    </div>
    <div class="receipt-total"><span>Total Paid</span><strong>${Backend.formatCurrency(p.amount)}</strong></div>
    <div class="receipt-actions">
      <button class="btn-secondary" onclick="window.print()"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print / Save PDF</button>
      <button class="btn-primary-sm" onclick="DashApp.closeReceipt()">Done</button>
    </div>`;
  }

  // ── Chat ─────────────────────────────────────────────────────────────────
  function startChatPoll() {
    renderMessages();
    if (!chatPollInterval) chatPollInterval = setInterval(renderMessages, 2500);
  }
  function stopChatPoll() { clearInterval(chatPollInterval); chatPollInterval = null; }

  async function renderMessages() {
    try {
      await Backend.markMessagesRead(session.id, 'client');
      const messages  = await Backend.getMessages(session.id);
      const container = document.getElementById('chat-messages');
      const wasAtBottom = isScrolledToBottom(container);

      if (!messages.length) {
        container.innerHTML = `<div class="msg-date-divider">Today</div>
          <div class="msg-wrap">
            <div class="msg-avatar-sm">PW</div>
            <div>
              <div class="msg-bubble">Hi there! 👋 Welcome to your client portal. Feel free to ask me anything.</div>
              <span class="msg-time">Just now</span>
            </div>
          </div>`;
        return;
      }
      container.innerHTML = messages.map(m => {
        const isMe = m.sender_role === 'client';
        return `<div class="msg-wrap${isMe ? ' from-me' : ''}">
          <div class="msg-avatar-sm">${isMe ? escHtml(session.name.charAt(0).toUpperCase()) : 'PW'}</div>
          <div>
            <div class="msg-bubble">${escHtml(m.text)}</div>
            <span class="msg-time">${Backend.timeAgo(m.created_at)}</span>
          </div>
        </div>`;
      }).join('');
      if (wasAtBottom) container.scrollTop = container.scrollHeight;
    } catch {}
  }

  async function sendChat() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text) return;
    input.value = ''; input.style.height = '';
    try {
      await Backend.sendMessage(session.id, 'client', text);
      await renderMessages();
      document.getElementById('chat-messages').scrollTop = 9999;
    } catch (err) { showToast('Could not send: ' + err.message, 'error'); }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function autoGrow() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; }
  function isScrolledToBottom(el) { return el.scrollHeight - el.clientHeight - el.scrollTop < 60; }
  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function showToast(msg, type) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast ' + (type||'');
    t.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${type==='success'?'<polyline points="20 6 9 17 4 12"/>':'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}</svg> ${msg}`;
    c.appendChild(t); setTimeout(() => t.remove(), 4000);
  }
  function openSidebar()  { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').style.display = 'block'; }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').style.display = 'none'; }

  return {
    init, switchTab, toggleSelect, clearSelection, submitSelection,
    doDownload, downloadAll, initiatePayment, showReceipt, closeReceipt,
    sendChat, openSidebar, closeSidebar,
  };
})();

document.addEventListener('DOMContentLoaded', DashApp.init);
