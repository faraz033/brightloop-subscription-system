# ⚡ Brightloop — Subscription Management & Recurring Billing Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-brightloop.onrender.com-0066cc?style=for-the-badge&logo=render&logoColor=white)](https://brightloop-subscription-system.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-24%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Native%20WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Tests](https://img.shields.io/badge/Tests-25%2F25%20Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](smoke-test.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> Enterprise-grade Subscription Management, Automated Recurring Billing Engine, and Financial Intelligence Platform.  
> 🌐 **Live Deployed Application:** [https://brightloop-subscription-system.onrender.com](https://brightloop-subscription-system.onrender.com)

---

## 🚀 Live Demo & Quick Access

- **Production URL:** [https://brightloop-subscription-system.onrender.com](https://brightloop-subscription-system.onrender.com)
- **⚡ Interactive System Tour:** Click the **`Guided Tour`** button in the top navigation bar inside the Control Room for an automated interactive system walkthrough.

### 👥 Test Credentials (or use the 1-Click Demo Badges on the Sign-in modal)
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@brightloop.com` | `Admin@12345` | Full administrative control, staff management, automation toggle |
| 💼 **Staff** | `staff@brightloop.com` | `Staff@12345` | Contract lifecycle, invoices, discounts, manual payments |
| 👤 **Customer** | `customer@brightloop.com` | `Customer@12345` | Self-service portal: view own contracts, invoices & instant UPI/Card checkout |

---

## ✨ Core Architecture & Key Platform Features

### 1. 🔄 Enterprise Subscription Lifecycle & Metric Drill-Down
- **Interactive Smart Stat Tiles:** Every subscription features real-time operational tiles:
  - 🧾 **Invoices Count:** Lifetime generated invoices with smooth scroll anchor.
  - 💰 **Total Billed:** Cumulative value invoiced over the contract term.
  - 💳 **Total Collected:** Total payments successfully settled.
  - ⚖️ **Outstanding Balance:** Real-time due balance with visual status cues.
  - ⏳ **Next Billing Date:** Scheduled recurring date with leap-year clamping tags.
- **Contract Pipeline Tracker:** Visual stage transitions (`Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`) with in-modal actions to advance, pause, resume, or renew terms.

### 2. ⚡ Automated Nightly Billing Scheduler & Date Clamping
- **Background Cron Worker:** Simulates automated midnight billing runs with a dedicated `billing_runs` audit log table.
- **Leap Year & Month-End Clamping:** Intelligent date arithmetic ensuring end-of-month contracts anchor correctly without skipping months (e.g., `Jan 31` ➔ `Feb 28` ➔ `Mar 31`).
- **Idempotency Guarantee:** Composite database constraint (`subscription_id` + `period_start`) ensures zero duplicate billing.

### 3. 💳 Customer Instant "Pay Now" Checkout Portal
- **Multi-Method Payment Gateway Simulation:**
  - 📱 **UPI QR / App:** Dynamic SVG QR code branded with Brightloop bolt icon (`billing@brightloop`), simulating instant PhonePe, GPay, and Paytm approvals.
  - 💳 **Card Checkout:** Modern credit card preview with 1-click test card authorization.
  - 🏦 **Net Banking:** Instant bank authorization across top institutions.
  - **Instant Payment Receipts:** Generates official printable PDF receipts with unique transaction references (`TXN-...`).

### 4. 🎨 Minimalist Design System & Theme Engine
- Built with high-contrast surfaces, SF Pro & Inter typography, Action Blue interactive accents, and a clean responsive layout.
- Includes a persistent **☀️ / 🌙 Light & Dark mode toggle** saved in `localStorage`.

### 5. 📊 Real-Time Financial Analytics & CSV Data Engine
- **Finance Intelligence:** Live normalized Monthly Recurring Revenue (MRR), revenue collected vs. outstanding balance ratio, and overdue invoice alerts.
- **1-Click CSV Exports:** Dedicated streaming endpoints for Invoices, Payments Ledger, and Subscriptions.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (Node 24 with native synchronous `node:sqlite`)
- **Backend:** Express.js, JWT Authentication, bcryptjs, crypto
- **Database:** SQLite (`brightloop.db`) with WAL mode and foreign key constraints
- **Frontend:** Vanilla JavaScript (ES6+), Vanilla CSS (zero heavy runtime frameworks)
- **Testing:** Comprehensive test suite (`smoke-test.js`) verifying 25/25 integration and security contracts

---

## 💻 Local Setup & Development

### 1. Clone the repository
```bash
git clone https://github.com/faraz033/brightloop-subscription-system.git
cd brightloop-subscription-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev      # Runs with Node --watch on http://localhost:3000
# or
npm start
```

### 4. Run the automated test suite
```bash
npm test         # Executes 25 end-to-end integration tests
```

---

## 📂 Project Architecture

```
brightloop/
├── db.js                 # SQLite schema initialization, relations & indices
├── server.js             # Express API routes, billing engine, scheduler, auth & CSV exports
├── smoke-test.js         # Comprehensive 25-point integration test suite
├── seed-demo-users.js    # Demo accounts seeder (Admin, Staff, Customer)
├── package.json          # Node configuration & scripts
└── public/
    ├── index.html        # App shell with design system & theme toggle
    ├── js/
    │   ├── app.js        # SaaS control room, smart stat analytics, checkout modal & interactive tour
    │   └── landing.js    # Landing page animations & interactions
    └── css/
        ├── design-system.css # Base design tokens & typography
        ├── landing.css       # Landing page styling
        └── auth-app.css      # Control room & checkout portal styling
```

---



---

## 📋 PRD Requirements Traceability Matrix

Brightloop is built strictly to satisfy every functional, mathematical, and security specification of the enterprise subscription and recurring billing problem statement.

| Module / Requirement | Specification & Business Logic | Implementation Reference | Test Verification |
| :--- | :--- | :--- | :--- |
| **1. Product & Variant Catalog** | Dynamic sales & cost pricing, service types, and multi-tier pricing variants with surcharge deltas. | `server.js` (`/api/products`), `db.js` (`products`, `product_variants`) | PASS (`smoke-test.js`) |
| **2. Recurring Billing Plans** | 4 cadences (daily, weekly, monthly, yearly), minimum quantity triggers, auto-close policies. | `server.js` (`/api/plans`, `addPeriod`), `db.js` (`plans`) | PASS (`smoke-test.js`) |
| **3. Contract Lifecycle** | Strict progression (`Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`). Enforces valid state transitions and blocks unauthorized rollbacks. | `server.js` (`/api/subscriptions/:id/status`) | PASS `status → quotation/confirmed/active` & `invalid transition blocked` |
| **4. Idempotent Invoice Engine** | Zero-duplicate recurring generation. Computes elapsed billing intervals and locks records via composite database key `UNIQUE(subscription_id, period_start)`. | `server.js` (`/api/invoices/generate`), `db.js` (`invoices`) | PASS `invoices generated for missed periods` & `second run creates nothing (no double billing)` |
| **5. Leap-Year & Month-End Clamping** | End-of-month anchor day preservation preventing billing drift (e.g., `Jan 31` ➔ `Feb 28` (or 29) ➔ `Mar 31`). | `server.js` (`addPeriod` with `anchorDay` memory) | PASS `month-end date clamping verified: 2026-02-28 -> 2026-03-31` |
| **6. Multi-Tier Discounts & Tax** | Percentage and fixed discounts gated by minimum quantity rules; automated 18% GST calculation on net post-discount subtotal. | `server.js` (`/api/discounts`, invoice calculation engine) | PASS `discount+tax math total=3313.44` |
| **7. Payment & Overpayment Guard** | Split/partial payments, multi-method settlement (UPI, Bank, Card, Cash), auto-reconciliation, and atomic lock preventing payments against settled invoices. | `server.js` (`/api/payments`, `db.js` (`payments`)) | PASS `partial payment keeps confirmed`, `full payment → paid`, `cannot pay a paid invoice` |
| **8. 3-Tier RBAC Security** | Strict role boundaries (`Admin`, `Staff`, `Customer`). Algorithm-pinned JWT (`HS256`), rate limiting, password complexity hashing, customer row-level isolation. | `server.js` (`auth(...roles)`, `jwt.verify`, `rateLimit`) | PASS `customer cannot add staff`, `customer sees only own invoices`, `other customer blocked` |
| **9. Real-Time Finance Analytics** | Live normalized Monthly Recurring Revenue (MRR across all cadences), cumulative billed vs collected, and instant overdue invoice detection. | `server.js` (`/api/reports/summary`), `public/js/app.js` | PASS `report active=49 revenue=... outstanding=... overdue=... mrr=...` |
| **10. Auditability & Export** | High-throughput streaming CSV exports for invoices, ledger transactions, and contracts; system health telemetry. | `server.js` (`/api/export/invoices`, `/api/health`) | PASS `invoices CSV export generated`, `health: healthy` |

---

## 🔒 Enterprise Security & Accessibility Compliance

- **OWASP & WCAG Hardened:**
  - **Content Security Policy (CSP):** Enforced via strict policy headers (`script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; frame-ancestors 'none'`).
  - **Algorithm Pinning:** JWT signature verification is explicitly pinned to `HS256` to block cryptographic algorithm confusion.
  - **Zero Unlabeled Elements:** 100% of form inputs feature explicit `aria-label` attributes and all decorative icons carry `aria-hidden="true"` for full screen-reader compliance.
  - **Theme-Adaptive High Contrast:** Dual-palette system with 7:1+ contrast ratios in both light and dark modes, completely eliminating low-contrast text.
  - **Wire Efficiency:** Built-in dynamic Gzip compression middleware serving compressed HTML/CSS/JS with over 80% wire payload reduction.

## 📄 License

Licensed under the [MIT License](LICENSE).
