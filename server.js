const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- helpers ---------- */
const iso = d => d.toISOString().slice(0, 10);
const today = () => iso(new Date());
const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
const err = (status, msg) => Object.assign(new Error(msg), { status });
const wrap = fn => (req, res) => {
  try { const out = fn(req, res); if (out !== undefined) res.json(out); }
  catch (e) {
    const st = e.status || (String(e.code).startsWith('SQLITE_CONSTRAINT') ? 400 : 500);
    res.status(st).json({ error: e.message });
  }
};
function addPeriod(s, p) {
  const d = new Date(s + 'T00:00:00Z');
  ({ daily: () => d.setUTCDate(d.getUTCDate() + 1), weekly: () => d.setUTCDate(d.getUTCDate() + 7),
     monthly: () => d.setUTCMonth(d.getUTCMonth() + 1), yearly: () => d.setUTCFullYear(d.getUTCFullYear() + 1) })[p]();
  return iso(d);
}
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + Number(n)); return iso(d); };
const nextNo = (prefix, table) =>
  prefix + String(db.prepare(`SELECT COALESCE(MAX(id),0)+1 n FROM ${table}`).get().n).padStart(6, '0');
const clean = v => (v === '' || v === undefined ? null : v);

async function sendMail(to, subject, text) {
  if (!process.env.SMTP_HOST) { console.log(`\n[MAIL to ${to}] ${subject}\n${text}\n`); return; }
  const nm = require('nodemailer');
  await nm.createTransport({ host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
    .sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
}

/* ---------- auth + roles ---------- */
const PW_MSG = 'Password must be more than 8 characters with an uppercase letter, a lowercase letter and a special character';
const pwOk = p => typeof p === 'string' && p.length > 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[^A-Za-z0-9]/.test(p);

function auth(...roles) {
  return (req, res, next) => {
    const t = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
    try { req.user = jwt.verify(t, SECRET); } catch { return res.status(401).json({ error: 'Please log in' }); }
    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Not allowed for your role' });
    next();
  };
}
const session = u => ({
  token: jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '12h' }),
  user: { id: u.id, name: u.name, email: u.email, role: u.role }
});
function createUser({ name, email, password }, role) {
  if (!name || !email) throw err(400, 'Name and email are required');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw err(400, 'Invalid email address');
  if (!pwOk(password)) throw err(400, PW_MSG);
  email = email.toLowerCase();
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) throw err(409, 'This email already has an account');
  const id = db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)')
    .run(name, email, bcrypt.hashSync(password, 10), role).lastInsertRowid;
  return db.prepare('SELECT * FROM users WHERE id=?').get(id);
}

app.post('/api/auth/signup', wrap(req => session(createUser(req.body, 'customer'))));
app.post('/api/auth/login', wrap(req => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(req.body.email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.password_hash)) throw err(401, 'Wrong email or password');
  return session(u);
}));
app.post('/api/auth/forgot', wrap(req => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(req.body.email || '').toLowerCase());
  if (u) {
    const raw = crypto.randomBytes(24).toString('hex');
    db.prepare('UPDATE users SET reset_hash=?, reset_expires=? WHERE id=?')
      .run(crypto.createHash('sha256').update(raw).digest('hex'), Date.now() + 3600e3, u.id);
    const link = `${process.env.BASE_URL || 'http://localhost:' + PORT}/?reset=${raw}`;
    sendMail(u.email, 'Reset your Brightloop password', `Click to reset (valid 1 hour): ${link}`).catch(console.error);
  }
  return { ok: true, message: 'If that email is registered, a reset link has been sent.' }; // same reply either way
}));
app.post('/api/auth/reset', wrap(req => {
  if (!pwOk(req.body.password)) throw err(400, PW_MSG);
  const h = crypto.createHash('sha256').update(String(req.body.token || '')).digest('hex');
  const u = db.prepare('SELECT * FROM users WHERE reset_hash=? AND reset_expires>?').get(h, Date.now());
  if (!u) throw err(400, 'Reset link is invalid or expired');
  db.prepare('UPDATE users SET password_hash=?, reset_hash=NULL, reset_expires=NULL WHERE id=?')
    .run(bcrypt.hashSync(req.body.password, 10), u.id);
  return { ok: true };
}));
// only admin can add staff
app.post('/api/staff', auth('admin'), wrap(req => { const u = createUser(req.body, 'staff'); return { id: u.id, name: u.name, email: u.email }; }));
app.get('/api/users', auth('admin', 'staff'), wrap(req => {
  const role = req.query.role;
  return db.prepare(`SELECT id,name,email,role FROM users ${role ? 'WHERE role=?' : ''} ORDER BY id DESC`).all(...(role ? [role] : []));
}));

