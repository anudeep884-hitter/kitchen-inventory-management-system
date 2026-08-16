/* ===================================================================
   Kitchen Inventory Management System — Client Shared Module (shared.js)
   Full API client, role-based navigation, state management, and UI helpers
   =================================================================== */

const STORAGE_KEY = 'kitchen_inventory_v2_store';
const TOKEN_KEY = 'kitchen_inventory_auth_token';
const USER_KEY = 'kitchen_inventory_auth_user';

// In-memory application state
let state = {
  user: null,
  token: null,
  items: [],
  suppliers: [],
  deliveries: [],
  transactions: [],
  notifications: [],
  users: [],
  settings: {
    notifications: true,
    itemsPerPage: 25,
    theme: 'light'
  }
};

// ==========================================
// Authentication & Token Management
// ==========================================

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

export function setAuth(token, user, remember = true) {
  state.token = token;
  state.user = user;
  const storage = remember ? localStorage : sessionStorage;
  if (token) storage.setItem(TOKEN_KEY, token);
  if (user) storage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser() {
  if (state.user) return state.user;
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (raw) {
      state.user = JSON.parse(raw);
      return state.user;
    }
  } catch (e) {
    console.warn('Error reading stored user', e);
  }
  return null;
}

export function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  const token = getToken();

  if (!user || !token) {
    window.location = 'index.html';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert(`Access denied. Your role (${user.role}) is not authorized for this section.`);
    if (user.role === 'chef') window.location = 'chef.html';
    else if (user.role === 'delivery') window.location = 'delivery.html';
    else window.location = 'dashboard.html';
    return null;
  }

  return user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  state.user = null;
  state.token = null;
  window.location = 'index.html';
}

// ==========================================
// HTTP API Client
// ==========================================

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(endpoint, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `API error: ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

// API Methods
export async function apiLogin(email, password, remember = true) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data.success && data.token) {
    setAuth(data.token, data.user, remember);
  }
  return data;
}

export async function apiForgotPassword(email) {
  return await apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function apiGetInventory(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await apiRequest(`/api/inventory${query ? '?' + query : ''}`);
}

export async function apiGetItem(id) {
  return await apiRequest(`/api/inventory/${id}`);
}

export async function apiAddInventory(itemData) {
  return await apiRequest('/api/inventory', {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
}

export async function apiUpdateInventory(id, itemData) {
  return await apiRequest(`/api/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData)
  });
}

export async function apiDeleteInventory(id) {
  return await apiRequest(`/api/inventory/${id}`, {
    method: 'DELETE'
  });
}

export async function apiStockOperation(itemId, operation, quantity, reason = '', batchNo = '', expiryDate = '') {
  return await apiRequest('/api/stock/operation', {
    method: 'POST',
    body: JSON.stringify({ itemId, operation, quantity, reason, batchNo, expiryDate })
  });
}

export async function apiGetSuppliers() {
  return await apiRequest('/api/suppliers');
}

