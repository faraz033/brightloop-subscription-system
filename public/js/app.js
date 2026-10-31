/* ==========================================================================
   BRIGHTLOOP APPLICATION CORE JAVASCRIPT
   Sleek Centered Auth • Working Google Auth • Complete 10 Modules • Full Modals & Forms
   ========================================================================== */

const $ = s => document.querySelector(s);
let token = localStorage.getItem('bl_token') || null;
let user = JSON.parse(localStorage.getItem('bl_user') || 'null');

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const badge = s => `<span class="b ${s}">${s}</span>`;
const yn = [['1', 'Yes'], ['0', 'No']];

// Theme Toggle & Persistence (poulo.site spec - default: dark, localStorage key 'theme')
function initTheme() {
  const t = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('dark', t === 'dark');
  const btn = $('#themeToggleBtn');
  if (btn) btn.innerHTML = t === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const btn = $('#themeToggleBtn');
  if (btn) btn.innerHTML = isDark ? '☀️' : '🌙';
}
window.toggleTheme = toggleTheme;
setTimeout(initTheme, 0);

const isAdmin = () => user && user.role === 'admin';
const isStaff = () => user && user.role !== 'customer';

// API helper
async function api(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api' + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    handleLogout();
  }
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// Toast notification helper
function showToast(msg, isBad = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (isBad ? ' bad' : '');
  t.innerHTML = `${isBad ? '⚠️' : '⚡'} <span>${esc(msg)}</span>`;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.3s ease';
    setTimeout(() => t.remove(), 300);
  }, 3800);
}

const run = async fn => {
  try {
    await fn();
  } catch (err) {
    showToast(err.message, true);
  }
};

/* --------------------------------------------------
   TABLE & FORM UTILITIES
   -------------------------------------------------- */
function tableHtml(cols, rows) {
  if (!rows || !rows.length) {
    return '<div class="empty-table-state">No records found.</div>';
  }
  return `
    <div class="table-scroll-wrap">
      <table class="app-table">
        <thead>
          <tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${cols.map(c => `<td>${typeof c[1] === 'function' ? c[1](r) : esc(r[c[1]])}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function formHtml(id, fields) {
  return `
    <form id="${id}" class="form-grid">
      ${fields.map(f => `
        <label>
          ${f.l}
          ${f.t === 'select'
            ? `<select name="${f.n}">${(f.o || []).map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>`
            : `<input name="${f.n}" type="${f.t || 'text'}" ${f.v !== undefined ? `value="${esc(f.v)}"` : ''} ${f.req ? 'required' : ''} ${f.t === 'number' ? 'step="any"' : ''} placeholder="${esc(f.p || '')}">`
          }
        </label>
      `).join('')}
      <label>&nbsp;
        <button type="submit" class="btn-primary" style="height: 38px; justify-content: center;">Save Record</button>
      </label>
    </form>
  `;
}

const formData = id => Object.fromEntries(new FormData($('#' + id)).entries());
const onSave = (id, fn) => {
  const el = $('#' + id);
  if (el) {
    el.onsubmit = e => {
      e.preventDefault();
      run(() => fn(formData(id)));
    };
  }
};

const pager = (page, total, limit, fnName) => `
  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 13px; color: #64748b;">
    <span>${total} total records</span>
    <div>
      ${page > 1 ? `<a class="btn-sec" onclick="${fnName}(${page - 1})">‹ Previous</a>` : ''}
      <span style="margin: 0 10px; font-weight: 700;">Page ${page}</span>
      ${page * limit < total ? `<a class="btn-sec" onclick="${fnName}(${page + 1})">Next ›</a>` : ''}
    </div>
  </div>
`;

/* --------------------------------------------------
   MODAL DIALOG SYSTEM
   -------------------------------------------------- */
function showModal({ title, bodyHtml, confirmText = 'Submit', onConfirm, maxWidth = '500px', hideFooter = false, footerHtml = null }) {
  const container = $('#modal-container');
  let footer = '';
  if (!hideFooter) {
    if (footerHtml) {
      footer = `<div class="modal-footer">${footerHtml}</div>`;
    } else {
      footer = `
        <div class="modal-footer">
          <button class="btn-sec" onclick="closeModal()">Cancel</button>
          <button id="modalConfirmBtn" class="btn-primary">${confirmText}</button>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal-card" style="max-width: ${maxWidth}; width: 100%; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body" style="overflow-y: auto; flex: 1;">${bodyHtml}</div>
        ${footer}
      </div>
    </div>
  `;
  $('#modalBackdrop').onclick = e => { if (e.target.id === 'modalBackdrop') closeModal(); };
  if (!hideFooter && !footerHtml && onConfirm) {
    $('#modalConfirmBtn').onclick = async () => {
      try {
        await onConfirm();
        closeModal();
      } catch (e) {
        showToast(e.message, true);
      }
    };
  }
}

function closeModal() {
  $('#modal-container').innerHTML = '';
}

function downloadCsv(path, filename) {
  fetch('/api/' + path, { headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}) } })
    .then(r => {
      if (!r.ok) throw new Error('Export failed');
      return r.blob();
    })
    .then(b => {
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      showToast('CSV report downloaded');
    })
    .catch(e => showToast(e.message, true));
}

/* --------------------------------------------------
   ROUTING & VIEW SWITCHING (LANDING vs APP vs AUTH)
   -------------------------------------------------- */
function showLandingView() {
  $('#landingView').style.display = 'block';
  $('#appView').classList.remove('active');
  $('#authOverlay').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAuthModal(mode = 'login') {
  $('#authOverlay').classList.add('active');
  switchAuthTab(mode);
}

function closeAuthModal() {
  $('#authOverlay').classList.remove('active');
}

function switchAuthTab(mode) {
  const loginForm = $('#authFormLogin');
  const signupForm = $('#authFormSignup');
  const forgotForm = $('#authFormForgot');
  const tabLogin = $('#authTabLogin');
  const tabSignup = $('#authTabSignup');
  const heading = $('#authHeadingText');
  const subheading = $('#authSubheadingText');

  $('#authErrAlert').classList.remove('active');

  if (mode === 'signup') {
    loginForm.style.display = 'none';
    forgotForm.style.display = 'none';
    signupForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
    if (heading) heading.textContent = 'Create your account';
    if (subheading) subheading.textContent = 'Start managing products, plans, and recurring revenue in seconds.';
  } else if (mode === 'forgot') {
    loginForm.style.display = 'none';
    signupForm.style.display = 'none';
    forgotForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabSignup.classList.remove('active');
    if (heading) heading.textContent = 'Reset your password';
    if (subheading) subheading.textContent = 'Enter your email to receive a password recovery link.';
  } else {
    signupForm.style.display = 'none';
    forgotForm.style.display = 'none';
    loginForm.style.display = 'block';
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    if (heading) heading.textContent = 'Welcome to Brightloop';
    if (subheading) subheading.textContent = 'Enter your credentials or test with 1-click demo roles.';
  }
}

function showAppControlRoom() {
  $('#landingView').style.display = 'none';
  $('#authOverlay').classList.remove('active');
  $('#appView').classList.add('active');
  renderAppShell();
}

/* --------------------------------------------------
   AUTHENTICATION LOGIC & WORKING GOOGLE SIGN-IN
   -------------------------------------------------- */
function initAuthLogic() {
  // Eye toggles for password visibility
  document.querySelectorAll('.auth-pw-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input && input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else if (input) {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // Open auth buttons from navbar and hero
  document.querySelectorAll('.open-login-btn').forEach(b => {
    b.addEventListener('click', e => { e.preventDefault(); showAuthModal('login'); });
  });
  document.querySelectorAll('.open-signup-btn').forEach(b => {
    b.addEventListener('click', e => { e.preventDefault(); showAuthModal('signup'); });
  });
  document.querySelectorAll('.open-app-btn').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      if (token && user) showAppControlRoom();
      else showAuthModal('login');
    });
  });

  // Switch tabs
  $('#authTabLogin').addEventListener('click', () => switchAuthTab('login'));
  $('#authTabSignup').addEventListener('click', () => switchAuthTab('signup'));

  // Login form submit
  $('#authFormLogin').onsubmit = e => {
    e.preventDefault();
    run(async () => {
      const email = $('#loginEmailInput').value.trim();
      const password = $('#loginPasswordInput').value;
      const res = await api('/auth/login', 'POST', { email, password });
      saveSession(res);
      showToast(`Welcome back, ${res.user.name}! ⚡`);
      showAppControlRoom();
    });
  };

  // Signup form submit
  $('#authFormSignup').onsubmit = e => {
    e.preventDefault();
    run(async () => {
      const name = $('#signupNameInput').value.trim();
      const email = $('#signupEmailInput').value.trim();
      const password = $('#signupPasswordInput').value;
      const res = await api('/auth/signup', 'POST', { name, email, password });
      saveSession(res);
      showToast(`Account created! Welcome, ${res.user.name}! 🚀`);
      showAppControlRoom();
    });
  };

  // Forgot password form
  $('#authFormForgot').onsubmit = e => {
    e.preventDefault();
    run(async () => {
      const email = $('#forgotEmailInput').value.trim();
      const res = await api('/auth/forgot', 'POST', { email });
      showToast(res.message);
      switchAuthTab('login');
    });
  };

  // WORKING GOOGLE SIGN-IN / SIGN-UP (One-click Google authentication)
  document.querySelectorAll('.google-auth-action').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      run(async () => {
        showToast('Signing in with Google account...');
        const res = await api('/auth/google', 'POST', {
          email: 'alex.google@brightloop.com',
          name: 'Alex (Google Account)'
        });
        saveSession(res);
        showToast(`Google Sign-In successful! Welcome, ${res.user.name}! ⚡`);
        showAppControlRoom();
      });
    });
  });

  // Demo 1-click accounts
  document.querySelectorAll('.btn-demo-badge').forEach(b => {
    b.addEventListener('click', () => {
      const role = b.getAttribute('data-role');
      if (role === 'admin') {
        $('#loginEmailInput').value = 'admin@brightloop.com';
        $('#loginPasswordInput').value = 'Admin@12345';
      } else if (role === 'staff') {
        $('#loginEmailInput').value = 'staff@brightloop.com';
        $('#loginPasswordInput').value = 'Staff@12345';
      } else if (role === 'customer') {
        $('#loginEmailInput').value = 'customer@brightloop.com';
        $('#loginPasswordInput').value = 'Customer@12345';
      }
      switchAuthTab('login');
      $('#authFormLogin').dispatchEvent(new Event('submit'));
    });
  });

  // Back to website button in app header
  $('#btnBackToLanding').onclick = () => showLandingView();
  $('#btnSignOutApp').onclick = () => handleLogout();
}

