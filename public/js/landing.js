/* ==========================================================================
   BRIGHTLOOP LANDING PAGE INTERACTIVE LOGIC
   Parallax • Lifecycle Stepper • Showcase Tabs • FAQ Accordion & Filter
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initShowcaseTabs();
  initLifecycleExplorer();
  initFaqAccordion();
  initHeroParallax();
  initScrollAnimations();
});

/* --------------------------------------------------
   1. NAVBAR SCROLL & ACTIVE LINK TRACKING
   -------------------------------------------------- */
function initNavbar() {
  const navbar = document.getElementById('mainNavbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#' && !targetId.startsWith('#app') && !targetId.startsWith('#login')) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

/* --------------------------------------------------
   2. HERO SUBTLE PARALLAX & CURSOR MOTION
   -------------------------------------------------- */
function initHeroParallax() {
  const stage = document.getElementById('heroVisualStage');
  if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const cards = stage.querySelectorAll('.floating-sub-card, .floating-invoice-card, .floating-payment-pill');
    cards.forEach((card, idx) => {
      const depth = (idx + 1) * 12;
      card.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
    });

    const mascot = stage.querySelector('.mascot-hero-img');
    if (mascot) {
      mascot.style.transform = `rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale(1.02)`;
    }
  });

  stage.addEventListener('mouseleave', () => {
    const cards = stage.querySelectorAll('.floating-sub-card, .floating-invoice-card, .floating-payment-pill');
    cards.forEach(card => card.style.transform = '');
    const mascot = stage.querySelector('.mascot-hero-img');
    if (mascot) mascot.style.transform = '';
  });
}

/* --------------------------------------------------
   3. PRODUCT SHOWCASE TABS (REAL APP SCREENSHOTS)
   -------------------------------------------------- */
const showcaseData = {
  dashboard: {
    title: 'Finance Overview & Real-Time Metrics',
    url: 'https://app.brightloop.com/dashboard/finance',
    img: '/screenshots/dashboard.png',
    desc: 'Live financial telemetry: Monthly Recurring Revenue (MRR), total collected revenue, outstanding balances, and overdue invoices with zero guesswork.'
  },
  subscriptions: {
    title: 'Customer Subscriptions & Contract Lifecycles',
    url: 'https://app.brightloop.com/subscriptions/active',
    img: '/screenshots/subscriptions.png',
    desc: 'Manage subscription records across DRAFT, QUOTATION, CONFIRMED, ACTIVE, and CLOSED stages. Configure line items, quantities, and payment terms.'
  },
  invoices: {
    title: 'Automated Invoice Generation & Tax Engines',
    url: 'https://app.brightloop.com/invoices/all',
    img: '/screenshots/invoices.png',
    desc: 'Draft, confirm, print, and track recurring invoices. Mathematical uniqueness prevents duplicate billing across consecutive billing periods.'
  },
  products: {
    title: 'Product & Variant Catalog Studio',
    url: 'https://app.brightloop.com/products/catalog',
    img: '/screenshots/products.png',
    desc: 'Configure physical goods, recurring services, variant price tiers (sales & cost prices), and automated minimum quantity rules.'
  },
  payments: {
    title: 'Multi-Method Payment & Partial Balance Recording',
    url: 'https://app.brightloop.com/payments/reconcile',
    img: '/screenshots/dashboard.png',
    desc: 'Record partial and full payments via Bank Transfer, UPI, Credit Card, or Cash. Paid invoices are locked against duplicate payments.'
  }
};

