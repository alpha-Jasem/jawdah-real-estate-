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
  function trackBeacon(event, extra = {}) {
    const body = JSON.stringify([{
      page: 'website', event,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      ...extra,
    }]);
    // keepalive ensures request completes even if page navigates away
    fetch(`${SB_URL}/rest/v1/analytics`, {
      method: 'POST', keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Prefer': 'return=minimal',
      },
      body,
    }).catch(() => {});
  }

  async function trackVisit(event = 'view', extra = {}) {
    try {
      await db.from('analytics').insert([{
        page: 'website', event,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        ...extra,
      }]);
    } catch (_) {}
  }

  trackVisit('view');

  document.addEventListener('click', function (e) {
    const wa = e.target.closest('.wa-float');
    if (wa) { trackBeacon('click_whatsapp'); return; }
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
      if (s.whatsapp) {
        const wa = document.querySelector('.wa-float');
        if (wa) wa.href = s.whatsapp;
      }
      if (s.email) document.querySelectorAll('[data-field="email"], .fci-email').forEach(el => { el.textContent = s.email; });
      if (s.address) document.querySelectorAll('[data-field="address"], .fci-address').forEach(el => { el.textContent = s.address; });
      if (s.company_name) document.querySelectorAll('[data-field="company_name"]').forEach(el => { el.textContent = s.company_name; });
      if (s.hero_title) {
        const h1 = document.querySelector('.hero-h1');
        if (h1) h1.innerHTML = s.hero_title;
      }
      if (s.hero_desc) {
        const desc = document.querySelector('.hero-desc');
        if (desc) desc.textContent = s.hero_desc;
      }
      if (s.about_text) document.querySelectorAll('[data-field="about_text"]').forEach(el => { el.textContent = s.about_text; });
      if (s.about_text2) document.querySelectorAll('[data-field="about_text2"]').forEach(el => { el.textContent = s.about_text2; });
      if (s.logo_url) {
        const logos = document.querySelectorAll('#site-logo, .site-logo, .nav-logo img, .footer-logo img, .f-logo');
        logos.forEach(el => { el.src = s.logo_url; });
      }
      if (s.about_image_url) {
        const aImg = document.getElementById('about-section-img');
        if (aImg) aImg.src = s.about_image_url;
      }
      if (s.interior_bg_url) {
        const interior = document.getElementById('interior');
        if (interior) interior.style.backgroundImage = `url('${s.interior_bg_url}')`;
      }
      if (s.interior_title) {
        const el = document.getElementById('interior-h2');
        if (el) el.innerHTML = s.interior_title;
      }
      if (s.interior_desc) {
        const el = document.getElementById('interior-desc');
        if (el) el.textContent = s.interior_desc;
      }
      if (s.hero_bg_url) {
        const heroVideo = document.querySelector('#hero .hero-video');
        if (heroVideo) {
          heroVideo.style.display = 'none';
          const hero = document.getElementById('hero');
          if (hero) { hero.style.backgroundImage = `url('${s.hero_bg_url}')`; hero.style.backgroundSize = 'cover'; hero.style.backgroundPosition = 'center'; }
        }
      }
      if (s.hero_btn_url) {
        const btn = document.getElementById('hero-cta-btn');
        if (btn) btn.href = s.hero_btn_url;
      }
      if (s.hero_btn_text) {
        const btn = document.getElementById('hero-cta-btn');
        if (btn) btn.textContent = s.hero_btn_text;
      }
      // hero stats
      ['hero_stat1_num','hero_stat2_num','hero_stat3_num','hero_stat1_label','hero_stat2_label','hero_stat3_label'].forEach(k => {
        if (s[k]) document.querySelectorAll(`[data-field="${k}"]`).forEach(el => { el.textContent = s[k]; });
      });
      // stats section
      ['stat1_num','stat2_num','stat3_num','stat4_num','stat1_label','stat2_label','stat3_label','stat4_label'].forEach(k => {
        if (s[k]) document.querySelectorAll(`[data-field="${k}"]`).forEach(el => { el.textContent = s[k]; });
      });
      // services
      if (s.services_desc) {
        const el = document.getElementById('services-desc');
        if (el) el.textContent = s.services_desc;
      }
      // licenses
      if (s.license1_num) { const el = document.getElementById('lic1-num'); if (el) el.textContent = s.license1_num; }
      if (s.license2_num) { const el = document.getElementById('lic2-num'); if (el) el.textContent = s.license2_num; }
      if (s.license3_num) { const el = document.getElementById('lic3-num'); if (el) el.textContent = s.license3_num; }
      // CTA section
      if (s.cta_title) {
        const el = document.getElementById('cta-h2');
        if (el) el.innerHTML = s.cta_title;
      }
      if (s.cta_desc) {
        const el = document.getElementById('cta-desc');
        if (el) el.textContent = s.cta_desc;
      }
      if (s.cta_btn_url) {
        const el = document.getElementById('cta-btn');
        if (el) el.href = s.cta_btn_url;
      }
      if (s.cta_btn_text) {
        const el = document.getElementById('cta-btn');
        if (el) el.textContent = s.cta_btn_text;
      }
      // footer
      if (s.footer_desc) document.querySelectorAll('[data-field="footer_desc"]').forEach(el => { el.textContent = s.footer_desc; });
    } catch (_) {}
  }

  loadSiteSettings();

  // ─── 3. Load achievements — Gallery4 carousel ────────
  async function loadAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    try {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) {
        grid.innerHTML = '<div class="ach-empty">لا توجد مشاريع منشورة حالياً</div>';
        document.getElementById('ach-prev').style.display = 'none';
        document.getElementById('ach-next').style.display = 'none';
        return;
      }

      const catMap = { residential: 'سكني', commercial: 'تجاري', administrative: 'إداري' };
      const LIMIT = 5;
      const hasMore = data.length > LIMIT;
      const visible = hasMore ? data.slice(0, LIMIT) : data;

      grid.innerHTML = visible.map(p => {
        const cat = catMap[p.category] || p.category || '';
        const inner = p.image_url
          ? `<img src="${p.image_url}" alt="${(p.title_ar || '').replace(/"/g, '')}" loading="lazy">`
          : `<div class="ach-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 22V12h6v10"/></svg></div>`;
        return `
          <div class="ach-item">
            <a class="ach-card" href="#our-achievements">
              ${inner}
              <div class="ach-card-ov"></div>
              <div class="ach-card-body">
                ${cat ? `<div class="ach-badge">${cat}</div>` : ''}
                <div class="ach-title">${p.title_ar || p.title || '—'}</div>
                ${(p.year || p.client_name) ? `<div class="ach-meta">${p.year || ''}${p.client_name ? ' · ' + p.client_name : ''}</div>` : ''}
                ${p.description ? `<div class="ach-desc">${p.description}</div>` : ''}
                <div class="ach-link">اقرأ المزيد <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
            </a>
          </div>`;
      }).join('');

      // ── "المزيد" button ────────────────────────────────
      const dotsParent = document.getElementById('ach-dots');
      if (hasMore && dotsParent) {
        const moreBtn = document.createElement('a');
        moreBtn.href = 'projects.html';
        moreBtn.className = 'ach-more-btn';
        moreBtn.textContent = 'المزيد من مشاريعنا ←';
        dotsParent.insertAdjacentElement('afterend', moreBtn);
      }

      // ── Carousel init ──────────────────────────────────
      const wrap     = document.querySelector('.ach-wrap');
      const prevBtn  = document.getElementById('ach-prev');
      const nextBtn  = document.getElementById('ach-next');
      const dotsEl   = document.getElementById('ach-dots');
      const CARD_W   = 340 + 20;
      let idx = 0;

      function visibleCount() {
        const pl = window.innerWidth <= 768 ? 20 : 80;
        return Math.max(1, Math.floor((wrap.offsetWidth - pl) / (window.innerWidth <= 768 ? 300 : CARD_W)));
      }
      function maxIdx() { return Math.max(0, data.length - visibleCount()); }

      // dots
      dotsEl.innerHTML = '';
      for (let i = 0; i <= maxIdx(); i++) {
        const d = document.createElement('button');
        d.className = 'ach-dot' + (i === 0 ? ' on' : '');
        d.setAttribute('aria-label', 'انتقل للشريحة ' + (i + 1));
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
      }

      function goTo(n) {
        idx = Math.max(0, Math.min(n, maxIdx()));
        const cw = window.innerWidth <= 768 ? 300 : CARD_W;
        grid.style.transform = 'translateX(-' + (idx * cw) + 'px)';
        prevBtn.disabled = idx === 0;
        nextBtn.disabled = idx >= maxIdx();
        dotsEl.querySelectorAll('.ach-dot').forEach((d, i) => d.classList.toggle('on', i === idx));
      }

      prevBtn.addEventListener('click', () => goTo(idx - 1));
      nextBtn.addEventListener('click', () => goTo(idx + 1));

      // touch / drag
      let startX = 0;
      grid.addEventListener('mousedown',  e => { startX = e.clientX; grid.classList.add('no-trans'); });
      window.addEventListener('mouseup',  e => {
        if (!startX) return;
        grid.classList.remove('no-trans');
        const dx = startX - e.clientX;
        if (Math.abs(dx) > 50) goTo(idx + (dx > 0 ? 1 : -1)); else goTo(idx);
        startX = 0;
      });
      grid.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      grid.addEventListener('touchend',   e => {
        const dx = startX - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 50) goTo(idx + (dx > 0 ? 1 : -1));
      });

      window.addEventListener('resize', () => goTo(Math.min(idx, maxIdx())));
      goTo(0);

    } catch (e) {
      console.error('[Jawdah] loadAchievements error:', e);
      grid.innerHTML = '<div class="ach-empty">حدث خطأ في تحميل المشاريع</div>';
    }
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