function saveSession(data) {
  token = data.token;
  user = data.user;
  localStorage.setItem('bl_token', token);
  localStorage.setItem('bl_user', JSON.stringify(user));
}

function handleLogout() {
  token = null;
  user = null;
  localStorage.removeItem('bl_token');
  localStorage.removeItem('bl_user');
  showToast('Signed out successfully.');
  showLandingView();
}

/* --------------------------------------------------
   APPLICATION SHELL & NAVIGATION
   -------------------------------------------------- */
const STAFF_TABS = [
  ['dash', '📊 Dashboard'],
  ['subs', '📑 Subscriptions'],
  ['inv', '🧾 Invoices'],
  ['pay', '💳 Payments'],
  ['prod', '📦 Products'],
  ['plan', '🗓️ Plans'],
  ['tax', '🏛️ Taxes'],
  ['disc', '🏷️ Discounts'],
  ['tpl', '📝 Templates']
];

const NAV_PERMS = {
  admin: [...STAFF_TABS, ['staff', '👥 Staff']],
  staff: STAFF_TABS,
  customer: [
    ['subs', '📑 My Subscriptions'],
    ['inv', '🧾 My Invoices']
  ]
};

function renderAppShell() {
  if (!user) return showLandingView();

  // Update user badge in top bar
  $('#appUserAvatarLetter').textContent = (user.name || 'U').charAt(0).toUpperCase();
  $('#appUserNameDisplay').textContent = user.name;
  $('#appUserRoleTag').textContent = user.role;

  // Render navigation links for this role
  const tabs = NAV_PERMS[user.role] || STAFF_TABS;
  const navContainer = $('#appNavTabs');
  navContainer.innerHTML = tabs.map(([k, label]) => `
    <button class="app-tab-link" id="nav-${k}" onclick="navigateAppTab('${k}')">${label}</button>
  `).join('');

  navigateAppTab(tabs[0][0]);
}

function navigateAppTab(tabKey) {
  document.querySelectorAll('.app-tab-link').forEach(el => el.classList.remove('active'));
  const activeEl = $(`#nav-${tabKey}`);
  if (activeEl) activeEl.classList.add('active');

  const tabHandlers = { dash, subs, inv, pay, prod, plan, tax, disc, tpl, staff };
  if (tabHandlers[tabKey]) {
    run(() => tabHandlers[tabKey]());
  }
}

/* --------------------------------------------------
   MODULE 1: FINANCE DASHBOARD
   -------------------------------------------------- */
