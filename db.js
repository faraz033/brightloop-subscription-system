const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database(process.env.DB_FILE || 'brightloop.db');
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
-- indexes keep every page under 2s with thousands of rows
CREATE INDEX IF NOT EXISTS ix_sub_status ON subscriptions(status, next_invoice_date);
CREATE INDEX IF NOT EXISTS ix_sub_cust ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS ix_inv_status ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS ix_inv_cust ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS ix_pay_inv ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS ix_pay_date ON payments(date);
`);

// ---- seed demo data on first run ----
if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  const h = p => bcrypt.hashSync(p, 10);
  db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES('Admin','admin@brightloop.com',?,'admin')").run(h('Admin@12345'));
  db.prepare("INSERT INTO taxes(name,rate,is_default) VALUES('GST 18%',18,1),('GST 5%',5,0)").run();
  const pid = db.prepare("INSERT INTO products(name,type,sales_price,cost_price,notes) VALUES('Brightloop CRM','service',1000,400,'CRM seat')").run().lastInsertRowid;
  db.prepare("INSERT INTO product_variants(product_id,attribute,value,extra_price) VALUES(?,?,?,?)").run(pid, 'Brand', 'Odoo', 560);
  db.prepare("INSERT INTO plans(name,product_id,price,billing_period,min_qty,start_date,end_date,auto_close,closable,pausable,renewable) VALUES('CRM Monthly',?,1000,'monthly',1,'2026-01-01','2030-12-31',0,1,1,1)").run(pid);
}

module.exports = db;
