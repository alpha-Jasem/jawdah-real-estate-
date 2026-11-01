/* Jawdah 3D city — Three.js (global THREE). Lazy-init, pauses offscreen, honours reduced-motion. */
(function () {
  'use strict';
  var TEAL = 0x3ECDC4, TEAL_L = 0x74E8E2, TEAL_D = 0x2AABA3;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = matchMedia('(max-width: 768px)').matches;

  function rand(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function hasWebGL() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }

  function mount(canvas, opts) {
    var holder = canvas.parentElement;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(opts.fog, 14, 38);
    var camera = new THREE.PerspectiveCamera(opts.fov || 38, 1, 0.1, 100);
    camera.position.set(0, opts.camY || 9, opts.camZ || 17);
    camera.lookAt(0, opts.lookY || 1.6, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(6, 12, 8); scene.add(key);
    var rim = new THREE.PointLight(TEAL, 1.4, 40); rim.position.set(-8, 6, -4); scene.add(rim);

    var city = new THREE.Group(); scene.add(city);
    var R = rand(opts.seed || 7), N = opts.towers || (isMobile ? 34 : 64);
    var mat = new THREE.MeshStandardMaterial({ color: opts.body, metalness: 0.55, roughness: 0.38, transparent: true, opacity: 0.94 });
    var lineMat = new THREE.LineBasicMaterial({ color: TEAL_L, transparent: true, opacity: 0.55 });
    var towers = [];
    for (var i = 0; i < N; i++) {
      var ring = Math.sqrt(R()) * 9.2, ang = R() * Math.PI * 2;
      var w = 0.7 + R() * 0.9, d = 0.7 + R() * 0.9;
      var h = 0.8 + Math.pow(R(), 2.2) * (5.5 - ring * 0.32);
      if (h < 0.7) h = 0.7;
      var g = new THREE.BoxGeometry(w, h, d);
      var m = new THREE.Mesh(g, mat);
      m.position.set(Math.cos(ang) * ring, h / 2, Math.sin(ang) * ring);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), lineMat));
      m.userData = { h: h, ph: R() * 6.28 };
      city.add(m); towers.push(m);
    }
    // hero tower (brand accent)
    var hg = new THREE.BoxGeometry(1.5, 8.4, 1.5);
    var hm = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL_D, emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.25 }));
    hm.position.set(0, 4.2, 0);
    hm.add(new THREE.LineSegments(new THREE.EdgesGeometry(hg), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })));
    city.add(hm);
    var halo = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.03, 8, 80), new THREE.MeshBasicMaterial({ color: TEAL_L, transparent: true, opacity: 0.7 }));
    halo.rotation.x = Math.PI / 2; halo.position.y = 8.6; city.add(halo);

    var grid = new THREE.GridHelper(40, 40, TEAL, TEAL); grid.material.transparent = true; grid.material.opacity = 0.16; city.add(grid);

    var ry = 0, vy = 0, tx = 0, dragging = false, lastX = 0, running = false, visible = true, t0 = performance.now();

    function size() {
      var w = holder.clientWidth || 600, h = holder.clientHeight || 400;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    size(); window.addEventListener('resize', size);

    if (opts.interactive) {
      canvas.style.cursor = 'grab'; canvas.style.touchAction = 'pan-y';
      canvas.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; canvas.style.cursor = 'grabbing'; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', function (e) { if (dragging) { vy = (e.clientX - lastX) * 0.006; ry += vy; lastX = e.clientX; } else { tx = (e.clientX / innerWidth - 0.5); } });
      var end = function () { dragging = false; canvas.style.cursor = 'grab'; };
      canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    } else {
      window.addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - 0.5); }, { passive: true });
    }

    function frame(now) {
      if (!running) return;
      var t = (now - t0) / 1000;
      if (!dragging) ry += (reduce ? 0 : 0.0028) + vy * 0.92, vy *= 0.92;
      city.rotation.y = ry + tx * 0.35;
      halo.rotation.z = t * 0.6; halo.position.y = 8.6 + Math.sin(t * 1.4) * 0.12;
      if (!reduce) for (var i = 0; i < towers.length; i++) { var u = towers[i].userData; towers[i].scale.y = 1 + Math.sin(t * 0.9 + u.ph) * 0.025; }
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    function start() { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(frame); } }
    function stop() { running = false; }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.01 }).observe(holder);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if (reduce) { renderer.render(scene, camera); }
    start();
    canvas.classList.add('ready');
  }

  function init() {
    if (!window.THREE || !hasWebGL()) return;
    var hero = document.getElementById('hero3d'), show = document.getElementById('showcase3d');
    if (hero && !isMobile) mount(hero, { fog: 0x0b1f1f, body: 0x12302f, towers: 26, seed: 11, camY: 12, camZ: 27, lookY: 2.6, fov: 34, interactive: false });
    if (show) mount(show, { fog: 0x0f2a2a, body: 0x14403f, seed: 3, camY: 10, camZ: 21, lookY: 3.2, interactive: true });
  }
  if ('requestIdleCallback' in window) requestIdleCallback(init, { timeout: 2500 }); else setTimeout(init, 800);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () {});
})();