export async function apiAddSupplier(data) {
  return await apiRequest('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateSupplier(id, data) {
  return await apiRequest(`/api/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiDeleteSupplier(id) {
  return await apiRequest(`/api/suppliers/${id}`, {
    method: 'DELETE'
  });
}

export async function apiGetUsers() {
  return await apiRequest('/api/users');
}

export async function apiAddUser(data) {
  return await apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateUser(id, data) {
  return await apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiDeleteUser(id) {
  return await apiRequest(`/api/users/${id}`, {
    method: 'DELETE'
  });
}

export async function apiGetDeliveries() {
  return await apiRequest('/api/deliveries');
}

export async function apiAddDelivery(data) {
  return await apiRequest('/api/deliveries', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateDelivery(id, data) {
  return await apiRequest(`/api/deliveries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiGetTransactions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await apiRequest(`/api/transactions${query ? '?' + query : ''}`);
}

export async function apiGetNotifications() {
  return await apiRequest('/api/notifications');
}

export async function apiMarkNotificationRead(id) {
  return await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' });
}

export async function apiMarkAllNotificationsRead() {
  return await apiRequest('/api/notifications/mark-all-read', { method: 'PUT' });
}

export async function apiClearNotifications() {
  return await apiRequest('/api/notifications', { method: 'DELETE' });
}

export async function apiGetAnalyticsOverview() {
  return await apiRequest('/api/analytics/overview');
}

export async function apiGetRecommendations() {
  return await apiRequest('/api/recommendations');
}

export async function apiGetReport(type) {
  return await apiRequest(`/api/reports/${type}`);
}

export async function apiUpdateProfile(data) {
  return await apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiChangePassword(currentPassword, newPassword) {
  return await apiRequest('/api/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

// ==========================================
// UI Helpers & Injections
// ==========================================

export function showToast(message, type = 'info', duration = 3500) {
  let snackbar = document.getElementById('global-snackbar');
  if (!snackbar) {
    snackbar = document.createElement('div');
    snackbar.id = 'global-snackbar';
    snackbar.className = 'snackbar hidden';
    document.body.appendChild(snackbar);
  }

  snackbar.className = `snackbar snackbar-${type}`;
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  snackbar.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  snackbar.classList.remove('hidden');

  setTimeout(() => {
    snackbar.classList.add('hidden');
  }, duration);
}

export function formatStatusBadge(status) {
  const s = (status || 'AVAILABLE').toUpperCase();
  switch (s) {
    case 'AVAILABLE':
    case 'SAFE':
      return `<span class="badge badge-available"><span class="badge-dot"></span> Available</span>`;
    case 'LOW_STOCK':
    case 'LOW STOCK':
      return `<span class="badge badge-low"><span class="badge-dot"></span> Low Stock</span>`;
    case 'EXPIRING_SOON':
    case 'EXPIRING SOON':
      return `<span class="badge badge-expiring"><span class="badge-dot"></span> Expiring Soon</span>`;
    case 'EXPIRED':
      return `<span class="badge badge-expired"><span class="badge-dot"></span> Expired</span>`;
    default:
      return `<span class="badge badge-safe">${s}</span>`;
  }
}

export function formatRoleBadge(role) {
  const r = (role || 'guest').toUpperCase();
  let color = 'badge-role';
  if (r === 'ADMIN') color = 'badge-safe';
  if (r === 'CHEF') color = 'badge-expiring';
  if (r === 'DELIVERY') color = 'badge-available';
  return `<span class="badge ${color}">${r}</span>`;
}

export function formatCurrency(amount) {
  const n = parseFloat(amount) || 0;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Injects standard App Navigation Shell
export function renderAppShell(activeTarget = 'dashboard') {
  const user = getCurrentUser() || { name: 'Demo User', role: 'admin', email: 'admin@example.com' };
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KI';

  // Inject Header if container exists
  const headerEl = document.querySelector('.header');
  if (headerEl) {
    headerEl.innerHTML = `
      <a href="${user.role === 'chef' ? 'chef.html' : user.role === 'delivery' ? 'delivery.html' : 'dashboard.html'}" class="brand">
        <div class="logo">KI</div>
        <div>
          <h1>Kitchen Inventory</h1>
          <div class="small muted">Smart Management & Pantry Operations</div>
        </div>
      </a>

      <div class="controls">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input class="input" id="global-search" placeholder="Search inventory, batch, supplier..." autocomplete="off">
        </div>

        <div class="header-actions">
          <div style="position:relative">
            <button class="icon-btn" id="btn-header-notif" title="Notifications">
              🔔
              <span class="notif-badge" id="header-notif-count" style="display:none">0</span>
            </button>
            <div class="notif-dropdown" id="header-notif-dropdown">
              <div class="notif-header">
                <span class="bold small">Recent Notifications</span>
                <a href="notifications.html" class="small muted" style="text-decoration:none">View All</a>
              </div>
              <div id="header-notif-list" style="max-height:260px;overflow-y:auto">
                <div class="small muted text-center" style="padding:12px">Loading alerts...</div>
              </div>
            </div>
          </div>

          <a href="profile.html" class="profile-row" title="My Profile">
            <div class="avatar" id="header-avatar">${initials}</div>
            <div style="text-align:left">
              <div style="font-weight:600;font-size:13px;color:var(--text-main)" id="header-user">${user.name || 'User'}</div>
              <div class="small muted" style="font-size:11px" id="header-role">${(user.role || 'Admin').toUpperCase()}</div>
            </div>
          </a>
        </div>
      </div>
    `;

    // Wire global search input
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim();
          if (q) {
            window.location = `inventory.html?search=${encodeURIComponent(q)}`;
          }
        }
      });
    }

    // Wire notifications popup
    const notifBtn = document.getElementById('btn-header-notif');
    const notifDropdown = document.getElementById('header-notif-dropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('show');
        if (notifDropdown.classList.contains('show')) {
          loadHeaderNotifications();
        }
      });
      document.addEventListener('click', () => notifDropdown.classList.remove('show'));
    }
  }

  // Inject Sidebar Navigation
  const asideEl = document.querySelector('aside');
  if (asideEl) {
    let navLinks = '';
    const role = user.role || 'admin';

    if (role === 'admin') {
      navLinks = `
        <div class="nav-section-title">Overview</div>
        <a class="nav-item ${activeTarget === 'dashboard' ? 'active' : ''}" href="dashboard.html"><span class="nav-icon">🏠</span> Dashboard</a>
        <a class="nav-item ${activeTarget === 'inventory' ? 'active' : ''}" href="inventory.html"><span class="nav-icon">📦</span> Inventory</a>
        <a class="nav-item ${activeTarget === 'forecast' ? 'active' : ''}" href="forecast.html"><span class="nav-icon">📈</span> Forecast & AI</a>
        <a class="nav-item ${activeTarget === 'usage' ? 'active' : ''}" href="usage.html"><span class="nav-icon">📝</span> Usage Logs</a>

        <div class="nav-section-title">Management</div>
        <a class="nav-item ${activeTarget === 'suppliers' ? 'active' : ''}" href="suppliers.html"><span class="nav-icon">🏭</span> Suppliers</a>
        <a class="nav-item ${activeTarget === 'users' ? 'active' : ''}" href="users.html"><span class="nav-icon">👥</span> Users</a>
        <a class="nav-item ${activeTarget === 'history' ? 'active' : ''}" href="history.html"><span class="nav-icon">📜</span> Audit History</a>
        <a class="nav-item ${activeTarget === 'reports' ? 'active' : ''}" href="reports.html"><span class="nav-icon">📊</span> Reports</a>
        <a class="nav-item ${activeTarget === 'notifications' ? 'active' : ''}" href="notifications.html"><span class="nav-icon">🔔</span> Notifications</a>

        <div class="nav-section-title">Account</div>
        <a class="nav-item ${activeTarget === 'profile' ? 'active' : ''}" href="profile.html"><span class="nav-icon">👤</span> Profile</a>
        <a class="nav-item ${activeTarget === 'settings' ? 'active' : ''}" href="settings.html"><span class="nav-icon">⚙️</span> Settings</a>
      `;
    } else if (role === 'chef') {
      navLinks = `
        <div class="nav-section-title">Chef Station</div>
        <a class="nav-item ${activeTarget === 'chef' ? 'active' : ''}" href="chef.html"><span class="nav-icon">👨‍🍳</span> Chef Dashboard</a>
        <a class="nav-item ${activeTarget === 'inventory' ? 'active' : ''}" href="inventory.html"><span class="nav-icon">📦</span> Kitchen Stock</a>
        <a class="nav-item ${activeTarget === 'usage' ? 'active' : ''}" href="usage.html"><span class="nav-icon">📝</span> Prep Logs</a>
        <a class="nav-item ${activeTarget === 'notifications' ? 'active' : ''}" href="notifications.html"><span class="nav-icon">🔔</span> Expiry Alerts</a>

        <div class="nav-section-title">Account</div>
        <a class="nav-item ${activeTarget === 'profile' ? 'active' : ''}" href="profile.html"><span class="nav-icon">👤</span> Profile</a>
        <a class="nav-item ${activeTarget === 'settings' ? 'active' : ''}" href="settings.html"><span class="nav-icon">⚙️</span> Settings</a>
      `;
    } else if (role === 'delivery') {
      navLinks = `
        <div class="nav-section-title">Logistics & Intake</div>
        <a class="nav-item ${activeTarget === 'delivery' ? 'active' : ''}" href="delivery.html"><span class="nav-icon">🚚</span> Delivery Dashboard</a>
        <a class="nav-item ${activeTarget === 'inventory' ? 'active' : ''}" href="inventory.html"><span class="nav-icon">📦</span> Stock Intake</a>
        <a class="nav-item ${activeTarget === 'suppliers' ? 'active' : ''}" href="suppliers.html"><span class="nav-icon">🏭</span> Suppliers</a>
        <a class="nav-item ${activeTarget === 'notifications' ? 'active' : ''}" href="notifications.html"><span class="nav-icon">🔔</span> Alerts</a>

        <div class="nav-section-title">Account</div>
        <a class="nav-item ${activeTarget === 'profile' ? 'active' : ''}" href="profile.html"><span class="nav-icon">👤</span> Profile</a>
        <a class="nav-item ${activeTarget === 'settings' ? 'active' : ''}" href="settings.html"><span class="nav-icon">⚙️</span> Settings</a>
      `;
    }

    asideEl.innerHTML = `
      <nav>${navLinks}</nav>
      <hr style="margin:14px 0;border:none;border-top:1px solid var(--border-subtle)"/>
      <div style="padding:0 8px">
        <button id="btn-sidebar-logout" class="btn-ghost btn-sm" style="width:100%">🚪 Logout</button>
      </div>
    `;

    document.getElementById('btn-sidebar-logout')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out?')) {
        logout();
      }
    });
  }

  // Load initial notification count badge
  refreshNotificationBadge();
}

