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
  const showcaseImg = document.getElementById('showcaseScreenshotImg');
  const showcaseUrl = document.getElementById('showcaseUrlPill');
  const showcaseDesc = document.getElementById('showcaseDescriptionText');

  if (!tabBtns.length || !showcaseImg) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tabKey = btn.getAttribute('data-tab');
      const data = showcaseData[tabKey] || showcaseData.dashboard;

      // Smooth fade transition
      showcaseImg.style.opacity = '0';
      setTimeout(() => {
        showcaseImg.src = data.img;
        showcaseImg.alt = data.title;
        showcaseImg.style.opacity = '1';
        if (showcaseUrl) showcaseUrl.textContent = data.url;
        if (showcaseDesc) showcaseDesc.textContent = data.desc;
      }, 150);
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

  nodeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      nodeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const stageKey = btn.getAttribute('data-stage');
      const stage = lifecycleStages[stageKey] || lifecycleStages.draft;

      panel.style.opacity = '0';
      panel.style.transform = 'translateY(10px)';

      setTimeout(() => {
        panel.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--bl-text-head);">${stage.title}</h3>
            <span class="status-badge ${stageKey}" style="font-size: 0.85rem; padding: 0.35rem 0.9rem;">${stage.badge}</span>
          </div>
          <p style="font-size: 1.05rem; line-height: 1.7; color: var(--bl-text-body); margin-bottom: 1.5rem;">${stage.desc}</p>
          <div style="background: var(--bl-surface-soft); border: 1px solid var(--bl-border); border-radius: var(--r-md); padding: 1.25rem 1.5rem;">
            <h5 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--bl-text-muted); margin-bottom: 0.75rem;">Stage Rules & Operational Behavior</h5>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem;">
              ${stage.capabilities.map(c => `<li style="display: flex; align-items: center; gap: 0.65rem; font-size: 0.925rem; color: var(--bl-text-body);"><span style="color: var(--bl-violet); font-weight: 800;">✓</span> ${c}</li>`).join('')}
            </ul>
          </div>
        `;
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      }, 150);
    });
  });
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
