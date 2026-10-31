# ⚡ Brightloop — Subscription Management & Recurring Billing Platform

> **Odoo x FLUX Lucknow Hackathon '26** — Virtual Round Project  
> 🌐 **Live Deployed Application:** [https://brightloop-subscription-system.onrender.com](https://brightloop-subscription-system.onrender.com)

---

## 🚀 Live Demo & Quick Access

- **Production URL:** [https://brightloop-subscription-system.onrender.com](https://brightloop-subscription-system.onrender.com)
- **⚡ 1-Click Jury Demo Tour:** Click the **`🎯 1-Click Demo`** button in the top navigation bar inside the Control Room for an automated 10-second guided system showcase.

### 👥 Test Credentials (or use the 1-Click Demo Badges on the Sign-in modal)
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@brightloop.com` | `Admin@12345` | Full administrative control, staff management, automation toggle |
| 💼 **Staff** | `staff@brightloop.com` | `Staff@12345` | Contract lifecycle, invoices, discounts, manual payments |
| 👤 **Customer** | `customer@brightloop.com` | `Customer@12345` | Self-service portal: view own contracts, invoices & instant UPI/Card checkout |

---

## ✨ Standout Features & Hackathon Differentiators

### 1. 🔄 Odoo Life-Cycle Pipeline & Smart Stat Drill-Down
- **Odoo-Style Smart Stat Buttons:** Every subscription features real-time quick-stat tiles:
  - 🧾 **Invoices Count:** Lifetime generated invoices with smooth scroll anchor.
  - 💰 **Total Billed:** Cumulative value invoiced over the contract term.
  - 💳 **Total Collected:** Total payments successfully settled.
  - ⚖️ **Outstanding Balance:** Real-time due balance with visual status cues.
  - ⏳ **Next Billing Date:** Scheduled recurring date with leap-year clamping tags.
- **Contract Pipeline Tracker:** Visual stage transitions (`Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`) with in-modal actions to advance, pause, resume, or renew terms.

### 2. ⚡ Automated Nightly Billing Scheduler & Date Clamping
- **Background Cron Worker:** Simulates automated midnight billing runs with a dedicated `billing_runs` audit log table.
- **Leap Year & Month-End Clamping (PRD §7):** Intelligent date arithmetic ensuring end-of-month contracts anchor correctly without skipping months (e.g., `Jan 31` ➔ `Feb 28` ➔ `Mar 31`).
- **Idempotency Guarantee:** Composite database constraint (`subscription_id` + `period_start`) ensures zero duplicate billing.

### 3. 💳 Customer Instant "Pay Now" Checkout Portal
- **Multi-Method Payment Gateway Simulation:**
  - 📱 **UPI QR / App:** Dynamic SVG QR code branded with Brightloop bolt icon (`billing@brightloop`), simulating instant PhonePe, GPay, and Paytm approvals.
  - 💳 **3D Card Checkout:** Sleek glassmorphism credit card preview with 1-click test card authorization.
  - 🏦 **Net Banking:** Instant bank authorization across top Indian institutions.
  - **Instant Payment Receipts:** Generates official printable PDF receipts with unique transaction references (`TXN-...`).

### 4. 🎨 poulo.site-Inspired Minimalist Design System
- Built with a high-contrast monochrome dark canvas (`#0a0a0a`), Inter typography, floating glassmorphism navigation pill (`backdrop-filter: blur(12px)`), and a signature lime brand accent (`#adfa1d`).
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
    ├── index.html        # App shell with poulo.site design system & theme toggle
    ├── js/
    │   ├── app.js        # SaaS control room, Odoo smart stats, checkout modal & jury tour
    │   └── landing.js    # Landing page animations & interactions
    └── css/
        ├── design-system.css # Base design tokens & typography
        ├── landing.css       # Landing page styling
        └── auth-app.css      # Control room & checkout portal styling
```

---

## 📄 License & Attribution

Built for the **Odoo x FLUX Lucknow Hackathon '26**. Licensed under the [MIT License](LICENSE).