/* ---------- generic admin CRUD (staff can read) ---------- */
function crud(name, table, cols) {
  app.get(`/api/${name}`, auth('admin', 'staff'), wrap(() => db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all()));
  app.post(`/api/${name}`, auth('admin'), wrap(req => {
    // only insert fields the client actually filled in, so column DEFAULTs apply to the rest
    const use = cols.filter(c => clean(req.body[c]) !== null);
    const r = db.prepare(`INSERT INTO ${table}(${use.join(',')}) VALUES(${use.map(() => '?').join(',')})`).run(...use.map(c => req.body[c]));
    return db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(r.lastInsertRowid);
  }));
  app.put(`/api/${name}/:id`, auth('admin'), wrap(req => {
    db.prepare(`UPDATE ${table} SET ${cols.map(c => c + '=?').join(',')} WHERE id=?`).run(...cols.map(c => clean(req.body[c])), req.params.id);
    return db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(req.params.id);
  }));
  app.delete(`/api/${name}/:id`, auth('admin'), wrap(req => { db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id); return { ok: true }; }));
}
// products list includes variants (registered first so it wins)
app.get('/api/products', auth('admin', 'staff'), wrap(() => {
  const v = db.prepare('SELECT * FROM product_variants').all();
  return db.prepare('SELECT * FROM products ORDER BY id DESC').all().map(p => ({ ...p, variants: v.filter(x => x.product_id === p.id) }));
}));
crud('products', 'products', ['name', 'type', 'sales_price', 'cost_price', 'notes']);
app.post('/api/products/:id/variants', auth('admin'), wrap(req => {
  const { attribute, value, extra_price } = req.body;
  if (!attribute || !value) throw err(400, 'attribute and value required');
  const r = db.prepare('INSERT INTO product_variants(product_id,attribute,value,extra_price) VALUES(?,?,?,?)')
    .run(req.params.id, attribute, value, Number(extra_price) || 0);
  return db.prepare('SELECT * FROM product_variants WHERE id=?').get(r.lastInsertRowid);
}));
crud('plans', 'plans', ['name', 'product_id', 'price', 'billing_period', 'min_qty', 'start_date', 'end_date', 'auto_close', 'closable', 'pausable', 'renewable']);
crud('taxes', 'taxes', ['name', 'rate', 'is_default']);
crud('discounts', 'discounts', ['name', 'type', 'value', 'min_purchase', 'min_qty', 'start_date', 'end_date', 'usage_limit', 'applies_to', 'product_id', 'subscription_id']);

/* ---------- quotation templates ---------- */
app.get('/api/templates', auth('admin', 'staff'), wrap(() => {
  const l = db.prepare('SELECT * FROM template_lines').all();
  return db.prepare('SELECT * FROM quotation_templates ORDER BY id DESC').all().map(t => ({ ...t, lines: l.filter(x => x.template_id === t.id) }));
}));
app.post('/api/templates', auth('admin', 'staff'), wrap(req => db.transaction(() => {
  const { name, plan_id, validity_days, lines } = req.body;
  if (!name || !plan_id || !lines?.length) throw err(400, 'name, plan and at least one line required');
  const id = db.prepare('INSERT INTO quotation_templates(name,plan_id,validity_days) VALUES(?,?,?)').run(name, plan_id, validity_days || 30).lastInsertRowid;
  for (const l of lines) db.prepare('INSERT INTO template_lines(template_id,product_id,variant_id,quantity,tax_id) VALUES(?,?,?,?,?)')
    .run(id, l.product_id, clean(l.variant_id), l.quantity || 1, clean(l.tax_id));
  return { id };
})()));

