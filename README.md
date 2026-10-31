# Brightloop Subscription Management System

Odoo x FLUX Lucknow Hackathon '26 – Virtual Round.

**Stack:** Node.js, Express, SQLite (better-sqlite3), JWT auth, vanilla JS UI.

## Run
```bash
npm install
npm start            # http://localhost:3000
npm test             # (with server running) end-to-end smoke test
```
Demo admin: `admin@brightloop.com` / `Admin@12345`

Optional env: `JWT_SECRET`, `PORT`, `BASE_URL`, `SMTP_HOST/PORT/USER/PASS/FROM` (without SMTP, emails are printed to the server console).

## Features
- Signup (unique email, strong password), login, forgot/reset password (emailed link)
- Roles: admin (everything, adds staff), staff (day-to-day ops), customer (portal: own subscriptions and invoices)
- Products + variants (e.g. brand Odoo +560), plans (daily/weekly/monthly/yearly, min qty, availability dates, auto-close/closable/pausable/renewable)
- Quotation templates → subscriptions (Draft → Quotation → Confirmed → Active → Closed), pause/resume/renew
- One-click invoice generation, idempotent (UNIQUE subscription+period), auto tax, auto discounts
- Invoice Draft → Confirmed → Paid, cancel/send/print
- Discount rules (fixed/percent, min purchase/qty, dates, usage limit; per product or subscription)
- Payments (method, amount, date, note) with partial payments
- Finance dashboard: active subs, MRR, revenue (date filter), outstanding, overdue; indexed + paginated for speed