async function refreshNotificationBadge() {
  try {
    const res = await apiGetNotifications();
    const badge = document.getElementById('header-notif-count');
    if (badge && res.success) {
      if (res.unreadCount > 0) {
        badge.textContent = res.unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {
    // offline or not logged in
  }
}

async function loadHeaderNotifications() {
  const container = document.getElementById('header-notif-list');
  if (!container) return;
  try {
    const res = await apiGetNotifications();
    if (!res.success || (res.notifications || []).length === 0) {
      container.innerHTML = '<div class="small muted text-center" style="padding:12px">No notifications</div>';
      return;
    }
    const html = res.notifications.slice(0, 5).map(n => {
      let icon = '🔔';
      if (n.type === 'EXPIRED') icon = '🔴';
      else if (n.type === 'EXPIRING_SOON') icon = '🟠';
      else if (n.type === 'LOW_STOCK') icon = '🟡';
      else if (n.type === 'RESTOCKED') icon = '🟢';
      else if (n.type === 'STOCK_USED') icon = '🔵';

      return `
        <div class="notif-item ${!n.read ? 'unread' : ''}">
          <span class="notif-icon">${icon}</span>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${formatDate(n.timestamp)}</div>
          </div>
        </div>
      `;
    }).join('');
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<div class="small muted text-center" style="padding:12px">Failed to load alerts</div>';
  }
}

// ==========================================
// QR & Barcode Modal Helper
// ==========================================

export function showItemQRModal(item) {
  let modal = document.getElementById('qr-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-card" style="max-width:440px;text-align:center">
        <div class="modal-header">
          <h3 class="modal-title">Item Tag & QR Code</h3>
          <button class="btn-close" id="btn-close-qr">&times;</button>
        </div>
        <div class="qr-box">
          <div style="font-weight:700;font-size:18px" id="qr-item-name">Item Name</div>
          <div class="small muted" id="qr-item-batch">Batch: -</div>
          <canvas id="qr-canvas-element" width="160" height="160" style="border:1px solid #e2e8f0;border-radius:10px;padding:8px;background:#fff"></canvas>
          <div class="small bold" id="qr-item-code">ITEM-CODE</div>
          <div style="font-size:12px;color:var(--muted)" id="qr-item-details">Qty: 0 | Loc: -</div>
        </div>
        <div class="actions-row" style="justify-content:center;gap:8px">
          <button id="btn-print-qr" class="btn btn-sm">🖨️ Print Tag</button>
          <button id="btn-done-qr" class="btn-ghost btn-sm">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-qr').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('btn-done-qr').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('btn-print-qr').addEventListener('click', () => window.print());
  }

  document.getElementById('qr-item-name').textContent = item.name;
  document.getElementById('qr-item-batch').textContent = `Batch: ${item.batchNo || 'N/A'}`;
  document.getElementById('qr-item-code').textContent = `SKU: ${item.id.toUpperCase()}`;
  document.getElementById('qr-item-details').textContent = `Qty: ${item.qty} ${item.unit} | Location: ${item.location || 'Dry Storage'} | Expiry: ${item.expiry || 'N/A'}`;

  // Draw clean simulated QR grid onto canvas
  const canvas = document.getElementById('qr-canvas-element');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#0f172a';

    // Generate pseudo-random matrix deterministically from item ID
    const seed = item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const cellSize = 8;
    const count = 20;

    // Corner alignment squares
    function drawSquare(x, y, size) {
      ctx.fillRect(x, y, size, size);
      ctx.clearRect(x + 8, y + 8, size - 16, size - 16);
      ctx.fillRect(x + 16, y + 16, size - 32, size - 32);
    }
    drawSquare(8, 8, 40);
    drawSquare(112, 8, 40);
    drawSquare(8, 112, 40);

    // Fill data dots
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        // Skip corner square regions
        if ((r < 7 && c < 7) || (r < 7 && c > 12) || (r > 12 && c < 7)) continue;
        if (((r * 31 + c * 17 + seed) % 5) < 2) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }
  }

  modal.classList.remove('hidden');
}

// ==========================================
// CSV Export Utility
// ==========================================

export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    showToast('No data available to export', 'warning');
    return;
  }
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map(row => keys.map(k => {
      let val = row[k] === undefined || row[k] === null ? '' : String(row[k]);
      val = val.replace(/"/g, '""');
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        val = `"${val}"`;
      }
      return val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Export downloaded successfully', 'success');
}

export function activateNav() {
  const curPage = document.body.dataset.page;
  renderAppShell(curPage);
}

// Default export
export default {
  state,
  getToken,
  setAuth,
  getCurrentUser,
  requireAuth,
  logout,
  apiLogin,
  apiForgotPassword,
  apiGetInventory,
  apiGetItem,
  apiAddInventory,
  apiUpdateInventory,
  apiDeleteInventory,
  apiStockOperation,
  apiGetSuppliers,
  apiAddSupplier,
  apiUpdateSupplier,
  apiDeleteSupplier,
  apiGetUsers,
  apiAddUser,
  apiUpdateUser,
  apiDeleteUser,
  apiGetDeliveries,
  apiAddDelivery,
  apiUpdateDelivery,
  apiGetTransactions,
  apiGetNotifications,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  apiClearNotifications,
  apiGetAnalyticsOverview,
  apiGetRecommendations,
  apiGetReport,
  apiUpdateProfile,
  apiChangePassword,
  showToast,
  formatStatusBadge,
  formatRoleBadge,
  formatCurrency,
  formatDate,
  renderAppShell,
  showItemQRModal,
  exportToCSV,
  activateNav
};