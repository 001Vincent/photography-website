/**
 * PRINCE WILLIAMS — Admin Dashboard Logic
 * Rewritten to match actual admin-dashboard.html element IDs.
 */

const AdminApp = (() => {
  'use strict';

  let session       = null;
  let clients       = [];
  let activeChatId  = null;
  let chatPollTimer = null;
  let dropFiles     = [];

  // ── Boot ─────────────────────────────────────────────────────────────────
  async function init() {
    session = Auth.requireAuth('admin');
    if (!session) return;

    document.querySelectorAll('.sidebar-link[data-tab]').forEach(l =>
      l.addEventListener('click', () => switchTab(l.dataset.tab))
    );
    document.getElementById('hamburger').addEventListener('click', openSidebar);

    const chatInput = document.getElementById('admin-chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminChat(); }
      });
    }

    // ── Event delegation for chat client list clicks ──────────────────────
    const chatList = document.getElementById('chat-clients-list');
    if (chatList) {
      chatList.addEventListener('click', e => {
        const item = e.target.closest('[data-client-id]');
        if (item) openChat(item.dataset.clientId);
      });
    }

    setupDropzone();
    await loadOverview();
    switchTab('overview');

    // ── Package modal wiring (elements exist after DOMContentLoaded) ─────
    setTimeout(() => {
      document.getElementById('add-package-btn')?.addEventListener('click', () => openPackageModal());
      document.getElementById('pkg-modal-close')?.addEventListener('click', closePackageModal);
      document.getElementById('pkg-modal-cancel')?.addEventListener('click', closePackageModal);
      document.getElementById('pkg-modal-save')?.addEventListener('click', savePackage);
    }, 200);
  }

  // ── Tab Switching ─────────────────────────────────────────────────────────
  function switchTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => l.classList.remove('active'));

    const panel = document.getElementById('tab-' + tab);
    const link  = document.querySelector(`.sidebar-link[data-tab="${tab}"]`);
    if (panel) panel.classList.add('active');
    if (link)  link.classList.add('active');

    const titles = {
      'overview':    'Dashboard Overview',
      'clients':     'Client Management',
      'send-photos': 'Send Photos to Client',
      'selections':  'Client Selections',
      'payments':    'All Payments',
      'chat':        'Client Chat',
      'packages':    'Manage Packages',
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = titles[tab] || tab;

    if (tab === 'overview')    loadOverview();
    if (tab === 'clients')     loadClients();
    if (tab === 'send-photos') populateClientDropdown();
    if (tab === 'selections')  loadSelections();
    if (tab === 'payments')    loadPayments();
    if (tab === 'chat')        loadChatList();
    if (tab === 'packages')    loadPackages();
    if (tab !== 'chat')        stopChatPoll();
    closeSidebar();
  }

  // ── Overview ─────────────────────────────────────────────────────────────
  async function loadOverview() {
    try {
      const [cl, pm, sl] = await Promise.all([
        Backend.getAllClients(),
        Backend.getAllPayments(),
        Backend.getAllSelections(),
      ]);
      clients = cl;
      const revenue = pm.reduce((s, p) => s + Number(p.amount), 0);
      const pending = sl.filter(s => !s.reviewed).length;
      const totalPhotos = cl.reduce((s, c) => s + (c.total_photos || 0), 0);

      setText('stat-clients',    cl.length);
      setText('stat-revenue',    Backend.formatCurrency(revenue));
      setText('stat-selections', pending);
      setText('stat-messages',   cl.reduce((s, c) => s + (c.unread_messages || 0), 0));

      renderRecentClientsTable(cl.slice(0, 5));
    } catch (err) { showToast('Overview error: ' + err.message, 'error'); }
  }

  function renderRecentClientsTable(list) {
    const tbody = document.getElementById('overview-clients-tbody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gray-400);">No clients yet.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(c => `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:.6rem;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--btn-bg);color:var(--btn-text);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0;">${escHtml(c.name.charAt(0))}</div>
          <div><p style="font-weight:600;font-size:.85rem;">${escHtml(c.name)}</p><p style="font-size:.72rem;color:var(--gray-400);">${escHtml(c.email)}</p></div>
        </div>
      </td>
      <td>${Backend.timeAgo(c.created_at)}</td>
      <td>${c.wedding_date ? Backend.formatDate(c.wedding_date) : '—'}</td>
      <td>${c.total_photos || 0}</td>
      <td>${c.selection_submitted_at
        ? `<span class="pill ${c.selection_reviewed ? 'success' : 'warning'}">${c.selection_reviewed ? 'Reviewed' : 'Pending'}</span>`
        : '<span class="pill neutral">None</span>'}</td>
    </tr>`).join('');
  }

  // ── Clients Tab ────────────────────────────────────────────────────────────
  async function loadClients() {
    const tbody = document.getElementById('clients-tbody');
    const pill  = document.getElementById('clients-count-pill');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:2rem;">Loading…</td></tr>';
    try {
      clients = await Backend.getAllClients();
      if (pill) pill.textContent = clients.length + ' client' + (clients.length !== 1 ? 's' : '');

      if (!clients.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:2rem;">No clients registered yet.</td></tr>';
        return;
      }
      tbody.innerHTML = clients.map(c => `<tr>
        <td><strong>${escHtml(c.name)}</strong></td>
        <td>${escHtml(c.email)}</td>
        <td>${c.phone ? escHtml(c.phone) : '—'}</td>
        <td>${c.wedding_date ? Backend.formatDate(c.wedding_date) : '—'}</td>
        <td>${Backend.timeAgo(c.created_at)}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-outline" onclick="AdminApp.quickSendPhotos('${c.id}')">Send Photos</button>
          <button class="btn btn-sm btn-outline" style="margin-left:.4rem;" onclick="AdminApp.openChat('${c.id}')">Chat</button>
        </td>
      </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">${escHtml(err.message)}</td></tr>`;
    }
  }

  // ── Send Photos Tab ────────────────────────────────────────────────────────
  async function populateClientDropdown() {
    if (!clients.length) clients = await Backend.getAllClients().catch(() => []);
    const sel = document.getElementById('send-client-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Choose a client —</option>';
    clients.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name + ' (' + c.email + ')';
      sel.appendChild(o);
    });
    // Enable send button when client + files are chosen
    sel.addEventListener('change', checkSendReady);
    dropFiles = [];
    updateDropzoneUI();
  }

  function quickSendPhotos(clientId) {
    switchTab('send-photos');
    setTimeout(() => {
      const sel = document.getElementById('send-client-select');
      if (sel) { sel.value = clientId; checkSendReady(); }
    }, 200);
  }

  function setupDropzone() {
    const zone  = document.getElementById('upload-zone');
    const input = document.getElementById('photo-input');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', e => {
      addFiles(Array.from(e.target.files));
      input.value = '';
    });
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
    });
  }

  function addFiles(files) {
    files.forEach(f => {
      if (!dropFiles.find(x => x.name === f.name && x.size === f.size)) dropFiles.push(f);
    });
    updateDropzoneUI();
  }

  function updateDropzoneUI() {
    const label = document.getElementById('upload-count-label');
    if (label) {
      label.textContent = dropFiles.length
        ? `${dropFiles.length} photo${dropFiles.length === 1 ? '' : 's'} selected`
        : '';
    }

    // Show thumbnail previews
    const previews = document.getElementById('upload-previews');
    if (previews) {
      previews.innerHTML = dropFiles.slice(0, 8).map(f =>
        `<div style="width:64px;height:64px;border-radius:.5rem;overflow:hidden;flex-shrink:0;">
           <img src="${URL.createObjectURL(f)}" style="width:100%;height:100%;object-fit:cover;" />
         </div>`
      ).join('') + (dropFiles.length > 8 ? `<div style="width:64px;height:64px;border-radius:.5rem;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:.75rem;color:var(--gray-500);">+${dropFiles.length - 8}</div>` : '');
    }
    checkSendReady();
  }

  function checkSendReady() {
    const btn      = document.getElementById('send-btn');
    const clientId = document.getElementById('send-client-select')?.value;
    if (btn) btn.disabled = !(clientId && dropFiles.length > 0);
  }

  async function sendPhotos() {
    const clientId = document.getElementById('send-client-select')?.value;
    const typeEl   = document.querySelector('input[name="gallery-type"]:checked');
    const type     = typeEl?.value;
    if (!clientId) { showToast('Please select a client.', 'error'); return; }
    if (!type)     { showToast('Please choose a gallery type.', 'error'); return; }
    if (!dropFiles.length) { showToast('Please add photos first.', 'error'); return; }

    const btn     = document.getElementById('send-btn');
    const btnText = document.getElementById('send-btn-text');
    btn.disabled = true;
    if (btnText) btnText.textContent = `Uploading ${dropFiles.length} photo${dropFiles.length !== 1 ? 's' : ''}…`;

    try {
      const result = await Backend.sendPhotos(clientId, dropFiles, type);
      dropFiles = [];
      updateDropzoneUI();
      const previews = document.getElementById('upload-previews');
      if (previews) previews.innerHTML = '';
      showToast(`✅ Sent ${result.count} photo${result.count !== 1 ? 's' : ''} successfully!`, 'success');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      if (btnText) btnText.textContent = 'Send Photos';
    }
  }

  // ── Selections ─────────────────────────────────────────────────────────────
  async function loadSelections() {
    const container = document.getElementById('selections-container');
    if (!container) return;
    container.innerHTML = '<p style="color:var(--gray-400);padding:2rem;text-align:center;">Loading…</p>';
    try {
      const selections = await Backend.getAllSelections();
      if (!selections.length) {
        container.innerHTML = `<div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <h3>No selections yet</h3>
          <p>Client photo selections will appear here after they submit their choices.</p></div>`;
        return;
      }
      container.innerHTML = selections.map(s => `
        <div style="padding:1.25rem;border:1px solid var(--gray-200);border-radius:.75rem;margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
            <div>
              <h4 style="font-size:.95rem;font-weight:700;">${escHtml(s.client_name)}</h4>
              <p style="font-size:.78rem;color:var(--gray-500);">${escHtml(s.client_email)} · Submitted ${Backend.timeAgo(s.submitted_at)}</p>
            </div>
            <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;">
              <span class="pill ${s.reviewed ? 'success' : 'warning'}">${s.reviewed ? '✓ Reviewed' : '⏳ Pending'}</span>
              <span style="font-size:.8rem;font-weight:600;background:var(--gray-100);padding:.25rem .65rem;border-radius:.375rem;">${s.photo_count} photo${s.photo_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style="margin-top:.85rem;display:flex;gap:.65rem;">
            <button class="btn btn-sm btn-outline" onclick="AdminApp.viewSelection('${s.client_id}')">View Photos</button>
            ${!s.reviewed ? `<button class="btn btn-sm btn-primary" onclick="AdminApp.reviewSelection('${s.client_id}', this)">Mark Reviewed</button>` : ''}
          </div>
        </div>`).join('');
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${escHtml(err.message)}</p></div>`;
    }
  }

  async function viewSelection(clientId) {
    try {
      const sel = await Backend.getSelections(clientId);
      if (!sel || !sel.photos.length) { showToast('No photos in this selection.'); return; }
      const body = document.getElementById('sel-modal-body');
      if (body) {
        body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.75rem;">` +
          sel.photos.map(p =>
            `<div style="aspect-ratio:1;overflow:hidden;border-radius:.5rem;background:var(--gray-100);">
               <img src="${Backend.getPhotoUrl(p.id)}" alt="${escHtml(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;"/>
             </div>`
          ).join('') + `</div>`;
      }
      const modal = document.getElementById('selection-modal');
      if (modal) modal.classList.add('open');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  }

  async function reviewSelection(clientId, btn) {
    try {
      await Backend.markSelectionReviewed(clientId);
      const card = btn.closest('div[style*="border"]');
      if (card) {
        const pill = card.querySelector('.pill');
        if (pill) { pill.className = 'pill success'; pill.textContent = '✓ Reviewed'; }
        btn.remove();
      }
      showToast('Marked as reviewed.', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  }

  function closeSelectionModal() {
    const modal = document.getElementById('selection-modal');
    if (modal) modal.classList.remove('open');
  }

  // ── Payments ───────────────────────────────────────────────────────────────
  async function loadPayments() {
    const tbody   = document.getElementById('payments-tbody');
    const revenue = document.getElementById('total-revenue-display');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:2rem;">Loading…</td></tr>';
    try {
      const payments = await Backend.getAllPayments();
      const total = payments.reduce((s, p) => s + Number(p.amount), 0);
      if (revenue) revenue.textContent = Backend.formatCurrency(total);

      if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:2rem;">No payments recorded yet.</td></tr>';
        return;
      }
      tbody.innerHTML = payments.map(p => `<tr>
        <td>${escHtml(p.client_name || '—')}</td>
        <td>${escHtml(p.package_name)}</td>
        <td><strong>${Backend.formatCurrency(p.amount)}</strong></td>
        <td style="font-family:monospace;font-size:.75rem;">${p.reference}</td>
        <td>${Backend.formatDate(p.paid_at)}</td>
        <td><span class="pill success">✓ Success</span></td>
      </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">${escHtml(err.message)}</td></tr>`;
    }
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  async function loadChatList() {
    const list = document.getElementById('chat-clients-list');
    if (!list) return;
    try {
      const convos = await Backend.getAllConversations();
      if (!convos.length) {
        list.innerHTML = '<p style="color:var(--gray-400);font-size:.82rem;padding:1.5rem;">No conversations yet.<br><small>Clients who send a message will appear here.</small></p>';
        return;
      }
      // Use data-client-id for event delegation — no inline onclick needed
      list.innerHTML = convos.map(c => `
        <div class="chat-client-item${activeChatId === c.client_id ? ' active' : ''}"
             data-client-id="${escHtml(c.client_id)}">
          <div class="chat-client-item-avatar">${escHtml((c.client_name || '?').charAt(0).toUpperCase())}</div>
          <div class="chat-client-item-info">
            <div class="chat-client-item-row">
              <span class="chat-client-item-name">${escHtml(c.client_name || 'Unknown')}</span>
              ${c.unread_count > 0 ? `<span class="chat-unread-badge">${c.unread_count}</span>` : ''}
            </div>
            <p class="chat-client-item-preview">${escHtml(c.last_message || 'No messages yet')}</p>
          </div>
        </div>`).join('');
    } catch (err) {
      console.error('[Admin Chat List]', err);
    }
  }

  async function openChat(clientId) {
    activeChatId = clientId;
    if (!clients.length) clients = await Backend.getAllClients().catch(() => []);
    const client = clients.find(c => c.id === clientId);

    // Update chat header
    const nameEl   = document.getElementById('admin-chat-name');
    const avatarEl = document.getElementById('admin-chat-avatar');
    const statusEl = document.getElementById('admin-chat-status');
    const inputEl  = document.getElementById('admin-chat-input');
    const sendBtn  = document.getElementById('admin-send-btn');

    if (nameEl)   nameEl.textContent   = client?.name || 'Client';
    if (avatarEl) avatarEl.textContent = (client?.name || 'C').charAt(0).toUpperCase();
    if (statusEl) statusEl.textContent = client?.email || '';
    if (inputEl)  { inputEl.disabled = false; inputEl.placeholder = `Reply to ${client?.name || 'client'}...`; }
    if (sendBtn)  sendBtn.disabled = false;

    if (!document.getElementById('tab-chat')?.classList.contains('active')) {
      switchTab('chat');
    } else {
      loadChatList();
    }
    startChatPoll();
  }

  function startChatPoll() {
    stopChatPoll();
    renderAdminMessages();
    chatPollTimer = setInterval(renderAdminMessages, 2500);
  }

  function stopChatPoll() {
    clearInterval(chatPollTimer);
    chatPollTimer = null;
  }

  async function renderAdminMessages() {
    if (!activeChatId) return;
    const container = document.getElementById('admin-chat-messages');
    if (!container) return;

    // Mark read separately — don't let it block message display
    Backend.markMessagesRead(activeChatId, 'admin').catch(() => {});

    try {
      const messages = await Backend.getMessages(activeChatId);
      const atBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 60;

      if (!messages.length) {
        container.innerHTML = `<div class="empty-state" style="padding:2rem 1rem;">
          <h3 style="font-size:.9rem;">No messages yet</h3>
          <p style="font-size:.78rem;">Start the conversation below.</p></div>`;
        return;
      }

      const client = clients.find(c => c.id === activeChatId);
      container.innerHTML = messages.map(m => {
        const isAdmin = m.sender_role === 'admin';
        return `<div class="msg-wrap${isAdmin ? ' from-me' : ''}">
          <div class="msg-avatar-sm" style="width:30px;height:30px;border-radius:50%;background:var(--gray-200);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0;">
            ${isAdmin ? 'PW' : escHtml((client?.name || 'C').charAt(0).toUpperCase())}
          </div>
          <div>
            <div class="msg-bubble" style="max-width:360px;padding:.6rem .9rem;border-radius:1rem;font-size:.85rem;line-height:1.45;${isAdmin ? 'background:var(--btn-bg);color:var(--btn-text);border-bottom-right-radius:.25rem;' : 'background:var(--gray-100);color:var(--gray-800);border-bottom-left-radius:.25rem;'}">
              ${escHtml(m.text)}
            </div>
            <span style="font-size:.7rem;color:var(--gray-400);margin-top:.2rem;display:block;${isAdmin ? 'text-align:right;' : ''}">${Backend.timeAgo(m.created_at)}</span>
          </div>
        </div>`;
      }).join('');

      if (atBottom) container.scrollTop = container.scrollHeight;
    } catch {}
  }

  async function sendAdminChat() {
    const input = document.getElementById('admin-chat-input');
    const text  = (input?.value || '').trim();
    if (!text || !activeChatId) return;
    input.value = '';
    try {
      await Backend.sendMessage(activeChatId, 'admin', text);
      await renderAdminMessages();
      const container = document.getElementById('admin-chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    } catch (err) { showToast('Could not send: ' + err.message, 'error'); }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Packages Management ─────────────────────────────────────────────────────
  let editingPackageId = null;

  async function loadPackages() {
    const grid = document.getElementById('packages-admin-grid');
    if (!grid) return;
    grid.innerHTML = '<p style="color:var(--gray-400);padding:1rem;">Loading…</p>';
    try {
      const pkgs = await Backend.getAllPackagesAdmin();
      if (!pkgs.length) {
        grid.innerHTML = '<p style="color:var(--gray-400);padding:1rem;">No packages yet. Click "Add Package" to create one.</p>';
        return;
      }
      grid.innerHTML = pkgs.map(p => {
        const features = Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]');
        return `
          <div class="package-card" style="${p.is_active ? '' : 'opacity:.55;'}position:relative;">
            ${!p.is_active ? '<span style="position:absolute;top:.75rem;right:.75rem;font-size:.65rem;background:var(--gray-200);color:var(--gray-500);padding:.2rem .6rem;border-radius:9999px;font-weight:600;">INACTIVE</span>' : ''}
            ${p.badge ? `<div class="package-badge">${escHtml(p.badge)}</div>` : ''}
            <h3 class="package-name">${escHtml(p.name)}</h3>
            <p class="package-tagline">${escHtml(p.tagline || '')}</p>
            <p class="package-price" style="font-size:1.4rem;">${Backend.formatCurrency(p.price)}</p>
            <ul class="package-features" style="margin-bottom:1.25rem;">
              ${features.slice(0, 4).map(f => `<li class="package-feature"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>${escHtml(f)}</li>`).join('')}
              ${features.length > 4 ? `<li class="package-feature" style="color:var(--gray-400);">+${features.length - 4} more…</li>` : ''}
            </ul>
            <div style="display:flex;gap:.6rem;margin-top:auto;">
              <button class="btn btn-outline btn-sm" style="flex:1;" data-edit-pkg="${escHtml(p.id)}">✏️ Edit</button>
              <button class="btn btn-sm" style="flex:1;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;" data-del-pkg="${escHtml(p.id)}" data-pkg-name="${escHtml(p.name)}">🗑 Delete</button>
            </div>
          </div>`;
      }).join('');

      // Event delegation for edit/delete buttons
      grid.addEventListener('click', e => {
        const editBtn = e.target.closest('[data-edit-pkg]');
        const delBtn  = e.target.closest('[data-del-pkg]');
        if (editBtn) openPackageModal(pkgs.find(p => p.id === editBtn.dataset.editPkg));
        if (delBtn)  confirmDeletePackage(delBtn.dataset.delPkg, delBtn.dataset.pkgName);
      }, { once: true });
    } catch (err) {
      grid.innerHTML = `<p style="color:var(--error,#dc2626);padding:1rem;">Error: ${escHtml(err.message)}</p>`;
    }
  }

  function openPackageModal(pkg = null) {
    editingPackageId = pkg ? pkg.id : null;
    document.getElementById('pkg-modal-title').textContent = pkg ? 'Edit Package' : 'Add Package';
    document.getElementById('pkg-name').value    = pkg?.name    || '';
    document.getElementById('pkg-tagline').value = pkg?.tagline || '';
    document.getElementById('pkg-price').value   = pkg?.price   || '';
    document.getElementById('pkg-badge').value   = pkg?.badge   || '';
    document.getElementById('pkg-sort').value    = pkg?.sort_order ?? 0;
    document.getElementById('pkg-active').checked = pkg ? (pkg.is_active !== false) : true;
    const features = pkg ? (Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || '[]')) : [];
    document.getElementById('pkg-features').value = features.join('\n');
    document.getElementById('package-modal').classList.add('open');
    document.getElementById('pkg-name').focus();
  }

  function closePackageModal() {
    document.getElementById('package-modal').classList.remove('open');
    editingPackageId = null;
  }

  async function savePackage() {
    const name    = document.getElementById('pkg-name').value.trim();
    const tagline = document.getElementById('pkg-tagline').value.trim();
    const price   = Number(document.getElementById('pkg-price').value);
    const badge   = document.getElementById('pkg-badge').value.trim();
    const sort    = Number(document.getElementById('pkg-sort').value) || 0;
    const active  = document.getElementById('pkg-active').checked;
    const rawFeatures = document.getElementById('pkg-features').value;
    const features = rawFeatures.split('\n').map(f => f.trim()).filter(Boolean);

    if (!name)  { showToast('Package name is required.', 'error'); return; }
    if (!price || price <= 0) { showToast('Valid price is required.', 'error'); return; }

    const saveBtn = document.getElementById('pkg-modal-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    try {
      const data = { name, tagline: tagline || null, price, badge: badge || null, features, sort_order: sort, is_active: active };
      if (editingPackageId) {
        await Backend.updatePackage(editingPackageId, data);
        showToast('Package updated!', 'success');
      } else {
        await Backend.createPackage(data);
        showToast('Package created!', 'success');
      }
      closePackageModal();
      await loadPackages();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Package';
    }
  }

  async function confirmDeletePackage(id, name) {
    if (!confirm(`Deactivate "${name}"? It will no longer appear for clients but payment history is preserved.`)) return;
    try {
      await Backend.deletePackage(id);
      showToast(`"${name}" deactivated.`, 'success');
      await loadPackages();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  function showToast(msg, type) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  function openSidebar()  {
    document.getElementById('sidebar')?.classList.add('open');
    const ov = document.getElementById('sidebar-overlay');
    if (ov) ov.style.display = 'block';
  }
  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    const ov = document.getElementById('sidebar-overlay');
    if (ov) ov.style.display = 'none';
  }

  return {
    init, switchTab, loadClients, sendPhotos, quickSendPhotos,
    viewSelection, reviewSelection, closeSelectionModal,
    openChat, sendAdminChat,
    openSidebar, closeSidebar,
    openPackageModal, closePackageModal, savePackage, confirmDeletePackage,
  };
})();

document.addEventListener('DOMContentLoaded', AdminApp.init);
