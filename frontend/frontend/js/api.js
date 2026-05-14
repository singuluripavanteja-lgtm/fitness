const API_BASE = '/api';

const getToken = () => localStorage.getItem('fs_token');
const getUser = () => JSON.parse(localStorage.getItem('fs_user') || 'null');
const setAuth = (token, user) => { localStorage.setItem('fs_token', token); localStorage.setItem('fs_user', JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem('fs_token'); localStorage.removeItem('fs_user'); };

const api = async (method, path, body = null, isFormData = false) => {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const toast = (msg, type = 'info') => {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); return c;
  })();
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.animation = 'slideIn 0.3s ease reverse'; setTimeout(() => t.remove(), 300); }, 3500);
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const avatarHTML = (user, size = 40) => {
  if (user?.avatar) return `<img src="${user.avatar}" class="avatar" style="width:${size}px;height:${size}px;" alt="${user.username}">`;
  const initials = (user?.username || '?')[0].toUpperCase();
  return `<div class="avatar-placeholder" style="width:${size}px;height:${size}px;font-size:${size*0.4}px;">${initials}</div>`;
};

const progressRing = (id, pct, color, label, sublabel, size = 90) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return `<div class="progress-ring-wrap" style="width:${size}px;height:${size}px;">
    <svg class="progress-ring" width="${size}" height="${size}">
      <circle stroke="rgba(255,255,255,0.08)" stroke-width="7" fill="none" r="${r}" cx="${size/2}" cy="${size/2}"/>
      <circle id="${id}" class="progress-ring__circle" stroke="${color}" stroke-width="7" fill="none"
        stroke-linecap="round" r="${r}" cx="${size/2}" cy="${size/2}"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
    </svg>
    <div class="progress-ring-label">${label}<small>${sublabel}</small></div>
  </div>`;
};

const requireAuth = () => { if (!getToken()) { window.location.href = '/auth'; return false; } return true; };
const redirectIfAuth = () => { if (getToken()) { window.location.href = '/dashboard'; return true; } return false; };

window.api = api; window.toast = toast; window.getUser = getUser; window.getToken = getToken;
window.setAuth = setAuth; window.clearAuth = clearAuth;
window.formatDate = formatDate; window.timeAgo = timeAgo;
window.avatarHTML = avatarHTML; window.progressRing = progressRing;
window.requireAuth = requireAuth; window.redirectIfAuth = redirectIfAuth;
