/**
 * PRINCE WILLIAMS PHOTOGRAPHY — Frontend API Client
 * ===================================================
 * Replaces the old localStorage mock backend.
 * All functions call the real Express REST API.
 * Function signatures and return shapes are identical
 * to the old backend.js — only the bodies changed.
 */

const Backend = (() => {
  'use strict';

  const API = () => (CONFIG.API_URL || '');

  function _headers(isMultipart) {
    const token = Auth.getToken();
    const h = {};
    if (token) h['Authorization'] = 'Bearer ' + token;
    if (!isMultipart) h['Content-Type'] = 'application/json';
    return h;
  }

  async function _json(res) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // ════════════════════════════════════════════════════════════════
  //  GALLERY
  // ════════════════════════════════════════════════════════════════

  /**
   * [ADMIN] Upload photos to a client's gallery via Google Drive.
   * @param {string}   clientId
   * @param {File[]}   files     — native File objects from <input type="file">
   * @param {'unedited'|'final'} type
   */
  async function sendPhotos(clientId, files, type) {
    const form = new FormData();
    form.append('clientId', clientId);
    form.append('type', type);
    for (const f of files) form.append('photos', f);

    const res = await fetch(API() + '/api/gallery/upload', {
      method: 'POST',
      headers: _headers(true),
      body: form,
    });
    return _json(res);
  }

  /**
   * Get gallery metadata for a client.
   * Returns { unedited: [...], final: [...] }
   * Each photo has: { id, name, type, size_bytes, sent_at, selected }
   * Use getPhotoUrl(photoId) to display photos — never expose Drive IDs.
   */
  async function getGallery(clientId, type = 'all') {
    const url = API() + '/api/gallery/' + clientId + (type !== 'all' ? '?type=' + type : '');
    const res = await fetch(url, { headers: _headers() });
    return _json(res);
  }

  /**
   * Returns a proxied URL for displaying a photo.
   * The token is embedded in the URL so it can be used in <img src>.
   */
  function getPhotoUrl(photoId) {
    return API() + '/api/gallery/photo/' + photoId + '?token=' + encodeURIComponent(Auth.getToken() || '');
  }

  /**
   * Download a final photo — triggers file download via anchor.
   */
  function downloadPhoto(photoId, name) {
    const a = document.createElement('a');
    a.href = getPhotoUrl(photoId);
    a.download = name || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * [ADMIN] Delete a photo.
   */
  async function deletePhoto(photoId) {
    const res = await fetch(API() + '/api/gallery/' + photoId, {
      method: 'DELETE', headers: _headers(),
    });
    return _json(res);
  }

  // ════════════════════════════════════════════════════════════════
  //  SELECTIONS
  // ════════════════════════════════════════════════════════════════

  /**
   * [CLIENT] Submit selected photo IDs.
   */
  async function submitSelections(clientId, photoIds) {
    const res = await fetch(API() + '/api/selections', {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ photoIds }),
    });
    return _json(res);
  }

  /**
   * Get a client's selection (admin or self).
   */
  async function getSelections(clientId) {
    const res = await fetch(API() + '/api/selections/' + clientId, { headers: _headers() });
    if (res.status === 404) return null;
    return _json(res);
  }

  /**
   * [ADMIN] Get all client selections.
   */
  async function getAllSelections() {
    const res = await fetch(API() + '/api/selections', { headers: _headers() });
    return _json(res);
  }

  /**
   * [ADMIN] Mark selection as reviewed.
   */
  async function markSelectionReviewed(clientId) {
    const res = await fetch(API() + '/api/selections/' + clientId + '/review', {
      method: 'PATCH', headers: _headers(),
    });
    return _json(res);
  }

  // ════════════════════════════════════════════════════════════════
  //  MESSAGES / CHAT
  // ════════════════════════════════════════════════════════════════

  /**
   * Send a message in a client's thread.
   */
  async function sendMessage(clientId, from, text) {
    const res = await fetch(API() + '/api/messages/' + clientId, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ text }),
    });
    return _json(res);
  }

  /**
   * Get all messages for a thread.
   */
  async function getMessages(clientId) {
    const res = await fetch(API() + '/api/messages/' + clientId, { headers: _headers() });
    return _json(res);
  }

  /**
   * Mark messages in thread as read.
   */
  async function markMessagesRead(clientId, viewer) {
    const res = await fetch(API() + '/api/messages/' + clientId + '/read', {
      method: 'PATCH', headers: _headers(),
    });
    return _json(res);
  }

  /**
   * Get unread message counts.
   */
  async function getUnread() {
    const res = await fetch(API() + '/api/messages/unread/counts', { headers: _headers() });
    return _json(res);
  }

  /**
   * [ADMIN] Get all conversation threads.
   */
  async function getAllConversations() {
    const res = await fetch(API() + '/api/messages', { headers: _headers() });
    return _json(res);
  }

  // ════════════════════════════════════════════════════════════════
  //  PAYMENTS
  // ════════════════════════════════════════════════════════════════

  /**
   * Server-side verify a Paystack payment and record it.
   * Call this in the Paystack callback() handler.
   */
  async function recordPayment({ reference, packageId, packageName, amount }) {
    const res = await fetch(API() + '/api/payments/verify', {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ reference, packageId, packageName, amount }),
    });
    return _json(res);
  }

  /**
   * Get payment history (client: own; admin: all).
   */
  async function getPayments() {
    const res = await fetch(API() + '/api/payments', { headers: _headers() });
    return _json(res);
  }

  /**
   * [ADMIN] Alias for getPayments (admin sees all by default).
   */
  async function getAllPayments() {
    return getPayments();
  }

  // ════════════════════════════════════════════════════════════════
  //  CLIENTS  (admin)
  // ════════════════════════════════════════════════════════════════

  async function getAllClients() {
    const res = await fetch(API() + '/api/clients', { headers: _headers() });
    return _json(res);
  }

  async function getClientById(id) {
    const res = await fetch(API() + '/api/clients/' + id, { headers: _headers() });
    return _json(res);
  }

  // ════════════════════════════════════════════════════════════════
  //  UTILITIES
  // ════════════════════════════════════════════════════════════════

  function formatCurrency(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60)  return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24)  return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  // ────────────────────────────────────────────────────────────────
  //  PACKAGES
  // ────────────────────────────────────────────────────────────────

  /** Public list of active packages. */
  async function getPackages() {
    const res = await fetch(API() + '/api/packages');
    return _json(res);
  }

  /** Admin: all packages including inactive. */
  async function getAllPackagesAdmin() {
    const res = await fetch(API() + '/api/packages/all', { headers: _headers() });
    return _json(res);
  }

  /** Admin: create a new package. */
  async function createPackage(data) {
    const res = await fetch(API() + '/api/packages', {
      method: 'POST', headers: _headers(), body: JSON.stringify(data),
    });
    return _json(res);
  }

  /** Admin: update an existing package. */
  async function updatePackage(id, data) {
    const res = await fetch(API() + '/api/packages/' + id, {
      method: 'PUT', headers: _headers(), body: JSON.stringify(data),
    });
    return _json(res);
  }

  /** Admin: soft-delete a package. */
  async function deletePackage(id) {
    const res = await fetch(API() + '/api/packages/' + id, {
      method: 'DELETE', headers: _headers(),
    });
    return _json(res);
  }

  return {
    // Gallery
    sendPhotos, getGallery, getPhotoUrl, downloadPhoto, deletePhoto,
    // Selections
    submitSelections, getSelections, getAllSelections, markSelectionReviewed,
    // Messages
    sendMessage, getMessages, markMessagesRead, getUnread, getAllConversations,
    // Payments
    recordPayment, getPayments, getAllPayments,
    // Packages
    getPackages, getAllPackagesAdmin, createPackage, updatePackage, deletePackage,
    // Clients
    getAllClients, getClientById,
    // Utils
    formatCurrency, formatDate, formatDateTime, timeAgo,
  };
})();