function initShowcaseTabs() {
  const tabBtns = document.querySelectorAll('.showcase-tab-btn');
  const showcaseUrl = document.getElementById('showcaseUrlPill');
  const showcaseDesc = document.getElementById('showcaseDescriptionText');
  const stageTitle = document.getElementById('showcaseStageTitle');
  const stageSub = document.getElementById('showcaseStageSub');
  const tableHeading = document.getElementById('showcaseTableHeading');
  const rowsContainer = document.getElementById('showcaseRows');

  if (!tabBtns.length) return;

  const showcaseMockData = {
    dashboard: {
      url: 'https://app.brightloop.com/dashboard/finance',
      title: 'Finance Overview',
      sub: 'Live recurring metrics, revenue recognition, and payment status.',
      tableHead: 'Overdue Invoices Requiring Follow-up',
      desc: 'Live financial telemetry: Monthly Recurring Revenue (MRR), total collected revenue, outstanding balances, and overdue invoices with zero guesswork.',
      rows: [
        ['INV-000003', 'Acme Corp', '2026-09-01', '₹1,180.00', '#d70015'],
        ['INV-000008', 'Beta Labs', '2026-09-01', '₹1,180.00', '#d70015'],
        ['INV-000013', 'Gamma Digital', '2026-09-01', '₹1,180.00', '#d70015']
      ]
    },
    subscriptions: {
      url: 'https://app.brightloop.com/subscriptions/active',
      title: 'Customer Subscriptions',
      sub: 'Active contract agreements, line items, and lifecycle stages.',
      tableHead: 'Recent Active Subscription Contracts',
      desc: 'Manage subscription records across DRAFT, QUOTATION, CONFIRMED, ACTIVE, and CLOSED stages. Configure line items, quantities, and payment terms.',
      rows: [
        ['SUB-000004', 'Cloud Pro Tier', 'Net 15 Terms', 'Active', '#248a3d'],
        ['SUB-000005', 'Enterprise Suite', 'Immediate', 'Active', '#248a3d'],
        ['SUB-000006', 'Starter Plan', 'Net 30 Terms', 'Confirmed', '#0066cc']
      ]
    },
    invoices: {
      url: 'https://app.brightloop.com/invoices/recurring',
      title: 'Recurring Invoices',
      sub: 'Period-specific invoices, automated tax calculations, and discount rules.',
      tableHead: 'Generated Period Invoices',
      desc: 'Automated invoice generation engine ensures exact period coverage without duplicate billings, applies configured discounts, and manages payment locks.',
      rows: [
        ['INV-000004', 'Cloud Pro Tier', 'Jan 1 → Jan 31', 'Paid (₹3,313.44)', '#248a3d'],
        ['INV-000005', 'Cloud Pro Tier', 'Feb 1 → Feb 28', 'Confirmed (₹4,120.00)', '#0066cc'],
        ['INV-000006', 'Enterprise Suite', 'Feb 1 → Feb 28', 'Draft (₹15,480.00)', '#737373']
      ]
    },
    products: {
      url: 'https://app.brightloop.com/products/catalog',
      title: 'Product Catalog & Add-ons',
      sub: 'Base offerings, pricing tiers, and variant matrices.',
      tableHead: 'Configured Product Catalog',
      desc: 'Organize software subscriptions, physical goods, and professional services with dynamic pricing attributes and variant add-ons.',
      rows: [
        ['PROD-01', 'Cloud Infrastructure', 'Base ₹1,000.00', 'Active Offering', '#0066cc'],
        ['PROD-02', 'Dedicated Support', 'Base ₹500.00', 'Active Add-on', '#0066cc'],
        ['PROD-03', 'Custom Storage Block', 'Base ₹250.00', 'Active Offering', '#0066cc']
      ]
    },
    payments: {
      url: 'https://app.brightloop.com/payments/ledger',
      title: 'Payment Ledger',
      sub: 'Multi-method transactions, automated balance settlements, and audit trails.',
      tableHead: 'Reconciled Payment Transactions',
      desc: 'Track partial and full invoice payments across Bank Transfer, UPI, Credit Card, and Cash with zero duplicate processing.',
      rows: [
        ['PAY-000001', 'Bank Transfer', 'Jan 15, 2026', 'Settled (₹1,000.00)', '#248a3d'],
        ['PAY-000002', 'UPI Instant', 'Jan 15, 2026', 'Settled (₹2,313.44)', '#248a3d'],
        ['PAY-000003', 'Credit Card', 'Feb 02, 2026', 'Settled (₹4,120.00)', '#248a3d']
      ]
    }
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tabKey = btn.getAttribute('data-tab');
      const data = showcaseMockData[tabKey] || showcaseMockData.dashboard;

      if (showcaseUrl) showcaseUrl.textContent = data.url;
      if (showcaseDesc) showcaseDesc.textContent = data.desc;
      if (stageTitle) stageTitle.textContent = data.title;
      if (stageSub) stageSub.textContent = data.sub;
      if (tableHeading) tableHeading.textContent = data.tableHead;

      if (rowsContainer) {
        rowsContainer.innerHTML = data.rows.map((r, i) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; ${i < data.rows.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''} font-size:13px;">
            <span style="font-family:var(--font-sans); font-weight:600; color:#0066cc;">${r[0]}</span>
            <span style="color:var(--foreground);">${r[1]}</span>
            <span style="color:var(--muted-foreground);">${r[2]}</span>
            <span style="font-weight:600; color:${r[4]};">${r[3]}</span>
          </div>
        `).join('');
      }
    });
  });
}

/* --------------------------------------------------
   4. SUBSCRIPTION LIFECYCLE INTERACTIVE EXPLORER
   -------------------------------------------------- */
const lifecycleStages = {
  draft: {
    title: '1. DRAFT — Initial Subscription Composition',
    badge: 'Draft Mode',
    desc: 'When an order is created, it begins in Draft. The administrator or sales rep sets the customer, selects a recurring plan (daily, weekly, monthly, yearly), and attaches products with optional variants and custom quantities. No billing commitments are active yet.',
    capabilities: [
      'Editable line items, quantities, and pricing variants',
      'Configurable payment terms (Immediate, Net 15, Net 30)',
      'Can transition to QUOTATION when ready for customer review'
    ]
  },
  quotation: {
    title: '2. QUOTATION — Proposal & Customer Review',
    badge: 'Quotation Mode',
    desc: 'Formal quotation sent to the customer with tax (e.g. 18% GST) and discount configurations applied. The customer can review terms, line quantities, and recurring frequency before final confirmation.',
    capabilities: [
      'Reusable quotation templates can prefill these details',
      'Customer can view proposal via self-service Customer Portal',
      'Can transition forward to CONFIRMED or cancel'
    ]
  },
  confirmed: {
    title: '3. CONFIRMED — Legally Binding Order Agreement',
    badge: 'Confirmed Order',
    desc: 'Customer approves terms or sales representative confirms contract. The subscription is locked for start-date initialization and queueing in the recurring billing engine.',
    capabilities: [
      'Locks core subscription parameters',
      'Initializes first billing period timestamp',
      'Transition directly to ACTIVE to begin recurring billing cycle'
    ]
  },
  active: {
    title: '4. ACTIVE — Live Recurring Billing & Service Delivery',
    badge: 'Active & Billing',
    desc: 'The subscription is live! Automated batch invoice runs scan active subscriptions and generate recurring invoices on schedule. Calculates taxes and percentage or fixed discounts automatically.',
    capabilities: [
      'Eligible for automated recurring invoice batch generation',
      'Prevent duplicate invoice generation for identical periods',
      'Can be paused, renewed, or closed based on plan rules'
    ]
  },
  closed: {
    title: '5. CLOSED — Completed or Expired Subscription',
    badge: 'Contract Complete',
    desc: 'The subscription reaches its end date or is closed early in accordance with plan rules (such as auto_close or early_closure policies). No further recurring invoices will be generated.',
    capabilities: [
      'Invoicing engine immediately stops generating new billing cycles',
      'Historical invoices and payment records remain permanently accessible for audit',
      'Can be cloned or renewed into a new active contract cycle'
    ]
  }
};

function initLifecycleExplorer() {
  const nodeBtns = document.querySelectorAll('.lifecycle-node-btn');
  const panel = document.getElementById('lifecycleDetailPanel');
  if (!nodeBtns.length || !panel) return;

  const stageData = {
    draft: {
      step: '01',
      title: 'Draft — Order Composition',
      badge: 'Draft Mode',
      badgeColor: '#0066cc',
      badgeBg: 'rgba(0, 102, 204, 0.1)',
      desc: 'When an order is created, it begins in Draft. The administrator or sales rep sets the customer, selects a recurring plan, and attaches products with optional variants and custom quantities. No billing commitments are active yet.',
      capabilities: [
        'Editable line items, quantities, and pricing variants',
        'Configurable payment terms (Immediate, Net 15, Net 30)',
        'One-click progression to QUOTATION when ready for customer review'
      ],
      nextAction: 'Advance to Quotation →',
      nextStage: 'quotation',
      statusText: 'Draft Composition',
      statusColor: '#0066cc',
      invoiceStatus: 'No Invoices Generated Yet',
      subId: 'SUB-000004'
    },
    quotation: {
      step: '02',
      title: 'Quotation — Customer Proposal Review',
      badge: 'Quotation Review',
      badgeColor: '#0066cc',
      badgeBg: 'rgba(0, 102, 204, 0.1)',
      desc: 'Formal quotation sent to the customer with tax (e.g. 18% GST) and discount configurations applied. The customer can review terms, line quantities, and recurring frequency before final confirmation.',
      capabilities: [
        'Reusable quotation templates prefill standard pricing packages',
        'Customer can view proposal via self-service Customer Portal',
        'Can transition forward to CONFIRMED or cancel'
      ],
      nextAction: 'Confirm Agreement →',
      nextStage: 'confirmed',
      statusText: 'Under Customer Review',
      statusColor: '#0066cc',
      invoiceStatus: 'Quotation Valid for 30 Days',
      subId: 'SUB-000004'
    },
    confirmed: {
      step: '03',
      title: 'Confirmed — Agreement Locked',
      badge: 'Agreement Locked',
      badgeColor: '#8b5cf6',
      badgeBg: 'rgba(139, 92, 246, 0.12)',
      desc: 'Customer approves terms or sales representative confirms the contract. The subscription is locked for start-date initialization and queueing in the recurring billing engine.',
      capabilities: [
        'Locks core subscription parameters to prevent accidental modification',
        'Initializes first billing period timestamp and schedule',
        'Transitions directly to ACTIVE to begin recurring billing cycle'
      ],
      nextAction: 'Activate Subscription →',
      nextStage: 'active',
      statusText: 'Contract Signed & Queued',
      statusColor: '#8b5cf6',
      invoiceStatus: 'Initial Invoice Queued for Delivery',
      subId: 'SUB-000004'
    },
    active: {
      step: '04',
      title: 'Active — Live Recurring Billing & Delivery',
      badge: 'Active & Invoicing',
      badgeColor: '#248a3d',
      badgeBg: 'rgba(52, 199, 89, 0.12)',
      desc: 'The subscription is live! Automated batch invoice runs scan active subscriptions and generate recurring invoices on schedule. Calculates taxes and percentage or fixed discounts automatically.',
      capabilities: [
        'Eligible for automated recurring invoice batch generation',
        'Guaranteed zero duplicate invoice generation for identical periods',
        'Can be paused, resumed, renewed, or closed based on plan rules'
      ],
      nextAction: 'View Active Invoices →',
      nextStage: 'closed',
      statusText: 'Active Recurring (Cron Managed)',
      statusColor: '#248a3d',
      invoiceStatus: 'Auto-Invoicing Active (Next: Feb 28)',
      subId: 'SUB-000004'
    },
    closed: {
      step: '05',
      title: 'Closed — Completed or Renewed',
      badge: 'Term Completed',
      badgeColor: '#d70015',
      badgeBg: 'rgba(215, 0, 21, 0.1)',
      desc: 'The subscription reaches its end date or is closed early in accordance with plan rules (such as auto_close or early_closure policies). No further recurring invoices will be generated.',
      capabilities: [
        'Invoicing engine immediately halts generating new billing cycles',
        'Historical invoices and payment records remain permanently accessible for audit',
        'Can be cloned or renewed with one click into a new term'
      ],
      nextAction: 'Renew Contract Term ↺',
      nextStage: 'draft',
      statusText: 'Contract Expired / Archived',
      statusColor: '#d70015',
      invoiceStatus: 'All Cycles Billed & Archived',
      subId: 'SUB-000004'
    }
  };

  function renderStage(stageKey) {
    const s = stageData[stageKey] || stageData.draft;
    const stagesList = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
    const currentIdx = stagesList.indexOf(stageKey);

    panel.innerHTML = `
      <div class="lifecycle-panel-grid">
        <!-- Left: Stage Description & Capabilities -->
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
            <span style="font-size:12px; font-weight:700; color:#0066cc; text-transform:uppercase; letter-spacing:0.05em; background:rgba(0,102,204,0.08); padding:4px 12px; border-radius:9999px;">STAGE ${s.step}</span>
            <span style="font-size:12px; font-weight:600; color:${s.badgeColor}; background:${s.badgeBg}; padding:4px 12px; border-radius:9999px;">${s.badge}</span>
          </div>

          <h3 style="font-size:26px; font-weight:600; color:var(--foreground); margin:0 0 12px 0; line-height:1.2;">${s.title}</h3>
          <p style="font-size:15px; line-height:1.6; color:var(--muted-foreground); margin:0 0 24px 0;">${s.desc}</p>

          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:28px;">
            ${s.capabilities.map(c => `
              <div style="display:flex; align-items:center; gap:12px; background:var(--secondary); border:1px solid var(--border); border-radius:12px; padding:12px 16px;">
                <div style="width:22px; height:22px; border-radius:50%; background:#0066cc; color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0;">✓</div>
                <span style="font-size:13.5px; font-weight:500; color:var(--foreground);">${c}</span>
              </div>
            `).join('')}
          </div>

          <button id="lifecycleNextBtn" style="background:#0066cc; color:#ffffff; border:none; border-radius:9999px; padding:11px 24px; font-size:14px; font-weight:500; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:transform 0.1s ease, background 0.15s ease;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='none'">
            ${s.nextAction}
          </button>
        </div>

        <!-- Right: Sleek Interactive Contract Preview Card -->
        <div>
          <div class="lifecycle-contract-preview-card" style="background:var(--card); border:1px solid var(--border); border-radius:18px; padding:28px; box-shadow:rgba(0,0,0,0.12) 0 8px 30px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:1px solid var(--border); margin-bottom:16px;">
              <div>
                <span style="font-size:11px; font-weight:700; color:var(--muted-foreground); text-transform:uppercase; letter-spacing:0.05em;">Contract Agreement</span>
                <div style="font-family:var(--font-display); font-size:20px; font-weight:600; color:var(--foreground); margin-top:2px;">${s.subId} — Cloud Pro</div>
                <div style="font-size:12.5px; color:var(--muted-foreground); margin-top:2px;">Acme Corp • Net 15 Terms</div>
              </div>
              <div style="text-align:right;">
                <span style="display:inline-block; padding:4px 12px; border-radius:9999px; font-size:12px; font-weight:600; color:${s.badgeColor}; background:${s.badgeBg};">${s.statusText}</span>
                <div style="font-family:var(--font-display); font-size:18px; font-weight:600; color:#0066cc; margin-top:6px;">₹4,120.00 / mo</div>
              </div>
            </div>

            <!-- Stepper Progress Bar -->
            <div style="margin-bottom:20px;">
              <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600; color:var(--muted-foreground); text-transform:uppercase; margin-bottom:8px;">
                <span>Draft</span>
                <span>Quotation</span>
                <span>Confirmed</span>
                <span>Active</span>
                <span>Closed</span>
              </div>
              <div style="height:6px; background:#f0f0f0; border-radius:9999px; overflow:hidden;">
                <div style="width:${((currentIdx + 1) / 5) * 100}%; height:100%; background:#0066cc; border-radius:9999px; transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Operational Status Callout -->
            <div style="background:var(--secondary); border:1px solid var(--border); border-radius:12px; padding:14px; margin-bottom:16px;">
              <div style="font-size:11.5px; text-transform:uppercase; font-weight:700; color:var(--muted-foreground); letter-spacing:0.05em;">Engine Status</div>
              <div style="font-size:13.5px; font-weight:600; color:var(--foreground); margin-top:3px;">${s.invoiceStatus}</div>
            </div>

            <!-- Mini Summary Details -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px;">
              <div style="background:var(--card); border:1px solid var(--border); border-radius:10px; padding:10px 14px;">
                <div style="color:var(--muted-foreground); font-size:11px;">Frequency</div>
                <div style="font-weight:600; color:var(--foreground); margin-top:2px;">Monthly Recurring</div>
              </div>
              <div style="background:var(--card); border:1px solid var(--border); border-radius:10px; padding:10px 14px;">
                <div style="color:var(--muted-foreground); font-size:11px;">Auto-Clamping</div>
                <div style="font-weight:600; color:#248a3d; margin-top:2px;">Verified Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook up the Advance Stage button
    const nextBtn = document.getElementById('lifecycleNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextNode = document.querySelector(`.lifecycle-node-btn[data-stage="${s.nextStage}"]`);
        if (nextNode) nextNode.click();
      });
    }
  }

  nodeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      nodeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const stageKey = btn.getAttribute('data-stage') || 'draft';
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(6px)';

      setTimeout(() => {
        renderStage(stageKey);
        panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      }, 100);
    });
  });

  // Render initial draft stage
  renderStage('draft');
}

/* --------------------------------------------------
   5. INTERACTIVE FAQ ACCORDION & REAL-TIME SEARCH
   -------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  const searchInput = document.getElementById('faqSearchInput');

  // Accordion click toggle
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close other items
      faqItems.forEach(other => other.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // Real-time FAQ filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      faqItems.forEach(item => {
        const questionText = item.querySelector('.faq-question-btn').textContent.toLowerCase();
        const answerText = item.querySelector('.faq-answer-pane').textContent.toLowerCase();
        if (!query || questionText.includes(query) || answerText.includes(query)) {
          item.style.display = 'block';
          if (query && (questionText.includes(query) || answerText.includes(query))) {
            item.classList.add('open');
          }
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
}

/* --------------------------------------------------
   6. SCROLL REVEALS USING INTERSECTION OBSERVER
   -------------------------------------------------- */
function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const revealElements = document.querySelectorAll('.feature-rich-card, .split-card, .billing-step-card, .role-persona-card, .metric-stat-card, .why-feature-item');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}