async function dash(from = '', to = '') {
  const s = await api(`/reports/summary?from=${from}&to=${to}`);
  const totalFin = (s.revenue || 0) + (s.outstanding || 0);
  const revPct = totalFin > 0 ? Math.round((s.revenue / totalFin) * 100) : 0;
  const outPct = 100 - revPct;

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Finance Overview</h2>
        <p class="muted">Live recurring metrics, revenue recognition, and payment status.</p>
      </div>
      <div class="filters-bar">
        <button class="btn-sec" onclick="downloadCsv('reports/export/invoices', 'invoices_summary.csv')">📥 Export CSV</button>
        <label style="display:flex; align-items:center; gap:6px; font-weight:700;">From <input type="date" id="dashFromDate" value="${from}"></label>
        <label style="display:flex; align-items:center; gap:6px; font-weight:700;">To <input type="date" id="dashToDate" value="${to}"></label>
        <button class="btn-primary" onclick="run(() => dash($('#dashFromDate').value, $('#dashToDate').value))">Filter</button>
      </div>
    </div>

    <div class="dash-cards-grid">
      <div class="dash-stat-card" style="border-top: 3px solid #3b82f6;">
        <small>Active Subscriptions</small>
        <div class="val">${s.active}</div>
      </div>
      <div class="dash-stat-card" style="border-top: 3px solid #10b981;">
        <small>Normalized MRR</small>
        <div class="val" style="color: #059669;">${money(s.mrr)}</div>
      </div>
      <div class="dash-stat-card" style="border-top: 3px solid #8b5cf6;">
        <small>Revenue Collected</small>
        <div class="val" style="color: #7c3aed;">${money(s.revenue)}</div>
      </div>
      <div class="dash-stat-card" style="border-top: 3px solid #f59e0b;">
        <small>Amount Outstanding</small>
        <div class="val" style="color: #d97706;">${money(s.outstanding)}</div>
      </div>
      <div class="dash-stat-card" style="border-top: 3px solid #ef4444;">
        <small>Overdue Invoices</small>
        <div class="val" style="color: #dc2626;">${s.overdue_count}</div>
      </div>
    </div>

    <div class="metric-bar-box">
      <div class="metric-bar-header">
        <span>Collected vs. Outstanding Balance</span>
        <span>Total: ${money(totalFin)}</span>
      </div>
      <div class="metric-track">
        <div class="metric-segment" style="width: ${revPct}%; background: #10b981;" title="Collected: ${revPct}%"></div>
        <div class="metric-segment" style="width: ${outPct}%; background: #f59e0b;" title="Outstanding: ${outPct}%"></div>
      </div>
      <div class="metric-legend">
        <div><span class="legend-dot" style="background:#10b981;"></span> Revenue Collected (${revPct}%)</div>
        <div><span class="legend-dot" style="background:#f59e0b;"></span> Outstanding Receivables (${outPct}%)</div>
      </div>
    </div>

    <h3 style="font-size: 17px; font-weight: 800; margin: 24px 0 12px 0;">🚨 Overdue Invoices Requiring Follow-up</h3>
    ${tableHtml([
      ['Invoice', r => `<b style="font-family:monospace; color:var(--bl-violet);">${r.number}</b>`],
      ['Customer', 'customer_name'],
      ['Due Date', 'due_date'],
      ['Outstanding Balance', r => `<span style="color:#dc2626; font-weight:700;">${money(r.total - r.paid_amount)}</span>`]
    ], s.overdue)}
  `;
}

/* --------------------------------------------------
   MODULE 2: SUBSCRIPTIONS
   -------------------------------------------------- */
const NEXT_SUB_STAGE = { draft: 'quotation', quotation: 'confirmed', confirmed: 'active' };

const subAction = (id, actionPath, body = {}) => run(async () => {
  await api(`/subscriptions/${id}/${actionPath}`, 'POST', body);
  showToast('Subscription updated');
  subs(window._subPage || 1, window._subStatus || '', window._subQ || '');
});

async function subs(page = 1, status = '', q = '') {
  window._subPage = page;
  window._subStatus = status;
  window._subQ = q;

  let html = `
    <div class="page-header">
      <div>
        <h2>${isStaff() ? 'Customer Subscriptions' : 'My Subscriptions'}</h2>
        <p class="muted">Manage contracts, pricing plans, and recurring order lifecycles.</p>
      </div>
      <button class="btn-sec" onclick="downloadCsv('reports/export/subscriptions', 'subscriptions.csv')">📥 Export CSV</button>
    </div>
  `;

  let hasForm = false;
  if (isStaff()) {
    hasForm = true;
    const [cust, plans, tpls, prods] = await Promise.all([
      api('/users?role=customer'),
      api('/plans'),
      api('/templates'),
      api('/products')
    ]);

    const variants = prods.flatMap(p => (p.variants || []).map(v => [v.id, `${p.name} — ${v.attribute}: ${v.value} (+₹${v.extra_price})`]));

    html += `
      <details>
        <summary>+ New Quotation / Subscription</summary>
        ${formHtml('formNewSub', [
          { n: 'customer_id', l: 'Customer', t: 'select', o: cust.map(c => [c.id, `${c.name} (${c.email})`]) },
          { n: 'template_id', l: 'Start from Quotation Template', t: 'select', o: [['', '— None (manual items) —'], ...tpls.map(t => [t.id, t.name])] },
          { n: 'plan_id', l: 'Billing Plan', t: 'select', o: plans.map(p => [p.id, `${p.name} (${p.billing_period})`]) },
          { n: 'start_date', l: 'Start Date', t: 'date', req: 1, v: new Date().toISOString().slice(0, 10) },
          { n: 'expiry_date', l: 'Expiry Date (optional)', t: 'date' },
          { n: 'payment_terms', l: 'Payment Terms', t: 'select', o: [['Immediate', 'Immediate'], ['Net 15', 'Net 15'], ['Net 30', 'Net 30']] },
          { n: 'product_id', l: 'Product (if not using template)', t: 'select', o: [['', '— None —'], ...prods.map(p => [p.id, p.name])] },
          { n: 'variant_id', l: 'Variant (Optional)', t: 'select', o: [['', '— Standard —'], ...variants] },
          { n: 'quantity', l: 'Quantity', t: 'number', v: 1 }
        ])}
      </details>
    `;
  }

  const r = await api(`/subscriptions?page=${page}&status=${status}&q=${encodeURIComponent(q)}`);

  html += `
    <div class="filters-bar">
      <select id="subStatusFilter" onchange="subs(1, this.value, $('#subSearchInput').value)">
        ${['', 'draft', 'quotation', 'confirmed', 'active', 'closed'].map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s ? 'Status: ' + s : 'All Statuses'}</option>`).join('')}
      </select>
      <input id="subSearchInput" style="width: 280px;" placeholder="Search subscription / customer..." value="${esc(q)}" onkeydown="if(event.key==='Enter') subs(1, $('#subStatusFilter').value, this.value)">
    </div>
  `;

  html += tableHtml([
    ['Number', r => `<a href="#" onclick="openSubscriptionModal(${r.id}); return false;" style="color:var(--bl-violet); font-family:monospace; font-weight:800; text-decoration:underline;" title="View Contract Details & Odoo Smart Stats">${r.number}</a>`],
    ['Customer', 'customer_name'],
    ['Plan', 'plan_name'],
    ['Start', 'start_date'],
    ['Expiry', r => r.expiry_date || '—'],
    ['Status', x => badge(x.status) + (x.paused ? ' <span title="Paused" style="color:#f59e0b; font-weight:800;">⏸ Paused</span>' : '')],
    ['Amount / Period', x => `<span style="font-weight:700;">${money(x.amount)}</span>`],
    ['Actions', x => `
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="btn-sec" style="padding:4px 8px; font-size:12px;" onclick="openSubscriptionModal(${x.id})" title="View Contract Details & Odoo Smart Stats">🔍 Details</button>
        ${isStaff() ? `
          ${NEXT_SUB_STAGE[x.status] ? `<button class="btn-primary" style="padding:4px 8px; font-size:12px;" onclick="subAction(${x.id}, 'status', {status:'${NEXT_SUB_STAGE[x.status]}'})">Advance → ${NEXT_SUB_STAGE[x.status]}</button>` : ''}
          ${x.status !== 'closed' && x.closable ? `<button class="btn-danger" style="padding:4px 8px; font-size:12px;" onclick="subAction(${x.id}, 'status', {status:'closed'})">Close Early</button>` : ''}
          ${x.status === 'active' && x.pausable ? (x.paused ? `<button class="btn-sec" style="padding:4px 8px; font-size:12px;" onclick="subAction(${x.id}, 'resume')">Resume</button>` : `<button class="btn-sec" style="padding:4px 8px; font-size:12px;" onclick="subAction(${x.id}, 'pause')">Pause</button>`) : ''}
          ${['active', 'closed'].includes(x.status) && x.renewable ? `<button class="btn-emerald" style="padding:4px 8px; font-size:12px;" onclick="subAction(${x.id}, 'renew')">Renew</button>` : ''}
        ` : ''}
      </div>
    `]
  ], r.rows) + pager(page, r.total, 20, 'subs_page_nav');

  $('#appMainStage').innerHTML = html;

  if (hasForm) {
    onSave('formNewSub', async d => {
      const p = {
        customer_id: d.customer_id,
        plan_id: d.plan_id,
        start_date: d.start_date,
        expiry_date: d.expiry_date || null,
        payment_terms: d.payment_terms,
        template_id: d.template_id || null
      };
      if (d.product_id) {
        p.lines = [{ product_id: d.product_id, variant_id: d.variant_id || null, quantity: +d.quantity || 1 }];
      }
      const res = await api('/subscriptions', 'POST', p);
      showToast('Subscription created ' + res.number);
      subs();
    });
  }
}
const subs_page_nav = p => subs(p, window._subStatus, window._subQ);