/* ---------- subscriptions ---------- */
app.post('/api/subscriptions', auth('admin', 'staff'), wrap(req => db.transaction(() => {
  let { customer_id, plan_id, start_date, expiry_date, payment_terms, lines, template_id } = req.body;
  let validity = 30;
  if (template_id) {
    const t = db.prepare('SELECT * FROM quotation_templates WHERE id=?').get(template_id);
    if (!t) throw err(404, 'Template not found');
    plan_id = plan_id || t.plan_id; validity = t.validity_days;
    if (!lines?.length) lines = db.prepare('SELECT product_id,variant_id,quantity,tax_id FROM template_lines WHERE template_id=?').all(t.id);
  }
  const cust = db.prepare("SELECT 1 FROM users WHERE id=? AND role='customer'").get(customer_id);
  if (!cust) throw err(400, 'Pick a valid customer');
  const plan = db.prepare('SELECT * FROM plans WHERE id=?').get(plan_id);
  if (!plan) throw err(400, 'Pick a valid plan');
  if (!start_date) throw err(400, 'Start date required');
  expiry_date = expiry_date || plan.end_date;
  if (!expiry_date) throw err(400, 'Expiry date required');
  if (expiry_date <= start_date) throw err(400, 'Expiry must be after start');
  if (plan.start_date && start_date < plan.start_date) throw err(400, `Plan is only available from ${plan.start_date}`);
  if (plan.end_date && start_date > plan.end_date) throw err(400, 'Plan is no longer available');
  if (!lines?.length) throw err(400, 'At least one product line is required');
  const defTax = db.prepare('SELECT id FROM taxes WHERE is_default=1').get()?.id ?? null;
  const number = nextNo('SUB-', 'subscriptions');
  const id = db.prepare(`INSERT INTO subscriptions(number,customer_id,plan_id,start_date,expiry_date,payment_terms,status,quote_valid_until)
    VALUES(?,?,?,?,?,?,'draft',?)`).run(number, customer_id, plan_id, start_date, expiry_date, payment_terms || 'Immediate', addDays(today(), validity)).lastInsertRowid;
  for (const l of lines) {
    const p = db.prepare('SELECT * FROM products WHERE id=?').get(l.product_id);
    if (!p) throw err(400, 'Unknown product');
    let extra = 0;
    if (l.variant_id) {
      const v = db.prepare('SELECT * FROM product_variants WHERE id=? AND product_id=?').get(l.variant_id, p.id);
      if (!v) throw err(400, 'Variant does not belong to product');
      extra = v.extra_price;
    }
    const qty = Number(l.quantity || 1);
    if (qty < plan.min_qty) throw err(400, `Minimum quantity for this plan is ${plan.min_qty}`);
    db.prepare('INSERT INTO subscription_lines(subscription_id,product_id,variant_id,quantity,unit_price,tax_id) VALUES(?,?,?,?,?,?)')
      .run(id, p.id, clean(l.variant_id), qty, p.sales_price + extra, clean(l.tax_id) ?? defTax);
  }
  return { id, number };
})()));

