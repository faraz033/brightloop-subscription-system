const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const db = new DatabaseSync(process.env.DB_FILE || 'brightloop.db');

// Add compatibility helpers
db.pragma = (str) => db.exec(`PRAGMA ${str}`);
db.transaction = (fn) => (...args) => {
  db.exec('BEGIN');
  try {
    const res = fn(...args);
    db.exec('COMMIT');
    return res;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','staff','customer')),
  reset_hash TEXT, reset_expires INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'service',
  sales_price REAL NOT NULL CHECK(sales_price>=0),
  cost_price REAL NOT NULL DEFAULT 0, notes TEXT
);
CREATE TABLE IF NOT EXISTS product_variants(
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL, value TEXT NOT NULL, extra_price REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS taxes(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  rate REAL NOT NULL CHECK(rate>=0), is_default INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS plans(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  price REAL NOT NULL CHECK(price>=0),
  billing_period TEXT NOT NULL CHECK(billing_period IN ('daily','weekly','monthly','yearly')),
  min_qty INTEGER NOT NULL DEFAULT 1,
  start_date TEXT, end_date TEXT,
  auto_close INTEGER NOT NULL DEFAULT 0, closable INTEGER NOT NULL DEFAULT 1,
  pausable INTEGER NOT NULL DEFAULT 0, renewable INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS discounts(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fixed','percent')),
  value REAL NOT NULL CHECK(value>=0),
  min_purchase REAL NOT NULL DEFAULT 0, min_qty INTEGER NOT NULL DEFAULT 0,
  start_date TEXT, end_date TEXT,
  usage_limit INTEGER, used_count INTEGER NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'subscription' CHECK(applies_to IN ('product','subscription')),
  product_id INTEGER REFERENCES products(id),
  subscription_id INTEGER
);
CREATE TABLE IF NOT EXISTS quotation_templates(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  validity_days INTEGER NOT NULL DEFAULT 30
);
CREATE TABLE IF NOT EXISTS template_lines(
  id INTEGER PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1, tax_id INTEGER REFERENCES taxes(id)
);
CREATE TABLE IF NOT EXISTS subscriptions(
  id INTEGER PRIMARY KEY, number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  start_date TEXT NOT NULL, expiry_date TEXT NOT NULL,
  payment_terms TEXT NOT NULL DEFAULT 'Immediate',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','quotation','confirmed','active','closed')),
  paused INTEGER NOT NULL DEFAULT 0,
  next_invoice_date TEXT, quote_valid_until TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS subscription_lines(
  id INTEGER PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK(quantity>0),
  unit_price REAL NOT NULL, tax_id INTEGER REFERENCES taxes(id)
);
CREATE TABLE IF NOT EXISTS invoices(
  id INTEGER PRIMARY KEY, number TEXT NOT NULL UNIQUE,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  customer_id INTEGER NOT NULL REFERENCES users(id),
  period_start TEXT NOT NULL, period_end TEXT NOT NULL,
  issue_date TEXT NOT NULL, due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','confirmed','paid','cancelled')),
  subtotal REAL NOT NULL, discount_total REAL NOT NULL DEFAULT 0,
  tax_total REAL NOT NULL, total REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0, sent_at TEXT,
  UNIQUE(subscription_id, period_start)   -- guarantees nothing is billed twice
);
CREATE TABLE IF NOT EXISTS invoice_lines(
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0, tax_rate REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0, amount REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS payments(
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  method TEXT NOT NULL, amount REAL NOT NULL CHECK(amount>0),
  date TEXT NOT NULL, note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS billing_runs(
  id INTEGER PRIMARY KEY,
  run_type TEXT NOT NULL DEFAULT 'auto' CHECK(run_type IN ('auto','manual')),
  triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
  billing_date TEXT NOT NULL,
  due_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  auto_closed_count INTEGER NOT NULL DEFAULT 0
);
-- indexes keep every page under 2s with thousands of rows
CREATE INDEX IF NOT EXISTS ix_sub_status ON subscriptions(status, next_invoice_date);
CREATE INDEX IF NOT EXISTS ix_sub_cust ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS ix_inv_status ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS ix_inv_cust ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS ix_pay_inv ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS ix_pay_date ON payments(date);
CREATE INDEX IF NOT EXISTS ix_billing_runs_date ON billing_runs(triggered_at);
`);

// ---- seed demo data on first run ----
const h = p => bcrypt.hashSync(p, 10);

if (!db.prepare("SELECT 1 FROM users WHERE email='admin@brightloop.com'").get()) {
  db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES('Admin','admin@brightloop.com',?,'admin')").run(h('Admin@12345'));
}
if (!db.prepare("SELECT 1 FROM users WHERE email='staff@brightloop.com'").get()) {
  db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES('Sarah Connor','staff@brightloop.com',?,'staff')").run(h('Staff@12345'));
}
if (!db.prepare("SELECT 1 FROM users WHERE email='customer@brightloop.com'").get()) {
  db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES('Alex Morgan','customer@brightloop.com',?,'customer')").run(h('Customer@12345'));
}

if (!db.prepare('SELECT 1 FROM taxes LIMIT 1').get()) {
  db.prepare("INSERT INTO taxes(name,rate,is_default) VALUES('GST 18%',18,1),('GST 5%',5,0)").run();
}

if (!db.prepare('SELECT 1 FROM products LIMIT 1').get()) {
  const pid = db.prepare("INSERT INTO products(name,type,sales_price,cost_price,notes) VALUES('Brightloop CRM','service',1000,400,'CRM Enterprise Seat')").run().lastInsertRowid;
  const vid = db.prepare("INSERT INTO product_variants(product_id,attribute,value,extra_price) VALUES(?,?,?,?)").run(pid, 'Edition', 'Odoo Enhanced', 560).lastInsertRowid;
  const planId = db.prepare("INSERT INTO plans(name,product_id,price,billing_period,min_qty,start_date,end_date,auto_close,closable,pausable,renewable) VALUES('Enterprise Monthly',?,1560,'monthly',1,'2026-01-01','2030-12-31',0,1,1,1)").run(pid).lastInsertRowid;
  
  // Seed sample quotation template
  const tplId = db.prepare("INSERT INTO quotation_templates(name,plan_id,validity_days) VALUES('Standard SaaS Package',?,30)").run(planId).lastInsertRowid;
  db.prepare("INSERT INTO template_lines(template_id,product_id,variant_id,quantity,tax_id) VALUES(?,?,?,1,1)").run(tplId, pid, vid);

  // Seed sample active subscription for customer
  const cust = db.prepare("SELECT id FROM users WHERE email='customer@brightloop.com'").get();
  if (cust) {
    const subId = db.prepare("INSERT INTO subscriptions(number,customer_id,plan_id,start_date,expiry_date,payment_terms,status,paused,next_invoice_date) VALUES('SUB-000001',?,?, '2026-01-01', '2027-01-01', 'Immediate', 'active', 0, '2026-03-01')").run(cust.id, planId).lastInsertRowid;
    db.prepare("INSERT INTO subscription_lines(subscription_id,product_id,variant_id,quantity,unit_price,tax_id) VALUES(?,?,?,?,1560,1)").run(subId, pid, vid, 2);

    // Seed sample invoices: 1 paid, 1 confirmed (ready to pay)
    const inv1 = db.prepare("INSERT INTO invoices(number,subscription_id,customer_id,period_start,period_end,issue_date,due_date,status,subtotal,discount_total,tax_total,total,paid_amount) VALUES('INV-000001',?,?, '2026-01-01', '2026-02-01', '2026-01-01', '2026-01-15', 'paid', 3120, 0, 561.6, 3681.6, 3681.6)").run(subId, cust.id).lastInsertRowid;
    db.prepare("INSERT INTO invoice_lines(invoice_id,description,quantity,unit_price,discount,tax_rate,tax_amount,amount) VALUES(?,'Brightloop CRM - Edition: Odoo Enhanced',2,1560,0,18,561.6,3681.6)").run(inv1);
    db.prepare("INSERT INTO payments(invoice_id,method,amount,date,note) VALUES(?,'upi',3681.6,'2026-01-02','Initial period settlement via UPI')").run(inv1);

    const inv2 = db.prepare("INSERT INTO invoices(number,subscription_id,customer_id,period_start,period_end,issue_date,due_date,status,subtotal,discount_total,tax_total,total,paid_amount) VALUES('INV-000002',?,?, '2026-02-01', '2026-03-01', '2026-02-01', '2026-02-15', 'confirmed', 3120, 0, 561.6, 3681.6, 0)").run(subId, cust.id).lastInsertRowid;
    db.prepare("INSERT INTO invoice_lines(invoice_id,description,quantity,unit_price,discount,tax_rate,tax_amount,amount) VALUES(?,'Brightloop CRM - Edition: Odoo Enhanced',2,1560,0,18,561.6,3681.6)").run(inv2);
  }
}

module.exports = db;
