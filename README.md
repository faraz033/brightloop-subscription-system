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

## 📄 License

Licensed under the [MIT License](LICENSE).
