/* ── SCROLL RESTORATION ── */
if (history.scrollRestoration) history.scrollRestoration = "manual";
window.addEventListener("load", () => {
  if (location.hash) history.replaceState(null, "", location.pathname);
  window.scrollTo(0, 0);
});

/* ── REVEAL ON SCROLL ── */
const reveals = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);
reveals.forEach((el) => revealObserver.observe(el));

/* ── ACTIVE NAV ── */
const navLinks = document.querySelectorAll(".main-nav a");
const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setActiveNav() {
  const scrollY = window.scrollY + 120;
  let currentId = "#home";
  sections.forEach((section) => {
    if (scrollY >= section.offsetTop) currentId = `#${section.id}`;
  });
  navLinks.forEach((link) =>
    link.classList.toggle("active", link.getAttribute("href") === currentId)
  );
}
setActiveNav();
window.addEventListener("scroll", setActiveNav);

/* ── MOBILE NAV ── */
const mobileToggle = document.getElementById("mobileToggle");
const navMenu = document.getElementById("navLinks");
if (mobileToggle && navMenu) {
  mobileToggle.addEventListener("click", () => navMenu.classList.toggle("open"));
  navMenu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => navMenu.classList.remove("open"))
  );
}

/* ── HERO TYPEWRITER ── */
(function initTypewriter() {
  const el = document.getElementById("typewriterText");
  if (!el) return;
  const words = ["تحقيق أهدافك الاستثمارية", "زيادة عوائد عقاراتك", "إيجاد المستأجر المثالي", "حماية حقوقك في كل صفقة", "إدارة أملاكك باحترافية"];
  let wi = 0, ci = 0, deleting = false;

  function tick() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; return setTimeout(tick, 1800); }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(tick, deleting ? 55 : 95);
  }
  setTimeout(tick, 600);
})();

/* ── HERO CANVAS PARTICLES ── */
(function initHeroCanvas() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles;

  const TEAL = "44,190,201";
  const COUNT = 60;
  const MAX_DIST = 120;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H * 0.75,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.6,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          ctx.strokeStyle = `rgba(${TEAL},${0.18 * (1 - dist / MAX_DIST)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    particles.forEach((p) => {
      ctx.fillStyle = `rgba(${TEAL},0.55)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H * 0.75) p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); });
  init();
  draw();
})();

/* ── VISION CARDS MOUSE PARALLAX ── */
(function initVisionParallax() {
  const grid = document.querySelector(".vision-grid");
  if (!grid) return;
  const cards = grid.querySelectorAll(".vision-card");
  grid.addEventListener("mousemove", (e) => {
    const rect = grid.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    cards.forEach((card) => {
      card.style.transform = `rotateX(${dy * 10}deg) rotateY(${-dx * 10}deg) translateZ(8px)`;
    });
  });
  grid.addEventListener("mouseleave", () => {
    cards.forEach((card) => (card.style.transform = ""));
  });
})();

/* ── ACTIVITIES GLOW FOLLOWER ── */
(function initActivityGlow() {
  const section = document.querySelector(".activities-section");
  const glow = document.getElementById("activityGlow");
  if (!section || !glow) return;
  section.addEventListener("mousemove", (e) => {
    const rect = section.getBoundingClientRect();
    glow.style.left = e.clientX - rect.left + "px";
    glow.style.top = e.clientY - rect.top + "px";
  });
})();

/* ── CTA ANIMATED COUNTERS ── */
(function initCounters() {
  const ctaSection = document.querySelector(".cta-section");
  if (!ctaSection) return;
  let triggered = false;
  function countUp(el, target, duration) {
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(progress * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target + "+";
    }
    requestAnimationFrame(update);
  }
  const counterObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !triggered) {
        triggered = true;
        ctaSection.querySelectorAll(".cta-counter strong").forEach((el) => {
          countUp(el, parseInt(el.dataset.target, 10), 1800);
        });
      }
    },
    { threshold: 0.3 }
  );
  counterObserver.observe(ctaSection);
})();

/* ── ACCREDITATIONS STAGGERED REVEAL ── */
(function initCredentialStagger() {
  const cards = document.querySelectorAll(".credential-card");
  if (!cards.length) return;
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = [...cards].indexOf(entry.target);
          setTimeout(() => entry.target.classList.add("visible"), idx * 120);
          staggerObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  cards.forEach((card) => staggerObserver.observe(card));
})();
