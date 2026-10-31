// Run: start server (DB_FILE=test.db npm start) then `node smoke-test.js`
const B = process.env.BASE || 'http://localhost:3000';
const call = async (p, m = 'GET', b, t) => {
  const r = await fetch(B + '/api' + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
  return { s: r.status, j: await r.json().catch(() => ({})) };
};
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const e = Date.now() + '@t.com';
  ok((await call('/auth/signup', 'POST', { name: 'X', email: e, password: 'short' })).s === 400, 'weak password rejected');
  ok((await call('/auth/signup', 'POST', { name: 'X', email: e, password: 'Strong#Pass1' })).s === 200, 'signup ok');
  ok((await call('/auth/signup', 'POST', { name: 'X', email: e, password: 'Strong#Pass1' })).s === 409, 'duplicate email rejected');
  const cust = (await call('/auth/login', 'POST', { email: e, password: 'Strong#Pass1' })).j;
  const admin = (await call('/auth/login', 'POST', { email: 'admin@brightloop.com', password: 'Admin@12345' })).j.token;
  ok((await call('/staff', 'POST', { name: 'S', email: 's' + e, password: 'Strong#Pass1' }, cust.token)).s === 403, 'customer cannot add staff');
  ok((await call('/staff', 'POST', { name: 'S', email: 's' + e, password: 'Strong#Pass1' }, admin)).s === 200, 'admin adds staff');
  ok((await call('/discounts', 'POST', { name: 'x', type: 'fixed', value: 1, applies_to: 'subscription' }, cust.token)).s === 403, 'customer cannot create discount');
  const existingDiscounts = (await call('/discounts', 'GET', null, admin)).j || [];
  for (const d of existingDiscounts) await call('/discounts/' + d.id, 'DELETE', null, admin);
  await call('/discounts', 'POST', { name: '10% off', type: 'percent', value: 10, min_qty: 2, applies_to: 'subscription' }, admin);
  const prods = (await call('/products', 'GET', null, admin)).j, p = prods[0];
  const plans = (await call('/plans', 'GET', null, admin)).j;
  const start = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
  const sub = await call('/subscriptions', 'POST', { customer_id: cust.user.id, plan_id: plans[0].id, start_date: start, payment_terms: 'Net 15', lines: [{ product_id: p.id, variant_id: p.variants[0].id, quantity: 2 }] }, admin);
  ok(sub.s === 200, 'subscription created ' + sub.j.number);
  for (const st of ['quotation', 'confirmed', 'active']) ok((await call(`/subscriptions/${sub.j.id}/status`, 'POST', { status: st }, admin)).s === 200, 'status → ' + st);
  ok((await call(`/subscriptions/${sub.j.id}/status`, 'POST', { status: 'draft' }, admin)).s === 400, 'invalid transition blocked');
  const g1 = (await call('/invoices/generate', 'POST', {}, admin)).j, g2 = (await call('/invoices/generate', 'POST', {}, admin)).j;
  ok(g1.created >= 2, 'invoices generated for missed periods: ' + g1.created);
  ok(g2.created === 0, 'second run creates nothing (no double billing)');
  const invs = (await call('/invoices?status=draft', 'GET', null, admin)).j.rows;
  const inv = invs.find(r => r.customer_id === cust.user.id) || invs[0], d = (await call('/invoices/' + inv.id, 'GET', null, admin)).j;
  // 2 x (1000+560)=3120, -10% = 312, net 2808, +18% tax = 505.44 -> 3313.44
  ok(Math.abs(d.total - 3313.44) < 0.01, 'discount+tax math total=' + d.total);
  ok((await call(`/invoices/${inv.id}/confirm`, 'POST', {}, admin)).s === 200, 'invoice confirmed');
  ok((await call('/payments', 'POST', { invoice_id: inv.id, method: 'bank', amount: 1000 }, admin)).j.status === 'confirmed', 'partial payment keeps confirmed');
  ok((await call('/payments', 'POST', { invoice_id: inv.id, method: 'upi', amount: d.total - 1000 }, admin)).j.status === 'paid', 'full payment → paid');
  ok((await call('/payments', 'POST', { invoice_id: inv.id, method: 'upi', amount: 1 }, admin)).s === 400, 'cannot pay a paid invoice');
  const mine = (await call('/invoices', 'GET', null, cust.token)).j;
  ok(mine.rows.length >= 2 && mine.rows.every(r => r.customer_id === cust.user.id), 'customer sees only own invoices');
  ok((await call('/invoices/' + inv.id, 'GET', null, (await call('/auth/signup', 'POST', { name: 'O', email: 'o' + e, password: 'Strong#Pass1' })).j.token)).s === 403, 'other customer blocked');
  // overdue: second subscription billed 60 days ago with immediate terms, auto-confirmed
  const old = d0 => new Date(Date.now() - d0 * 864e5).toISOString().slice(0, 10);
  const s2 = (await call('/subscriptions', 'POST', { customer_id: cust.user.id, plan_id: plans[0].id, start_date: old(90), payment_terms: 'Immediate', lines: [{ product_id: p.id, quantity: 1 }] }, admin)).j;
  for (const st of ['quotation', 'confirmed', 'active']) await call(`/subscriptions/${s2.id}/status`, 'POST', { status: st }, admin);
  await call('/invoices/generate', 'POST', { date: old(60), auto_confirm: true }, admin);
  const rep = (await call('/reports/summary', 'GET', null, admin)).j;
  ok(rep.active >= 1 && rep.revenue >= d.total && rep.overdue_count >= 1, `report active=${rep.active} revenue=${rep.revenue} outstanding=${rep.outstanding} overdue=${rep.overdue_count} mrr=${rep.mrr}`);
  const autoStatus = (await call('/automation/status', 'GET', null, admin)).j;
  ok(autoStatus.active === true && Array.isArray(autoStatus.recent_runs), 'automation status active');
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})();
