// src/api/index.js  — single place for every backend call

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── core fetch wrapper ───────────────────────────────────────────────────────
const request = async (method, path, body = null) => {
  const opts = {
    method,
    credentials: 'include',           // sends httpOnly refresh-token cookie
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const token = localStorage.getItem('kflix_token');
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE}${path}`, opts);

  // token expired → try refresh once, then retry
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      opts.headers['Authorization'] = `Bearer ${localStorage.getItem('kflix_token')}`;
      res = await fetch(`${BASE}${path}`, opts);
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const tryRefresh = async () => {
  try {
    const res  = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('kflix_token', data.accessToken);
      return true;
    }
  } catch {}
  return false;
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: async ({ username, email, password }) => {
    const data = await request('POST', '/api/auth/signup', { username, email, password });
    _storeSession(data);
    return data.user;
  },

  login: async ({ username, password }) => {
    const data = await request('POST', '/api/auth/login', { username, password });
    _storeSession(data);
    return data.user;
  },

  logout: async () => {
    try { await request('POST', '/api/auth/logout'); } catch {}
    _clearSession();
  },

  getMe: () => request('GET', '/api/auth/me').then(d => d.user),

  changePassword: (currentPassword, newPassword) =>
    request('PUT', '/api/auth/change-password', { currentPassword, newPassword }),
};

const _storeSession = (data) => {
  localStorage.setItem('kflix_token',     data.accessToken);
  localStorage.setItem('kflix_role',      data.user.role);
  localStorage.setItem('kflix_logged_in', 'true');
  localStorage.setItem('kflix_username',  data.user.username);
};
const _clearSession = () => {
  ['kflix_token','kflix_role','kflix_logged_in','kflix_username'].forEach(k => localStorage.removeItem(k));
};

// ─── MEDIA ────────────────────────────────────────────────────────────────────
export const mediaAPI = {
  getGrouped: () => request('GET', '/api/media/grouped').then(d => d.data),

  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/media${qs ? `?${qs}` : ''}`);
  },

  search: (q) => request('GET', `/api/media?search=${encodeURIComponent(q)}&limit=8`).then(d => d.data),

  // admin
  create: (body) => request('POST', '/api/media', body).then(d => d.data),
  update: (id, body) => request('PUT', `/api/media/${id}`, body).then(d => d.data),
  delete: (id) => request('DELETE', `/api/media/${id}`),
};

// ─── USERS (admin) ────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/users${qs ? `?${qs}` : ''}`);
  },
  getStats: () => request('GET', '/api/users/stats').then(d => d.data),
  update:   (id, body) => request('PUT', `/api/users/${id}`, body).then(d => d.data),
  delete:   (id) => request('DELETE', `/api/users/${id}`),
};

// ─── WATCHLIST ────────────────────────────────────────────────────────────────
export const watchlistAPI = {
  get:    () => request('GET', '/api/users/me/watchlist').then(d => d.data),
  add:    (mediaId, mediaType) => request('POST', '/api/users/me/watchlist', { mediaId, mediaType }),
  remove: (mediaId) => request('DELETE', `/api/users/me/watchlist/${mediaId}`),
};
