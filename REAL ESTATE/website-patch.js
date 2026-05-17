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
      // ── Build Process section ──────────────────────────────
      const processInner = document.getElementById('process-inner');
      if (processInner) {
        const stepIcons = [
          'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
          'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
          'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
          'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        ];
        const stepSvg = d => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="${d}"></path></svg>`;
        const steps = [1,2,3,4,5].map((n,i) => `
          <div class="pr-step fade stagger-${n} on">
            <div class="sn">${stepSvg(stepIcons[i])}</div>
            <h3>${s['process_step'+n+'_title'] || ''}</h3>
            <p>${s['process_step'+n+'_desc'] || ''}</p>
          </div>`).join('');
        processInner.innerHTML = `
          <div class="pr-head fade lux-reveal on">
            <div class="lbl c">مسؤولياتنا</div>
            <h2 class="h2">${s.process_h2 || 'ما تشمله إدارة الأملاك'}</h2>
            <div class="gl c" style="background:#2AABA3"></div>
            <p class="sp" style="color:#5A5A5A;text-align:center;margin:0 auto">${s.process_desc || ''}</p>
          </div>
          <div class="pr-steps" style="--process-progress:1">
            <span class="pr-progress-dot" aria-hidden="true"></span>
            ${steps}
          </div>
          <div class="pr-cta fade lux-reveal on">
            <h3>${s.process_cta_h3 || ''}</h3>
            <p>${s.process_cta_desc || ''}</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <a href="https://api.whatsapp.com/message/AZBMZ4OGSAJGJ1?autoload=1&app_absent=0" class="btn-gd">${s.process_cta_btn || 'احجز استشارة الآن'}</a>
            </div>
          </div>`;
      }

      // ── Build Testimonials section ─────────────────────────
      const testimonialsInner = document.getElementById('testimonials-inner');
      if (testimonialsInner) {
        const gSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;
        const starSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#3ECDC4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`.repeat(5);
        const bigStarSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#3ECDC4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`.repeat(5);
        const months = ['','4','3','3','5','5','5'];
        const cards = [1,2,3,4,5,6].map(n => `
          <div class="fade stagger-${n > 3 ? n-3 : n}" style="background:#fff;border:1px solid rgba(62,205,196,.18);border-radius:18px;padding:26px 28px;box-shadow:0 4px 24px rgba(62,205,196,.07);transition:transform .35s ease,box-shadow .35s ease" onmouseover="this.style.transform='translateY(-5px)';this.style.boxShadow='0 18px 40px rgba(62,205,196,.13)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 24px rgba(62,205,196,.07)'">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;gap:3px">${starSvg}</div>
              ${gSvg}
            </div>
            <p style="font-size:.88rem;line-height:1.85;color:rgba(15,42,42,.72);margin-bottom:18px">${s['review'+n+'_text'] || ''}</p>
            <div style="display:flex;align-items:center;gap:10px;padding-top:14px;border-top:1px solid rgba(62,205,196,.1)">
              <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#3ECDC4,#2AABA3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.9rem;flex-shrink:0">${s['review'+n+'_initial'] || ''}</div>
              <div>
                <div style="font-size:.86rem;font-weight:700;color:#0f2a2a">${s['review'+n+'_name'] || ''}</div>
                <div style="font-size:.72rem;color:rgba(15,42,42,.45);margin-top:2px">منذ ${months[n]} أشهر</div>
              </div>
            </div>
          </div>`).join('');
        testimonialsInner.innerHTML = `
          <div class="fade" style="text-align:center;margin-bottom:52px">
            <div style="display:inline-flex;align-items:center;gap:10px;background:#f5fffe;border:1px solid rgba(62,205,196,.25);border-radius:50px;padding:7px 20px 7px 12px;margin-bottom:20px">
              ${gSvg}
              <span style="font-size:.76rem;font-weight:600;color:#2AABA3;letter-spacing:.06em">Google Maps Reviews</span>
            </div>
            <div class="lbl c">آراء عملائنا</div>
            <h2 class="h2" style="text-align:center;font-size:clamp(2.2rem,4.5vw,3.6rem);color:#0f2a2a">${s.reviews_h2 || 'ثقة عملائنا هي أكبر إنجاز لنا'}</h2>
            <div class="gl c" style="background:#2AABA3"></div>
            <div style="display:inline-flex;align-items:center;justify-content:center;gap:10px;margin-top:18px;background:#f5fffe;border:1px solid rgba(62,205,196,.2);border-radius:50px;padding:10px 24px">
              <div style="display:flex;gap:3px">${bigStarSvg}</div>
              <span style="font-size:1.5rem;font-weight:800;color:#0f2a2a;line-height:1">5.0</span>
              <span style="font-size:.82rem;color:rgba(15,42,42,.5)">${s.reviews_count_text || ' 6 تقييمات على جوجل'}</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
            ${cards}
          </div>
          <div class="fade" style="text-align:center;margin-top:36px">
            <a href="https://share.google/jEG7rk8uwm99rUL3x" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;color:#2AABA3;font-size:.88rem;font-weight:600;border:1px solid rgba(62,205,196,.3);padding:11px 24px;border-radius:50px;text-decoration:none;transition:all .3s" onmouseover="this.style.background='rgba(62,205,196,.08)'" onmouseout="this.style.background=''">
              ${gSvg} اقرأ كل التقييمات على جوجل
            </a>
          </div>`;
      }
      // footer
      if (s.footer_desc) document.querySelectorAll('[data-field="footer_desc"]').forEach(el => { el.textContent = s.footer_desc; });

      // ── Social media links ──
      const socialBar = document.getElementById('social-bar');
      if (socialBar) {
        const socials = [
          { key: 'social_twitter',   label: 'X',          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.631ZM17.083 20.083h1.833L7.084 4.126H5.117Z"/></svg>' },
          { key: 'social_instagram', label: 'Instagram',  icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>' },
          { key: 'social_tiktok',    label: 'TikTok',     icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.166.75c.954-.007 1.9.003 2.846-.003l.034.003c.143 2.196 1.02 4.337 2.64 5.852 1.62 1.522 3.817 2.267 5.98 2.221v4.56c-1.96.068-3.936-.42-5.65-1.454-.014 3.378.007 6.756-.02 10.127a8.862 8.862 0 01-1.564 4.704A8.747 8.747 0 0110.1 30a8.786 8.786 0 01-5.766-2.172A8.93 8.93 0 011.8 21.375c-.041-4.897 3.937-9.016 8.823-9.197.02 1.694-.047 3.385-.047 5.079-2.043.578-3.387 2.684-2.957 4.755.37 1.851 2.1 3.235 3.983 3.187a3.897 3.897 0 003.28-2.077c.26-.5.38-1.06.37-1.624L15.24.75h-3.074z"/></svg>' },
          { key: 'social_snapchat',  label: 'Snapchat',   icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97.9a3.33 3.33 0 00-.485-.277 6.553 6.553 0 00-2.9-.627c-1.78 0-3.376.618-4.42 1.664-.972 1.007-1.5 2.386-1.5 3.997 0 1.528.502 2.856 1.405 3.795.976 1.01 2.41 1.544 4.14 1.544 1.61 0 2.974-.475 3.956-1.374.936-.855 1.435-2.048 1.435-3.443v-.317h-4.83v-2.37h7.374v.687c0 2.25-.74 4.077-2.072 5.25-1.27 1.12-3.098 1.713-5.278 1.713-2.292 0-4.179-.693-5.46-2.004-1.244-1.277-1.9-3.056-1.9-5.18 0-2.213.7-4.07 2.022-5.373C8.428 5.55 10.46 4.8 12.857 4.8c1.457 0 2.773.28 3.912.835.456.223.87.493 1.237.806l-.444.807z"/></svg>' },
          { key: 'social_linkedin',  label: 'LinkedIn',   icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
          { key: 'social_youtube',   label: 'YouTube',    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' },
        ];
        const links = socials.filter(sc => s[sc.key]);
        if (links.length) {
          socialBar.innerHTML = links.map(sc => `
            <a href="${s[sc.key]}" target="_blank" rel="noopener" aria-label="${sc.label}"
               style="width:40px;height:40px;border-radius:10px;background:rgba(62,205,196,.12);border:1px solid rgba(62,205,196,.2);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.7);transition:background .2s,color .2s;text-decoration:none"
               onmouseover="this.style.background='rgba(62,205,196,.28)';this.style.color='#fff'"
               onmouseout="this.style.background='rgba(62,205,196,.12)';this.style.color='rgba(255,255,255,.7)'">
              ${sc.icon}
            </a>`).join('');
        } else {
          socialBar.style.display = 'none';
        }
      }
      // partners — dynamic, unlimited count
      if (s.partners_label) document.querySelectorAll('[data-field="partners_label"]').forEach(el => { el.textContent = s.partners_label; });
      const partnerLogos = [];
      for (let i = 1; i <= 30; i++) {
        if (s[`partner_logo_${i}`]) partnerLogos.push(s[`partner_logo_${i}`]);
        else if (i > 9) break; // stop early if gap beyond original 9
      }
      if (partnerLogos.length > 0) {
        const track = document.getElementById('partners-track');
        if (track) {
          const makeItems = () => partnerLogos.map(url =>
            `<div class="partner-item"><div class="partner-card"><img src="${url}" class="partner-logo" loading="lazy" onerror="this.closest('.partner-item').style.display='none'"></div></div>`
          ).join('');
          // duplicate for seamless infinite scroll
          track.innerHTML = makeItems() + makeItems();
        }
      }
      // ── Force dynamic sections visible after observer might remove .on ──
      setTimeout(() => {
        document.querySelectorAll('#process .fade, #process .lux-reveal, #process .pr-step, #testimonials .fade, #testimonials .lux-reveal').forEach(el => el.classList.add('on'));
      }, 200);

    } catch (err) { console.error('[Jawdah] loadSiteSettings error:', err); }
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
      window._PROJ_DATA = data;
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
            <div class="ach-card" data-proj-id="${p.id}" style="cursor:pointer">
              ${inner}
              <div class="ach-card-ov"></div>
              <div class="ach-card-body">
                ${cat ? `<div class="ach-badge">${cat}</div>` : ''}
                <div class="ach-title">${p.title_ar || p.title || '—'}</div>
                ${(p.year || p.client_name) ? `<div class="ach-meta">${p.year || ''}${p.client_name ? ' · ' + p.client_name : ''}</div>` : ''}
                ${p.description ? `<div class="ach-desc">${p.description}</div>` : ''}
                <div class="ach-link">اقرأ المزيد <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
            </div>
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
      let startX = 0, wasDrag = false;
      grid.addEventListener('mousedown',  e => { startX = e.clientX; wasDrag = false; grid.classList.add('no-trans'); });
      window.addEventListener('mouseup',  e => {
        if (!startX) return;
        grid.classList.remove('no-trans');
        const dx = startX - e.clientX;
        if (Math.abs(dx) > 10) { wasDrag = true; goTo(idx + (dx > 0 ? 1 : -1)); } else goTo(idx);
        startX = 0;
      });
      grid.addEventListener('touchstart', e => { startX = e.touches[0].clientX; wasDrag = false; }, { passive: true });
      grid.addEventListener('touchend',   e => {
        const dx = startX - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 50) { wasDrag = true; goTo(idx + (dx > 0 ? 1 : -1)); }
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