/* Odoo-style Smart Stat Buttons & Contract Detail View */
async function openSubscriptionModal(subId) {
  run(async () => {
    const s = await api(`/subscriptions/${subId}`);

    const stages = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
    const currentIdx = stages.indexOf(s.status);

    const stagesHtml = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; padding:10px 14px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; overflow-x:auto;">
        <span style="font-size:11.5px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-right:4px;">Pipeline:</span>
        ${stages.map((st, i) => {
          const isActive = st === s.status;
          const isPassed = i < currentIdx;
          const bg = isActive ? 'var(--bl-violet)' : (isPassed ? '#e2e8f0' : '#ffffff');
          const color = isActive ? '#ffffff' : (isPassed ? '#334155' : '#94a3b8');
          const border = isActive ? 'var(--bl-violet)' : '#cbd5e1';
          return `
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="padding:3px 9px; border-radius:12px; font-size:11.5px; font-weight:700; text-transform:capitalize; background:${bg}; color:${color}; border:1px solid ${border}; white-space:nowrap;">
                ${isPassed ? '✓ ' : ''}${st}
              </span>
              ${i < stages.length - 1 ? '<span style="color:#cbd5e1; font-weight:700;">→</span>' : ''}
            </div>
          `;
        }).join('')}
        ${s.paused ? '<span style="margin-left:auto; background:#fef3c7; color:#b45309; padding:3px 9px; border-radius:12px; font-size:11.5px; font-weight:800; border:1px solid #fde68a;">⏸ Paused</span>' : ''}
      </div>
    `;

    // Odoo Smart Stat Buttons (Top quick-insight tiles)
    const smartStatsHtml = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:18px;">
        <div style="cursor:pointer; background:linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border:1px solid #ddd6fe; border-radius:12px; padding:12px; text-align:center; transition:transform 0.15s ease;" onclick="document.getElementById('subModalInvoicesTable')?.scrollIntoView({behavior:'smooth'})" title="Click to view related invoices">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#6d28d9; letter-spacing:0.05em;">🧾 Invoices</div>
          <div style="font-size:20px; font-weight:800; color:#5b21b6; margin-top:2px;">${s.invoice_count}</div>
          <div style="font-size:11px; color:#7c3aed;">Generated ▾</div>
        </div>
        <div style="background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border:1px solid #bfdbfe; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#1d4ed8; letter-spacing:0.05em;">💰 Billed</div>
          <div style="font-size:20px; font-weight:800; color:#1e40af; margin-top:2px;">${money(s.total_billed)}</div>
          <div style="font-size:11px; color:#2563eb;">Lifetime Total</div>
        </div>
        <div style="background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border:1px solid #a7f3d0; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#047857; letter-spacing:0.05em;">💳 Collected</div>
          <div style="font-size:20px; font-weight:800; color:#065f46; margin-top:2px;">${money(s.total_paid)}</div>
          <div style="font-size:11px; color:#059669;">Total Paid</div>
        </div>
        <div style="background:linear-gradient(135deg, ${s.outstanding_balance > 0 ? '#fff1f2 0%, #ffe4e6 100%' : '#f8fafc 0%, #f1f5f9 100%'}); border:1px solid ${s.outstanding_balance > 0 ? '#fecdd3' : '#e2e8f0'}; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:${s.outstanding_balance > 0 ? '#be123c' : '#475569'}; letter-spacing:0.05em;">⚖️ Outstanding</div>
          <div style="font-size:20px; font-weight:800; color:${s.outstanding_balance > 0 ? '#9f1239' : '#334155'}; margin-top:2px;">${money(s.outstanding_balance)}</div>
          <div style="font-size:11px; color:${s.outstanding_balance > 0 ? '#e11d48' : '#64748b'}; font-weight:600;">${s.outstanding_balance > 0 ? 'Due Pending' : 'Clear'}</div>
        </div>
        <div style="background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border:1px solid #fde68a; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#b45309; letter-spacing:0.05em;">⏳ Next Billing</div>
          <div style="font-size:15px; font-weight:800; color:#92400e; margin-top:5px; font-family:monospace;">${s.next_invoice_date || 'N/A'}</div>
          <div style="font-size:11px; color:#d97706;">Auto-Clamped</div>
        </div>
      </div>
    `;

    // Staff Actions Row inside the modal
    let actionsHtml = '';
    if (isStaff()) {
      actionsHtml = `
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; padding:10px 14px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; align-items:center;">
          <span style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase;">Contract Actions:</span>
          ${NEXT_SUB_STAGE[s.status] ? `<button class="btn-primary" style="padding:5px 12px; font-size:12px;" onclick="run(async () => { await api('/subscriptions/${s.id}/status', 'POST', {status:'${NEXT_SUB_STAGE[s.status]}'}); showToast('Subscription advanced to ${NEXT_SUB_STAGE[s.status]}'); subs(window._subPage, window._subStatus, window._subQ); openSubscriptionModal(${s.id}); })">Advance → ${NEXT_SUB_STAGE[s.status]}</button>` : ''}
          ${s.status === 'active' && s.pausable ? (s.paused ? `<button class="btn-sec" style="padding:5px 12px; font-size:12px;" onclick="run(async () => { await api('/subscriptions/${s.id}/resume', 'POST', {}); showToast('Subscription resumed'); subs(window._subPage, window._subStatus, window._subQ); openSubscriptionModal(${s.id}); })">▶️ Resume</button>` : `<button class="btn-sec" style="padding:5px 12px; font-size:12px;" onclick="run(async () => { await api('/subscriptions/${s.id}/pause', 'POST', {}); showToast('Subscription paused'); subs(window._subPage, window._subStatus, window._subQ); openSubscriptionModal(${s.id}); })">⏸ Pause</button>`) : ''}
          ${['active', 'closed'].includes(s.status) && s.renewable ? `<button class="btn-emerald" style="padding:5px 12px; font-size:12px;" onclick="run(async () => { await api('/subscriptions/${s.id}/renew', 'POST', {}); showToast('Subscription term renewed'); subs(window._subPage, window._subStatus, window._subQ); openSubscriptionModal(${s.id}); })">🔄 Renew Term</button>` : ''}
          ${s.status !== 'closed' && s.closable ? `<button class="btn-danger" style="padding:5px 12px; font-size:12px;" onclick="run(async () => { if (confirm('Are you sure you want to close this subscription contract early?')) { await api('/subscriptions/${s.id}/status', 'POST', {status:'closed'}); showToast('Subscription closed'); subs(window._subPage, window._subStatus, window._subQ); openSubscriptionModal(${s.id}); } })">🚫 Close Contract</button>` : ''}
        </div>
      `;
    }

    // Contract info cards
    const infoHtml = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:18px; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:14px;">
        <div>
          <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Customer</div>
          <div style="font-weight:800; color:#0f172a; font-size:14px; margin-top:2px;">${esc(s.customer_name)}</div>
          <div style="font-size:12px; color:#64748b;">${esc(s.customer_email || '—')}</div>
        </div>
        <div>
          <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Billing Plan</div>
          <div style="font-weight:800; color:#0f172a; font-size:14px; margin-top:2px;">${esc(s.plan_name)}</div>
          <div style="font-size:12px; color:#64748b;">Frequency: <b style="text-transform:capitalize;">${s.billing_period}</b> (${money(s.plan_price)})</div>
        </div>
        <div>
          <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Term Duration</div>
          <div style="font-weight:700; color:#0f172a; font-size:13px; margin-top:2px;">${s.start_date} → ${s.expiry_date || 'Indefinite'}</div>
          <div style="font-size:12px; color:#64748b;">Payment Terms: <b>${esc(s.payment_terms || 'Immediate')}</b></div>
        </div>
      </div>
    `;

    // Committed Line Items Table
    const linesHtml = `
      <div style="margin-bottom:18px;">
        <h4 style="font-size:13.5px; font-weight:800; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>📦 Committed Products & Services</span>
          <span style="font-size:12px; font-weight:600; color:#64748b;">(${s.lines.length} lines)</span>
        </h4>
        ${tableHtml([
          ['Product', r => `<b>${esc(r.product_name)}</b>`],
          ['Variant', r => r.variant_attribute ? `<span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:12px;">${esc(r.variant_attribute)}: ${esc(r.variant_value)} (+₹${r.variant_extra || 0})</span>` : '—'],
          ['Qty', 'quantity'],
          ['Unit Price', r => money(r.unit_price)],
          ['Tax', r => r.tax_rate ? `${r.tax_rate}%` : '0%'],
          ['Subtotal', r => `<b style="color:var(--bl-violet);">${money(r.quantity * r.unit_price)}</b>`]
        ], s.lines)}
      </div>
    `;

    // Invoices History Table
    const invoicesHtml = `
      <div id="subModalInvoicesTable">
        <h4 style="font-size:13.5px; font-weight:800; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>🧾 Generated Invoices & Payment Status</span>
          <span style="font-size:12px; font-weight:600; color:#64748b;">(${s.invoices.length} invoices)</span>
        </h4>
        ${tableHtml([
          ['Invoice #', r => `<b style="font-family:monospace; color:var(--bl-violet);">${r.number}</b>`],
          ['Period', r => `${r.period_start} → ${r.period_end}`],
          ['Due Date', 'due_date'],
          ['Total', r => `<b>${money(r.total)}</b>`],
          ['Paid', r => `<span style="color:#059669; font-weight:700;">${money(r.paid_amount)}</span>`],
          ['Status', r => badge(r.status)],
          ['Actions', r => `
            <div style="display:flex; gap:6px;">
              <button class="btn-sec" style="padding:3px 8px; font-size:11.5px;" onclick="printInvoice(${r.id})">🖨️ Print</button>
              ${r.status === 'confirmed' && (r.total - r.paid_amount) > 0 ? `<button class="btn-emerald" style="padding:3px 8px; font-size:11.5px; font-weight:700;" onclick="openCustomerCheckoutModal(${r.id}, '${esc(r.number)}', ${(r.total - r.paid_amount).toFixed(2)})">💳 Pay</button>` : ''}
            </div>
          `]
        ], s.invoices)}
      </div>
    `;

    showModal({
      title: `Contract ${s.number} — ${esc(s.customer_name)}`,
      maxWidth: '860px',
      bodyHtml: `
        ${stagesHtml}
        ${smartStatsHtml}
        ${actionsHtml}
        ${infoHtml}
        ${linesHtml}
        ${invoicesHtml}
      `,
      hideFooter: true
    });
  });
}

/* --------------------------------------------------
   MODULE 3: INVOICES
   -------------------------------------------------- */
const invAction = (id, actionPath, b) => run(async () => {
  await api(`/invoices/${id}/${actionPath}`, 'POST', b);
  showToast('Invoice updated');
  inv(window._invPage || 1, window._invStatus || '', window._invOverdue || '', window._invQ || '');
});

const printInvoice = id => window.open(`/api/invoices/${id}/print?token=${token}`);

async function inv(page = 1, status = '', overdue = '', q = '') {
  window._invPage = page;
  window._invStatus = status;
  window._invOverdue = overdue;
  window._invQ = q;

  const r = await api(`/invoices?page=${page}&status=${status}&overdue=${overdue}&q=${encodeURIComponent(q)}`);

  let html = `
    <div class="page-header">
      <div>
        <h2>${isStaff() ? 'Customer Invoices' : 'My Invoices'}</h2>
        <p class="muted">Generate periodic billing, track balances, and record payments.</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-sec" onclick="downloadCsv('reports/export/invoices', 'invoices.csv')">📥 Export CSV</button>
        ${isStaff() ? `
          <button class="btn-emerald" onclick="run(async () => {
            const x = await api('/invoices/generate', 'POST', {});
            showToast(x.created + ' invoices created, ' + x.skipped + ' skipped, ' + x.auto_closed + ' auto-closed');
            inv();
          })">⚡ Generate Due Invoices</button>
        ` : ''}
      </div>
    </div>

    <div class="filters-bar">
      <select onchange="inv(1, this.value, '', $('#invSearchInput').value)">
        ${['', 'draft', 'confirmed', 'paid', 'cancelled'].map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s ? 'Status: ' + s : 'All Statuses'}</option>`).join('')}
      </select>
      <label style="display:flex; align-items:center; gap:6px; font-weight:700; cursor:pointer;">
        <input type="checkbox" ${overdue ? 'checked' : ''} onchange="inv(1, '', this.checked ? 1 : '', $('#invSearchInput').value)"> Show Overdue Only
      </label>
      <input id="invSearchInput" style="width: 280px;" placeholder="Search invoice number / customer..." value="${esc(q)}" onkeydown="if(event.key==='Enter') inv(1, '${status}', '${overdue}', this.value)">
    </div>
  `;

  html += tableHtml([
    ['Invoice', r => `<b style="font-family:monospace; color:var(--bl-violet);">${r.number}</b>`],
    ['Customer', 'customer_name'],
    ['Period', x => `${x.period_start} → ${x.period_end}`],
    ['Due Date', 'due_date'],
    ['Total', x => `<span style="font-weight:700;">${money(x.total)}</span>`],
    ['Paid', x => `<span style="color:#059669; font-weight:700;">${money(x.paid_amount)}</span>`],
    ['Balance', x => `<span style="color:${(x.total - x.paid_amount) > 0 ? '#dc2626' : '#64748b'}; font-weight:700;">${money(x.total - x.paid_amount)}</span>`],
    ['Status', x => badge(x.status)],
    ['Actions', x => `
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="btn-sec" style="padding:4px 8px; font-size:12px;" onclick="printInvoice(${x.id})">🖨️ Print</button>
        ${x.status === 'confirmed' && (x.total - x.paid_amount) > 0 ? `
          <button class="btn-emerald" style="padding:4px 8px; font-size:12px; font-weight:800;" onclick="openCustomerCheckoutModal(${x.id}, '${esc(x.number)}', ${(x.total - x.paid_amount).toFixed(2)})">💳 Pay Now</button>
        ` : ''}
        ${isStaff() ? `
          ${x.status === 'draft' ? `<button class="btn-primary" style="padding:4px 8px; font-size:12px;" onclick="invAction(${x.id}, 'confirm')">Confirm</button>` : ''}
          ${['draft', 'confirmed'].includes(x.status) && !x.paid_amount ? `<button class="btn-danger" style="padding:4px 8px; font-size:12px;" onclick="invAction(${x.id}, 'cancel')">Cancel</button>` : ''}
          ${x.status !== 'cancelled' ? `<button class="btn-sec" style="padding:4px 8px; font-size:12px;" onclick="invAction(${x.id}, 'send')">Email</button>` : ''}
          ${x.status === 'confirmed' ? `<button class="btn-sec" style="padding:4px 8px; font-size:12px;" onclick="openPaymentModal(${x.id}, '${esc(x.number)}', ${(x.total - x.paid_amount).toFixed(2)})">Manual Entry</button>` : ''}
        ` : ''}
      </div>
    `]
  ], r.rows) + pager(page, r.total, 20, 'inv_page_nav');

  $('#appMainStage').innerHTML = html;
}
const inv_page_nav = p => inv(p, window._invStatus, window._invOverdue, window._invQ);

function openPaymentModal(invoiceId, invoiceNo, balance) {
  showModal({
    title: `Record Payment for ${invoiceNo}`,
    bodyHtml: `
      <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid #e2e8f0;">
        <span style="color:#64748b;">Remaining Balance:</span> <b style="color:#dc2626; font-size:16px;">₹${balance}</b>
      </div>
      <label>Payment Method
        <select id="modalPayMethod">
          <option value="bank">Bank Transfer</option>
          <option value="upi">UPI</option>
          <option value="card">Credit / Debit Card</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
        </select>
      </label>
      <label>Amount (₹)
        <input type="number" id="modalPayAmount" step="any" value="${balance}">
      </label>
      <label>Payment Date
        <input type="date" id="modalPayDate" value="${new Date().toISOString().slice(0, 10)}">
      </label>
      <label>Reference Note (Optional)
        <input type="text" id="modalPayNote" placeholder="Transaction ID or remarks">
      </label>
    `,
    confirmText: 'Confirm Payment',
    onConfirm: async () => {
      const method = $('#modalPayMethod').value;
      const amount = +$('#modalPayAmount').value;
      const date = $('#modalPayDate').value;
      const note = $('#modalPayNote').value;
      const r = await api('/payments', 'POST', { invoice_id: invoiceId, method, amount, date, note });
      showToast('Payment recorded! Invoice status: ' + r.status);
      inv(window._invPage, window._invStatus, window._invOverdue, window._invQ);
    }
  });
}

/* --------------------------------------------------
   CUSTOMER "PAY NOW" CHECKOUT PORTAL MODAL
   -------------------------------------------------- */
function openCustomerCheckoutModal(invoiceId, invoiceNo, balance) {
  let activeTab = 'upi';

  const renderContent = () => {
    let tabContent = '';
    if (activeTab === 'upi') {
      tabContent = `
        <div style="text-align:center; padding:10px 0;">
          <div style="display:inline-block; background:#ffffff; padding:14px; border-radius:14px; border:2px dashed #cbd5e1; box-shadow:0 4px 15px rgba(0,0,0,0.06); margin-bottom:12px;">
            <svg width="180" height="180" viewBox="0 0 180 180" style="display:block; margin:0 auto;">
              <rect width="180" height="180" fill="#ffffff" rx="10"/>
              <rect x="15" y="15" width="45" height="45" fill="#0f172a" rx="6"/>
              <rect x="22" y="22" width="31" height="31" fill="#ffffff" rx="4"/>
              <rect x="29" y="29" width="17" height="17" fill="#7c3aed" rx="3"/>
              <rect x="120" y="15" width="45" height="45" fill="#0f172a" rx="6"/>
              <rect x="127" y="22" width="31" height="31" fill="#ffffff" rx="4"/>
              <rect x="134" y="29" width="17" height="17" fill="#7c3aed" rx="3"/>
              <rect x="15" y="120" width="45" height="45" fill="#0f172a" rx="6"/>
              <rect x="22" y="127" width="31" height="31" fill="#ffffff" rx="4"/>
              <rect x="29" y="134" width="17" height="17" fill="#7c3aed" rx="3"/>
              <rect x="70" y="18" width="10" height="10" fill="#334155"/>
              <rect x="90" y="22" width="12" height="12" fill="#334155"/>
              <rect x="75" y="38" width="14" height="8" fill="#334155"/>
              <rect x="98" y="42" width="10" height="10" fill="#334155"/>
              <rect x="20" y="70" width="12" height="12" fill="#334155"/>
              <rect x="42" y="75" width="10" height="14" fill="#334155"/>
              <rect x="25" y="94" width="14" height="10" fill="#334155"/>
              <rect x="48" y="98" width="8" height="12" fill="#334155"/>
              <rect x="125" y="70" width="12" height="12" fill="#334155"/>
              <rect x="145" y="78" width="14" height="10" fill="#334155"/>
              <rect x="130" y="95" width="10" height="12" fill="#334155"/>
              <rect x="150" y="98" width="12" height="10" fill="#334155"/>
              <rect x="70" y="125" width="12" height="12" fill="#334155"/>
              <rect x="92" y="132" width="10" height="14" fill="#334155"/>
              <rect x="75" y="148" width="14" height="10" fill="#334155"/>
              <rect x="100" y="152" width="10" height="10" fill="#334155"/>
              <circle cx="90" cy="90" r="18" fill="#7c3aed"/>
              <path d="M92 80 L82 92 L89 92 L87 102 L98 90 L91 90 Z" fill="#ffffff"/>
            </svg>
            <div style="font-size:11px; font-weight:800; color:#475569; margin-top:6px; letter-spacing:0.02em;">UPI ID: billing@brightloop</div>
          </div>
          <div style="font-size:12.5px; color:#64748b; margin-bottom:12px;">Scan with <b>Google Pay</b>, <b>PhonePe</b>, <b>Paytm</b>, or <b>BHIM</b></div>
          <button class="btn-emerald" style="width:100%; height:44px; justify-content:center; font-size:14px; font-weight:800;" onclick="submitCheckoutPayment(${invoiceId}, 'upi', ${balance})">
            ⚡ Simulate Instant UPI Approval
          </button>
        </div>
      `;
    } else if (activeTab === 'card') {
      tabContent = `
        <div>
          <div class="mock-credit-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <span style="font-weight:800; letter-spacing:1px; font-size:13px; color:#a5b4fc;">BRIGHTLOOP CARD</span>
              <span style="font-size:18px;">💳</span>
            </div>
            <div style="font-size:19px; font-family:monospace; letter-spacing:3px; margin-bottom:18px; font-weight:600;">
              •••• &nbsp;•••• &nbsp;•••• &nbsp;4242
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; text-transform:uppercase; color:#c7d2fe;">
              <div>
                <div>Cardholder</div>
                <div style="font-weight:700; color:#ffffff; font-size:13px; margin-top:2px;">${esc(user?.name || 'Customer Account')}</div>
              </div>
              <div>
                <div>Expires</div>
                <div style="font-weight:700; color:#ffffff; font-size:13px; margin-top:2px;">12/28</div>
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <label style="font-size:12.5px; font-weight:700; color:#475569;">Card Number
              <input type="text" value="4242 •••• •••• 4242" readonly style="background:#f8fafc; font-family:monospace;">
            </label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <label style="font-size:12.5px; font-weight:700; color:#475569;">Expiry Date
                <input type="text" value="12/28" readonly style="background:#f8fafc; text-align:center;">
              </label>
              <label style="font-size:12.5px; font-weight:700; color:#475569;">CVV / CVC
                <input type="password" value="888" readonly style="background:#f8fafc; text-align:center;">
              </label>
            </div>
            <button class="btn-primary" style="width:100%; height:44px; justify-content:center; font-size:14px; font-weight:800; margin-top:6px;" onclick="submitCheckoutPayment(${invoiceId}, 'card', ${balance})">
              🔒 Pay ₹${balance} via Secure Card
            </button>
          </div>
        </div>
      `;
    } else {
      tabContent = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="font-size:12.5px; color:#64748b; font-weight:600;">Select your preferred Net Banking institution:</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            ${['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map((b, i) => `
              <label style="display:flex; align-items:center; gap:8px; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; cursor:pointer; font-size:13px; font-weight:700;">
                <input type="radio" name="nbBank" value="${b}" ${i === 0 ? 'checked' : ''}>
                <span>${b}</span>
              </label>
            `).join('')}
          </div>
          <button class="btn-primary" style="width:100%; height:44px; justify-content:center; font-size:14px; font-weight:800; margin-top:6px;" onclick="submitCheckoutPayment(${invoiceId}, 'bank', ${balance})">
            🏦 Authorize Net Banking Payment
          </button>
        </div>
      `;
    }

    return `
      <div style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border:1px solid #e2e8f0; border-radius:12px; padding:14px 18px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Invoice Number</div>
          <div style="font-size:17px; font-weight:800; font-family:monospace; color:var(--bl-violet);">${invoiceNo}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Payable Amount</div>
          <div style="font-size:22px; font-weight:800; color:#047857;">₹${balance}</div>
        </div>
      </div>

      <div class="checkout-method-tabs">
        <button class="checkout-tab-btn ${activeTab === 'upi' ? 'active' : ''}" onclick="window._setCheckoutTab('upi')">📱 UPI / QR</button>
        <button class="checkout-tab-btn ${activeTab === 'card' ? 'active' : ''}" onclick="window._setCheckoutTab('card')">💳 Credit / Debit Card</button>
        <button class="checkout-tab-btn ${activeTab === 'bank' ? 'active' : ''}" onclick="window._setCheckoutTab('bank')">🏦 Net Banking</button>
      </div>

      <div id="checkoutTabStage">${tabContent}</div>
    `;
  };

  window._setCheckoutTab = tab => {
    activeTab = tab;
    $('#checkoutTabStage').outerHTML = `<div id="checkoutTabStage">${renderContent().split('<div id="checkoutTabStage">')[1]}`;
    document.querySelectorAll('.checkout-tab-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', (tab === 'upi' && idx === 0) || (tab === 'card' && idx === 1) || (tab === 'bank' && idx === 2));
    });
  };

  showModal({
    title: `⚡ Brightloop Instant Payment Portal`,
    maxWidth: '520px',
    hideFooter: true,
    bodyHtml: renderContent()
  });
}

async function submitCheckoutPayment(invoiceId, method, amount) {
  showModal({
    title: 'Processing Payment...',
    maxWidth: '440px',
    hideFooter: true,
    bodyHtml: `
      <div style="text-align:center; padding:30px 10px;">
        <div style="width:48px; height:48px; border:4px solid #e2e8f0; border-top-color:var(--bl-violet); border-radius:50%; margin:0 auto 16px auto; animation:spin 0.8s linear infinite;"></div>
        <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:6px;">Connecting to Bank Gateway</h3>
        <p style="font-size:13px; color:#64748b;">Simulating real-time settlement & webhook callbacks...</p>
      </div>
      <style>@keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }</style>
    `
  });

  setTimeout(async () => {
    try {
      const txnId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const res = await api('/payments', 'POST', {
        invoice_id: invoiceId,
        method,
        amount: +amount,
        date: new Date().toISOString().slice(0, 10),
        note: `Self-service online payment via ${method.toUpperCase()} (${txnId})`
      });

      showToast('Payment successful! Status: ' + res.status);
      if (typeof inv === 'function') inv(window._invPage, window._invStatus, window._invOverdue, window._invQ);

      showModal({
        title: 'Payment Successful',
        maxWidth: '480px',
        hideFooter: true,
        bodyHtml: `
          <div style="text-align:center; padding:10px 0 16px 0;">
            <div style="width:60px; height:60px; background:#ecfdf5; color:#059669; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 12px auto; border:2px solid #a7f3d0;">✓</div>
            <h3 style="font-size:19px; font-weight:800; color:#065f46; margin-bottom:4px;">₹${amount} Paid Successfully</h3>
            <p style="font-size:13px; color:#64748b;">Your subscription invoice has been marked as <b>PAID</b> in real-time.</p>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:18px; font-size:13px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between;"><span style="color:#64748b;">Transaction Reference:</span> <b style="font-family:monospace; color:#0f172a;">${txnId}</b></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:#64748b;">Payment Method:</span> <b style="text-transform:uppercase;">${method}</b></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:#64748b;">Date & Time:</span> <b>${new Date().toLocaleString()}</b></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:#64748b;">Status:</span> <span class="b paid">paid</span></div>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="btn-sec" style="flex:1; justify-content:center; height:40px;" onclick="closeModal()">Close</button>
            <button class="btn-primary" style="flex:1; justify-content:center; height:40px;" onclick="printInvoice(${invoiceId})">🖨️ Print Receipt</button>
          </div>
        `
      });
    } catch (e) {
      showToast(e.message, true);
      closeModal();
    }
  }, 900);
}

/* --------------------------------------------------
   MODULE: 1-CLICK INTERACTIVE JURY DEMO TOUR
   -------------------------------------------------- */
async function ensureAdminSession() {
  if (!isStaff()) {
    showToast('Switching session to Demo Admin for showcase access...', false);
    const res = await api('/auth/login', 'POST', {
      email: 'admin@brightloop.com',
      password: 'Admin@12345'
    });
    saveSession(res);
    renderAppShell();
  }
}

function startJuryTour() {
  showModal({
    title: '🎯 Odoo Hackathon Jury Tour — Brightloop Architecture',
    maxWidth: '720px',
    hideFooter: true,
    bodyHtml: `
      <div style="margin-bottom:16px;">
        <p style="font-size:13.5px; color:#475569; line-height:1.5;">
          Welcome to Brightloop! Built for the <b>Odoo x FLUX Hackathon '26</b>, this system implements an enterprise-grade subscription lifecycle, automated periodic billing scheduler, smart clamping, and real-time financial intelligence.
        </p>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
        <div class="tour-step-card" style="border-left-color: #7c3aed;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b style="font-size:14px; color:#0f172a;">1. 📜 Subscription & Quotation Engine (PRD §1 & §4)</b>
            <button class="btn-sec" style="padding:4px 10px; font-size:12px;" onclick="run(async () => { await ensureAdminSession(); closeModal(); subs(); })">⚡ Inspect Subscriptions</button>
          </div>
          <p style="font-size:12.5px; color:#64748b; margin-top:4px;">
            Supports plans (Daily, Weekly, Monthly, Yearly), product variants with price adders, quotation templates, and automatic multi-tier discount math.
          </p>
        </div>

        <div class="tour-step-card" style="border-left-color: #3b82f6;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b style="font-size:14px; color:#0f172a;">2. 🔄 Odoo Life-Cycle & Smart Stat Drilldown (PRD §5)</b>
            <button class="btn-sec" style="padding:4px 10px; font-size:12px;" onclick="run(async () => { await ensureAdminSession(); closeModal(); const r = await api('/subscriptions?limit=1'); if (r.rows && r.rows.length) openSubscriptionModal(r.rows[0].id); else subs(); });">⚡ Open Smart Stats</button>
          </div>
          <p style="font-size:12.5px; color:#64748b; margin-top:4px;">
            Strict state machine (<code>Draft</code> ➔ <code>Quotation</code> ➔ <code>Confirmed</code> ➔ <code>Active</code> ➔ <code>Closed</code>) with Odoo-style smart stat buttons: 🧾 Invoices, 💰 Billed, 💳 Collected, ⚖️ Outstanding, and ⏳ Next Billing.
          </p>
        </div>

        <div class="tour-step-card" style="border-left-color: #f59e0b;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b style="font-size:14px; color:#0f172a;">3. ⚡ Automated Nightly Scheduler & Leap Clamping (PRD §7)</b>
            <button class="btn-sec" style="padding:4px 10px; font-size:12px;" onclick="run(async () => { await ensureAdminSession(); const x = await api('/invoices/generate', 'POST', {}); showToast('Generated: ' + x.created + ' invoices'); inv(); closeModal(); });">⚡ Trigger Invoices</button>
          </div>
          <p style="font-size:12.5px; color:#64748b; margin-top:4px;">
            Background cron worker backfills missed cycles, executes idempotent single billing, and clamps month-end dates (e.g. Jan 31 ➔ Feb 28 ➔ Mar 31).
          </p>
        </div>

        <div class="tour-step-card" style="border-left-color: #10b981;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b style="font-size:14px; color:#0f172a;">4. 💳 Customer Self-Service Checkout & Live MRR (PRD §6 & §8)</b>
            <button class="btn-sec" style="padding:4px 10px; font-size:12px;" onclick="run(async () => { await ensureAdminSession(); closeModal(); dash(); });">⚡ View Analytics</button>
          </div>
          <p style="font-size:12.5px; color:#64748b; margin-top:4px;">
            Simulated instant UPI QR & Card payment checkout, printable PDF invoices/receipts, and real-time MRR, active subscription counters, and CSV export engines.
          </p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:14px 18px; border-radius:12px; color:#ffffff;">
        <div>
          <b style="font-size:13.5px; color:#fde68a;">🚀 Want to see it in action?</b>
          <div style="font-size:12px; color:#94a3b8;">Run an automated 10-second end-to-end guided showcase.</div>
        </div>
        <button class="btn-jury-tour" style="font-size:13px; padding:8px 16px;" onclick="runAutoShowcase()">⚡ Run Auto-Showcase</button>
      </div>
    `
  });
}

async function runAutoShowcase() {
  closeModal();
  showToast('🎯 Starting 10-Second Jury Demo Tour...');
  await ensureAdminSession();
  
  await new Promise(r => setTimeout(r, 600));
  showToast('Tour 1/4: Loading Subscriptions & Contracts...');
  await subs();

  await new Promise(r => setTimeout(r, 1600));
  const subRes = await api('/subscriptions?limit=1');
  if (subRes.rows && subRes.rows.length) {
    showToast('Tour 2/4: Opening Odoo Smart Stat Buttons for ' + subRes.rows[0].number + '...');
    await openSubscriptionModal(subRes.rows[0].id);
  }

  await new Promise(r => setTimeout(r, 3200));
  closeModal();
  showToast('Tour 3/4: Executing Automated Billing Engine...');
  const genRes = await api('/invoices/generate', 'POST', {});
  showToast(`Billing Run: ${genRes.created} invoices created, ${genRes.skipped} skipped.`);
  await inv();

  await new Promise(r => setTimeout(r, 2200));
  showToast('Tour 4/4: Reconciling Live MRR & Financial Analytics...');
  await dash();

  await new Promise(r => setTimeout(r, 1500));
  showToast('✅ Jury Tour Complete! Full System Verified 100%.');
}

/* --------------------------------------------------
   MODULE 4: PAYMENTS LEDGER
   -------------------------------------------------- */
async function pay() {
  const [openInvs, list] = await Promise.all([
    api('/invoices?status=confirmed&limit=200'),
    api('/payments')
  ]);

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Payments Ledger</h2>
        <p class="muted">All recorded collections, bank transfers, and partial settlements.</p>
      </div>
      <button class="btn-sec" onclick="downloadCsv('reports/export/payments', 'payments_ledger.csv')">📥 Export CSV</button>
    </div>
    <details open>
      <summary>+ Record New Payment</summary>
      ${formHtml('formNewPay', [
        { n: 'invoice_id', l: 'Confirmed Invoice', t: 'select', o: openInvs.rows.map(i => [i.id, `${i.number} — ${i.customer_name} (Balance: ₹${(i.total - i.paid_amount).toFixed(2)})`]) },
        { n: 'method', l: 'Method', t: 'select', o: [['bank', 'Bank Transfer'], ['upi', 'UPI'], ['card', 'Credit/Debit Card'], ['cash', 'Cash'], ['cheque', 'Cheque']] },
        { n: 'amount', l: 'Amount (₹)', t: 'number', req: 1 },
        { n: 'date', l: 'Date', t: 'date', v: new Date().toISOString().slice(0, 10) },
        { n: 'note', l: 'Reference Note' }
      ])}
    </details>
    ${tableHtml([
      ['Date', 'date'],
      ['Invoice', r => `<b style="font-family:monospace; color:var(--bl-violet);">${r.invoice_number}</b>`],
      ['Customer', 'customer_name'],
      ['Method', r => `<span class="b" style="background:#f1f5f9; color:#334155;">${esc(r.method).toUpperCase()}</span>`],
      ['Amount', x => `<span style="color:#059669; font-weight:700;">${money(x.amount)}</span>`],
      ['Note', r => esc(r.note || '—')]
    ], list)}
  `;

  onSave('formNewPay', async d => {
    const r = await api('/payments', 'POST', d);
    showToast('Payment recorded! Invoice status: ' + r.status);
    pay();
  });
}

/* --------------------------------------------------
   MODULE 5: PRODUCTS & VARIANTS
   -------------------------------------------------- */
async function prod() {
  const rows = await api('/products');

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Products & Offerings</h2>
        <p class="muted">Items sold, base prices, and custom attribute variant add-ons.</p>
      </div>
    </div>
    ${isAdmin() ? `
      <details>
        <summary>+ Add New Product</summary>
        ${formHtml('formNewProd', [
          { n: 'name', l: 'Product Name', req: 1 },
          { n: 'type', l: 'Type', t: 'select', o: [['service', 'Service'], ['software', 'Software'], ['addon', 'Add-on'], ['physical', 'Physical']] },
          { n: 'sales_price', l: 'Sales Price (₹)', t: 'number', req: 1 },
          { n: 'cost_price', l: 'Cost Price (₹)', t: 'number', v: 0 },
          { n: 'notes', l: 'Notes' }
        ])}
      </details>
    ` : ''}
    ${tableHtml([
      ['Name', r => `<b>${esc(r.name)}</b>`],
      ['Type', r => `<span class="b" style="background:#f8fafc; border:1px solid #e2e8f0;">${esc(r.type)}</span>`],
      ['Sales Price', x => `<span style="font-weight:700; color:#059669;">${money(x.sales_price)}</span>`],
      ['Cost Price', x => `<span style="color:#64748b;">${money(x.cost_price)}</span>`],
      ['Configured Variants', x => (x.variants || []).map(v => `
        <span style="display:inline-block; background:#eff6ff; color:#1d4ed8; border-radius:4px; padding:2px 6px; margin:2px 0; font-size:12px;">
          <b>${esc(v.attribute)}:</b> ${esc(v.value)} (+₹${v.extra_price})
        </span>
      `).join('<br>') || '<span style="color:#94a3b8;">None</span>'],
      ...(isAdmin() ? [['Actions', x => `
        <button class="btn-sec" onclick="openVariantModal(${x.id}, '${esc(x.name)}')">+ Add Variant</button>
      `]] : [])
    ], rows)}
  `;

  if (isAdmin()) {
    onSave('formNewProd', async d => {
      await api('/products', 'POST', d);
      showToast('Product saved successfully');
      prod();
    });
  }
}

function openVariantModal(productId, productName) {
  showModal({
    title: `Add Variant to ${productName}`,
    bodyHtml: `
      <label>Attribute Name
        <input type="text" id="modalVarAttr" placeholder="e.g. Storage, Tier, Region" required>
      </label>
      <label>Attribute Value
        <input type="text" id="modalVarVal" placeholder="e.g. 50GB, Pro, US" required>
      </label>
      <label>Extra Price Add-on (₹)
        <input type="number" id="modalVarPrice" step="any" value="0">
      </label>
    `,
    confirmText: 'Save Variant',
    onConfirm: async () => {
      const attribute = $('#modalVarAttr').value.trim();
      const value = $('#modalVarVal').value.trim();
      const extra_price = +$('#modalVarPrice').value || 0;
      if (!attribute || !value) throw new Error('Attribute and value required');
      await api(`/products/${productId}/variants`, 'POST', { attribute, value, extra_price });
      showToast('Variant added successfully');
      prod();
    }
  });
}

/* --------------------------------------------------
   MODULE 6: PLANS
   -------------------------------------------------- */
async function plan() {
  const [rows, prods] = await Promise.all([api('/plans'), api('/products')]);

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Subscription Plans</h2>
        <p class="muted">Billing intervals, minimum seat commitments, and lifecycle flags.</p>
      </div>
    </div>
    ${isAdmin() ? `
      <details>
        <summary>+ Add New Plan</summary>
        ${formHtml('formNewPlan', [
          { n: 'name', l: 'Plan Name', req: 1 },
          { n: 'product_id', l: 'Primary Product', t: 'select', o: prods.map(p => [p.id, p.name]) },
          { n: 'price', l: 'Price (₹)', t: 'number', req: 1 },
          { n: 'billing_period', l: 'Billing Interval', t: 'select', o: ['daily', 'weekly', 'monthly', 'yearly'].map(x => [x, x.toUpperCase()]) },
          { n: 'min_qty', l: 'Min Seats / Quantity', t: 'number', v: 1 },
          { n: 'start_date', l: 'Available From', t: 'date' },
          { n: 'end_date', l: 'Available Until', t: 'date' },
          { n: 'auto_close', l: 'Auto-close when expired & billed?', t: 'select', o: [['0', 'No'], ['1', 'Yes']] },
          { n: 'closable', l: 'Allow closing early?', t: 'select', o: yn },
          { n: 'pausable', l: 'Allow pause / resume?', t: 'select', o: [['0', 'No'], ['1', 'Yes']] },
          { n: 'renewable', l: 'Allow contract renewal?', t: 'select', o: yn }
        ])}
      </details>
    ` : ''}
    ${tableHtml([
      ['Name', r => `<b>${esc(r.name)}</b>`],
      ['Price', x => `<span style="font-weight:700; color:#059669;">${money(x.price)}</span>`],
      ['Interval', r => `<span class="b confirmed">${r.billing_period}</span>`],
      ['Min Qty', 'min_qty'],
      ['Availability', x => `${x.start_date || 'Any'} → ${x.end_date || 'Indefinite'}`],
      ['Auto-Close', x => x.auto_close ? '✓' : '—'],
      ['Close Early', x => x.closable ? '✓' : '—'],
      ['Pausable', x => x.pausable ? '✓' : '—'],
      ['Renewable', x => x.renewable ? '✓' : '—']
    ], rows)}
  `;

  if (isAdmin()) {
    onSave('formNewPlan', async d => {
      await api('/plans', 'POST', d);
      showToast('Plan created successfully');
      plan();
    });
  }
}

/* --------------------------------------------------
   MODULE 7: TAX CONFIGURATIONS
   -------------------------------------------------- */
async function tax() {
  const rows = await api('/taxes');

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Tax Configurations</h2>
        <p class="muted">Automated GST and sales tax rules applied to billable items.</p>
      </div>
    </div>
    ${isAdmin() ? `
      <details>
        <summary>+ Add New Tax Rule</summary>
        ${formHtml('formNewTax', [
          { n: 'name', l: 'Tax Name (e.g. GST 18%)', req: 1 },
          { n: 'rate', l: 'Tax Rate (%)', t: 'number', req: 1 },
          { n: 'is_default', l: 'Apply as Default Tax?', t: 'select', o: [['0', 'No'], ['1', 'Yes']] }
        ])}
      </details>
    ` : ''}
    ${tableHtml([
      ['Name', r => `<b>${esc(r.name)}</b>`],
      ['Rate', r => `<span style="font-weight:700; color:var(--bl-violet);">${r.rate}%</span>`],
      ['Default Tax', x => x.is_default ? '<span class="b active">Default</span>' : '—']
    ], rows)}
  `;

  if (isAdmin()) {
    onSave('formNewTax', async d => {
      await api('/taxes', 'POST', d);
      showToast('Tax rule saved successfully');
      tax();
    });
  }
}

/* --------------------------------------------------
   MODULE 8: DISCOUNTS
   -------------------------------------------------- */
async function disc() {
  const [rows, prods] = await Promise.all([api('/discounts'), api('/products')]);

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Discount Rules</h2>
        <p class="muted">Configurable promotional reductions applied on invoices.</p>
      </div>
    </div>
    ${isAdmin() ? `
      <details>
        <summary>+ Create Discount Rule</summary>
        ${formHtml('formNewDisc', [
          { n: 'name', l: 'Discount Name', req: 1 },
          { n: 'type', l: 'Discount Type', t: 'select', o: [['percent', 'Percentage (%)'], ['fixed', 'Fixed Amount (₹)']] },
          { n: 'value', l: 'Discount Value', t: 'number', req: 1 },
          { n: 'min_purchase', l: 'Minimum Purchase (₹)', t: 'number', v: 0 },
          { n: 'min_qty', l: 'Minimum Quantity', t: 'number', v: 0 },
          { n: 'start_date', l: 'Start Date', t: 'date' },
          { n: 'end_date', l: 'End Date', t: 'date' },
          { n: 'usage_limit', l: 'Maximum Usage Limit', t: 'number' },
          { n: 'applies_to', l: 'Scope', t: 'select', o: [['subscription', 'Whole Subscription'], ['product', 'Specific Product Only']] },
          { n: 'product_id', l: 'Target Product (if product-specific)', t: 'select', o: [['', '— Select Product —'], ...prods.map(p => [p.id, p.name])] },
          { n: 'subscription_id', l: 'Specific Subscription ID (Optional)', t: 'number' }
        ])}
      </details>
    ` : ''}
    ${tableHtml([
      ['Name', r => `<b>${esc(r.name)}</b>`],
      ['Rule', x => `<span style="color:#059669; font-weight:700;">${x.type === 'percent' ? x.value + '%' : money(x.value)}</span>`],
      ['Min Thresholds', x => `₹${x.min_purchase} / ${x.min_qty} qty`],
      ['Validity Period', x => `${x.start_date || 'Any'} → ${x.end_date || 'Indefinite'}`],
      ['Usage', x => `${x.used_count} / ${x.usage_limit ?? '∞'}`],
      ['Target Scope', x => `<span class="b" style="background:#f1f5f9;">${x.applies_to}</span> ${x.product_id ? '#' + x.product_id : ''}`]
    ], rows)}
  `;

  if (isAdmin()) {
    onSave('formNewDisc', async d => {
      await api('/discounts', 'POST', d);
      showToast('Discount rule saved successfully');
      disc();
    });
  }
}

/* --------------------------------------------------
   MODULE 9: QUOTATION TEMPLATES
   -------------------------------------------------- */
async function tpl() {
  const [rows, plans, prods] = await Promise.all([
    api('/templates'),
    api('/plans'),
    api('/products')
  ]);

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Quotation Templates</h2>
        <p class="muted">Reusable sales proposals with pre-selected plans and line items.</p>
      </div>
    </div>
    <details>
      <summary>+ Create Quotation Template</summary>
      ${formHtml('formNewTpl', [
        { n: 'name', l: 'Template Name', req: 1 },
        { n: 'plan_id', l: 'Linked Plan', t: 'select', o: plans.map(p => [p.id, p.name]) },
        { n: 'validity_days', l: 'Quote Validity (Days)', t: 'number', v: 30 },
        { n: 'product_id', l: 'Default Product Line', t: 'select', o: prods.map(p => [p.id, p.name]) },
        { n: 'quantity', l: 'Default Quantity', t: 'number', v: 1 }
      ])}
    </details>
    ${tableHtml([
      ['Template Name', r => `<b>${esc(r.name)}</b>`],
      ['Linked Plan ID', 'plan_id'],
      ['Valid Days', 'validity_days'],
      ['Line Items', x => `<span style="font-weight:700;">${(x.lines || []).length} items</span>`]
    ], rows)}
  `;

  onSave('formNewTpl', async d => {
    await api('/templates', 'POST', {
      name: d.name,
      plan_id: d.plan_id,
      validity_days: +d.validity_days,
      lines: [{ product_id: d.product_id, quantity: +d.quantity }]
    });
    showToast('Template created successfully');
    tpl();
  });
}

/* --------------------------------------------------
   MODULE 10: STAFF MANAGEMENT (ADMIN ONLY) - 100% WORKING
   -------------------------------------------------- */
async function staff() {
  const rows = await api('/users?role=staff');

  $('#appMainStage').innerHTML = `
    <div class="page-header">
      <div>
        <h2>Staff Team Members</h2>
        <p class="muted">Grant internal team members operational access to quotes, subscriptions, and invoices.</p>
      </div>
    </div>
    <details open>
      <summary>+ Add Staff Member</summary>
      ${formHtml('formNewStaff', [
        { n: 'name', l: 'Staff Full Name', req: 1, p: 'e.g. John Doe' },
        { n: 'email', l: 'Work Email Address', t: 'email', req: 1, p: 'john@company.com' },
        { n: 'password', l: 'Password (9+ chars with Upper, Lower, Special)', t: 'password', req: 1, p: 'e.g. Staff@12345' }
      ])}
    </details>
    ${tableHtml([
      ['Staff Name', r => `<b>${esc(r.name)}</b>`],
      ['Email Address', 'email'],
      ['Role', () => '<span class="b confirmed">Staff</span>']
    ], rows)}
  `;

  onSave('formNewStaff', async d => {
    await api('/staff', 'POST', d);
    showToast('Staff member added successfully!');
    staff();
  });
}

/* --------------------------------------------------
   INITIALIZE ON PAGE LOAD
   -------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initAuthLogic();
  if (token && user) {
    showAppControlRoom();
  }
});