const FLOW = { draft: 'quotation', quotation: 'confirmed', confirmed: 'active' };
function getSub(id) { const s = db.prepare('SELECT s.*,p.closable,p.pausable,p.renewable,p.billing_period FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.id=?').get(id); if (!s) throw err(404, 'Not found'); return s; }
app.post('/api/subscriptions/:id/status', auth('admin', 'staff'), wrap(req => {
  const s = getSub(req.params.id), to = req.body.status;
  if (to === 'closed') {
    if (s.status === 'closed') throw err(400, 'Already closed');
    if (!s.closable) throw err(400, 'This plan cannot be closed early');
  } else if (FLOW[s.status] !== to) throw err(400, `Cannot move from ${s.status} to ${to}`);
  db.prepare('UPDATE subscriptions SET status=?, next_invoice_date=CASE WHEN ?=\'active\' THEN start_date ELSE next_invoice_date END WHERE id=?').run(to, to, s.id);
  return { ok: true };
}));
app.post('/api/subscriptions/:id/pause', auth('admin', 'staff'), wrap(req => {
  const s = getSub(req.params.id);
  if (!s.pausable) throw err(400, 'This plan cannot be paused');
  if (s.status !== 'active') throw err(400, 'Only active subscriptions can be paused');
  db.prepare('UPDATE subscriptions SET paused=1 WHERE id=?').run(s.id); return { ok: true };
}));
app.post('/api/subscriptions/:id/resume', auth('admin', 'staff'), wrap(req => { db.prepare('UPDATE subscriptions SET paused=0 WHERE id=?').run(getSub(req.params.id).id); return { ok: true }; }));
app.post('/api/subscriptions/:id/renew', auth('admin', 'staff'), wrap(req => {
  const s = getSub(req.params.id);
  if (!s.renewable) throw err(400, 'This plan cannot be renewed');
  if (!['active', 'closed'].includes(s.status)) throw err(400, 'Only active or closed subscriptions can be renewed');
  db.prepare("UPDATE subscriptions SET expiry_date=?, status='active', paused=0, next_invoice_date=COALESCE(MAX(next_invoice_date,?),?) WHERE id=?")
    .run(addPeriod(s.expiry_date, s.billing_period), s.expiry_date, s.expiry_date, s.id);
  return { ok: true };
}));

