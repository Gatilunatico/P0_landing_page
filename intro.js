/* Sentinela — SHIELD ASSEMBLY (introdução cinematográfica)
   Dependências (versões fixas, scripts globais via cdnjs, carregados com defer):
     • three.js r128  → window.THREE
     • GSAP 3.12.5    → window.gsap
   Se uma biblioteca, o WebGL ou qualquer etapa falhar, a página é revelada normalmente.
   API pública: window.__sentinelaIntro = { timeline, skip() }.
   Para rever a intro na mesma sessão: abra a página com ?intro=1 */
(function () {
  'use strict';

  const root = document.documentElement;
  const overlay = document.getElementById('intro');
  const canvas = document.getElementById('introCanvas');
  const skipBtn = document.getElementById('introSkip');
  if (!overlay || !canvas || !root.classList.contains('intro-lock')) {   // intro não solicitada
    if (overlay) overlay.remove();
    return;
  }

  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const inertEls = ['.nav', 'main', '.footer'].map(q).filter(Boolean);

  // ----- elementos do hero que a intro revela -----
  const hero = {
    nav: q('.nav'),
    text: qa('.hero__text > *'),
    rings: qa('.radar__ring'),
    sweep: q('.radar__sweep'),     // o transform é do script.js: aqui só mexemos na opacity
    targets: q('.radar__targets'),
    shield: q('.radar__shield'),   // escudo real do radar (destino da animação)
  };
  const revealList = [hero.nav, ...hero.text, ...hero.rings, hero.sweep, hero.targets, hero.shield].filter(Boolean);

  let done = false;
  let tl = null;
  let renderer = null;
  let scene = null;
  let envMap = null;
  let tickFn = null;
  const listeners = [];
  const on = (t, e, f, o) => { t.addEventListener(e, f, o); listeners.push([t, e, f, o]); };

  /* ================= encerramento / limpeza ================= */
  function restoreHero() {
    if (window.gsap) window.gsap.killTweensOf(revealList);
    revealList.forEach((el) => {
      const props = el === hero.sweep
        ? ['opacity']
        : ['opacity', 'transform', 'translate', 'scale', 'rotate', 'visibility', 'will-change'];
      props.forEach((p) => el.style.removeProperty(p));
    });
  }

  function teardown3D() {
    try {
      if (tickFn && window.gsap) window.gsap.ticker.remove(tickFn);
      tickFn = null;
      if (scene) {
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
          ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        });
        scene = null;
      }
      if (envMap) { envMap.dispose(); envMap = null; }
      if (renderer) {
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        renderer = null;
      }
    } catch (e) { /* limpeza best-effort */ }
  }

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(window.__introTimer);
    try { if (tl) tl.kill(); } catch (e) {}
    teardown3D();
    restoreHero();
    root.classList.remove('intro-lock');
    inertEls.forEach((el) => el.removeAttribute('inert'));
    listeners.forEach(([t, e, f, o]) => t.removeEventListener(e, f, o));
    listeners.length = 0;
    overlay.remove();                 // nada fica invisível por cima da página
    window.__introRelease = function () {};
  }

  window.__introRelease = finish;     // botão "Pular" e timer de segurança passam a usar esta rotina
  window.__sentinelaIntro = { get timeline() { return tl; }, skip: finish };

  /* ================= utilidades 3D ================= */
  const SH = 6;            // altura do escudo em unidades 3D
  const K = SH / 20;       // unidades SVG → 3D (o escudo ocupa y de 2 a 22)
  const DEPTH = 0.42;      // espessura das peças

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // contorno do escudo do logotipo: "M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z"
  function bezier(p0, p1, p2, p3, n) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return out;
  }
  function shieldOutline(n) {
    return [[12, 2], [4, 5], [4, 11]]
      .concat(bezier([4, 11], [4, 16], [7.4, 20.3], [12, 22], n))
      .concat(bezier([12, 22], [16.6, 20.3], [20, 16], [20, 11], n))
      .concat([[20, 5]]);
  }

  // mantém o lado do polígono onde nx*x + ny*y >= c (Sutherland–Hodgman; o escudo é convexo)
  function clip(poly, nx, ny, c) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = nx * a[0] + ny * a[1] - c, db = nx * b[0] + ny * b[1] - c;
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  const centroid = (poly) => [
    poly.reduce((s, p) => s + p[0], 0) / poly.length,
    poly.reduce((s, p) => s + p[1], 0) / poly.length,
  ];

  // fragmenta o escudo em células (Voronoi) a partir de sementes fixas → geometria coerente e repetível
  const SEEDS_FULL = [
    [8, 4.2], [16, 4.2], [5.2, 9], [18.8, 9], [6.2, 15], [17.8, 15], [9.6, 20], [14.4, 20],
    [12, 5.4], [9.2, 9.8], [14.8, 9.8], [9.6, 14.6], [14.4, 14.6], [12, 17.2], [12, 11.8],
  ];
  const SEEDS_LITE = [
    [8, 4.4], [16, 4.4], [5.3, 10], [18.7, 10], [7.5, 17], [16.5, 17], [12, 19.5],
    [12, 6.5], [9.3, 12], [14.7, 12],
  ];
  function buildCells(seeds, inset) {
    const outline = shieldOutline(14);
    return seeds.map((s, i) => {
      let poly = outline;
      seeds.forEach((o, j) => {
        if (j === i) return;
        poly = clip(poly, s[0] - o[0], s[1] - o[1], (s[0] * s[0] + s[1] * s[1] - o[0] * o[0] - o[1] * o[1]) / 2);
      });
      // recua cada aresta para abrir uma junta fina entre as peças
      const c = centroid(poly), base = poly.slice();
      for (let k = 0; k < base.length; k++) {
        const a = base[k], b = base[(k + 1) % base.length];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]);
        const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
        if (nx * (c[0] - a[0]) + ny * (c[1] - a[1]) < 0) { nx = -nx; ny = -ny; }
        poly = clip(poly, nx, ny, nx * a[0] + ny * a[1] + inset);
      }
      return poly;
    }).filter((p) => p.length >= 3);
  }

  function glowTexture(stops) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function ringTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.shadowColor = '#fff'; g.shadowBlur = 14;
    g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke();
    return new THREE.CanvasTexture(c);
  }
  // ambiente sintético (softboxes brancos e uma faixa vermelha) para dar reflexo ao metal
  function makeEnvironment(r) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#2a2c33'); bg.addColorStop(0.5, '#0a0a0c'); bg.addColorStop(1, '#030304');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
    // as faces frontais do escudo refletem a região em torno de x≈384: um softbox largo com
    // gradiente faz cada peça (levemente girada) captar um tom diferente, como metal escovado
    const sb = g.createLinearGradient(290, 0, 480, 0);
    sb.addColorStop(0, 'rgba(255,255,255,0)'); sb.addColorStop(0.4, 'rgba(190,196,206,.28)');
    sb.addColorStop(0.68, 'rgba(255,255,255,.85)'); sb.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sb; g.fillRect(290, 70, 190, 120);
    g.filter = 'blur(3px)';
    const box = (x, y, w, h, col, a) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(x, y, w, h); };
    box(70, 36, 130, 22, '#ffffff', 0.95);
    box(300, 30, 190, 10, '#e9ecf1', 0.85);
    box(300, 205, 190, 8, '#E52538', 0.9);
    box(8, 110, 14, 90, '#E52538', 0.65);
    g.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(r);
    const env = pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
    return env;
  }

  /* ================= montagem da cena ================= */
  function init() {
    if (!window.THREE || !window.gsap) throw new Error('bibliotecas indisponíveis');
    const gsap = window.gsap;

    try { window.scrollTo(0, 0); } catch (e) {}
    inertEls.forEach((el) => el.setAttribute('inert', ''));   // sem foco "escondido" atrás da intro

    const small = innerWidth < 720;
    const tablet = innerWidth < 1100;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    on(canvas, 'webglcontextlost', (e) => { e.preventDefault(); finish(); });

    scene = new THREE.Scene();
    envMap = makeEnvironment(renderer);
    scene.environment = envMap;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const cam = { k: 1.18 };   // "dolly" suave: a câmera se aproxima durante a montagem
    let baseDist = 18;
    function fit() {
      const W = innerWidth, H = innerHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      const needH = Math.max(SH / 0.46, (SH * 0.8 / 0.7) / camera.aspect); // escudo nunca é cortado
      baseDist = needH / (2 * tanHalf);
      camera.updateProjectionMatrix();
    }
    fit();
    on(window, 'resize', fit);

    /* ----- luzes ----- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-6, 8, 10); scene.add(key);
    const fill = new THREE.DirectionalLight(0xc4cad4, 0.45); fill.position.set(8, -3, 6); scene.add(fill);
    const rim = new THREE.PointLight(0xff334a, 0, 16); rim.position.set(0, -5, 5); scene.add(rim);

    const shield = new THREE.Group();
    scene.add(shield);
    const runner = new THREE.PointLight(0xff334a, 0, 7); shield.add(runner);

    /* ----- fragmentos ----- */
    const rnd = mulberry32(2026);
    const cells = buildCells(small ? SEEDS_LITE : SEEDS_FULL, 0.2);
    const bodyMats = [];
    const frags = cells.map((poly) => {
      const c = centroid(poly);
      const wc = new THREE.Vector3((c[0] - 12) * K, -(c[1] - 12) * K, 0);
      const shape = new THREE.Shape();
      poly.forEach((p, i) => {
        const x = (p[0] - c[0]) * K, y = -(p[1] - c[1]) * K;
        if (i) shape.lineTo(x, y); else shape.moveTo(x, y);
      });
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: DEPTH, steps: 1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.022, bevelSegments: 2,
      });
      geo.translate(0, 0, -DEPTH / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xaab0ba, metalness: 1, roughness: 0.3, envMapIntensity: 0.95,
        emissive: 0xe52538, emissiveIntensity: 0, transparent: true, opacity: 0,
      });
      bodyMats.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      shield.add(mesh);

      const dir = wc.clone(); dir.z = 0;
      if (dir.length() < 0.3) dir.set(0, 1, 0); dir.normalize();
      const ang = Math.atan2(wc.y, wc.x) + (rnd() - 0.5) * 1.7;
      const R = 7 + rnd() * 8;
      const f = {
        mesh, mat, dir,
        final: wc,
        dist: Math.hypot(c[0] - 12, c[1] - 12),
        stage: wc.clone().addScaledVector(dir, 1.5).add(new THREE.Vector3(0, 0, 1.4)),
        start: new THREE.Vector3(Math.cos(ang) * R * 1.3, Math.sin(ang) * R, -12 + rnd() * 20),
        swirl: new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar((rnd() - 0.5) * 5),
        qStart: new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 6, (rnd() - 0.5) * 6, (rnd() - 0.5) * 6)),
        qStage: new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.9)),
        // inclinação mínima (~5°) por peça: facetas que captam reflexos diferentes, sem alterar a silhueta
        qFinal: new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.18, (rnd() - 0.5) * 0.18, 0)),
        delay: rnd() * 0.12,
        dur: 0.62 + rnd() * 0.1,
      };
      mesh.position.copy(f.start); mesh.quaternion.copy(f.qStart);
      return f;
    });
    frags.sort((a, b) => b.dist - a.dist);     // contorno primeiro, peças internas depois

    /* ----- símbolo central (check vermelho) ----- */
    // sem iluminação e sem tone mapping: o vermelho é exatamente o da marca; a "ativação" varia só o brilho
    const checkMat = new THREE.MeshBasicMaterial({ color: 0x5a111a, transparent: true, opacity: 0, toneMapped: false });
    const chkDim = new THREE.Color(0x5a111a), chkHot = new THREE.Color(0xff3347), chkSet = new THREE.Color(0xe52538);
    const chk = { e: 0, s: 0 };
    const paintCheck = () => { checkMat.color.copy(chkDim).lerp(chkHot, chk.e).lerp(chkSet, chk.s); };
    const T = 0.5, CZ = DEPTH / 2 + 0.05 + 0.1;
    const cp = [[8.5, 12], [11, 14.5], [15.5, 9.5]].map((p) => new THREE.Vector3((p[0] - 12) * K, -(p[1] - 12) * K, CZ));
    for (let i = 0; i < 2; i++) {
      const a = cp[i], b = cp[i + 1], len = a.distanceTo(b);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, T, 0.26), checkMat);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
      shield.add(m);
    }
    cp.forEach((p) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(T / 2, 16, 12), checkMat);
      s.position.copy(p); s.scale.z = 0.5; shield.add(s);
    });

    /* ----- luz que percorre o contorno ----- */
    const path = shieldOutline(20).map((p) => new THREE.Vector3((p[0] - 12) * K, -(p[1] - 12) * K, DEPTH / 2 + 0.2));
    path.push(path[0].clone());
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + path[i].distanceTo(path[i - 1]));
    const total = cum[cum.length - 1];
    function pointAt(u, out) {
      const d = ((u % 1) + 1) % 1 * total;
      let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
      const t = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      return out.copy(path[i - 1]).lerp(path[i], t);
    }
    const sparkTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,90,110,.9)'], [1, 'rgba(229,37,56,0)']]);
    const sparks = [];
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: sparkTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      }));
      s.scale.setScalar(0.9 - i * 0.09); s.renderOrder = 12; shield.add(s); sparks.push(s);
    }

    /* ----- núcleo, brilho, pulsos e partículas ----- */
    const addSprite = (map, color, order) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map, color, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      }));
      s.renderOrder = order; scene.add(s); return s;
    };
    const coreTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,70,90,1)'], [0.55, 'rgba(229,37,56,.35)'], [1, 'rgba(229,37,56,0)']]);
    const haloTex = glowTexture([[0, 'rgba(229,37,56,.55)'], [0.5, 'rgba(229,37,56,.12)'], [1, 'rgba(229,37,56,0)']]);
    const rTex = ringTexture();
    const halo = addSprite(haloTex, 0xffffff, 1);
    const core = addSprite(coreTex, 0xffffff, 3);
    const ringA = addSprite(rTex, 0xe52538, 2);
    const ringB = addSprite(rTex, 0xff334a, 2);
    [halo, core, ringA, ringB].forEach((s) => s.position.z = 1.5);
    core.scale.setScalar(0.02);

    const NP = small ? 70 : tablet ? 110 : 150;
    const pp = new Float32Array(NP * 3);
    for (let i = 0; i < NP; i++) {
      const a = rnd() * Math.PI * 2, r = 4 + rnd() * 11;
      pp[i * 3] = Math.cos(a) * r * 1.3; pp[i * 3 + 1] = Math.sin(a) * r; pp[i * 3 + 2] = -10 + rnd() * 16;
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const dotTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(210,216,226,.7)'], [1, 'rgba(184,190,199,0)']]);
    const particles = new THREE.Points(pg, new THREE.PointsMaterial({
      map: dotTex, size: 0.2, sizeAttenuation: true, color: 0xb8bec7, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    scene.add(particles);

    /* ----- render ----- */
    tickFn = (time) => {
      camera.position.set(0, 0, baseDist * cam.k);
      particles.rotation.y = time * 0.05;
      particles.rotation.x = Math.sin(time * 0.3) * 0.05;
      renderer.render(scene, camera);
    };
    gsap.ticker.add(tickFn);

    /* ================= TIMELINE ================= */
    const isLight = root.getAttribute('data-theme') === 'light';
    const bodyColor = new THREE.Color(isLight ? 0xe3e6eb : 0x17171b);
    const silver = new THREE.Color(0xb8bec7);
    const sparkPos = new THREE.Vector3();
    const run = { u: 0, a: 0 };
    const ring = (sprite, at, from, to, dur, op) => {
      tl.fromTo(sprite.material, { opacity: op }, { opacity: 0, duration: dur, ease: 'power2.out', immediateRender: false }, at)
        .fromTo(sprite.scale, { x: from, y: from }, { x: to, y: to, duration: dur, ease: 'expo.out', immediateRender: false }, at);
    };

    tl = gsap.timeline({ onComplete: finish, defaults: { overwrite: false } });
    shield.rotation.set(-0.12, 0.5, 0);

    // CENA 01 — INITIAL PULSE (0,00–0,40)
    tl.to(core.material, { opacity: 1, duration: 0.22, ease: 'power2.out' }, 0)
      .to(core.scale, { x: 0.55, y: 0.55, duration: 0.4, ease: 'expo.out' }, 0)
      .to(halo.material, { opacity: 0.9, duration: 0.4, ease: 'sine.out' }, 0.04)
      .fromTo(halo.scale, { x: 1, y: 1 }, { x: 9, y: 9, duration: 0.5, ease: 'power2.out' }, 0.04)
      .to(particles.material, { opacity: 0.85, duration: 0.55, ease: 'sine.inOut' }, 0.12)
      .to(skipBtn, { opacity: 0.8, duration: 0.5 }, 0.3);
    ring(ringA, 0.05, 0.6, 7, 0.6, 0.8);

    // movimentos contínuos da câmera e do grupo durante a montagem
    tl.to(cam, { k: 1, duration: 2.3, ease: 'power1.out' }, 0)
      .to(shield.rotation, { x: 0, y: 0, duration: 1.95, ease: 'sine.inOut' }, 0.4);

    // CENA 02 — FRAGMENT ARRIVAL (0,40–1,15): cada peça converge a uma posição de espera predeterminada
    frags.forEach((f) => {
      const p = { e: 0 }, t0 = 0.4 + f.delay;
      tl.to(f.mat, { opacity: 1, duration: 0.3, ease: 'power1.out' }, t0)
        .to(p, {
          e: 1, duration: f.dur, ease: 'power2.out',
          onUpdate() {
            f.mesh.position.lerpVectors(f.start, f.stage, p.e)
              .addScaledVector(f.swirl, Math.sin(Math.PI * p.e) * (1 - p.e * 0.3));
            f.mesh.quaternion.copy(f.qStart).slerp(f.qStage, p.e);
          },
        }, t0);
    });

    // CENA 03 — SHIELD ASSEMBLY (1,15–1,90): contorno → peças internas, encaixe com desaceleração
    const n = frags.length;
    frags.forEach((f, i) => {
      const p = { e: 0 }, t0 = 1.15 + (i / Math.max(1, n - 1)) * 0.42;
      tl.to(p, {
        e: 1, duration: 0.34, ease: 'expo.out',
        onUpdate() {
          f.mesh.position.lerpVectors(f.stage, f.final, p.e);
          f.mesh.quaternion.copy(f.qStage).slerp(f.qFinal, p.e);
        },
      }, t0)
        .fromTo(f.mat, { emissiveIntensity: 0 },
          { emissiveIntensity: 0.5, duration: 0.09, ease: 'power1.out', yoyo: true, repeat: 1, immediateRender: false }, t0 + 0.1);
    });
    tl.to(rim, { intensity: 1.4, duration: 0.7, ease: 'sine.inOut' }, 1.3);
    tl.to(checkMat, { opacity: 1, duration: 0.15, ease: 'power1.out' }, 1.8);

    // CENA 04 — SECURITY ACTIVATED (1,90–2,35)
    tl.to(run, { u: 1, duration: 0.45, ease: 'power2.inOut',
      onUpdate() {
        pointAt(run.u, runner.position);
        sparks.forEach((s, i) => { pointAt(run.u - i * 0.016, sparkPos); s.position.copy(sparkPos); s.material.opacity = run.a * (1 - i / 8); });
        runner.intensity = 7 * run.a;
      } }, 1.9)
      .to(run, { a: 1, duration: 0.1, ease: 'none' }, 1.9)
      .to(run, { a: 0, duration: 0.14, ease: 'none' }, 2.2)
      .to(chk, { e: 1, duration: 0.2, ease: 'power2.out', onUpdate: paintCheck }, 2.0)
      .to(chk, { s: 1, duration: 0.35, ease: 'sine.inOut', onUpdate: paintCheck }, 2.2);
    ring(ringB, 2.0, 2.5, 20, 0.55, 0.85);
    tl.to(bodyMats.map((m) => m), { envMapIntensity: 0.6, duration: 0.45, ease: 'sine.inOut' }, 1.95)
      .to(key, { intensity: 0.9, duration: 0.45, ease: 'sine.inOut' }, 1.95);

    // CENA 05 — HERO TRANSITION (2,35–3,00): o escudo 3D vira o escudo do radar
    function targetPose() {
      const r = hero.shield.getBoundingClientRect();
      const upp = 2 * camera.position.z * tanHalf / innerHeight;          // unidades 3D por pixel em z = 0
      const hPx = r.height * (20 / 24);                                   // altura real do símbolo dentro do SVG
      return {
        x: (r.left + r.width / 2 - innerWidth / 2) * upp,
        y: -(r.top + r.height / 2 - innerHeight / 2) * upp,
        s: (hPx * upp) / SH,
      };
    }
    const tr = { p: 0 }, from = { x: 0, y: 0, s: 1 };
    tl.to(tr, { p: 1, duration: 0.65, ease: 'power3.inOut',
      onUpdate() {
        const t = targetPose();
        shield.position.set(from.x + (t.x - from.x) * tr.p, from.y + (t.y - from.y) * tr.p, 0);
        shield.scale.setScalar(from.s + (t.s - from.s) * tr.p);
      } }, 2.35);
    // as peças esfriam para o acabamento do escudo do radar (corpo escuro, bordas prateadas)
    const col = { e: 0 };
    tl.to(col, { e: 1, duration: 0.5, ease: 'sine.inOut',
      onUpdate() {
        bodyMats.forEach((m) => { m.color.copy(silver).lerp(bodyColor, col.e); m.metalness = 1 - col.e * 0.3; m.envMapIntensity = 0.6 - col.e * 0.3; });
      } }, 2.38)
      .to(rim, { intensity: 0, duration: 0.4 }, 2.4)
      .to([halo.material, particles.material, core.material], { opacity: 0, duration: 0.4, ease: 'sine.out' }, 2.35)
      .to(overlay, { backgroundColor: 'rgba(9,9,11,0)', duration: 0.65, ease: 'power2.inOut' }, 2.35)
      .to(skipBtn, { opacity: 0, duration: 0.2 }, 2.6);

    // revelação do hero, sincronizada com a mesma timeline
    gsap.set(hero.nav, { y: -26 });
    gsap.set(hero.text, { y: 26 });
    gsap.set(hero.rings, { scale: 0.86 });
    const [eyebrow, h1, lead, cta, stats] = hero.text;
    tl.to(hero.nav, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 2.4)
      .to(hero.rings, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.07 }, 2.4)
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 2.45)
      .to(h1, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, 2.52)
      .to(lead, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 2.68)
      .to(cta, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 2.82)
      .to(stats, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 2.95)
      .to(hero.sweep, { opacity: 1, duration: 0.5, ease: 'sine.out' }, 2.85)
      .to(hero.targets, { opacity: 1, duration: 0.5, ease: 'sine.out' }, 2.95);

    // entrega sem corte: o SVG do radar assume exatamente onde o escudo 3D termina
    tl.call(() => { overlay.style.pointerEvents = 'none'; inertEls.forEach((el) => el.removeAttribute('inert')); }, null, 2.95)
      .to(hero.shield, { opacity: 1, duration: 0.1, ease: 'none' }, 3.0)
      .to(canvas, { opacity: 0, duration: 0.2, ease: 'none' }, 3.06)
      .to({}, { duration: 0.05 });

    // auxílio de ajuste: ?introAt=1.6 congela a timeline nesse instante (use __sentinelaIntro.timeline.seek(t))
    const hold = /[?&]introAt=([\d.]+)/.exec(location.search);
    if (hold) { clearTimeout(window.__introTimer); tl.pause(); tl.seek(parseFloat(hold[1])); }
  }

  /* ================= controles ================= */
  on(document, 'keydown', (e) => { if (e.key === 'Escape') finish(); });   // Esc também pula

  try {
    init();
  } catch (err) {
    console.warn('[Sentinela] Introdução indisponível; a página foi revelada normalmente.', err);
    finish();
  }
})();
