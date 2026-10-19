/* Sentinela — EXPERIÊNCIA INTEGRADA
   1) Centro de Operações de Segurança (SOC) sobre o radar do hero: monitoramento → detecção → análise → contenção → retorno.
   2) Portais hexagonais entre seções, com progresso ligado ao scroll (hero→serviços, processo→pacotes, configurador→contato).
   Camada isolada e reversível: remova <link experience.css> e <script experience.js> do index.html para desfazer.
   Depende de GSAP (core, já carregado com defer antes deste arquivo). Todos os eventos do SOC são FICTÍCIOS (sem dados reais). */
(function () {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onReady = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NS = 'http://www.w3.org/2000/svg';

  const emit = (name) => document.dispatchEvent(new CustomEvent('sentinela:' + name));   // eventos públicos do SOC (soc-start / soc-end)

  onReady(() => {
    if (!window.gsap) return;                        // sem GSAP: nada é tocado
    try { initializeSOC(); } catch (e) { console.warn('[Sentinela] Narrativa SOC indisponível.', e); }
    if (reduceMotion) return;                        // movimento reduzido: o SOC tem versão simplificada; portais não existem
    try { initializePortals(); } catch (e) { console.warn('[Sentinela] Portais indisponíveis.', e); }
  });

  /* ======================================================================================
     PARTE I — CENTRO DE OPERAÇÕES DE SEGURANÇA
     ====================================================================================== */
  function initializeSOC() {
    const radar = document.querySelector('.radar');
    const sweep = document.querySelector('.radar__sweep');
    if (!radar || !sweep) return;
    const small = matchMedia('(max-width: 720px)').matches;

    // geometria ancorada ao radar: mesma fórmula dos alvos existentes (ângulo horário a partir do topo, raio 0–1)
    const pol = (deg, r) => ({ x: 50 + Math.sin(deg * Math.PI / 180) * r * 50, y: 50 - Math.cos(deg * Math.PI / 180) * r * 50 });
    const THETA = 227, T = pol(THETA, 0.40);           // sinal simulado: posição fixa, em área livre entre os alvos existentes
    const f = (n) => n.toFixed(2);
    const hex = (cx, cy, r) => [0, 1, 2, 3, 4, 5].map((k) => { const a = (k * 60 + 30) * Math.PI / 180; return f(cx + r * Math.cos(a)) + ',' + f(cy + r * Math.sin(a)); }).join(' ');

    // rede discreta: anéis, marcas e pontos de sinal (permanecem ao final)
    const dots = [[18, .62], [95, .30], [150, .72], [265, .58], [312, .85], [340, .42], [60, .88]].map(([a, r], i) => {
      const p = pol(a, r); return '<circle class="soc-nd' + (small && i > 3 ? ' soc-lite' : '') + '" cx="' + f(p.x) + '" cy="' + f(p.y) + '" r="' + (0.5 + (i % 3) * 0.12) + '"/>';
    }).join('');
    const ticks = [0, 90, 180, 270].map((a) => { const p1 = pol(a, .88), p2 = pol(a, .96); return '<line class="soc-tick soc-lite" x1="' + f(p1.x) + '" y1="' + f(p1.y) + '" x2="' + f(p2.x) + '" y2="' + f(p2.y) + '"/>'; }).join('');
    // linhas convergindo ao sinal (análise)
    const conv = [0, 60, 120, 180, 240, 300].map((a) => {
      const r = Math.PI / 180 * a, x1 = T.x + Math.cos(r) * 15, y1 = T.y + Math.sin(r) * 15, x2 = T.x + Math.cos(r) * 10, y2 = T.y + Math.sin(r) * 10;
      return '<line class="soc-line" x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '"/>';
    }).join('');
    const leader = 'M' + f(T.x) + ' ' + f(T.y) + ' L' + f(T.x - 9) + ' ' + f(T.y + 9) + ' L' + f(T.x - 22) + ' ' + f(T.y + 9);
    const flow = 'M' + f(T.x) + ' ' + f(T.y) + ' L' + f(T.x + 6) + ' ' + f(T.y) + ' L' + f(T.x + 11) + ' ' + f(T.y - 5) + ' L46.6 54.4';

    const soc = document.createElement('div');
    soc.className = 'soc'; soc.setAttribute('aria-hidden', 'true');
    soc.innerHTML =
      '<svg class="soc__svg" viewBox="0 0 100 100" focusable="false">' +
        '<defs><radialGradient id="socGlow"><stop offset="0" stop-color="#FF334A" stop-opacity=".7"/><stop offset="1" stop-color="#E52538" stop-opacity="0"/></radialGradient></defs>' +
        '<g class="soc-net"><circle class="soc-ring" cx="50" cy="50" r="47.5"/><circle class="soc-ring soc-lite" cx="50" cy="50" r="33"/>' + ticks + dots + '</g>' +
        '<circle class="soc-amb" cx="50" cy="50" r="6"/>' +
        '<g class="soc-threat">' +
          '<circle class="soc-halo" cx="' + f(T.x) + '" cy="' + f(T.y) + '" r="3.6" fill="url(#socGlow)"/>' +
          '<circle class="soc-pulse soc-p1" cx="' + f(T.x) + '" cy="' + f(T.y) + '" r="1"/>' +
          '<circle class="soc-pulse soc-p2" cx="' + f(T.x) + '" cy="' + f(T.y) + '" r="1"/>' +
          '<path class="soc-leader" d="' + leader + '"/><rect class="soc-leadend" x="' + f(T.x - 23.2) + '" y="' + f(T.y + 7.8) + '" width="2.4" height="2.4"/>' +
          '<g class="soc-conv">' + conv + '</g>' +
          '<circle class="soc-seg" cx="' + f(T.x) + '" cy="' + f(T.y) + '" r="6.4"/>' +
          '<polygon class="soc-hex" points="' + hex(T.x, T.y, 5.6) + '"/>' +
          '<path class="soc-flow" d="' + flow + '"/><circle class="soc-packet" r="0.95"/>' +
          '<circle class="soc-dot" cx="' + f(T.x) + '" cy="' + f(T.y) + '" r="1.25"/>' +
        '</g>' +
        '<circle class="soc-sglow" cx="50" cy="50" r="12" fill="url(#socGlow)"/>' +
        '<circle class="soc-proc" cx="50" cy="50" r="9.6"/>' +
        '<circle class="soc-wave soc-w1" cx="50" cy="50" r="6"/><circle class="soc-wave soc-w2" cx="50" cy="50" r="6"/>' +
      '</svg>' +
      '<div class="soc__status"><i class="soc__led"></i><span class="soc__text">MONITORAMENTO ATIVO</span></div>';
    radar.appendChild(soc);

    const q = (s) => soc.querySelector(s);
    const el = {
      net: q('.soc-net'), threat: q('.soc-threat'), halo: q('.soc-halo'), dot: q('.soc-dot'), p1: q('.soc-p1'), p2: q('.soc-p2'),
      leader: q('.soc-leader'), leadend: q('.soc-leadend'), conv: q('.soc-conv'), seg: q('.soc-seg'), hex: q('.soc-hex'),
      flow: q('.soc-flow'), packet: q('.soc-packet'), sglow: q('.soc-sglow'), proc: q('.soc-proc'), w1: q('.soc-w1'), w2: q('.soc-w2'),
      amb: q('.soc-amb'), status: q('.soc__status'), text: q('.soc__text'), led: q('.soc__led'),
      nd: Array.from(soc.querySelectorAll('.soc-nd')), rings: Array.from(soc.querySelectorAll('.soc-ring')), ticks: Array.from(soc.querySelectorAll('.soc-tick')),
    };
    const leadLen = el.leader.getTotalLength(), flowLen = el.flow.getTotalLength(), hexLen = 6 * 5.6;

    // estado inicial (tudo oculto até a narrativa)
    gsap.set([el.threat, el.halo, el.dot, el.p1, el.p2, el.leader, el.leadend, el.conv, el.seg, el.hex, el.flow, el.packet, el.sglow, el.proc, el.w1, el.w2, el.amb], { opacity: 0 });
    gsap.set(el.net, { opacity: 1 });
    gsap.set([el.rings, el.ticks, el.nd], { opacity: 0 });
    gsap.set(el.status, { opacity: 0, y: 4 });
    gsap.set(el.leader, { strokeDasharray: leadLen, strokeDashoffset: leadLen });
    gsap.set(el.flow, { strokeDasharray: flowLen, strokeDashoffset: flowLen });
    gsap.set(el.hex, { strokeDasharray: hexLen, strokeDashoffset: hexLen });
    gsap.set([el.dot, el.halo, el.seg, el.conv], { transformOrigin: '50% 50%' });
    gsap.set([el.proc, el.sglow], { transformOrigin: '50% 50%' });

    // decodificação curta do status: resolve da esquerda para a direita e termina EXATAMENTE no texto final.
    // A largura é travada na medida do texto final (nada se desloca); o rótulo é decorativo (overlay aria-hidden).
    const SYM = '01<>/\[]{}#$%&*+=?';
    let decRaf = 0;
    function stopDecode() { if (decRaf) { cancelAnimationFrame(decRaf); decRaf = 0; } ['width', 'display', 'textAlign'].forEach((k) => { el.text.style[k] = ''; }); }
    function setText(text, animate) {
      stopDecode();
      el.text.textContent = text;
      if (!animate || reduceMotion || text.length < 2) return;
      el.text.style.width = el.text.offsetWidth + 'px'; el.text.style.display = 'inline-block'; el.text.style.textAlign = 'center';
      const DUR = 380, t0 = performance.now(), n = text.length; let last = 0;
      (function step(now) {
        const p = Math.min(1, (now - t0) / DUR);
        if (p >= 1) { decRaf = 0; stopDecode(); el.text.textContent = text; return; }
        if (now - last > 40) {
          last = now; const k = Math.floor(p * n);
          el.text.textContent = text.split('').map((c, i) => (i < k || c === ' ' ? c : SYM[(Math.random() * SYM.length) | 0])).join('');
        }
        decRaf = requestAnimationFrame(step);
      })(t0);
    }
    const setStatus = (tl, at, text, hot) => {
      tl.to(el.text, { opacity: 0, duration: 0.1, ease: 'none' }, at)
        .call(() => { setText(text, true); el.led.classList.toggle('is-hot', !!hot); }, null, at + 0.1)
        .to(el.text, { opacity: 1, duration: 0.18, ease: 'none' }, at + 0.1);
    };

    /* ---------- a narrativa (uma única vez) ---------- */
    const D1 = 1.2, D2 = 1.0, D3 = 1.25, D4 = 1.2;       // durações das fases 1–4
    let phase1Done = false, running = false, lastRun = 0, slotIdx = -1, ambient = null, ambVisible = true;
    const pending = [];                                   // chamadas agendadas do início automático (canceláveis)
    const tl = gsap.timeline({ paused: true, onComplete: finish,
      onUpdate() { if (!phase1Done && tl.time() >= D1) phase1Done = true; } });
    const t2 = D1, t3 = D1 + D2, t4 = D1 + D2 + D3, t5 = D1 + D2 + D3 + D4;

    // FASE 1 — monitoramento ativo (estabilidade operacional)
    tl.to(el.status, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0)
      .to(el.rings, { opacity: 1, duration: 0.7, ease: 'sine.out', stagger: 0.12 }, 0.1)
      .to(el.ticks, { opacity: 1, duration: 0.5, ease: 'none', stagger: 0.08 }, 0.2)
      .to(el.nd, { opacity: 0.7, duration: 0.45, ease: 'sine.out', stagger: 0.09 }, 0.25)
      .fromTo(el.nd, { scale: 0.2 }, { scale: 1, duration: 0.45, ease: 'power2.out', stagger: 0.09, transformOrigin: '50% 50%', immediateRender: false }, 0.25);

    // FASE 2 — detecção: ponto, pulso, segundo anel de confirmação, linha técnica e novo indicador
    tl.set(el.threat, { opacity: 1 }, t2)
      .fromTo(el.dot, { opacity: 0, scale: 0.3 }, { opacity: 0.55, scale: 1, duration: 0.28, ease: 'power2.out', immediateRender: false }, t2)
      .fromTo(el.halo, { opacity: 0, scale: 0.4 }, { opacity: 0.7, scale: 1, duration: 0.5, ease: 'power2.out', immediateRender: false }, t2)
      .to(el.dot, { opacity: 1, duration: 0.3, ease: 'sine.inOut' }, t2 + 0.3)
      .fromTo(el.p1, { opacity: 0.95, attr: { r: 1 } }, { opacity: 0, attr: { r: 9.5 }, duration: 0.75, ease: 'power2.out', immediateRender: false }, t2 + 0.05)
      .fromTo(el.p2, { opacity: 0.9, attr: { r: 1 } }, { opacity: 0, attr: { r: 7 }, duration: 0.7, ease: 'power2.out', immediateRender: false }, t2 + 0.3)
      .set([el.leader, el.leadend], { opacity: 1 }, t2 + 0.35)
      .to(el.leader, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.inOut' }, t2 + 0.35)
      .fromTo(el.leadend, { scale: 0 }, { scale: 1, duration: 0.2, ease: 'power2.out', transformOrigin: '50% 50%', immediateRender: false }, t2 + 0.7);
    setStatus(tl, t2 + 0.2, 'SINAL DETECTADO', true);

    // FASE 3 — análise: círculo segmentado, linhas convergentes, fluxo de dados até o escudo e processamento
    tl.set([el.seg, el.conv, el.flow, el.packet, el.proc], { opacity: 1 }, t3)
      .fromTo(el.seg, { scale: 1.5, rotation: 0, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.35, ease: 'power2.out', immediateRender: false }, t3)
      .to(el.seg, { rotation: 200, duration: D3 - 0.05, ease: 'sine.inOut' }, t3)
      .fromTo(el.conv, { scale: 1.45, opacity: 0 }, { scale: 0.62, opacity: 0.95, duration: 0.85, ease: 'power2.inOut', immediateRender: false }, t3 + 0.05)
      .to(el.conv, { opacity: 0, duration: 0.25, ease: 'power1.in' }, t3 + 0.9)
      .to(el.flow, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, t3 + 0.3)
      .fromTo(el.proc, { rotation: 0, opacity: 0 }, { opacity: 0.85, rotation: 360, duration: 0.8, ease: 'power1.inOut', immediateRender: false }, t3 + 0.55);
    const pk = { l: 0 };
    tl.fromTo(pk, { l: 0 }, { l: flowLen, duration: 0.6, ease: 'power1.inOut', immediateRender: false,
        onUpdate() { const p = el.flow.getPointAtLength(pk.l); el.packet.setAttribute('cx', p.x); el.packet.setAttribute('cy', p.y); } }, t3 + 0.45)
      .to(el.packet, { opacity: 0, duration: 0.15 }, t3 + 1.0);
    setStatus(tl, t3 + 0.05, 'ANALISANDO SINAL', true);

    // FASE 4 — contenção: escudo pulsa, onda de proteção até o sinal, contorno hexagonal, sinal perde intensidade
    const reach = clamp((Math.hypot(T.x - 50, T.y - 50) - 6) / (28 - 6), 0.2, 0.9);
    tl.to(el.proc, { opacity: 0, duration: 0.2 }, t4)
      .set([el.sglow, el.w1, el.w2], { opacity: 1 }, t4)
      .fromTo(el.sglow, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.25, duration: 0.3, ease: 'power2.out', immediateRender: false }, t4)
      .to(el.sglow, { opacity: 0, duration: 0.6, ease: 'sine.inOut' }, t4 + 0.3)
      .fromTo(el.w1, { opacity: 0.95, attr: { r: 6 } }, { opacity: 0, attr: { r: 28 }, duration: 0.85, ease: 'power2.out', immediateRender: false }, t4 + 0.1)
      .fromTo(el.w2, { opacity: 0.8, attr: { r: 6 } }, { opacity: 0, attr: { r: 24 }, duration: 0.8, ease: 'power2.out', immediateRender: false }, t4 + 0.28);
    const hit = t4 + 0.1 + 0.85 * reach * 0.62;           // instante em que a onda alcança o sinal (aprox.)
    tl.set(el.hex, { opacity: 1 }, hit)
      .to(el.hex, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, hit)
      .to(el.dot, { opacity: 0.22, scale: 0.65, duration: 0.55, ease: 'power2.inOut' }, hit + 0.05)
      .to(el.halo, { opacity: 0.1, duration: 0.55 }, hit + 0.05)
      .to(el.seg, { opacity: 0, duration: 0.3 }, hit);
    setStatus(tl, hit, 'AMEAÇA SIMULADA CONTIDA', false);

    // FASE 5 — retorno ao monitoramento: elementos temporários se dissipam; rede discreta permanece
    tl.to([el.hex, el.leader, el.leadend, el.dot, el.halo, el.flow], { opacity: 0, duration: 0.5, ease: 'sine.inOut' }, t5)
      .set(el.threat, { opacity: 0 }, t5 + 0.55);
    setStatus(tl, t5 + 0.25, 'MONITORAMENTO ATIVO', false);
    tl.to({}, { duration: 0.2 }, t5 + 0.7);

    // após a sequência: apenas um pulso discreto de monitoramento, e só enquanto o hero está visível
    function finish() {
      running = false; emit('soc-end');
      if (!ambient) {
        ambient = gsap.timeline({ repeat: -1, repeatDelay: 4.6, paused: true })
          .fromTo(el.amb, { opacity: 0.28, attr: { r: 7 } }, { opacity: 0, attr: { r: 30 }, duration: 2.2, ease: 'sine.out' });
        if ('IntersectionObserver' in window) {
          new IntersectionObserver((en) => { ambVisible = en[0].isIntersecting; if (running) return; if (ambVisible) ambient.play(); else ambient.pause(); }).observe(radar);
        }
      }
      if (ambVisible) ambient.play();
    }
    function play() { running = true; emit('soc-start'); if (ambient) ambient.pause(); tl.play(); }

    // execução MANUAL: reutiliza a mesma timeline (nenhuma duplicada). Reinício controlado, com trava curta contra cliques repetidos.
    function run() {
      if (document.documentElement.classList.contains('intro-lock')) return false;      // nunca durante a introdução
      if (running && Date.now() - lastRun < 700) return false;
      lastRun = Date.now();
      pending.forEach((c) => c.kill()); pending.length = 0;                             // cancela o início automático ainda pendente
      tl.pause(0);                                                                       // reverte as propriedades animadas (limpa só os temporários)
      setText('MONITORAMENTO ATIVO', false); el.led.classList.remove('is-hot');
      slotIdx = (slotIdx + 1) % SLOTS.length; placeAt(SLOTS[slotIdx]);
      if (phase1Done) tl.seek(D1, false);                                                // recomeça na detecção
      play();
      return true;
    }
    window.__sentinelaSOC = { get timeline() { return tl; }, get running() { return running; }, run };

    /* ---------- início sincronizado: depois da intro, com o hero visível e o radar pronto ---------- */
    function whenIntroDone(cb) {                          // a intro encerra removendo a classe "intro-lock" do <html> (conclusão, pular, falha)
      const root = document.documentElement;
      if (!root.classList.contains('intro-lock')) { cb(); return; }
      const mo = new MutationObserver(() => { if (!root.classList.contains('intro-lock')) { mo.disconnect(); cb(); } });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    function whenVisible(target, threshold, cb) {
      if (!('IntersectionObserver' in window)) { cb(); return; }
      const io = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) { io.disconnect(); cb(); } }, { threshold });
      io.observe(target);
    }
    const readAngle = () => { const m = /rotate\(([-\d.]+)deg\)/.exec(sweep.style.transform || ''); return m ? parseFloat(m[1]) % 360 : null; };

    const SLOTS = [227, 317, 47, 137];                    // 4 posições fixas (diagonais, área interna livre do radar)
    function placeAt(theta) { el.threat.setAttribute('transform', 'rotate(' + (theta - THETA) + ' 50 50)'); }
    function begin() {
      // mede a velocidade real da varredura (sem assumir o período) e alinha a detecção à passagem dela por uma das posições fixas
      const a0 = readAngle(), t0 = performance.now();
      pending.push(gsap.delayedCall(0.16, () => {
        const a1 = readAngle(), t1 = performance.now();
        const speed = (a0 == null || a1 == null) ? 0 : ((a1 - a0 + 360) % 360) / (t1 - t0);          // graus por ms
        if (!(speed > 0)) { slotIdx = 0; placeAt(SLOTS[0]); play(); return; }
        const period = 360 / speed;
        let best = null;
        SLOTS.forEach((th) => {
          let wait = ((th - a1 + 360) % 360) / speed - D1 * 1000;
          while (wait < 0) wait += period;
          if (!best || wait < best.wait) best = { th, wait };
        });
        slotIdx = SLOTS.indexOf(best.th); placeAt(best.th);
        pending.push(gsap.delayedCall(best.wait / 1000, play));
      }));
    }
    if (reduceMotion) {                                   // movimento reduzido: sem narrativa automática; simulação manual simplificada, sem deslocamentos
      gsap.set([el.rings, el.ticks], { opacity: 1 }); gsap.set(el.nd, { opacity: 0.7 }); gsap.set(el.status, { opacity: 1, y: 0 });
      let busy = false, idx = -1;
      const say = (t, hot) => { el.text.textContent = t; el.led.classList.toggle('is-hot', !!hot); };
      window.__sentinelaSOC = { get timeline() { return null; }, get running() { return busy; },
        run() {
          if (document.documentElement.classList.contains('intro-lock') || busy) return false;
          busy = true; emit('soc-start'); idx = (idx + 1) % SLOTS.length; placeAt(SLOTS[idx]);
          gsap.set(el.threat, { opacity: 1 }); gsap.set([el.dot, el.halo], { opacity: 1, scale: 1 }); gsap.set(el.hex, { opacity: 0 });
          say('SINAL DETECTADO', true);
          gsap.delayedCall(1.0, () => say('ANALISANDO SINAL', true));
          gsap.delayedCall(2.0, () => { gsap.set(el.hex, { opacity: 1, strokeDashoffset: 0 }); gsap.set([el.dot, el.halo], { opacity: 0.25 }); say('AMEAÇA SIMULADA CONTIDA', false); });
          gsap.delayedCall(3.2, () => { gsap.set([el.threat, el.hex], { opacity: 0 }); say('MONITORAMENTO ATIVO', false); busy = false; emit('soc-end'); });
          return true;
        } };
      return;
    }
    // auxílio de ajuste: ?socAt=2.4 congela a narrativa nesse instante (use __sentinelaSOC.timeline.seek(t, false))
    const hold = /[?&]socAt=([\d.]+)/.exec(location.search);
    if (hold) { whenIntroDone(() => { tl.seek(parseFloat(hold[1]), false); }); return; }
    whenIntroDone(() => whenVisible(radar, 0.5, () => requestAnimationFrame(() => requestAnimationFrame(begin))));
  }

  /* ======================================================================================
     PARTE II — PORTAIS HEXAGONAIS (progresso ligado ao scroll; nunca bloqueia a rolagem)
     ====================================================================================== */
  function initializePortals() {
    const vhNow = () => window.innerHeight || document.documentElement.clientHeight;
    // host: seção que abriga o portal (ele fica NO FUNDO da seção, atrás do conteúdo)
    // y: posição do centro (px a partir do topo, ou do rodapé); s0/s1: fração da altura da tela em que o centro começa/termina a trajetória
    const CONFIG = [
      { id: 'hero-processo',      host: '#roadmap',    x: '72%', y: 205, fromBottom: false, size: 'min(520px, 52vw)', s0: 1.02, s1: 0.30, tone: 'strong', reveal: { el: '#roadmap', prop: '--pt-reveal', from: 0.15 } },
      { id: 'servicos-pacotes',  host: '#servicos',     x: '50%', y: 120, fromBottom: true,  size: 'min(430px, 46vw)', s0: 1.02, s1: 0.40, tone: 'mid',    glow: { el: '#pacotes', prop: '--pt-glow' } },
      { id: 'config-contato',    host: '#agendar',     x: '20%', y: 190, fromBottom: false, size: 'min(360px, 36vw)', s0: 1.02, s1: 0.32, tone: 'soft' },
    ];
    const small = matchMedia('(max-width: 720px)').matches;

    function hexPts(cx, cy, r) { return [0, 1, 2, 3, 4, 5].map((k) => { const a = k * Math.PI / 3; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }); }
    const pstr = (pts) => pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const portals = CONFIG.map(buildPortal).filter(Boolean);   // (depois dos auxiliares acima)
    if (!portals.length) return;

    function buildPortal(cfg, idx) {
      const host = document.querySelector(cfg.host);
      if (!host) return null;
      const wrap = document.createElement('div');
      wrap.className = 'hexportal hexportal--' + cfg.tone; wrap.setAttribute('aria-hidden', 'true');
      wrap.style.left = cfg.x; wrap.style.width = cfg.size; wrap.style.height = cfg.size;
      wrap.style.top = cfg.fromBottom ? 'calc(100% - ' + cfg.y + 'px)' : cfg.y + 'px';

      const C = 200, gid = 'ptg' + idx;
      const H1 = hexPts(C, C, 60), H2 = hexPts(C, C, 105), H3 = hexPts(C, C, 150), H4 = hexPts(C, C, 188);
      // segmentos do hexágono principal (2 por aresta, com abertura central) → montagem
      let segs = '', segData = [];
      for (let k = 0; k < 6; k++) {
        const a = H2[k], b = H2[(k + 1) % 6];
        const s1 = [a, lerp(a, b, 0.43)], s2 = [lerp(a, b, 0.57), b];
        [s1, s2].forEach((s, j) => {
          const mid = lerp(s[0], s[1], 0.5), dx = mid[0] - C, dy = mid[1] - C, d = Math.hypot(dx, dy) || 1;
          segData.push({ ox: dx / d, oy: dy / d, k: k * 2 + j });
          segs += '<line class="pt-s pt-seg" x1="' + s[0][0].toFixed(1) + '" y1="' + s[0][1].toFixed(1) + '" x2="' + s[1][0].toFixed(1) + '" y2="' + s[1][1].toFixed(1) + '"/>';
        });
      }
      // satélites: pequenos traços que convergem no início
      let sats = '', satData = [];
      for (let k = 0; k < 6; k++) {
        const ang = (k * 60 + 30) * Math.PI / 180, r = 215, cx = C + r * Math.cos(ang), cy = C + r * Math.sin(ang);
        const tx = -Math.sin(ang) * 11, ty = Math.cos(ang) * 11;
        sats += '<line class="pt-s pt-sat" x1="' + (cx - tx).toFixed(1) + '" y1="' + (cy - ty).toFixed(1) + '" x2="' + (cx + tx).toFixed(1) + '" y2="' + (cy + ty).toFixed(1) + '"/>';
        satData.push({ ox: Math.cos(ang), oy: Math.sin(ang) });
      }
      const verts = H3.map((p) => '<circle class="pt-r pt-vtx" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6"/>').join('');
      const redPath = 'M' + H2.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z';
      wrap.innerHTML =
        '<svg class="hexportal__svg" viewBox="0 0 400 400" focusable="false">' +
          '<defs><radialGradient id="' + gid + '"><stop offset="0" stop-color="#E52538" stop-opacity=".42"/><stop offset=".6" stop-color="#E52538" stop-opacity=".1"/><stop offset="1" stop-color="#E52538" stop-opacity="0"/></radialGradient></defs>' +
          '<circle class="pt-glow" cx="200" cy="200" r="195" fill="url(#' + gid + ')"/>' +
          '<g class="pt-outer"><polygon class="pt-s pt-h4" points="' + pstr(H4) + '"/></g>' +
          '<g class="pt-mid"><polygon class="pt-s pt-h3" points="' + pstr(H3) + '"/>' + verts + '</g>' +
          '<g class="pt-core">' + segs + '<polygon class="pt-s pt-h1" points="' + pstr(H1) + '"/><path class="pt-r pt-trace" d="' + redPath + '" pathLength="1"/></g>' +
          '<g class="pt-sats">' + sats + '</g>' +
        '</svg>';
      host.appendChild(wrap);

      const $ = (s) => wrap.querySelector(s), $$ = (s) => Array.from(wrap.querySelectorAll(s));
      const svg = $('.hexportal__svg'), glow = $('.pt-glow'), outer = $('.pt-outer'), mid = $('.pt-mid'), core = $('.pt-core');
      const h4 = $('.pt-h4'), h3 = $('.pt-h3'), h1 = $('.pt-h1'), trace = $('.pt-trace');
      const segEls = $$('.pt-seg'), satEls = $$('.pt-sat'), vtx = $$('.pt-vtx');
      const per = (r) => 6 * r;
      const late = [2, 7, 10];                                   // segmentos que só se conectam na fase B (hexágono incompleto antes)

      // estado inicial (progresso 0)
      gsap.set([glow, outer, mid, core], { svgOrigin: '200 200' });
      gsap.set(glow, { opacity: 0, scale: 0.6 });
      gsap.set(h4, { opacity: 0, strokeDasharray: '34 18' });
      gsap.set(h3, { opacity: 0, strokeDasharray: per(150), strokeDashoffset: per(150) });
      gsap.set(h1, { opacity: 0, strokeDasharray: per(60), strokeDashoffset: per(60) });
      gsap.set(trace, { opacity: 0, strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(vtx, { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
      segEls.forEach((s, i) => { const d = segData[i]; gsap.set(s, { opacity: 0, x: d.ox * 150, y: d.oy * 150, rotation: (i % 2 ? 1 : -1) * (14 + (i * 7) % 22), transformOrigin: '50% 50%' }); });
      satEls.forEach((s, i) => gsap.set(s, { opacity: 0, x: satData[i].ox * 90, y: satData[i].oy * 90, transformOrigin: '50% 50%' }));

      /* a coreografia é UMA timeline pausada (duração 1), controlada pelo progresso do scroll */
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      // Fase A (0–.24) — inicialização: segmentos convergem e formam um hexágono incompleto
      segEls.forEach((s, i) => { if (late.indexOf(i) < 0) tl.to(s, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.15, ease: 'power3.out' }, 0.005 + i * 0.012); });
      satEls.forEach((s, i) => { tl.to(s, { opacity: 0.9, x: satData[i].ox * 8, y: satData[i].oy * 8, duration: 0.2, ease: 'power2.out' }, 0.01 + i * 0.015); });
      // Fase B (.22–.50) — montagem: segmentos finais se conectam, contornos se desenham, traçado vermelho percorre a estrutura
      late.forEach((i, n) => tl.to(segEls[i], { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.1, ease: 'power3.out' }, 0.24 + n * 0.03));
      tl.to(satEls, { opacity: 0, duration: 0.1 }, 0.27)
        .to(h1, { opacity: 1, strokeDashoffset: 0, duration: 0.16, ease: 'power2.out' }, 0.24)
        .to(h3, { opacity: 0.9, strokeDashoffset: 0, duration: 0.2, ease: 'power2.out' }, 0.3)
        .to(vtx, { opacity: 1, scale: 1, duration: 0.08, stagger: 0.015, ease: 'power2.out' }, 0.38)
        .to(trace, { opacity: 1, strokeDashoffset: 0.45, duration: 0.24, ease: 'power1.inOut' }, 0.27)
        .to(glow, { opacity: 0.55, scale: 0.9, duration: 0.26, ease: 'sine.out' }, 0.24);
      // Fase C (.46–.78) — expansão: hexágono principal cresce, contornos externos se afastam com profundidade
      tl.to(h4, { opacity: 0.75, duration: 0.1 }, 0.46)
        .to(outer, { scale: 1.6, duration: 0.32, ease: 'power2.out' }, 0.46)
        .to(mid, { scale: 1.28, duration: 0.32, ease: 'power2.out' }, 0.46)
        .to(core, { scale: 1.12, duration: 0.32, ease: 'power2.out' }, 0.46)
        .to(trace, { strokeDashoffset: 0, duration: 0.2, ease: 'power1.inOut' }, 0.5)
        .to(glow, { opacity: 0.95, scale: 1.4, duration: 0.3, ease: 'sine.inOut' }, 0.46);
      // Fase D (.74–1) — dissolução: o portal se desfaz em linhas e fragmentos; nada permanece sobre o conteúdo
      segEls.forEach((s, i) => { const d = segData[i]; tl.to(s, { opacity: 0, x: d.ox * 60, y: d.oy * 60, rotation: (i % 2 ? -1 : 1) * 20, duration: 0.2, ease: 'power2.in' }, 0.76 + i * 0.01); });
      tl.to([h1, h3], { opacity: 0, strokeDashoffset: (i) => -per(i ? 150 : 60) * 0.5, duration: 0.2, ease: 'power1.in' }, 0.76)
        .to(h4, { opacity: 0, duration: 0.2 }, 0.76)
        .to(trace, { opacity: 0, strokeDashoffset: -0.5, duration: 0.2, ease: 'power1.in' }, 0.78)
        .to(vtx, { opacity: 0, scale: 0, duration: 0.12, stagger: 0.01 }, 0.78)
        .to(glow, { opacity: 0, duration: 0.24 }, 0.76);

      // efeitos sobre o fundo da próxima seção (textura revelada / iluminação ambiental), ligados ao mesmo progresso
      const fx = { v: 0 };
      const target = (c) => (c ? document.querySelector(c.el) : null);
      const revealEl = target(cfg.reveal), glowEl = target(cfg.glow);
      if (revealEl) {
        tl.to(fx, { v: 1, duration: 0.3, ease: 'sine.inOut', onUpdate() { revealEl.style.setProperty(cfg.reveal.prop, (cfg.reveal.from + (1 - cfg.reveal.from) * fx.v).toFixed(3)); } }, 0.44);
        revealEl.style.setProperty(cfg.reveal.prop, String(cfg.reveal.from));
      }
      if (glowEl) {
        const g = { v: 0 };
        tl.to(g, { v: 1, duration: 0.26, ease: 'sine.out', onUpdate() { glowEl.style.setProperty(cfg.glow.prop, (0.9 * g.v).toFixed(3)); } }, 0.4)
          .to(g, { v: 0, duration: 0.22, ease: 'sine.in', onUpdate() { glowEl.style.setProperty(cfg.glow.prop, (0.9 * g.v).toFixed(3)); } }, 0.78);
      }
      tl.progress(0);
      return { cfg, host, wrap, tl, last: -1 };
    }

    // progresso pela posição REAL do scroll (centro do portal ao longo da tela); sem travar, sem saltos
    function update() {
      ticking = false;
      const vh = vhNow();
      portals.forEach((p) => {
        const r = p.host.getBoundingClientRect();
        if (r.bottom < -vh * 1.5 || r.top > vh * 2.5) { if (p.last !== -2) { p.wrap.style.visibility = 'hidden'; p.last = -2; } return; }
        const yc = r.top + (p.cfg.fromBottom ? r.height - p.cfg.y : p.cfg.y);
        const prog = clamp((vh * p.cfg.s0 - yc) / (vh * (p.cfg.s0 - p.cfg.s1)), 0, 1);
        if (Math.abs(prog - p.last) < 0.002) return;
        p.last = prog;
        p.tl.progress(prog);
        p.wrap.style.visibility = (prog <= 0 || prog >= 1) ? 'hidden' : 'visible';
      });
    }
    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.__sentinelaPortals = portals.map((p) => ({ id: p.cfg.id, get timeline() { return p.tl; }, el: p.wrap }));
    update();
  }
})();