const pageOf = req => { const limit = Math.min(+req.query.limit || 20, 200); return { limit, offset: ((+req.query.page || 1) - 1) * limit }; };
app.get('/api/subscriptions', auth(), wrap(req => {
  const { limit, offset } = pageOf(req), w = [], a = [];
  if (req.user.role === 'customer') { w.push('s.customer_id=?'); a.push(req.user.id); }
  if (req.query.status) { w.push('s.status=?'); a.push(req.query.status); }
  if (req.query.q) { w.push('(s.number LIKE ? OR u.name LIKE ?)'); a.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
  const from = `FROM subscriptions s JOIN users u ON u.id=s.customer_id JOIN plans p ON p.id=s.plan_id ${where}`;
  return {
    total: db.prepare(`SELECT COUNT(*) c ${from}`).get(...a).c,
    rows: db.prepare(`SELECT s.*,u.name customer_name,p.name plan_name,p.closable,p.pausable,p.renewable,
      (SELECT COALESCE(SUM(quantity*unit_price),0) FROM subscription_lines WHERE subscription_id=s.id) amount
      ${from} ORDER BY s.id DESC LIMIT ? OFFSET ?`).all(...a, limit, offset)
  };
}));
app.get('/api/subscriptions/:id', auth(), wrap(req => {
  const s = getSub(req.params.id);
  if (req.user.role === 'customer' && s.customer_id !== req.user.id) throw err(403, 'Not your subscription');
  s.lines = db.prepare(`SELECT l.*,pr.name product_name,t.rate tax_rate FROM subscription_lines l JOIN products pr ON pr.id=l.product_id LEFT JOIN taxes t ON t.id=l.tax_id WHERE subscription_id=?`).all(s.id);
  return s;
}));

/* ---------- billing engine ---------- */
function createInvoice(s, ps, pe, onDay) {
  if (db.prepare('SELECT 1 FROM invoices WHERE subscription_id=? AND period_start=?').get(s.id, ps)) return null; // never twice
  const lines = db.prepare(`SELECT l.*,pr.name pname,COALESCE(t.rate,0) rate FROM subscription_lines l
    JOIN products pr ON pr.id=l.product_id LEFT JOIN taxes t ON t.id=l.tax_id WHERE l.subscription_id=?`).all(s.id);
  const discs = db.prepare(`SELECT * FROM discounts WHERE (start_date IS NULL OR start_date<=?) AND (end_date IS NULL OR end_date>=?)
    AND (usage_limit IS NULL OR used_count<usage_limit)`).all(onDay, onDay);
  const used = new Set();
  const calc = (d, base) => Math.min(base, d.type === 'percent' ? base * d.value / 100 : d.value);

  // 1) product-level discounts
  const items = lines.map(l => {
    const gross = r2(l.quantity * l.unit_price); let disc = 0;
    for (const d of discs) {
      if (d.applies_to !== 'product' || d.product_id !== l.product_id) continue;
      if (gross < d.min_purchase || l.quantity < d.min_qty) continue;
      disc += calc(d, gross - disc); used.add(d.id);
    }
    return { l, gross, disc: r2(disc) };
  });
  // 2) subscription-level discounts on what remains
  const afterLine = items.reduce((a, i) => a + i.gross - i.disc, 0);
  const totalQty = lines.reduce((a, l) => a + l.quantity, 0);
  let subDisc = 0;
  for (const d of discs) {
    if (d.applies_to !== 'subscription' || (d.subscription_id && d.subscription_id !== s.id)) continue;
    if (afterLine < d.min_purchase || totalQty < d.min_qty) continue;
    subDisc += calc(d, afterLine - subDisc); used.add(d.id);
  }
  subDisc = r2(subDisc);

  let subtotal = 0, discTotal = 0, taxTotal = 0;
  const out = items.map(({ l, gross, disc }) => {
    const share = afterLine > 0 ? subDisc * (gross - disc) / afterLine : 0;
    const lineDisc = r2(disc + share), net = r2(gross - lineDisc), tax = r2(net * l.rate / 100);
    subtotal += gross; discTotal += lineDisc; taxTotal += tax;
    return { desc: l.pname + (l.variant_id ? ' (variant)' : ''), qty: l.quantity, price: l.unit_price, lineDisc, rate: l.rate, tax, net };
  });
  const total = r2(subtotal - discTotal + taxTotal);
  const days = parseInt((s.payment_terms.match(/\d+/) || [0])[0]);
  const id = db.prepare(`INSERT INTO invoices(number,subscription_id,customer_id,period_start,period_end,issue_date,due_date,subtotal,discount_total,tax_total,total)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(nextNo('INV-', 'invoices'), s.id, s.customer_id, ps, pe, onDay, addDays(onDay, days), r2(subtotal), r2(discTotal), r2(taxTotal), total).lastInsertRowid;
  for (const o of out) db.prepare('INSERT INTO invoice_lines(invoice_id,description,quantity,unit_price,discount,tax_rate,tax_amount,amount) VALUES(?,?,?,?,?,?,?,?)')
    .run(id, o.desc, o.qty, o.price, o.lineDisc, o.rate, o.tax, o.net);
  for (const did of used) db.prepare('UPDATE discounts SET used_count=used_count+1 WHERE id=?').run(did);
  return id;
}
function generateInvoices(onDay, autoConfirm) {
  const subs = db.prepare(`SELECT s.*,p.billing_period FROM subscriptions s JOIN plans p ON p.id=s.plan_id
    WHERE s.status='active' AND s.paused=0 AND s.next_invoice_date<=? AND s.next_invoice_date<s.expiry_date`).all(onDay);
  let created = 0, skipped = 0;
  for (const s of subs) db.transaction(() => {
    let ns = s.next_invoice_date, guard = 0;
    while (ns <= onDay && ns < s.expiry_date && guard++ < 60) {
      const pe = addPeriod(ns, s.billing_period);
      const id = createInvoice(s, ns, pe, onDay);
      if (id) { created++; if (autoConfirm) db.prepare("UPDATE invoices SET status='confirmed' WHERE id=?").run(id); } else skipped++;
      ns = pe;
    }
    db.prepare('UPDATE subscriptions SET next_invoice_date=? WHERE id=?').run(ns, s.id);
  })();
  // plans set to close on their own once expired and fully billed
  const closed = db.prepare(`UPDATE subscriptions SET status='closed' WHERE status='active' AND expiry_date<=? AND next_invoice_date>=expiry_date
    AND plan_id IN (SELECT id FROM plans WHERE auto_close=1)`).run(onDay).changes;
  return { due: subs.length, created, skipped, auto_closed: closed };
}
app.post('/api/invoices/generate', auth('admin', 'staff'), wrap(req => generateInvoices(req.body.date || today(), !!req.body.auto_confirm)));

/* ---------- invoices ---------- */
function getInvoice(id, user) {
  const i = db.prepare('SELECT i.*,u.name customer_name,u.email customer_email,s.number subscription_number FROM invoices i JOIN users u ON u.id=i.customer_id JOIN subscriptions s ON s.id=i.subscription_id WHERE i.id=?').get(id);
  if (!i) throw err(404, 'Invoice not found');
  if (user.role === 'customer' && i.customer_id !== user.id) throw err(403, 'Not your invoice');
  i.lines = db.prepare('SELECT * FROM invoice_lines WHERE invoice_id=?').all(id);
  i.payments = db.prepare('SELECT * FROM payments WHERE invoice_id=? ORDER BY date').all(id);
  return i;
}
app.get('/api/invoices', auth(), wrap(req => {
  const { limit, offset } = pageOf(req), w = [], a = [];
  if (req.user.role === 'customer') { w.push('i.customer_id=?'); a.push(req.user.id); }
  if (req.query.status) { w.push('i.status=?'); a.push(req.query.status); }
  if (req.query.overdue) { w.push("i.status='confirmed' AND i.due_date<?"); a.push(today()); }
  if (req.query.q) { w.push('(i.number LIKE ? OR u.name LIKE ?)'); a.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const from = `FROM invoices i JOIN users u ON u.id=i.customer_id ${w.length ? 'WHERE ' + w.join(' AND ') : ''}`;
  return {
    total: db.prepare(`SELECT COUNT(*) c ${from}`).get(...a).c,
    rows: db.prepare(`SELECT i.*,u.name customer_name ${from} ORDER BY i.id DESC LIMIT ? OFFSET ?`).all(...a, limit, offset)
  };
}));
app.get('/api/invoices/:id', auth(), wrap(req => getInvoice(req.params.id, req.user)));
app.post('/api/invoices/:id/confirm', auth('admin', 'staff'), wrap(req => {
  const i = getInvoice(req.params.id, req.user);
  if (i.status !== 'draft') throw err(400, 'Only draft invoices can be confirmed');
  db.prepare("UPDATE invoices SET status='confirmed' WHERE id=?").run(i.id); return { ok: true };
}));
app.post('/api/invoices/:id/cancel', auth('admin', 'staff'), wrap(req => {
  const i = getInvoice(req.params.id, req.user);
  if (!['draft', 'confirmed'].includes(i.status) || i.paid_amount > 0) throw err(400, 'This invoice cannot be cancelled');
  db.prepare("UPDATE invoices SET status='cancelled' WHERE id=?").run(i.id); return { ok: true };
}));
app.post('/api/invoices/:id/send', auth('admin', 'staff'), wrap(req => {
  const i = getInvoice(req.params.id, req.user);
  if (i.status === 'cancelled') throw err(400, 'Cancelled invoice');
  sendMail(i.customer_email, `Invoice ${i.number}`, `Hi ${i.customer_name},\nInvoice ${i.number} for ${i.total.toFixed(2)} is due on ${i.due_date}.`).catch(console.error);
  db.prepare("UPDATE invoices SET sent_at=datetime('now') WHERE id=?").run(i.id); return { ok: true };
}));
app.get('/api/invoices/:id/print', auth(), (req, res) => {
  try {
    const i = getInvoice(req.params.id, req.user), m = n => Number(n).toFixed(2);
    res.send(`<!doctype html><meta charset=utf-8><title>${i.number}</title><style>body{font-family:sans-serif;max-width:760px;margin:30px auto}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}.r{text-align:right}</style>
<h1>Brightloop Software</h1><h2>Invoice ${i.number} <small>(${i.status})</small></h2>
<p>Customer: ${i.customer_name}<br>Subscription: ${i.subscription_number}<br>Period: ${i.period_start} → ${i.period_end}<br>Issued: ${i.issue_date} · Due: ${i.due_date}</p>
<table><tr><th>Item</th><th class=r>Qty</th><th class=r>Price</th><th class=r>Discount</th><th class=r>Tax %</th><th class=r>Amount</th></tr>
${i.lines.map(l => `<tr><td>${l.description}</td><td class=r>${l.quantity}</td><td class=r>${m(l.unit_price)}</td><td class=r>${m(l.discount)}</td><td class=r>${l.tax_rate}</td><td class=r>${m(l.amount)}</td></tr>`).join('')}</table>
<p class=r>Subtotal ${m(i.subtotal)}<br>Discount −${m(i.discount_total)}<br>Tax ${m(i.tax_total)}<br><b>Total ${m(i.total)}</b><br>Paid ${m(i.paid_amount)}<br><b>Balance ${m(i.total - i.paid_amount)}</b></p>
<script>window.print()</script>`);
  } catch (e) { res.status(e.status || 500).send(e.message); }
});

/* ---------- payments ---------- */
app.post('/api/payments', auth('admin', 'staff'), wrap(req => db.transaction(() => {
  const { invoice_id, method, amount, date, note } = req.body;
  const i = db.prepare('SELECT * FROM invoices WHERE id=?').get(invoice_id);
  if (!i) throw err(404, 'Invoice not found');
  if (i.status !== 'confirmed') throw err(400, 'Only confirmed invoices can receive payments');
  const amt = r2(Number(amount));
  if (!(amt > 0)) throw err(400, 'Amount must be positive');
  if (!method) throw err(400, 'Payment method required');
  if (amt > r2(i.total - i.paid_amount) + 0.001) throw err(400, `Amount exceeds balance (${r2(i.total - i.paid_amount)})`);
  db.prepare('INSERT INTO payments(invoice_id,method,amount,date,note) VALUES(?,?,?,?,?)').run(i.id, method, amt, date || today(), clean(note));
  const paid = r2(i.paid_amount + amt);
  db.prepare('UPDATE invoices SET paid_amount=?, status=? WHERE id=?').run(paid, paid >= i.total - 0.001 ? 'paid' : 'confirmed', i.id);
  return { ok: true, status: paid >= i.total - 0.001 ? 'paid' : 'confirmed' };
})()));
app.get('/api/payments', auth('admin', 'staff'), wrap(req => {
  const { limit, offset } = pageOf(req);
  return db.prepare(`SELECT p.*,i.number invoice_number,u.name customer_name FROM payments p JOIN invoices i ON i.id=p.invoice_id JOIN users u ON u.id=i.customer_id ORDER BY p.id DESC LIMIT ? OFFSET ?`).all(limit, offset);
}));

/* ---------- finance dashboard ---------- */
app.get('/api/reports/summary', auth('admin', 'staff'), wrap(req => {
  const from = req.query.from || '0000-01-01', to = req.query.to || '9999-12-31';
  const active = db.prepare("SELECT COUNT(*) c FROM subscriptions WHERE status='active'").get().c;
  const revenue = db.prepare('SELECT COALESCE(SUM(amount),0) v FROM payments WHERE date BETWEEN ? AND ?').get(from, to).v;
  const outstanding = db.prepare("SELECT COALESCE(SUM(total-paid_amount),0) v FROM invoices WHERE status='confirmed'").get().v;
  const overdue = db.prepare(`SELECT i.*,u.name customer_name FROM invoices i JOIN users u ON u.id=i.customer_id WHERE i.status='confirmed' AND i.due_date<? ORDER BY i.due_date LIMIT 50`).all(today());
  const overdueCount = db.prepare("SELECT COUNT(*) c FROM invoices WHERE status='confirmed' AND due_date<?").get(today()).c;
  const factor = { daily: 30, weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };
  const mrr = db.prepare(`SELECT p.billing_period bp, SUM(l.quantity*l.unit_price) v FROM subscriptions s JOIN plans p ON p.id=s.plan_id
    JOIN subscription_lines l ON l.subscription_id=s.id WHERE s.status='active' AND s.paused=0 GROUP BY p.billing_period`).all()
    .reduce((a, r) => a + r.v * factor[r.bp], 0);
  return { active, revenue: r2(revenue), outstanding: r2(outstanding), overdue_count: overdueCount, overdue, mrr: r2(mrr) };
}));

app.listen(PORT, () => console.log(`Brightloop running → http://localhost:${PORT}  (admin@brightloop.com / Admin@12345)`));
