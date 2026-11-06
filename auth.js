/**
 * PRINCE WILLIAMS PHOTOGRAPHY — Frontend Auth Module
 * ====================================================
 * Replaces the old localStorage-based auth.
 * Now uses JWT tokens via the real Express API.
 */

const Auth = (() => {
  'use strict';

  const JWT_KEY     = 'pw_jwt';
  const SESSION_KEY = 'pw_session';
  const API         = () => (CONFIG.API_URL || '');

  // ── Helpers ──────────────────────────────────────────────────────────────
  function _authHeaders() {
    const token = localStorage.getItem(JWT_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    };
  }

  function _saveSession(token, user) {
    localStorage.setItem(JWT_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function _handleResponse(data) {
    if (data.token && data.user) {
      _saveSession(data.token, data.user);
    }
    return data;
  }

  // ── Register ─────────────────────────────────────────────────────────────
  async function register({ name, email, phone, password, weddingDate }) {
    try {
      const res = await fetch(API() + '/api/auth/register', {
        method: 'POST',
        headers: _authHeaders(),
        body: JSON.stringify({ name, email, phone, password, weddingDate }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Registration failed.' };
      _handleResponse(data);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      const res = await fetch(API() + '/api/auth/login', {
        method: 'POST',
        headers: _authHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Login failed.' };
      _handleResponse(data);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  // ── Session ───────────────────────────────────────────────────────────────
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function getToken() {
    return localStorage.getItem(JWT_KEY);
  }

  function logout() {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/login.html';
  }

  // ── Route Guards ──────────────────────────────────────────────────────────
  function requireAuth(role) {
    const session = getSession();
    const token   = getToken();
    if (!session || !token) {
      window.location.href = '/login.html';
      return null;
    }
    if (role && session.role !== role) {
      window.location.href = session.role === 'admin'
        ? '/admin-dashboard.html'
        : '/client-dashboard.html';
      return null;
    }
    return session;
  }

  return { register, login, logout, getSession, getToken, requireAuth };
})();
