/**
 * Jawdah Real Estate — Website Supabase Patch
 * =============================================
 * أضف هذا الملف في نهاية index.html:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="website-patch.js"></script>
 *
 * يقوم هذا الملف بـ:
 *  1. تتبع الزيارات في جدول analytics
 *  2. تحميل المشاريع/الإنجازات من Supabase وعرضها في قسم المشاريع
 *  3. تتبع النقرات على الأزرار الرئيسية
 *  4. تحميل إعدادات الموقع من site_settings
 */

(function () {
  // ─── Config ───────────────────────────────────────────
  const SB_URL = 'https://checwxcpfwbvjfvbujaw.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZWN3eGNwZndidmpmdmJ1amF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mjc0NDQsImV4cCI6MjA5MzIwMzQ0NH0.52n-Mg8_JxoWdDompJ2c9q2-LkRuc7bX0IB7XblGdgw';

  // ─── Init Supabase ─────────────────────────────────────
  const db = window.supabase
    ? window.supabase.createClient(SB_URL, SB_KEY)
    : null;

  if (!db) {
    console.warn('[Jawdah] Supabase SDK not found. Load it before this script.');
    return;
  }

  // ─── 1. Track page visit ───────────────────────────────
  async function trackVisit(event = 'view', extra = {}) {
    try {
      await db.from('analytics').insert([{
        page: 'website',
        event,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        ...extra,
      }]);
    } catch (_) {}
  }

  // Track on load
  trackVisit('view');

  // Track CTA button clicks (any button with data-track attr or known classes)
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-track], .btn-ph, .btn-p, .btn-gd, .nav-cta');
    if (!btn) return;
    const label = btn.dataset?.track
      || btn.textContent?.trim()?.slice(0, 60)
      || 'button';
    trackVisit('click_cta', { event: `click: ${label}` });
  });

  // ─── 2. Load site_settings and apply ──────────────────
  async function loadSiteSettings() {
    try {
      const { data } = await db.from('site_settings').select('key, value');
      if (!data) return;
      const s = {};
      data.forEach(r => s[r.key] = r.value);

      // Apply phone
      if (s.phone) {
        document.querySelectorAll('[data-field="phone"], .fci-phone').forEach(el => {
          el.textContent = s.phone;
        });
        // WhatsApp float btn
        const wa = document.querySelector('.wa-float');
        if (wa) {
          const num = s.phone.replace(/\D/g, '');
          wa.href = `https://wa.me/${num}`;
        }
      }
      // Apply email
      if (s.email) {
        document.querySelectorAll('[data-field="email"], .fci-email').forEach(el => {
          el.textContent = s.email;
        });
      }
      // Apply address
      if (s.address) {
        document.querySelectorAll('[data-field="address"], .fci-address').forEach(el => {
          el.textContent = s.address;
        });
      }
      // Apply company name
      if (s.company_name) {
        document.querySelectorAll('[data-field="company_name"]').forEach(el => {
          el.textContent = s.company_name;
        });
      }
    } catch (_) {}
  }

  loadSiteSettings();

  // ─── 3. Load projects from Supabase ───────────────────
  async function loadProjects() {
    try {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) return;

      // Find the projects grid — look for .pg or #projects-grid
      const grid = document.querySelector('.pg, #projects-grid, #achievements-grid');
      if (!grid) return;

      // Clear existing placeholder cards if any
      // Only replace if we have real data
      grid.innerHTML = data.map((p, i) => {
        const cat = { residential: 'سكني', commercial: 'تجاري', administrative: 'إداري' }[p.category] || p.category || '';
        const imgStyle = p.image_url
          ? `background-image:url('${p.image_url}');background-size:cover;background-position:center;`
          : `background:linear-gradient(135deg,#2AABA3,#0f2a2a);`;

        return `
          <div class="lic-card fade stagger-${(i % 5) + 1}">
            ${p.image_url ? `
              <div style="width:56px;height:56px;margin:0 auto 18px;border-radius:10px;overflow:hidden;${imgStyle}"></div>
            ` : `
              <div class="lic-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
              </div>
            `}
            ${cat ? `<div class="lic-badge">${cat}</div>` : ''}
            <div class="lic-num">${p.title_ar || p.title || '—'}</div>
            ${p.client_name ? `<div class="lic-sub">${p.client_name}${p.year ? ' · ' + p.year : ''}</div>` : ''}
            ${p.description_ar ? `<div class="lic-sub" style="margin-top:10px;font-size:.75rem;opacity:.75;line-height:1.6">${p.description_ar}</div>` : ''}
          </div>
        `;
      }).join('');

      // Re-trigger scroll reveal for new cards
      if (window._jawdahRevealObserver) {
        grid.querySelectorAll('.fade').forEach(el => {
          window._jawdahRevealObserver.observe(el);
        });
      }
    } catch (_) {}
  }

  // Wait for DOM to be ready before loading projects
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
  } else {
    loadProjects();
  }

  // ─── 4. Expose scroll reveal observer for re-use ──────
  window.addEventListener('DOMContentLoaded', function () {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    window._jawdahRevealObserver = observer;

    document.querySelectorAll('.fade, .fade-l, .fade-r, .fade-sc, .clip-in, .lux-reveal').forEach(el => {
      observer.observe(el);
    });
  });

  // ─── 5. Lead capture form (if exists) ─────────────────
  const contactForm = document.querySelector('#contact-form, form[data-type="lead"]');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name  = fd.get('name')  || '';
      const phone = fd.get('phone') || '';
      const email = fd.get('email') || '';
      const notes = fd.get('message') || fd.get('notes') || '';

      if (!name || !phone) {
        alert('يرجى إدخال الاسم ورقم الهاتف');
        return;
      }

      const { error } = await db.from('leads').insert([{
        name, phone, email, notes,
        source: 'website',
        stage: 'new',
      }]);

      if (error) {
        alert('حدث خطأ، يرجى المحاولة مرة أخرى');
        return;
      }

      trackVisit('submit_lead');
      contactForm.reset();
      alert('تم استلام طلبك، سنتواصل معك قريباً');
    });
  }

  console.log('[Jawdah] Website patch loaded ✓');
})();
