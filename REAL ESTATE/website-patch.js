/**
 * Jawdah Real Estate — Website Supabase Patch
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

  trackVisit('view');

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-track], .btn-ph, .btn-p, .btn-gd, .nav-cta');
    if (!btn) return;
    const label = btn.dataset?.track || btn.textContent?.trim()?.slice(0, 60) || 'button';
    trackVisit('click_cta', { event: `click: ${label}` });
  });

  // ─── 2. Load site_settings and apply ──────────────────
  async function loadSiteSettings() {
    try {
      const { data } = await db.from('site_settings').select('key, value');
      if (!data) return;
      const s = {};
      data.forEach(r => s[r.key] = r.value);
      if (s.phone) {
        document.querySelectorAll('[data-field="phone"], .fci-phone').forEach(el => { el.textContent = s.phone; });
        const wa = document.querySelector('.wa-float');
        if (wa) wa.href = `https://wa.me/${s.phone.replace(/\D/g, '')}`;
      }
      if (s.email) document.querySelectorAll('[data-field="email"], .fci-email').forEach(el => { el.textContent = s.email; });
      if (s.address) document.querySelectorAll('[data-field="address"], .fci-address').forEach(el => { el.textContent = s.address; });
      if (s.company_name) document.querySelectorAll('[data-field="company_name"]').forEach(el => { el.textContent = s.company_name; });
    } catch (_) {}
  }

  loadSiteSettings();

  // ─── 3. Load achievements (مشاريعنا) ─────────────────
  async function loadAchievements() {
    try {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) return;

      const grid = document.getElementById('achievements-grid');
      if (!grid) return;

      const section = document.getElementById('our-achievements');
      if (section) {
        section.style.display = 'block';
        section.querySelectorAll('.fade,.fade-l,.fade-r,.lux-reveal,.clip-in').forEach(el => el.classList.add('on'));
      }

      const catMap = { residential: 'سكني', commercial: 'تجاري', administrative: 'إداري' };

      grid.innerHTML = data.map(p => {
        const cat = catMap[p.category] || p.category || '';
        return `
          <div class="lic-card on" style="text-align:right">
            ${p.image_url ? `
              <div style="width:100%;height:160px;margin:0 0 18px;border-radius:8px;overflow:hidden;background-image:url('${p.image_url}');background-size:cover;background-position:center"></div>
            ` : `
              <div class="lic-icon" style="margin-bottom:18px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
              </div>
            `}
            ${cat ? `<div class="lic-badge" style="margin-bottom:10px">${cat}</div>` : ''}
            <div class="lic-num" style="font-size:1rem;margin-bottom:6px">${p.title_ar || p.title || '—'}</div>
            <div class="lic-sub">${p.year || ''}${p.client_name ? ' · ' + p.client_name : ''}</div>
          </div>
        `;
      }).join('');
    } catch (e) { console.error('[Jawdah] loadAchievements error:', e); }
  }

  // ─── 5. Scroll reveal observer ────────────────────────
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

  // ─── 6. Lead capture form ─────────────────────────────
  const contactForm = document.querySelector('#contact-form, form[data-type="lead"]');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name  = fd.get('name')  || '';
      const phone = fd.get('phone') || '';
      const email = fd.get('email') || '';
      const notes = fd.get('message') || fd.get('notes') || '';
      if (!name || !phone) { alert('يرجى إدخال الاسم ورقم الهاتف'); return; }
      const { error } = await db.from('leads').insert([{ name, phone, email, notes, source: 'website', stage: 'new' }]);
      if (error) { alert('حدث خطأ، يرجى المحاولة مرة أخرى'); return; }
      trackVisit('submit_lead');
      contactForm.reset();
      alert('تم استلام طلبك، سنتواصل معك قريباً');
    });
  }

  // ─── Init ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAchievements);
  } else {
    loadAchievements();
  }

  console.log('[Jawdah] Website patch loaded ✓');
})();
