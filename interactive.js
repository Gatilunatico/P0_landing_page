/* Sentinela — EVOLUÇÃO INTERATIVA (estética "hacker elegante")
   Fase 1  Radar SOC interativo (cursor como sensor, botão "Simular um ataque", alvo demonstrativo com painel)
   Fase 2  Arquitetura visual de segurança, ligada ao estado REAL do configurador
   Fase 3  Navegação lateral por seções
   Fase 4  Microinterações técnicas
   Camada isolada e reversível: remova <link interactive.css> e <script interactive.js> do index.html para desfazer.
   Reutiliza a narrativa SOC existente (window.__sentinelaSOC, em experience.js) e o estado do configurador (aria-pressed dos botões). */
(function () {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const NS = 'http://www.w3.org/2000/svg';
  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  const safe = (name, fn) => { try { fn(); } catch (e) { console.warn('[Sentinela] ' + name + ' indisponível.', e); } };
  const introDone = (cb) => {                               // a intro encerra removendo "intro-lock" do <html> (conclusão, pular, falha)
    if (!root.classList.contains('intro-lock')) { cb(); return; }
    const mo = new MutationObserver(() => { if (!root.classList.contains('intro-lock')) { mo.disconnect(); cb(); } });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  };
  const pol = (deg, r) => ({ x: 50 + Math.sin(deg * Math.PI / 180) * r * 50, y: 50 - Math.cos(deg * Math.PI / 180) * r * 50 });

  ready(() => {
    safe('Radar SOC interativo', initializeSocInteractions);
    safe('Arquitetura visual', initializeArchitecture);
    safe('Mini diagnóstico', initializeDiagnostic);
    safe('Relatório de exemplo', initializeReportDemo);
    safe('Navegação lateral', initializeSideNav);
    safe('Microinterações', initializeMicro);
    safe('Spotlight dos cards', initializeCardSpotlight);
    safe('Retornar ao início', initializeBackToTop);
    safe('Conversão e confiança', initializeCommercial);
  });

  /* ======================================================================================
     FASE 1 — RADAR SOC INTERATIVO
     ====================================================================================== */
  function initializeSocInteractions() {
    const hv = document.querySelector('.hero__visual');
    const radar = document.querySelector('.radar');
    if (!hv || !radar || !window.__sentinelaSOC) return;

    // acessibilidade: o contêiner inteiro era aria-hidden; como agora há controles focáveis, o aria-hidden passa para os filhos decorativos
    if (hv.getAttribute('aria-hidden') === 'true') {
      hv.removeAttribute('aria-hidden');
      Array.from(radar.children).forEach((c) => c.setAttribute('aria-hidden', 'true'));
    }

    /* ----- botão "Simular um ataque": reutiliza a timeline SOC (window.__sentinelaSOC.run) ----- */
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'soc-sim';
    btn.setAttribute('aria-describedby', 'socSimHint');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5 20 7v10l-8 4.5L4 17V7z"/><path d="M12 8v4.5l3 1.8" stroke-linecap="round"/></svg><span>Simular um ataque</span>';
    const hint = document.createElement('span');
    hint.id = 'socSimHint'; hint.className = 'soc-sr';
    hint.textContent = 'Demonstração: executa uma simulação fictícia de detecção e contenção no radar.';
    hv.appendChild(btn); hv.appendChild(hint);
    const syncLock = () => { btn.disabled = root.classList.contains('intro-lock'); };
    syncLock(); introDone(syncLock);
    btn.addEventListener('click', () => { window.__sentinelaSOC.run(); });
    document.addEventListener('sentinela:soc-start', () => { btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true'); });
    document.addEventListener('sentinela:soc-end', () => { btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); });

    /* ----- cursor como sensor (somente mouse; nada se move no radar inteiro, o escudo nunca é deformado) ----- */
    if (!reduce && fine) {
      const ui = document.createElement('div');
      ui.className = 'soc-ui'; ui.setAttribute('aria-hidden', 'true');
      ui.innerHTML = '<i class="soc-ui__lit"></i><i class="soc-ui__cross"></i>';
      radar.appendChild(ui);
      const dots = Array.from(radar.querySelectorAll('.soc-nd')).map((d) => ({ el: d, x: parseFloat(d.getAttribute('cx')), y: parseFloat(d.getAttribute('cy')) }));
      let inside = false, tx = 0.5, ty = 0.5, cx = 0.5, cy = 0.5, lit = 0, raf = 0, near = null;

      const paint = () => {
        cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
        lit += ((inside ? 1 : 0) - lit) * 0.12;
        const w = radar.offsetWidth, h = radar.offsetHeight;
        radar.style.setProperty('--rx', ((cx - 0.5) * 2 * lit).toFixed(3));
        radar.style.setProperty('--ry', ((cy - 0.5) * 2 * lit).toFixed(3));
        ui.style.setProperty('--lit', lit.toFixed(3));
        ui.style.setProperty('--mx', (cx * w).toFixed(1) + 'px');
        ui.style.setProperty('--my', (cy * h).toFixed(1) + 'px');
        if (!inside && lit < 0.01) {                                       // voltou ao estado original: limpa tudo
          ['--rx', '--ry'].forEach((p) => radar.style.removeProperty(p));
          ['--lit', '--mx', '--my'].forEach((p) => ui.style.removeProperty(p));
          if (near) { near.el.classList.remove('is-near'); near = null; }
          raf = 0; return;
        }
        raf = requestAnimationFrame(paint);
      };
      const wake = () => { if (!raf) raf = requestAnimationFrame(paint); };
      radar.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { inside = true; wake(); } });
      // alvos que a mira pode travar: alvo demonstrativo, blips do radar visíveis e a ameaça do SOC enquanto aparece (lista curta, recalculada no máximo a cada 90 ms)
      const LOCK_R = 34;
      let cand = [], candAt = 0, locked = false;
      const collect = (r) => {
        const out = [], at = (el) => { const b = el.getBoundingClientRect(); out.push({ x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top }); };
        const hotEl = radar.querySelector('.soc-hot'); if (hotEl) at(hotEl);
        radar.querySelectorAll('.target').forEach((t) => { if (parseFloat(t.style.opacity) > 0.35) at(t); });
        const thr = radar.querySelector('.soc-threat');
        if (thr && parseFloat(getComputedStyle(thr).opacity) > 0.3) { const d = thr.querySelector('.soc-dot'); if (d) at(d); }
        return out;
      };
      const setLock = (on) => { if (on !== locked) { locked = on; ui.classList.toggle('is-lock', on); } };
      radar.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = radar.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        const now = performance.now();
        if (now - candAt > 90) { cand = collect(r); candAt = now; }
        let lk = null, ld = LOCK_R;
        for (const c of cand) { const dd = Math.hypot(c.x - px, c.y - py); if (dd < ld) { ld = dd; lk = c; } }
        setLock(!!lk);                                                  // com alvo próximo, a mira trava no centro dele
        const gx = lk ? lk.x : px, gy = lk ? lk.y : py;
        tx = Math.min(1, Math.max(0, gx / r.width)); ty = Math.min(1, Math.max(0, gy / r.height));
        inside = true; wake();
        // ponto de monitoramento mais próximo reage (apenas mudança de cor via classe)
        let best = null, bd = 9;
        for (const d of dots) { const dd = Math.hypot(d.x - tx * 100, d.y - ty * 100); if (dd < bd) { bd = dd; best = d; } }
        if (best !== near) { if (near) near.el.classList.remove('is-near'); if (best) best.el.classList.add('is-near'); near = best; }
      });
      radar.addEventListener('pointerleave', () => { inside = false; tx = ty = 0.5; setLock(false); wake(); });
    }

    /* ----- alvo demonstrativo + painel contextual (mouse, toque e teclado) ----- */
    const P = pol(18, 0.36);
    const hot = document.createElement('button');
    hot.type = 'button'; hot.className = 'soc-hot';
    hot.style.left = P.x.toFixed(2) + '%'; hot.style.top = P.y.toFixed(2) + '%';
    hot.setAttribute('aria-haspopup', 'dialog'); hot.setAttribute('aria-expanded', 'false'); hot.setAttribute('aria-controls', 'socPanel');
    hot.setAttribute('aria-label', 'Alvo demonstrativo: Phishing detectado (simulação). Abrir detalhes');
    hot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5"/><circle cx="12" cy="12" r="2.2"/></svg>';
    const panel = document.createElement('div');
    panel.className = 'soc-panel'; panel.id = 'socPanel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'socPanelTitle');
    panel.innerHTML =
      '<div class="soc-panel__head"><span class="soc-panel__tag">Simulação</span>' +
      '<button type="button" class="soc-panel__close" aria-label="Fechar detalhes"><span aria-hidden="true">×</span></button></div>' +
      '<h3 id="socPanelTitle">Phishing detectado</h3>' +
      '<p>Tentativa simulada de obtenção indevida de credenciais.</p>' +
      '<p class="soc-panel__rel"><b>Proteções relacionadas:</b> Anti-phishing e MFA / IAM.</p>';
    radar.appendChild(hot); radar.appendChild(panel);
    const closeBtn = panel.querySelector('.soc-panel__close');

    const onKey = (e) => { if (e.key === 'Escape') closePanel(true); };
    const onOutside = (e) => { if (!panel.contains(e.target) && !hot.contains(e.target)) closePanel(false); };
    function openPanel() {
      panel.hidden = false; hot.setAttribute('aria-expanded', 'true');
      closeBtn.focus({ preventScroll: true });
      document.addEventListener('keydown', onKey); document.addEventListener('pointerdown', onOutside);
    }
    function closePanel(restoreFocus) {
      if (panel.hidden) return;
      panel.hidden = true; hot.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside);
      if (restoreFocus) hot.focus({ preventScroll: true });
    }
    hot.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel(true)));
    closeBtn.addEventListener('click', () => closePanel(true));
  }
  /* ======================================================================================
     FASE 2 — ARQUITETURA VISUAL DE SEGURANÇA
     Fonte única de estado: o configurador. O diagrama apenas OBSERVA o aria-pressed dos 8 botões (que o próprio
     configurador atualiza ao adicionar/remover/limpar/restaurar) — sem seleção própria e sem tocar em preços/formulário.
     ====================================================================================== */
  function initializeArchitecture() {
    const builder = document.getElementById('combinationBuilder');
    if (!builder) return;
    const toggles = {};
    builder.querySelectorAll('.cb-toggle[data-toggle]').forEach((b) => { toggles[b.dataset.toggle] = b; });
    // posição no anel (0–7), nome curto para telas pequenas; o nome completo vem do próprio card
    const SERVICES = [['edr', 4, 'EDR'], ['siem', 5, 'SIEM'], ['backup', 6, 'Backup'], ['zerotrust', 7, 'Zero Trust'],
      ['cloud', 0, 'Cloud'], ['mfa', 1, 'MFA/IAM'], ['phishing', 2, 'Phishing'], ['intel', 3, 'Intel']]
      .filter((d) => toggles[d[0]])
      .map((d) => ({ id: d[0], slot: d[1], short: d[2], name: (builder.querySelector('.cb-card[data-module="' + d[0] + '"] .cb-card__name') || {}).textContent || d[2] }));
    if (!SERVICES.length) return;

    const fig = document.createElement('figure');
    fig.className = 'cb-arch';
    fig.innerHTML = '<figcaption class="cb-arch__cap"><span>Arquitetura de proteção</span>' +
      '<small>Representa os módulos selecionados. Não é uma avaliação de segurança.</small></figcaption>' +
      '<div class="cb-arch__stage" role="img"></div>';
    builder.insertBefore(fig, builder.firstElementChild);
    const stage = fig.querySelector('.cb-arch__stage');

    const compactMQ = matchMedia('(max-width: 720px)');
    const active = new Set();
    let E = null;                                           // elementos do diagrama atual (por serviço)
    let core = null, halo = null, shieldR = 0, F = null;
    let readyEl = null, readyPrev = null, readyT = 0;
    let mode = 'edit', tlFin = null, snapping = false, bbTween = null, bbEl = null;                         // modo da finalização: 'edit' | 'running' | 'final'
    const el = (tag, cls, attrs) => { const n = document.createElementNS(NS, tag); if (cls) n.setAttribute('class', cls); for (const k in attrs || {}) n.setAttribute(k, attrs[k]); return n; };
    const hexPts = (cx, cy, r) => [0, 1, 2, 3, 4, 5].map((k) => { const a = (k * 60 + 30) * Math.PI / 180; return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1); }).join(' ');

    function build() {
      const compact = compactMQ.matches;
      const W = compact ? 360 : 760, H = compact ? 330 : 320, cx = W / 2, cy = H / 2;
      const rx = compact ? 100 : 275, ry = compact ? 100 : 112, nodeR = compact ? 14 : 15;
      shieldR = compact ? 38 : 48; const segR = shieldR + (compact ? 16 : 18);
      const svg = el('svg', 'arch-svg', { viewBox: '0 0 ' + W + ' ' + H, focusable: 'false', 'aria-hidden': 'true' });
      const defs = el('defs'); defs.innerHTML = '<radialGradient id="archGlow"><stop offset="0" stop-color="#FF334A" stop-opacity=".8"/><stop offset="1" stop-color="#E52538" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="archMetal" gradientUnits="userSpaceOnUse" x1="4" y1="2" x2="20" y2="22"><stop offset="0" stop-color="#6b727d"/><stop offset=".42" stop-color="#e4e7eb"/><stop offset=".72" stop-color="#8d949e"/><stop offset="1" stop-color="#b8bec7"/></linearGradient>';
      svg.appendChild(defs);
      const gTracks = el('g', 'arch-tracks'), gLinks = el('g'), gSegs = el('g'), gBeams = el('g'), gNodes = el('g');
      svg.appendChild(gTracks); svg.appendChild(gLinks); svg.appendChild(gSegs); svg.appendChild(gBeams);

      // escudo central (mesma geometria do logotipo da Sentinela)
      core = el('circle', 'arch-core', { cx, cy, r: segR + 14, fill: 'url(#archGlow)' });
      halo = el('circle', 'arch-halo', { cx, cy, r: shieldR });
      svg.appendChild(core); svg.appendChild(halo);
      svg.appendChild(el('polygon', 'arch-hex', { points: hexPts(cx, cy, shieldR) }));
      const gl = el('g', 'arch-glyph', { transform: 'translate(' + cx + ' ' + cy + ') scale(' + (shieldR / 15.5).toFixed(2) + ') translate(-12 -12)' });
      gl.appendChild(el('path', 'arch-shield', { d: 'M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z' }));
      gl.appendChild(el('path', 'arch-check', { d: 'm8.5 12 2.5 2.5 4.5-5' }));
      svg.appendChild(gl);

      // montagem final do escudo (peças próprias do configurador; ocultas por CSS até a finalização)
      const k = shieldR / 10.6;
      const fin = el('g', 'arch-fin', { transform: 'translate(' + cx + ' ' + cy + ') scale(' + k.toFixed(3) + ') translate(-12 -12)' });
      const OUT = 'M12 2 20 5v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3Z';
      const plateD = ['M12 2 20 5', 'M20 5V11', 'M20 11c0 5-3.4 9.3-8 11', 'M12 22c-4.6-1.7-8-6-8-11', 'M4 11V5', 'M4 5 12 2'];
      const plateMid = [[16, 3.5], [20, 8], [17.6, 17], [6.4, 17], [4, 8], [8, 3.5]];
      F = { k, g: fin, plates: [], dirs: [] };
      F.fill = el('path', 'arch-ffill', { d: OUT }); fin.appendChild(F.fill);
      plateD.forEach((d, i) => {
        const p = el('path', 'arch-plate', { d }); fin.appendChild(p); F.plates.push(p);
        const dx = plateMid[i][0] - 12, dy = plateMid[i][1] - 12, dd = Math.hypot(dx, dy) || 1; F.dirs.push([dx / dd, dy / dd, plateMid[i]]);
      });
      F.contour = el('path', 'arch-contour', { d: OUT, pathLength: 1 }); fin.appendChild(F.contour);
      F.inner = ['M12 5.6 7 7.6v3.6c0 3.2 2.1 5.7 5 6.8 2.9-1.1 5-3.6 5-6.8V7.6L12 5.6Z', 'M12 5.6V18', 'M7 11.4h10']
        .map((d) => { const p = el('path', 'arch-inner', { d, pathLength: 1 }); fin.appendChild(p); return p; });
      F.sweep = el('path', 'arch-sweep', { d: OUT, pathLength: 1 }); fin.appendChild(F.sweep);
      svg.appendChild(fin);
      F.hex = svg.querySelector('.arch-hex'); F.glyph = gl; F.tracks = gTracks;

      E = {};
      SERVICES.forEach((sv) => {
        const th = (22.5 + 45 * sv.slot) * Math.PI / 180;
        const px = cx + rx * Math.cos(th), py = cy + ry * Math.sin(th);
        const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, phi = Math.atan2(dy, dx);
        const sx = px - ux * nodeR, sy = py - uy * nodeR, ex = cx + ux * (segR + 4), ey = cy + uy * (segR + 4);
        const len = Math.hypot(ex - sx, ey - sy);
        const track = el('line', 'arch-track', { x1: sx, y1: sy, x2: ex, y2: ey });
        const link = el('line', 'arch-link', { x1: sx, y1: sy, x2: ex, y2: ey });
        link.style.strokeDasharray = len; link.style.strokeDashoffset = len;
        const a1 = phi - 0.28, a2 = phi + 0.28;
        const seg = el('path', 'arch-seg', { d: 'M' + (cx + segR * Math.cos(a1)).toFixed(1) + ' ' + (cy + segR * Math.sin(a1)).toFixed(1) + ' A' + segR + ' ' + segR + ' 0 0 1 ' + (cx + segR * Math.cos(a2)).toFixed(1) + ' ' + (cy + segR * Math.sin(a2)).toFixed(1) });
        const node = el('g', 'arch-node');
        node.appendChild(el('polygon', '', { points: hexPts(px, py, nodeR) }));
        node.appendChild(el('circle', 'arch-dot', { cx: px, cy: py, r: 2.4 }));
        const side = Math.abs(Math.cos(th)) > 0.7;
        const lab = el('text', 'arch-label', side ? { x: px + (Math.cos(th) > 0 ? nodeR + 8 : -nodeR - 8), y: py + 4, 'text-anchor': Math.cos(th) > 0 ? 'start' : 'end' }
          : { x: px, y: Math.sin(th) < 0 ? py - nodeR - 8 : py + nodeR + 17, 'text-anchor': 'middle' });
        lab.textContent = compact ? sv.short : sv.name;
        node.appendChild(lab);
        const pk = el('circle', 'arch-packet', { r: 3, cx: sx, cy: sy }); pk.style.opacity = 0;
        // feixe: traço que se revela do serviço ao escudo com gradiente (vermelho no serviço, branco-quente na chegada) + cometa curto na frente
        const gid = 'archBeam' + sv.id;
        const grad = el('linearGradient', '', { id: gid, gradientUnits: 'userSpaceOnUse', x1: sx, y1: sy, x2: ex, y2: ey });
        grad.innerHTML = '<stop offset="0" stop-color="#E52538" stop-opacity=".35"/><stop offset=".65" stop-color="#FF334A"/><stop offset="1" stop-color="#fff"/>';
        defs.appendChild(grad);
        const beam = el('line', 'arch-beam', { x1: sx, y1: sy, x2: ex, y2: ey }); beam.style.stroke = 'url(#' + gid + ')'; beam.style.strokeDasharray = len; beam.style.strokeDashoffset = len;
        const clen = Math.max(10, len * 0.22);
        const comet = el('line', 'arch-comet', { x1: sx, y1: sy, x2: ex, y2: ey }); comet.style.strokeDasharray = clen + ' ' + len * 2; comet.style.strokeDashoffset = clen;
        const head = el('circle', 'arch-beamhead', { r: 4, cx: sx, cy: sy });
        gBeams.appendChild(beam); gBeams.appendChild(comet); gBeams.appendChild(head);
        gTracks.appendChild(track); gLinks.appendChild(link); gSegs.appendChild(seg); gNodes.appendChild(node); gLinks.appendChild(pk);
        E[sv.id] = { node, link, seg, pk, beam, comet, clen, head, len, sx, sy, ex, ey, px, py };
      });
      svg.appendChild(gNodes);
      stage.textContent = ''; stage.appendChild(svg);
    }

    function summarize() {
      const names = SERVICES.filter((s) => active.has(s.id)).map((s) => s.name);
      stage.setAttribute('aria-label', 'Arquitetura de proteção com ' + names.length + ' de ' + SERVICES.length + ' módulos selecionados' + (names.length ? ': ' + names.join(', ') + '.' : '.'));
      if (core) core.style.opacity = (0.22 + names.length * 0.09).toFixed(2);
    }

    function setActive(id, on, animate) {
      const n = E && E[id]; if (!n) return;
      n.node.classList.toggle('is-on', on); n.seg.classList.toggle('is-on', on);
      const g = window.gsap;
      if (!animate || reduce || !g) { n.link.style.strokeDashoffset = on ? 0 : n.len; n.pk.style.opacity = 0; return; }
      g.killTweensOf([n.link, n.pk]);
      if (on) {
        g.fromTo(n.link, { strokeDashoffset: n.len }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' });
        const p = { t: 0 };                                  // pulso de energia percorrendo a conexão
        g.fromTo(p, { t: 0 }, { t: 1, duration: 0.55, ease: 'power1.inOut', onUpdate() {
          n.pk.setAttribute('cx', n.sx + (n.ex - n.sx) * p.t); n.pk.setAttribute('cy', n.sy + (n.ey - n.sy) * p.t);
          n.pk.style.opacity = Math.sin(Math.PI * p.t).toFixed(2); }, onComplete() { n.pk.style.opacity = 0; } });
        g.killTweensOf(halo);                                // o escudo recebe um breve pulso
        g.fromTo(halo, { opacity: 0.85, attr: { r: shieldR + 2 } }, { opacity: 0, attr: { r: shieldR + 30 }, duration: 0.7, delay: 0.45, ease: 'power2.out', immediateRender: false });
      } else {
        g.to(n.link, { strokeDashoffset: n.len, duration: 0.35, ease: 'power2.in' });
      }
    }

    function sync(animate) {                                // lê o estado REAL do configurador e aplica somente as diferenças
      const diff = SERVICES.filter((sv) => (toggles[sv.id].getAttribute('aria-pressed') === 'true') !== active.has(sv.id));
      if (!diff.length) return;
      if (mode !== 'edit') leaveFinal(false);               // a seleção mudou: o diagrama volta ao modo editável (a seleção em si nunca é alterada aqui)
      diff.forEach((sv) => {
        const on = toggles[sv.id].getAttribute('aria-pressed') === 'true';
        if (on) active.add(sv.id); else active.delete(sv.id);
        setActive(sv.id, on, animate);
      });
      summarize(); refreshFinalButton();
    }

    /* ----------------------------------------------------------------------------------
       FINALIZAR PROTEÇÃO — montagem cinematográfica do escudo (exclusiva do configurador).
       Usa o MESMO estado (active ← aria-pressed); não cria outra lista nem toca em preços/formulário.
       Modos: edit → running → final → (Editar combinação) → edit. Apenas uma timeline por vez.
       ---------------------------------------------------------------------------------- */
    const panelEl = document.getElementById('cbPanel');
    const actionsRow = panelEl && panelEl.querySelector('.cb-actions');
    const sendBtn = document.getElementById('cbSend');
    let btnFin = null, hintEl = null, doneEl = null, liveEl = null;

    function initializeFinalize() {
      if (!window.gsap || !actionsRow || !sendBtn) return;
      btnFin = document.createElement('button');
      btnFin.type = 'button'; btnFin.className = 'btn btn--red cb-finalize'; btnFin.id = 'cbFinalize';
      btnFin.textContent = 'Finalizar proteção'; btnFin.setAttribute('aria-describedby', 'cbReady cbFinHint');
      hintEl = document.createElement('p');
      hintEl.id = 'cbFinHint'; hintEl.className = 'cb-final-hint'; hintEl.setAttribute('role', 'status');
      // indicador contextual de prontidão (acima do botão; não é região live para evitar anúncios repetidos)
      readyEl = document.createElement('div');
      readyEl.className = 'cb-ready'; readyEl.id = 'cbReady';
      readyEl.innerHTML = '<svg class="cb-ready__ico" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="var(--red-strong)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span class="cb-ready__txt"><b class="cb-ready__t"></b><small class="cb-ready__s"></small></span>';
      readyEl.addEventListener('animationend', () => readyEl.classList.remove('is-scan'));
      actionsRow.parentNode.insertBefore(btnFin, actionsRow); actionsRow.parentNode.insertBefore(hintEl, actionsRow);
      btnFin.parentNode.insertBefore(readyEl, btnFin);

      doneEl = document.createElement('div');
      doneEl.className = 'cb-arch__done'; doneEl.hidden = true;
      doneEl.innerHTML = '<div class="cb-arch__donetxt"><strong>Sua arquitetura está pronta</strong>' +
        '<p>Esta é a combinação de serviços que você selecionou, não uma proteção já implantada. Escopo e valores finais são definidos na proposta.</p></div>' +
        '<div class="cb-arch__doneact"><button type="button" class="btn btn--red" data-act="send">Solicitar proposta</button>' +
        '<button type="button" class="btn btn--ghost" data-act="edit">Editar combinação</button></div>';
      stage.insertAdjacentElement('afterend', doneEl);
      liveEl = document.createElement('p'); liveEl.className = 'soc-sr'; liveEl.setAttribute('aria-live', 'polite');
      fig.appendChild(liveEl);

      btnFin.addEventListener('click', startFinal);
      doneEl.querySelector('[data-act="send"]').addEventListener('click', () => sendBtn.click());      // fluxo de contato já existente
      doneEl.querySelector('[data-act="edit"]').addEventListener('click', () => leaveFinal(true));

      // sair da seção durante a montagem: conclui com segurança (estado visual válido, seleção intacta); nunca reinicia sozinho
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { if (!en[en.length - 1].isIntersecting && mode === 'running' && tlFin) { snapping = true; tlFin.progress(1); snapping = false; } }).observe(fig);
      }
      refreshFinalButton();
    }

    function refreshFinalButton() {
      if (!btnFin) return;
      const empty = active.size === 0;
      btnFin.setAttribute('aria-disabled', String(empty));
      btnFin.classList.toggle('is-idle', empty);
      if (!empty) hintEl.textContent = '';
      renderReady();
    }

    // Indicador: Estado A (sem serviços), B (pronto), oculto durante a montagem e depois de concluída. Varredura única só na transição 0 → ≥1.
    function renderReady() {
      if (!readyEl) return;
      const n = active.size, show = mode === 'edit';
      readyEl.hidden = !show;
      if (!show) return;
      const ready = n > 0;
      readyEl.classList.toggle('is-ready', ready);
      readyEl.querySelector('.cb-ready__t').textContent = ready ? 'Pronto para finalizar' : 'Selecione pelo menos um serviço para continuar.';
      readyEl.querySelector('.cb-ready__s').textContent = ready ? 'Finalize para visualizar seu escudo de proteção sendo montado.' : '';
      if (readyPrev === 0 && ready && !reduce) { readyEl.classList.remove('is-scan'); void readyEl.offsetWidth; readyEl.classList.add('is-scan'); clearTimeout(readyT); readyT = setTimeout(() => readyEl.classList.remove('is-scan'), 900); }
      readyPrev = n;
    }

    function buildFinalTimeline() {
      const g = window.gsap, compact = compactMQ.matches;
      const sel = SERVICES.filter((s) => active.has(s.id)), n = sel.length;
      const tl = g.timeline({ paused: true, onComplete: enterFinal });
      // posição inicial das peças: afastadas pelo eixo radial, levemente giradas
      F.plates.forEach((p, i) => {
        const d = F.dirs[i];
        g.set(p, { x: d[0] * 9, y: d[1] * 9, rotation: (i % 2 ? 1 : -1) * 16, svgOrigin: d[2][0] + ' ' + d[2][1], opacity: 0 });
      });
      sel.forEach((sv) => g.set(E[sv.id].node.querySelector('polygon'), { svgOrigin: E[sv.id].px + ' ' + E[sv.id].py }));
      const B0 = 0.55, span = compact ? 0.6 : 0.8, bd = compact ? 0.4 : 0.45, C0 = B0 + span + bd, D0 = C0 + 1.1;
      const coreAt = (i) => Math.min(0.9, 0.14 + 0.1 * (i + 1));

      /* Fase A — inicialização: ambiente atenua, escudo central em destaque, peças se preparam */
      tl.call(() => fig.classList.add('is-assembling'), null, 0)
        .to(core, { opacity: 0.12, duration: 0.45, ease: 'sine.inOut' }, 0)
        .to(F.tracks, { opacity: 0.45, duration: 0.45 }, 0)
        .to(F.plates, { opacity: 0.38, duration: 0.4, stagger: 0.05, ease: 'power1.out' }, 0.1);

      /* Fase B — convergência: cada serviço selecionado envia um feixe pela conexão existente até o escudo */
      sel.forEach((sv, i) => {
        const e = E[sv.id], t = B0 + (n > 1 ? (i * span) / (n - 1) : 0);
        tl.fromTo(e.beam, { strokeDashoffset: e.len, opacity: 1 }, { strokeDashoffset: 0, duration: bd, ease: 'power2.in', immediateRender: false }, t)
          .to(e.beam, { opacity: 0, duration: 0.35, ease: 'power1.out' }, t + bd);
        tl.fromTo(e.comet, { strokeDashoffset: e.clen, opacity: 1 }, { strokeDashoffset: -e.len, duration: bd, ease: 'power2.in', immediateRender: false }, t)
          .to(e.comet, { opacity: 0, duration: 0.1 }, t + bd);
        if (!compact) {
          tl.fromTo(e.head, { attr: { cx: e.sx, cy: e.sy }, opacity: 1 }, { attr: { cx: e.ex, cy: e.ey }, duration: bd, ease: 'power2.in', immediateRender: false }, t)
            .to(e.head, { opacity: 0, duration: 0.12 }, t + bd);
        }
        tl.fromTo(e.node.querySelector('polygon'), { scale: 1 }, { scale: 1.18, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, t)
          .fromTo(halo, { opacity: 0.7, attr: { r: shieldR + 2 } }, { opacity: 0, attr: { r: shieldR + 16 }, duration: 0.4, ease: 'power2.out', immediateRender: false }, t + bd - 0.05)
          .to(core, { opacity: coreAt(i), duration: 0.2 }, t + bd - 0.05);
      });

      /* Fase C — montagem: peças metálicas se encaixam, o contorno fecha e as linhas internas são ativadas */
      F.plates.forEach((p, i) => tl.to(p, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, C0 + i * 0.09));
      tl.to([F.hex, F.glyph], { opacity: 0, duration: 0.4 }, C0 + 0.3)
        .fromTo(F.plates, { strokeWidth: 1.2 }, { strokeWidth: 1.9, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out', immediateRender: false }, C0 + 0.88)
        .fromTo(F.contour, { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.inOut', immediateRender: false }, C0 + 0.6)
        .to(F.fill, { opacity: 1, duration: 0.4, ease: 'sine.out' }, C0 + 0.75)
        .fromTo(F.inner, { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.1, ease: 'power1.out', immediateRender: false }, C0 + 0.75);

      /* Fase D — ativação: pulso percorre o escudo, conexões selecionadas brilham, estabiliza */
      if (!compact) {
        tl.fromTo(F.sweep, { strokeDashoffset: 0.18, opacity: 1 }, { strokeDashoffset: -1, duration: 0.7, ease: 'power1.inOut', immediateRender: false }, D0)
          .to(F.sweep, { opacity: 0, duration: 0.1 }, D0 + 0.7);
      }
      tl.call(borderBeam, null, D0);
      tl.fromTo(halo, { opacity: 0.9, attr: { r: shieldR + 4 } }, { opacity: 0, attr: { r: shieldR + (compact ? 30 : 44) }, duration: 0.8, ease: 'power2.out', immediateRender: false }, D0)
        .to(core, { opacity: Math.min(0.9, 0.3 + 0.06 * n), duration: 0.5 }, D0);
      sel.forEach((sv, i) => tl.fromTo(E[sv.id].link, { strokeWidth: 1.8 }, { strokeWidth: 3.2, duration: 0.2, yoyo: true, repeat: 1, immediateRender: false }, D0 + 0.1 + i * 0.05));
      return tl;
    }

    // Border Beam: UMA passada de luz pela borda do cartão do diagrama no momento da ativação (nunca em snap/reduzido, nunca repete sozinho)
    function clearBorderBeam() { if (bbTween) { bbTween.kill(); bbTween = null; } if (bbEl) { bbEl.remove(); bbEl = null; } }
    function borderBeam() {
      if (snapping || reduce || !window.gsap) return;
      clearBorderBeam();
      const w = fig.offsetWidth, h = fig.offsetHeight;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'arch-bb'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', 0.5); rect.setAttribute('y', 0.5); rect.setAttribute('width', w - 1); rect.setAttribute('height', h - 1); rect.setAttribute('rx', 17.5); rect.setAttribute('pathLength', 1);
      svg.appendChild(rect); fig.appendChild(svg); bbEl = svg;
      bbTween = window.gsap.fromTo(rect, { strokeDashoffset: 0.16 }, { strokeDashoffset: -1, duration: 1.3, ease: 'power1.inOut', onComplete: clearBorderBeam });
    }

    function startFinal() {
      if (mode !== 'edit') return;                          // sem montagem simultânea e sem cliques duplicados
      if (!active.size) { hintEl.textContent = 'Selecione pelo menos um módulo para finalizar sua proteção.'; return; }
      hintEl.textContent = '';
      mode = 'running'; renderReady();
      btnFin.setAttribute('aria-disabled', 'true'); btnFin.setAttribute('aria-busy', 'true'); btnFin.classList.add('is-idle');
      window.gsap.killTweensOf([halo, core, F.hex, F.glyph]);
      const r = fig.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) fig.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });   // um único deslocamento, sem travar a rolagem
      tlFin = buildFinalTimeline();
      if (reduce) { snapping = true; tlFin.progress(1); snapping = false; } else tlFin.play(0);    // movimento reduzido: estado final imediato
    }

    function enterFinal() {
      if (mode === 'final') return;
      const hadFocus = document.activeElement === btnFin;
      mode = 'final';
      fig.classList.remove('is-assembling'); fig.classList.add('is-final');
      btnFin.hidden = true; btnFin.removeAttribute('aria-busy'); renderReady();
      doneEl.hidden = false;
      liveEl.textContent = 'Sua arquitetura está pronta. Esta é a combinação de serviços selecionada, não uma proteção já implantada.';
      if (hadFocus) doneEl.querySelector('[data-act="send"]').focus({ preventScroll: true });
      // se a confirmação ficou parcialmente atrás da barra compacta do mobile, um único ajuste mínimo a traz para a área livre
      const dr = doneEl.getBoundingClientRect();
      if (dr.bottom > window.innerHeight - 96 && dr.top < window.innerHeight) doneEl.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }

    function leaveFinal(focusBtn) {
      if (mode === 'edit') return;
      const g = window.gsap;
      if (tlFin) { tlFin.kill(); tlFin = null; }
      clearBorderBeam();
      mode = 'edit';
      const sel = SERVICES.filter((s) => E[s.id]);
      const all = [F.plates, F.fill, F.contour, F.inner, F.sweep, F.hex, F.glyph, F.tracks, halo, core].flat();
      g.killTweensOf(all);
      sel.forEach((s) => g.killTweensOf([E[s.id].beam, E[s.id].comet, E[s.id].head, E[s.id].link, E[s.id].node.querySelector('polygon')]));
      g.set([F.plates, F.fill, F.contour, F.inner, F.sweep].flat(), { clearProps: 'all' });
      g.set([F.hex, F.glyph, F.tracks, halo], { clearProps: 'opacity' });
      halo.setAttribute('r', shieldR);
      sel.forEach((s) => {
        const e = E[s.id];
        g.set([e.beam, e.comet, e.head], { clearProps: 'opacity' }); e.comet.style.strokeDashoffset = e.clen; e.head.setAttribute('cx', e.sx); e.head.setAttribute('cy', e.sy);
        e.beam.style.strokeDashoffset = e.len;
        g.set(e.node.querySelector('polygon'), { clearProps: 'transform' });
        e.link.style.removeProperty('stroke-width');
      });
      g.fromTo([F.hex, F.glyph], { opacity: 0 }, { opacity: 1, duration: 0.35, clearProps: 'opacity' });
      summarize();
      fig.classList.remove('is-assembling', 'is-final');
      doneEl.hidden = true; btnFin.hidden = false; btnFin.removeAttribute('aria-busy');
      refreshFinalButton();
      liveEl.textContent = '';
      if (focusBtn) btnFin.focus({ preventScroll: true });
    }

    build(); sync(false); summarize();
    initializeFinalize();
    const mo = new MutationObserver(() => sync(true));
    Object.keys(toggles).forEach((id) => mo.observe(toggles[id], { attributes: true, attributeFilter: ['aria-pressed'] }));
    compactMQ.addEventListener('change', () => {
      const keep = new Set(active), was = mode;
      if (tlFin) { tlFin.kill(); tlFin = null; }
      build(); keep.forEach((id) => setActive(id, true, false)); summarize();
      if (was !== 'edit') { mode = 'running'; tlFin = buildFinalTimeline(); snapping = true; tlFin.progress(1); snapping = false; }       // mantém o escudo montado na nova versão (desktop/compacta)
    });
  }

  /* ======================================================================================
     FASE 3 — NAVEGAÇÃO LATERAL (complementar à navbar; não a substitui)
     Seções e ordem reais do HTML. Seção ativa por IntersectionObserver (um único sistema de detecção).
     ====================================================================================== */
  function initializeSideNav() {
    const DEFS = [['topo', 'Início', '.hero'], ['roadmap', 'Processo', '#roadmap'], ['servicos', 'Serviços', '#servicos'],
      ['pacotes', 'Pacotes', '#pacotes'], ['integracoes', 'Configurador', '#integracoes'], ['agendar', 'Contato', '#agendar']]
      .map((d) => ({ id: d[0], label: d[1], sec: document.querySelector(d[2]), target: document.getElementById(d[0]) }))
      .filter((d) => d.sec && d.target);                      // só seções que existem de verdade
    if (DEFS.length < 2) return;

    const nav = document.createElement('nav');
    nav.className = 'sidenav'; nav.setAttribute('aria-label', 'Seções da página');
    nav.innerHTML = '<i class="sidenav__line" aria-hidden="true"><i class="sidenav__fill"></i><i class="sidenav__head"></i></i><ol class="sidenav__list">' +
      DEFS.map((d) => '<li><a class="sidenav__node" href="#' + d.id + '"><span class="sidenav__label">' + d.label + '</span><span class="sidenav__dot" aria-hidden="true"></span></a></li>').join('') +
      '</ol>';
    document.body.appendChild(nav);
    const nodes = Array.from(nav.querySelectorAll('.sidenav__node'));
    let current = -1, labelTimer = 0;

    // durante a introdução o painel fica inerte e invisível; aparece quando ela termina
    const lockSync = () => { const locked = root.classList.contains('intro-lock'); nav.classList.toggle('is-ready', !locked); if (locked) nav.setAttribute('inert', ''); else nav.removeAttribute('inert'); };
    lockSync(); introDone(lockSync);

    function setActive(i) {
      if (i === current) return;
      current = i;
      nodes.forEach((n, k) => {
        n.classList.toggle('is-active', k === i); n.classList.toggle('is-done', k < i);
        if (k === i) n.setAttribute('aria-current', 'true'); else n.removeAttribute('aria-current');
      });
      nodes.forEach((n) => n.classList.remove('show-label'));       // o nome da seção aparece discretamente e some sozinho
      nodes[i].classList.add('show-label');
      clearTimeout(labelTimer); labelTimer = setTimeout(() => nodes[i] && nodes[i].classList.remove('show-label'), 1800);
    }

    // faixa fina no meio da tela define a seção atual
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { const k = DEFS.findIndex((d) => d.sec === e.target); if (k >= 0) setActive(k); } });
      }, { rootMargin: '-45% 0px -54% 0px', threshold: 0 });
      DEFS.forEach((d) => io.observe(d.sec));
    } else setActive(0);

    // progresso CONTÍNUO: o circuito é energizado conforme a rolagem entre os nós (mesma linha de referência da seção ativa, a 45% da tela).
    // Um único listener passivo limitado por quadro; não mexe no scroll e não roda quando a lateral está oculta.
    const hideMQ = matchMedia('(max-width: 1180px)');
    let pTick = false;
    function updateProgress() {
      pTick = false;
      if (hideMQ.matches) return;
      const y = window.scrollY, ref = y + window.innerHeight * 0.45, n = DEFS.length;
      const tops = DEFS.map((d) => d.sec.getBoundingClientRect().top + y);
      let k = 0; for (let i = 0; i < n; i++) if (ref >= tops[i]) k = i;
      const frac = k < n - 1 ? Math.min(1, Math.max(0, (ref - tops[k]) / Math.max(1, tops[k + 1] - tops[k]))) : 0;
      nav.style.setProperty('--p', ((k + frac) / (n - 1)).toFixed(4));
    }
    const onProgress = () => { if (!pTick) { pTick = true; requestAnimationFrame(updateProgress); } };
    window.addEventListener('scroll', onProgress, { passive: true });
    window.addEventListener('resize', onProgress);
    updateProgress();

    // clique: rola até a seção respeitando o scroll-padding/CSS existentes; sem hijack, sem alterar a URL
    nodes.forEach((n, k) => n.addEventListener('click', (e) => {
      e.preventDefault();
      const t = DEFS[k].target;
      if (DEFS[k].id === 'topo') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }));
  }

  /* ======================================================================================
     ETAPA B — MINI DIAGNÓSTICO (demonstrativo). Apenas SUGERE módulos; nunca gera nota, percentual ou avaliação técnica.
     Aplicar a sugestão = clicar nos botões REAIS do configurador (fonte única de estado, preços e formulário intactos).
     Nunca remove nem sobrescreve escolhas existentes.
     ====================================================================================== */
  function initializeDiagnostic() {
    const builder = document.getElementById('combinationBuilder');
    if (!builder) return;
    const toggles = {};
    builder.querySelectorAll('.cb-toggle[data-toggle]').forEach((b) => { toggles[b.dataset.toggle] = b; });
    if (!Object.keys(toggles).length) return;
    const nameOf = (id) => (builder.querySelector('.cb-card[data-module="' + id + '"] .cb-card__name') || {}).textContent || id;

    const Q = [
      { key: 'setor', title: 'Qual é o setor da organização?', opts: ['Financeiro', 'Saúde', 'Varejo / E-commerce', 'Indústria', 'Educação', 'Tecnologia', 'Governo', 'Outro'] },
      { key: 'porte', title: 'Qual é o porte aproximado?', opts: ['Até 50 pessoas', '51 a 250 pessoas', '251 a 1.000 pessoas', 'Mais de 1.000 pessoas'] },
      { key: 'dados', title: 'Onde ficam os dados principais?', opts: ['Principalmente local (servidores próprios)', 'Principalmente na nuvem', 'Híbrido (local e nuvem)'] },
      { key: 'mfa', title: 'A autenticação multifator (MFA) é usada?', opts: ['Sim, em todos os acessos', 'Só em alguns acessos', 'Não usamos', 'Não sei'] },
      { key: 'backup', title: 'Existe uma política de backup?', opts: ['Sim, com testes de restauração', 'Existe, mas sem testes regulares', 'Não temos', 'Não sei'] },
    ];
    const ORDER = ['edr', 'siem', 'backup', 'zerotrust', 'cloud', 'mfa', 'phishing', 'intel'];
    const RULES = {
      edr: [() => true, 'Proteger computadores e servidores é a base para qualquer porte.'],
      siem: [(a) => a.porte >= 2 || [0, 1, 6].includes(a.setor), 'Com mais pessoas e sistemas, correlacionar eventos ajuda a enxergar o conjunto.'],
      backup: [(a) => a.backup !== 0, 'Você indicou que não há política de backup com testes de restauração.'],
      zerotrust: [(a) => a.dados === 2 || a.porte >= 2, 'Ambientes híbridos ou de maior porte têm mais acessos a controlar.'],
      cloud: [(a) => a.dados >= 1, 'Seus dados estão, total ou parcialmente, na nuvem.'],
      mfa: [(a) => a.mfa !== 0, 'Você indicou que o MFA não cobre todos os acessos.'],
      phishing: [(a) => a.porte >= 1 || [0, 1, 4, 6].includes(a.setor) || a.mfa !== 0, 'O e-mail é uma das portas de entrada mais comuns para golpes.'],
      intel: [(a) => ([0, 1, 6].includes(a.setor) && a.porte >= 1) || a.porte === 3, 'Informação sobre ameaças do seu setor ajuda a priorizar defesas (valor sob consulta).'],
    };
    const suggest = (a) => ORDER.filter((id) => toggles[id] && RULES[id][0](a)).map((id) => ({ id, reason: RULES[id][1] }));

    let step = 0, open = false, applied = '';
    const answers = {};                                         // índice da opção escolhida por pergunta
    const picks = new Set();                                    // módulos marcados na tela de resultado

    const root = document.createElement('section');
    root.className = 'dx'; root.setAttribute('aria-labelledby', 'dxTitle');
    root.innerHTML = '<div class="dx__bar"><div class="dx__intro"><strong id="dxTitle">Mini diagnóstico</strong>' +
      '<span>Não sabe por onde começar? Responda 5 perguntas e receba uma sugestão ilustrativa de serviços.</span></div>' +
      '<button type="button" class="btn btn--ghost dx__toggle" aria-expanded="false" aria-controls="dxBody">Iniciar diagnóstico</button></div>' +
      '<div class="dx__body" id="dxBody" hidden></div>';
    builder.insertBefore(root, builder.firstElementChild);
    const bodyEl = root.querySelector('.dx__body'), toggleBtn = root.querySelector('.dx__toggle');

    const selectedNow = () => Object.keys(toggles).filter((id) => toggles[id].getAttribute('aria-pressed') === 'true');

    function render(focusHeading) {
      if (step < Q.length) {
        const q = Q[step], a = answers[q.key];
        bodyEl.innerHTML =
          '<div class="dx__top"><span class="dx__count">Pergunta ' + (step + 1) + ' de ' + Q.length + '</span>' +
          '<div class="dx__prog" role="progressbar" aria-label="Progresso do diagnóstico" aria-valuemin="1" aria-valuemax="' + Q.length + '" aria-valuenow="' + (step + 1) + '"><i style="width:' + ((step + 1) / Q.length * 100) + '%"></i></div></div>' +
          '<fieldset class="dx__q"><legend tabindex="-1">' + q.title + '</legend><div class="dx__opts">' +
          q.opts.map((o, i) => '<label class="dx__opt"><input type="radio" name="dxq" value="' + i + '"' + (a === i ? ' checked' : '') + '><span>' + o + '</span></label>').join('') +
          '</div></fieldset>' +
          '<div class="dx__nav"><button type="button" class="btn btn--ghost dx__back"' + (step === 0 ? ' disabled' : '') + '>Voltar</button>' +
          '<button type="button" class="btn btn--red dx__next"' + (a === undefined ? ' disabled' : '') + '>' + (step === Q.length - 1 ? 'Ver sugestão' : 'Próxima') + '</button></div>';
        bodyEl.querySelectorAll('input[name="dxq"]').forEach((r) => r.addEventListener('change', () => {
          answers[q.key] = parseInt(r.value, 10); bodyEl.querySelector('.dx__next').disabled = false;
        }));
        bodyEl.querySelector('.dx__back').addEventListener('click', () => { step = Math.max(0, step - 1); render(true); });
        bodyEl.querySelector('.dx__next').addEventListener('click', () => { if (answers[q.key] === undefined) return; step += 1; if (step === Q.length) { picks.clear(); suggest(answers).forEach((s) => picks.add(s.id)); applied = ''; } render(true); });
        if (focusHeading) bodyEl.querySelector('legend').focus({ preventScroll: true });
      } else {
        const list = suggest(answers), have = selectedNow();
        bodyEl.innerHTML =
          '<div class="dx__top"><span class="dx__count">Resultado</span><div class="dx__prog" role="progressbar" aria-label="Progresso do diagnóstico" aria-valuemin="1" aria-valuemax="' + Q.length + '" aria-valuenow="' + Q.length + '"><i style="width:100%"></i></div></div>' +
          '<h3 class="dx__res" tabindex="-1">Sugestão ilustrativa de serviços</h3>' +
          '<p class="dx__note">Com base nas suas respostas, estes módulos costumam fazer sentido. Não é uma avaliação técnica nem uma nota de segurança. Desmarque o que não quiser.</p>' +
          '<ul class="dx__list">' + list.map((s) => '<li><label class="dx__pick"><input type="checkbox" value="' + s.id + '"' + (picks.has(s.id) ? ' checked' : '') + '><span><b>' + nameOf(s.id) + '</b><small>' + s.reason + '</small></span></label></li>').join('') + '</ul>' +
          (have.length ? '<p class="dx__note dx__keep">Você já selecionou ' + have.length + (have.length === 1 ? ' módulo' : ' módulos') + '; eles serão mantidos.</p>' : '') +
          '<div class="dx__nav"><button type="button" class="btn btn--ghost dx__back">Alterar respostas</button><button type="button" class="btn btn--ghost dx__redo">Refazer</button>' +
          '<button type="button" class="btn btn--red dx__apply">Adicionar à minha combinação</button></div>' +
          '<p class="dx__status" role="status" aria-live="polite">' + applied + '</p>';
        bodyEl.querySelectorAll('.dx__list input').forEach((c) => c.addEventListener('change', () => { if (c.checked) picks.add(c.value); else picks.delete(c.value); }));
        bodyEl.querySelector('.dx__back').addEventListener('click', () => { step = Q.length - 1; render(true); });
        bodyEl.querySelector('.dx__redo').addEventListener('click', () => { Object.keys(answers).forEach((k) => delete answers[k]); picks.clear(); applied = ''; step = 0; render(true); });
        bodyEl.querySelector('.dx__apply').addEventListener('click', () => {
          let added = 0;
          picks.forEach((id) => { if (toggles[id] && toggles[id].getAttribute('aria-pressed') !== 'true') { toggles[id].click(); added += 1; } });   // botões reais do configurador
          applied = added ? added + (added === 1 ? ' módulo adicionado' : ' módulos adicionados') + ' à combinação. Ajuste nos cards abaixo ou use “Finalizar proteção”.' : 'Nada a adicionar: os módulos marcados já estão na sua combinação.';
          const st = bodyEl.querySelector('.dx__status'); if (st) st.textContent = applied;
        });
        if (focusHeading) bodyEl.querySelector('.dx__res').focus({ preventScroll: true });
      }
    }

    toggleBtn.addEventListener('click', () => {
      open = !open; bodyEl.hidden = !open; toggleBtn.setAttribute('aria-expanded', String(open));
      toggleBtn.textContent = open ? 'Ocultar diagnóstico' : (Object.keys(answers).length ? 'Continuar diagnóstico' : 'Iniciar diagnóstico');
      if (open) { render(true); }
    });
  }

  /* ======================================================================================
     ETAPA C — demonstração de relatório (abas acessíveis: setas, Home/End; sem JS todos os painéis ficam visíveis)
     ====================================================================================== */
  function initializeReportDemo() {
    const tabs = Array.from(document.querySelectorAll('#repDemo [role="tab"]'));
    if (tabs.length < 2) return;
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    function select(i, focus) {
      tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (panels[k]) panels[k].hidden = !on; });
      if (focus) tabs[i].focus();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        const n = tabs.length; let k = -1;
        if (e.key === 'ArrowRight') k = (i + 1) % n; else if (e.key === 'ArrowLeft') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = n - 1;
        if (k >= 0) { e.preventDefault(); select(k, true); }
      });
    });
    select(0, false);
  }

  /* ======================================================================================
     ETAPA A — faixa de incidentes: leva ao formulário EXISTENTE e preenche o campo Assunto (nenhum formulário novo)
     ====================================================================================== */
  function initializeCommercial() {
    const cta = document.getElementById('incidentCta'), subj = document.getElementById('assunto'), hint = document.getElementById('assuntoHint');
    if (subj && hint) { const sync = () => { hint.hidden = subj.value !== 'Resposta a incidentes'; }; subj.addEventListener('change', sync); sync(); }
    if (!cta || !subj) return;
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      subj.value = 'Resposta a incidentes'; subj.dispatchEvent(new Event('change'));
      const sec = document.getElementById('agendar'); if (sec) sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      const nome = document.getElementById('nome');
      if (nome) setTimeout(() => nome.focus({ preventScroll: true }), reduce ? 0 : 450);
    });
  }

  /* Botão "Retornar ao início" (rodapé): rola ao topo sem alterar a URL; sem JavaScript continua funcionando como âncora #topo. */
  function initializeBackToTop() {
    const a = document.getElementById('backToTop');
    if (!a) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      const h1 = document.querySelector('main h1');                 // devolve o foco ao início da página para teclado e leitor de tela
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); h1.addEventListener('blur', () => h1.removeAttribute('tabindex'), { once: true }); }
    });
  }

  /* ======================================================================================
     SPOTLIGHT DOS CARDS DE SERVIÇO — luz suave que acompanha o cursor dentro do card (somente mouse; sem loop contínuo).
     Só atualiza variáveis CSS (--mx/--my/--spot); a elevação e a borda do hover existente continuam intactas.
     ====================================================================================== */
  function initializeCardSpotlight() {
    const wrap = document.querySelector('#servicos .cards');
    if (!wrap || reduce || !fine) return;
    let raf = 0, ev = null;
    const paint = () => {
      raf = 0; if (!ev) return;
      const card = ev.target.closest && ev.target.closest('.card'); if (!card || !wrap.contains(card)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (ev.clientX - r.left).toFixed(1) + 'px'); card.style.setProperty('--my', (ev.clientY - r.top).toFixed(1) + 'px');
      card.style.setProperty('--spot', '1');
    };
    wrap.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; ev = e; if (!raf) raf = requestAnimationFrame(paint); });
    wrap.addEventListener('pointerout', (e) => {
      const card = e.target.closest && e.target.closest('.card');
      if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) card.style.setProperty('--spot', '0');
    });
  }

  /* ======================================================================================
     FASE 4 — MICROINTERAÇÕES TÉCNICAS
     Botões principais: varredura fina no hover e resposta curta ao clique (somente CSS, em interactive.css).
     Títulos: decodificação breve, uma única vez, em apenas 3 títulos estratégicos (sem animações complexas próprias).
     ====================================================================================== */
  function initializeMicro() {
    if (reduce) return;                                           // movimento reduzido: sem decodificação
    const TITLES = ['#servicos .section__head h2', '#integracoes .section__head h2', '#agendar .cta__text h2']
      .map((s) => document.querySelector(s)).filter(Boolean);
    const SYMBOLS = '01<>/\\[]{}#$%&*+=?';

    function decode(h) {
      const orig = h.textContent;
      if (!orig.trim()) return;
      // cada caractere ganha uma largura FIXA (a medida real) para que a troca de símbolos nunca desloque o layout
      const inner = document.createElement('span'); inner.setAttribute('aria-hidden', 'true');
      orig.split(/(\s+)/).forEach((w) => {
        if (/^\s+$/.test(w)) { inner.appendChild(document.createTextNode(w)); return; }
        const word = document.createElement('span'); word.style.whiteSpace = 'nowrap';
        Array.from(w).forEach((ch) => { const c = document.createElement('span'); c.textContent = ch; word.appendChild(c); });
        inner.appendChild(word);
      });
      const hBefore = h.getBoundingClientRect().height;
      h.setAttribute('aria-label', orig); h.textContent = ''; h.appendChild(inner);   // leitores de tela continuam lendo o texto original
      const chars = Array.from(inner.querySelectorAll('span > span'));
      const widths = chars.map((c) => c.getBoundingClientRect().width);
      chars.forEach((c, i) => { c.style.display = 'inline-block'; c.style.width = widths[i] + 'px'; c.style.textAlign = 'center'; });
      const finals = chars.map((c) => c.textContent);
      const DUR = 780, t0 = performance.now(), n = chars.length;
      const when = finals.map((_, i) => (i / n) * (DUR - 220) + Math.random() * 140);   // resolve da esquerda para a direita
      let last = 0;
      (function step(now) {
        const t = now - t0;
        if (now - last > 45 || t >= DUR) {
          last = now;
          chars.forEach((c, i) => { c.textContent = t >= when[i] || /[\s.,!?;:]/.test(finals[i]) ? finals[i] : SYMBOLS[(Math.random() * SYMBOLS.length) | 0]; });
        }
        if (t < DUR) requestAnimationFrame(step);
        else { h.textContent = orig; h.removeAttribute('aria-label'); }              // termina EXATAMENTE com o texto original
      })(t0);
      void hBefore;
    }

    TITLES.forEach((h) => {
      if (!('IntersectionObserver' in window)) return;
      const io = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) { io.disconnect(); decode(h); } }, { threshold: 0.6 });
      io.observe(h);
    });
  }

})();
