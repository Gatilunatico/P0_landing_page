// ===== Tema claro/escuro =====
const root = document.documentElement;
document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// ===== Animação de entrada ao rolar =====
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 80}ms`;
  io.observe(el);
});

// ===== Radar interativo =====
// Cada alvo: ângulo (graus, sentido horário a partir do topo), raio (0–1) e texto.
(function () {
  const sweep = document.querySelector('.radar__sweep');
  const box = document.getElementById('targets');
  if (!sweep || !box) return;

  const data = [
    { a: 20,  r: .78, t: 'Ameaça bloqueada' },
    { a: 70,  r: .50, t: 'Phishing detectado' },
    { a: 115, r: .82, t: 'Conformidade LGPD', ok: 1 },
    { a: 160, r: .55, t: 'Porta exposta fechada', ok: 1 },
    { a: 205, r: .80, t: 'Ransomware isolado' },
    { a: 250, r: .50, t: 'Login suspeito barrado' },
    { a: 295, r: .80, t: 'Vulnerabilidade corrigida', ok: 1 },
    { a: 340, r: .52, t: 'Tráfego malicioso filtrado' },
  ];

  const els = data.map((d) => {
    const rad = d.a * Math.PI / 180;
    const el = document.createElement('div');
    const right = Math.sin(rad) >= 0;
    el.className = 'target ' + (right ? 'target--r' : 'target--l') + (d.ok ? ' target--ok' : '');
    el.style.left = (50 + Math.sin(rad) * d.r * 50) + '%';
    el.style.top = (50 - Math.cos(rad) * d.r * 50) + '%';
    el.innerHTML = '<i class="target__dot"></i><span class="target__label">' + d.t + '</span>';
    box.appendChild(el);
    return el;
  });

  const PERIOD = 6000;   // ms por volta
  const FADE = 230;      // graus até o alvo sumir por completo
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    const ang = ((now % PERIOD) / PERIOD) * 360;
    sweep.style.transform = 'rotate(' + ang + 'deg)';
    data.forEach((d, i) => {
      const delta = (ang - d.a + 360) % 360;          // quanto a varredura já passou do alvo
      const o = delta < FADE ? Math.pow(1 - delta / FADE, 1.4) : 0;
      els[i].style.opacity = o.toFixed(3);
      els[i].style.transform = 'scale(' + (0.85 + o * 0.15) + ')';
    });
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  // o loop só roda enquanto o radar está na tela (o ângulo vem do relógio absoluto, então ao voltar a varredura continua coerente)
  let raf = 0, visible = true;
  if (still) { sweep.style.display = 'none'; els.forEach((e) => (e.style.opacity = .9)); }
  else {
    raf = requestAnimationFrame(frame);
    const radarEl = sweep.closest('.radar') || sweep;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        visible = en[en.length - 1].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(radarEl);
    }
  }
})();

// ===== Cards explicativos dos módulos =====
(function () {
  const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const R = 'fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
  const svg = (inner) => `<svg viewBox="0 0 320 170" role="img" aria-hidden="true">${inner}</svg>`;
  const shield = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0-12 -10-8v7c0 7 4 11 10 14 6-3 10-7 10-14v-7z" ${S}/><path d="m-4 0 3 3 6-6" ${R} stroke-width="2"/></g>`;

  const items = {
    edr: {
      tag: 'Proteção de endpoints', title: 'EDR',
      text: 'Um vigia instalado em cada computador e servidor. Detecta comportamento suspeito e isola a máquina antes que o problema se espalhe.',
      list: ['Detecta vírus e ataques sem arquivo', 'Isola o equipamento infectado em segundos', 'Histórico completo para investigação'],
      art: svg(`<rect x="90" y="30" width="140" height="90" rx="8" ${S}/><path d="M70 138h180" ${S}/><path d="M138 120l-6 18M182 120l6 18" ${S}/>
        <path d="M105 52h50M105 68h80M105 84h60" ${S} opacity=".45"/><rect x="100" y="44" width="120" height="3" fill="var(--red)" class="ill-pulse"/>
        ${shield(235, 48, 1.7)}`)
    },
    siem: {
      tag: 'Correlação de eventos', title: 'SIEM',
      text: 'Reúne os registros de todos os seus sistemas em um só painel e liga os pontos para revelar ataques que passariam despercebidos.',
      list: ['Centraliza logs de toda a empresa', 'Alertas inteligentes, sem excesso de ruído', 'Facilita auditorias e relatórios'],
      art: svg(`<path d="M30 40h60M30 85h60M30 130h60" ${S} opacity=".5"/><path d="M95 40 150 85M95 85h55M95 130 150 85" ${S}/>
        <rect x="150" y="50" width="130" height="70" rx="8" ${S}/><path d="M165 105l20-20 16 10 22-28 18 12" ${R}/>
        <circle cx="236" cy="77" r="5" fill="var(--red)" class="ill-pulse"/>
        <circle cx="30" cy="40" r="4" fill="currentColor"/><circle cx="30" cy="85" r="4" fill="currentColor"/><circle cx="30" cy="130" r="4" fill="currentColor"/>`)
    },
    backup: {
      tag: 'Anti-ransomware', title: 'Backup imutável',
      text: 'Cópias de segurança que ninguém consegue apagar ou alterar, nem mesmo um invasor. Se você for atacado, volta ao normal rapidamente.',
      list: ['Cópias protegidas contra exclusão', 'Recuperação rápida após ataque', 'Testes periódicos de restauração'],
      art: svg(`<ellipse cx="130" cy="45" rx="55" ry="14" ${S}/><path d="M75 45v30c0 8 25 14 55 14s55-6 55-14V45" ${S}/><path d="M75 75v30c0 8 25 14 55 14s55-6 55-14V75" ${S}/>
        <path d="M75 105v18c0 8 25 14 55 14s55-6 55-14v-18" ${S} opacity=".5"/>
        <rect x="210" y="82" width="52" height="42" rx="8" fill="var(--bg-alt)" stroke="var(--red)" stroke-width="2.5"/><path d="M222 82V70a14 14 0 0 1 28 0v12" ${R}/>
        <circle cx="236" cy="102" r="4" fill="var(--red)"/><path d="M236 104v8" ${R} stroke-width="2"/>`)
    },
    zerotrust: {
      tag: 'Acesso seguro', title: 'Zero Trust',
      text: 'Nunca confie, sempre verifique. Cada pessoa e cada dispositivo é validado a cada acesso, mesmo dentro da rede da empresa.',
      list: ['Acesso mínimo necessário por pessoa', 'Verificação contínua de identidade', 'Reduz o estrago se uma conta for invadida'],
      art: svg(`<circle cx="50" cy="60" r="12" ${S}/><path d="M28 100c0-14 10-22 22-22s22 8 22 22" ${S}/>
        <path d="M80 82h45" ${S} stroke-dasharray="4 6"/><rect x="125" y="40" width="46" height="84" rx="8" ${S}/>
        <circle cx="148" cy="72" r="9" ${R}/><path d="m144 72 3 3 6-6" ${R} stroke-width="2"/><path d="M135 100h26" ${S} opacity=".5"/>
        <path d="M171 82h45" ${S}/><path d="m210 76 8 6-8 6" ${S}/>
        <rect x="224" y="52" width="60" height="60" rx="10" ${S}/><path d="M240 76h28M240 90h18" ${S} opacity=".5"/>`)
    },
    cloud: {
      tag: 'AWS · Azure · GCP', title: 'Cloud Security',
      text: 'Revisamos e protegemos seus serviços na nuvem: configurações, permissões e dados, para evitar vazamentos por erros comuns.',
      list: ['Auditoria de configurações erradas', 'Controle de permissões e chaves', 'Alertas em tempo real na nuvem'],
      art: svg(`<path d="M105 120a30 30 0 0 1 3-60 42 42 0 0 1 80-8 34 34 0 0 1 22 68z" ${S}/>
        ${shield(160, 98, 2.4)}
        <circle cx="62" cy="48" r="4" fill="currentColor" opacity=".6"/><circle cx="262" cy="70" r="4" fill="var(--red)" class="ill-pulse"/><circle cx="250" cy="130" r="4" fill="currentColor" opacity=".6"/>
        <path d="M62 48l30 14M262 70l-28 6M250 130l-28-14" ${S} opacity=".35" stroke-dasharray="3 5"/>`)
    },
    mfa: {
      tag: 'Identidades e acessos', title: 'MFA / IAM',
      text: 'Mais de uma prova de identidade para entrar (senha, celular, biometria) e controle de quem pode acessar o quê.',
      list: ['Bloqueia o uso de senhas roubadas', 'Login único e simples para a equipe', 'Permissões por cargo e função'],
      art: svg(`<rect x="40" y="35" width="56" height="100" rx="10" ${S}/><path d="M60 125h16" ${S} opacity=".5"/><rect x="52" y="52" width="32" height="22" rx="4" ${S} opacity=".5"/>
        <text x="68" y="105" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="15" fill="var(--red)" font-weight="700">123</text>
        <path d="M110 85h30" ${S} stroke-dasharray="4 6"/><circle cx="170" cy="70" r="13" ${S}/><path d="M170 83v26M170 98h10M170 108h8" ${S}/>
        <path d="M205 85h24" ${S} stroke-dasharray="4 6"/><circle cx="262" cy="85" r="30" ${R}/><path d="m248 86 10 10 18-20" ${R}/>`)
    },
    phishing: {
      tag: 'E-mail protegido', title: 'Anti-phishing',
      text: 'Filtra e-mails falsos antes que cheguem à caixa de entrada e treina sua equipe para reconhecer golpes.',
      list: ['Bloqueia links e anexos perigosos', 'Simulações de golpe para treinar a equipe', 'Botão de denúncia com um clique'],
      art: svg(`<rect x="70" y="45" width="130" height="90" rx="10" ${S}/><path d="m70 55 65 45 65-45" ${S}/>
        <path d="M232 40v38c0 8 6 14 14 14" ${R}/><path d="M246 92l-8-8" ${R} stroke-width="2"/>
        <path d="M222 62 244 40l22 22" ${S} opacity=".0"/>
        <g transform="translate(242 108)"><path d="M0-22 22 18H-22z" fill="var(--bg-alt)" ${R}/><path d="M0-8v12" ${R}/><circle cx="0" cy="11" r="1.6" fill="var(--red)"/></g>`)
    },
    intel: {
      tag: 'Inteligência de ameaças', title: 'Threat Intel',
      text: 'Acompanhamos o que os criminosos estão fazendo pelo mundo e avisamos antes que o ataque chegue até você.',
      list: ['Monitoramento da dark web e vazamentos', 'Alertas sobre golpes do seu setor', 'Relatórios periódicos em linguagem simples'],
      art: svg(`<circle cx="160" cy="85" r="62" ${S}/><ellipse cx="160" cy="85" rx="26" ry="62" ${S} opacity=".5"/><path d="M98 85h124M108 55h104M108 115h104" ${S} opacity=".5"/>
        <circle cx="128" cy="62" r="5" fill="var(--red)" class="ill-pulse"/><circle cx="196" cy="108" r="5" fill="var(--red)" class="ill-pulse" style="animation-delay:.8s"/><circle cx="182" cy="52" r="4" fill="var(--red)" class="ill-pulse" style="animation-delay:1.5s"/>
        <path d="M232 60l22-18M236 118l24 14" ${S} stroke-dasharray="3 5"/><circle cx="260" cy="38" r="5" fill="currentColor"/><circle cx="266" cy="136" r="5" fill="currentColor"/>`)
    },
  };

  // ----- Serviços (cards de "Tudo o que sua empresa precisa") -----
  Object.assign(items, {
    diag: {
      tag: 'Serviço', title: 'Diagnóstico de riscos', cta: 'Quero este serviço',
      text: 'Fazemos um raio-x da sua empresa: o que precisa ser protegido, onde estão as falhas e quais riscos merecem atenção primeiro.',
      list: ['Inventário de sistemas e dados críticos', 'Falhas ordenadas por gravidade', 'Plano de ação claro e priorizado'],
      art: svg(`<rect x="50" y="35" width="110" height="100" rx="8" ${S} opacity=".5"/><path d="M68 62h50M68 82h74M68 102h40" ${S} opacity=".5"/>
        <circle cx="190" cy="80" r="40" fill="var(--bg-alt)" ${S}/><path d="m219 109 34 34" ${R} stroke-width="5"/>
        <circle cx="190" cy="80" r="40" ${R}/><path d="M172 84l12 12 24-26" ${R}/>
        <circle cx="150" cy="52" r="5" fill="var(--red)" class="ill-pulse"/>`)
    },
    pentest: {
      tag: 'Serviço', title: 'Teste de invasão', cta: 'Quero este serviço',
      text: 'Hackers éticos tentam invadir seus sistemas, com autorização, usando as mesmas técnicas dos criminosos. Você descobre as falhas antes deles.',
      list: ['Ataques simulados e controlados', 'Cobre sites, redes, apps e pessoas', 'Relatório com provas e como corrigir'],
      art: svg(`<rect x="30" y="30" width="160" height="110" rx="10" ${S}/><path d="M30 55h160" ${S}/><circle cx="46" cy="43" r="3" fill="var(--red)"/><circle cx="58" cy="43" r="3" fill="currentColor" opacity=".5"/><circle cx="70" cy="43" r="3" fill="currentColor" opacity=".5"/>
        <path d="m48 78 12 10-12 10" ${R}/><path d="M72 98h40" ${S}/><path d="M48 118h110" ${S} opacity=".4"/>
        <circle cx="250" cy="85" r="34" ${S}/><circle cx="250" cy="85" r="16" ${R}/><circle cx="250" cy="85" r="3" fill="var(--red)" class="ill-pulse"/>
        <path d="M250 38v26M250 106v26M203 85h26M271 85h26" ${S}/>`)
    },
    conf: {
      tag: 'Serviço', title: 'Conformidade', cta: 'Quero este serviço',
      text: 'Deixamos sua empresa em dia com leis e normas, como LGPD, ISO 27001 e PCI DSS, evitando multas e passando confiança aos clientes.',
      list: ['Adequação à LGPD sem burocracia', 'Preparação para auditorias e certificações', 'Políticas e documentos prontos para usar'],
      art: svg(`<rect x="85" y="22" width="120" height="136" rx="10" ${S}/><path d="m103 55 6 6 11-12M103 85l6 6 11-12M103 115l6 6 11-12" ${R} stroke-width="2.5"/>
        <path d="M132 55h50M132 85h50M132 115h34" ${S} opacity=".5"/>
        <g transform="translate(222 112)"><circle r="26" fill="var(--bg-alt)" ${R}/><path d="M0-12 -9-8v6c0 6 4 10 9 12 5-2 9-6 9-12v-6z" ${S}/><path d="m-4 0 3 3 6-6" ${R} stroke-width="2"/></g>`)
    },
    monit: {
      tag: 'Serviço', title: 'Monitoramento 24/7', cta: 'Quero este serviço',
      text: 'Um time dedicado vigia seu ambiente o tempo todo, de dia, de noite e nos feriados, e age assim que algo suspeito aparece.',
      list: ['Central de segurança sempre ativa', 'Alertas filtrados: só o que importa', 'Resposta a comportamentos suspeitos'],
      art: svg(`<rect x="45" y="30" width="230" height="110" rx="12" ${S}/><path d="M60 88h45l12-30 18 56 16-40 10 14h54" ${R} stroke-width="3"/>
        <circle cx="244" cy="88" r="4" fill="var(--red)" class="ill-pulse"/>
        <text x="62" y="56" font-family="Space Grotesk, sans-serif" font-size="14" font-weight="700" fill="currentColor">24/7</text>
        <path d="M60 126h200" ${S} opacity=".3" stroke-dasharray="3 6"/>`)
    },
    incid: {
      tag: 'Serviço', title: 'Resposta a incidentes', cta: 'Quero este serviço',
      text: 'Se o pior acontecer, entramos em ação na hora: contemos o ataque, descobrimos o que houve e colocamos tudo para funcionar de novo.',
      list: ['Equipe de plantão para emergências', 'Investigação para entender a origem', 'Plano de recuperação e comunicação'],
      art: svg(`<path d="M160 22 92 48v38c0 38 28 60 68 76 40-16 68-38 68-76V48z" ${S}/>
        <path d="M170 56 140 96h22l-8 30 34-44h-24z" fill="var(--red)" class="ill-pulse"/>
        <circle cx="50" cy="60" r="4" fill="currentColor" opacity=".5"/><circle cx="270" cy="110" r="4" fill="currentColor" opacity=".5"/>
        <path d="M54 60h28M238 110h28" ${S} opacity=".4" stroke-dasharray="3 5"/>`)
    },
    treino: {
      tag: 'Serviço', title: 'Treinamento de equipes', cta: 'Quero este serviço',
      text: 'A maioria dos ataques começa com um clique errado. Ensinamos sua equipe a reconhecer golpes e a agir com segurança no dia a dia.',
      list: ['Aulas curtas e práticas', 'Simulações de phishing com a sua equipe', 'Acompanhamento da evolução de cada área'],
      art: svg(`<rect x="60" y="25" width="150" height="86" rx="8" ${S}/><path d="M135 111v22M105 133h60" ${S}/>
        <path d="M80 85l22-22 18 14 28-32" ${R}/><circle cx="148" cy="45" r="4" fill="var(--red)" class="ill-pulse"/>
        <circle cx="245" cy="62" r="14" ${S}/><path d="M221 112c0-16 10-26 24-26s24 10 24 26" ${S}/>
        <path d="m238 62 5 5 9-10" ${R} stroke-width="2"/>`)
    },
  });

  const dlg = document.getElementById('addonModal');
  if (!dlg || !dlg.showModal) return;
  const $ = (id) => document.getElementById(id);

  document.querySelectorAll('[data-addon]').forEach((btn) => {
    btn.addEventListener('keydown', (e) => {   // cards (role="button") também abrem com Enter/Espaço
      if (btn.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); btn.click(); }
    });
    btn.addEventListener('click', () => {
      const d = items[btn.dataset.addon];
      $('mCta').textContent = d.cta || 'Quero este módulo';
      $('mArt').innerHTML = d.art;
      $('mTag').textContent = d.tag;
      $('mTitle').textContent = d.title;
      $('mText').textContent = d.text;
      $('mList').innerHTML = d.list.map((t) => `<li>${t}</li>`).join('');
      dlg.showModal();
    });
  });
  $('mClose').addEventListener('click', () => dlg.close());
  $('mCta').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // clique fora fecha
})();

// ===== Botões de pacote preenchem o formulário =====
document.querySelectorAll('[data-plan]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById('pacote').value = btn.dataset.plan;
  });
});

// ===== Formulário de agendamento (demonstração, sem backend) =====
const form = document.getElementById('form');
const msg = document.getElementById('msg');
const dateInput = document.getElementById('data');
dateInput.min = new Date().toISOString().split('T')[0];

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach((f) => {
    const bad = !f.value || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
    f.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });
  msg.className = 'form__msg ' + (ok ? 'ok' : 'err');
  if (!ok) { msg.textContent = 'Preencha os campos destacados.'; return; }
  const nome = document.getElementById('nome').value.split(' ')[0];
  msg.textContent = `Obrigado, ${nome}! Entraremos em contato por e-mail.`;
  form.reset();
});

// ===== Configurador "Monte a sua combinação" =====
// Cartões (HTML) → seleção múltipla → resumo, cálculo, persistência e envio ao formulário existente.
(function initializeCombinationBuilder() {
  const builder = document.getElementById('combinationBuilder');
  if (!builder) return;

  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1) Configuração central de preços (VALORES DEMONSTRATIVOS) ----------
     setup   = investimento inicial / implantação (pontual)
     monthly = mensalidade recorrente
     null    = "Sob consulta" (não entra em nenhuma soma) */
  const PRICING = {
    edr:       { setup: 900,  monthly: 1800 },
    siem:      { setup: 2500, monthly: 3200 },
    backup:    { setup: 600,  monthly: 1400 },
    zerotrust: { setup: 7500, monthly: 900 },
    cloud:     { setup: 1800, monthly: 2200 },
    mfa:       { setup: 1200, monthly: 600 },
    phishing:  { setup: 0,    monthly: 750 },
    intel:     null,
  };
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const STORE_KEY = 'sentinela-combinacao';

  // serviços reais = os cartões do HTML (nome vem do DOM, preço da configuração acima)
  const cards = new Map();
  const services = {};
  builder.querySelectorAll('.cb-card[data-module]').forEach((card) => {
    const id = card.dataset.module;
    services[id] = { id, name: card.querySelector('.cb-card__name').textContent.trim(), price: PRICING[id] || null };
    cards.set(id, card);
  });

  const selected = new Set();   // ordem de inserção = ordem no resumo

  /* ---------- 2) Cálculo centralizado ---------- */
  function priceLine(svc) {
    const p = svc.price;
    if (!p) return 'Sob consulta';
    const parts = [];
    if (p.monthly) parts.push(brl0.format(p.monthly) + '/mês');
    if (p.setup) parts.push(brl0.format(p.setup) + ' de implantação');
    return parts.join(' + ') || 'Sob consulta';
  }
  function calculateCombinationTotal() {
    let setup = 0, monthly = 0, consult = 0;
    selected.forEach((id) => {
      const p = services[id] && services[id].price;
      if (!p) { consult++; return; }
      setup += Math.max(0, p.setup || 0);
      monthly += Math.max(0, p.monthly || 0);
    });
    return { setup, monthly, consult, count: selected.size };
  }

  /* ---------- 3) Animação numérica (cancela a anterior; valor final sempre exato) ---------- */
  function animatePriceChange(node, to) {
    const from = node._shown != null ? node._shown : 0;
    cancelAnimationFrame(node._raf); clearTimeout(node._t);
    if (reduceMotion || from === to) { node._shown = to; node.textContent = brl.format(to); return; }
    const t0 = performance.now(), dur = 420;
    // garantia: mesmo se o navegador pausar o rAF (aba em segundo plano), o valor final é exato
    node._t = setTimeout(() => { cancelAnimationFrame(node._raf); node._shown = to; node.textContent = brl.format(to); }, dur + 80);
    (function step(now) {
      const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      node._shown = t < 1 ? from + (to - from) * e : to;
      node.textContent = brl.format(t < 1 ? Math.round(node._shown) : to);
      if (t < 1) node._raf = requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- 4) Resumo ---------- */
  const ui = {
    count: $('cbCount'), empty: $('cbEmpty'), list: $('cbList'), totals: $('cbTotals'),
    setup: $('cbSetup'), monthly: $('cbMonthly'), consult: $('cbConsult'), consultRow: $('cbConsultRow'),
    clear: $('cbClear'), send: $('cbSend'), live: $('cbLive'),
    bar: $('cbBar'), barCount: $('cbBarCount'), barEst: $('cbBarEst'),
  };
  const noun = (n) => n + (n === 1 ? ' módulo' : ' módulos');

  // itens do resumo criados uma única vez; depois só mostramos/ocultamos
  const rows = {};
  Object.values(services).forEach((svc) => {
    const li = document.createElement('li');
    li.className = 'cb-item'; li.hidden = true;
    li.innerHTML = '<span class="cb-item__txt"><b></b><small></small></span>' +
      '<button type="button" class="cb-item__rm"><span aria-hidden="true">×</span></button>';
    li.querySelector('b').textContent = svc.name;
    li.querySelector('small').textContent = priceLine(svc);
    const rm = li.querySelector('.cb-item__rm');
    rm.setAttribute('aria-label', 'Remover ' + svc.name + ' da combinação');
    rm.addEventListener('click', () => toggleServiceSelection(svc.id, false));
    ui.list.appendChild(li);
    rows[svc.id] = li;
  });

  function showRow(li, show) {
    clearTimeout(li._t);
    if (show) {
      li.hidden = false; li.classList.remove('is-leaving'); li.classList.add('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('is-entering')));
    } else if (!li.hidden) {
      li.classList.add('is-leaving');
      li._t = setTimeout(() => { li.hidden = true; li.classList.remove('is-leaving'); }, 200);
    }
  }

  function updateCombinationSummary() {
    const t = calculateCombinationTotal();
    ui.count.textContent = t.count;
    ui.count.classList.remove('is-bump'); void ui.count.offsetWidth; ui.count.classList.add('is-bump');
    ui.empty.hidden = t.count > 0;
    ui.totals.hidden = t.count === 0;
    ui.consultRow.hidden = t.consult === 0;
    ui.consult.textContent = noun(t.consult);
    ui.clear.disabled = ui.send.disabled = t.count === 0;
    animatePriceChange(ui.setup, t.setup);
    animatePriceChange(ui.monthly, t.monthly);
    // barra compacta (mobile)
    ui.barCount.textContent = noun(t.count);
    ui.barEst.textContent = t.monthly ? brl0.format(t.monthly) + '/mês' : t.setup ? brl0.format(t.setup) + ' inicial' : 'Sob consulta';
    updateBar();
    // anúncio estável para leitores de tela (só o valor final)
    ui.live.textContent = t.count === 0 ? 'Nenhum módulo selecionado.'
      : noun(t.count) + ' selecionados. Investimento inicial estimado ' + brl.format(t.setup) +
        ', mensalidade estimada ' + brl.format(t.monthly) + (t.consult ? ', mais ' + noun(t.consult) + ' sob consulta.' : '.');
  }

  /* ---------- 5) Seleção ---------- */
  function paintCard(id, on, animate) {
    const card = cards.get(id), btn = card.querySelector('.cb-toggle');
    card.classList.toggle('is-selected', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', (on ? 'Remover ' : 'Adicionar ') + services[id].name + (on ? ' da combinação' : ' à combinação'));
    btn.querySelector('.cb-toggle__label').textContent = on ? 'Remover' : 'Adicionar';
    if (on && animate && !reduceMotion) {
      card.classList.remove('is-pulse'); void card.offsetWidth; card.classList.add('is-pulse');
    }
  }
  function toggleServiceSelection(id, force) {
    if (!services[id]) return;
    const on = force === undefined ? !selected.has(id) : force;
    if (on === selected.has(id)) return;           // um serviço nunca entra duas vezes
    if (on) selected.add(id); else selected.delete(id);
    paintCard(id, on, true);
    if (on) ui.list.appendChild(rows[id]);          // segue a ordem de escolha
    showRow(rows[id], on);
    updateCombinationSummary();
    saveCombinationState();
  }
  function clearCombination() {
    Array.from(selected).forEach((id) => { selected.delete(id); paintCard(id, false, false); showRow(rows[id], false); });
    updateCombinationSummary();
    saveCombinationState();
  }

  /* ---------- 6) Persistência (sessionStorage) ---------- */
  function saveCombinationState() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(Array.from(selected))); } catch (e) {}
  }
  function restoreCombinationState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
      if (!Array.isArray(saved)) return;
      saved.filter((id) => typeof id === 'string' && services[id]).forEach((id) => {
        if (selected.has(id)) return;
        selected.add(id); paintCard(id, true, false); ui.list.appendChild(rows[id]); rows[id].hidden = false;
      });
    } catch (e) {}
  }

  /* ---------- 7) Envio ao formulário existente (nada é enviado automaticamente) ---------- */
  const MARK = '— Combinação Sentinela (estimativa demonstrativa) —';
  function buildCombinationText() {
    const t = calculateCombinationTotal();
    const lines = [MARK];
    selected.forEach((id) => lines.push('• ' + services[id].name + ' — ' + priceLine(services[id])));
    lines.push('Investimento inicial estimado: ' + brl.format(t.setup));
    lines.push('Mensalidade estimada: ' + brl.format(t.monthly));
    if (t.consult) lines.push('Serviços sob consulta: ' + noun(t.consult));
    return lines.join('\n');
  }
  function sendCombinationToForm() {
    if (!selected.size) return;
    const field = $('combinacaoField'), ta = $('combinacao');
    if (!field || !ta) return;
    const block = buildCombinationText();
    const i = ta.value.indexOf(MARK);
    // não apaga o que a pessoa já escreveu: atualiza só o nosso bloco
    ta.value = i >= 0 ? ta.value.slice(0, i) + block
      : (ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n\n' : '') + block;
    field.hidden = false;
    $('agendar').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    const target = !$('nome').value ? $('nome') : ta;
    setTimeout(() => target.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
  }
  const formEl = $('form');
  if (formEl) formEl.addEventListener('reset', () => { const f = $('combinacaoField'); if (f) f.hidden = true; });

  /* ---------- 8) Efeito magnético (somente mouse; um único loop rAF) ---------- */
  function initializeMagneticCards() {
    if (!canHover || reduceMotion) return;
    const MAX_TILT = 2, LIFT_MIN = 4, LIFT_MAX = 6;
    const active = new Set();
    const st = new Map();
    let raf = 0;
    cards.forEach((card) => st.set(card, { rx: 0, ry: 0, ty: 0, trx: 0, tryy: 0, tty: 0, hover: false }));

    function loop() {
      active.forEach((card) => {
        const s = st.get(card);
        const k = s.hover ? 0.2 : 0.13;                 // entra um pouco mais rápido do que volta
        s.rx += (s.trx - s.rx) * k; s.ry += (s.tryy - s.ry) * k; s.ty += (s.tty - s.ty) * k;
        card.style.setProperty('--cb-rx', s.rx.toFixed(3) + 'deg');
        card.style.setProperty('--cb-ry', s.ry.toFixed(3) + 'deg');
        card.style.setProperty('--cb-ty', s.ty.toFixed(2) + 'px');
        if (!s.hover && Math.abs(s.rx) + Math.abs(s.ry) + Math.abs(s.ty) < 0.02) {
          ['--cb-rx', '--cb-ry', '--cb-ty'].forEach((p) => card.style.removeProperty(p));
          s.rx = s.ry = s.ty = 0; active.delete(card);
        }
      });
      raf = active.size ? requestAnimationFrame(loop) : 0;
    }
    const wake = (card) => { active.add(card); if (!raf) raf = requestAnimationFrame(loop); };

    cards.forEach((card) => {
      const s = st.get(card);
      card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { s.hover = true; wake(card); } });
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');       // reflexo acompanha o cursor
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        s.tryy = (px - 0.5) * 2 * MAX_TILT;
        s.trx = -(py - 0.5) * 2 * MAX_TILT;
        const centered = 1 - Math.min(1, Math.hypot(px - 0.5, py - 0.5) * 2);
        s.tty = -(LIFT_MIN + (LIFT_MAX - LIFT_MIN) * centered);
        s.hover = true; wake(card);
      });
      card.addEventListener('pointerleave', () => { s.hover = false; s.trx = s.tryy = s.tty = 0; wake(card); });
    });
  }

  /* ---------- 9) Barra compacta (mobile) ---------- */
  let builderInView = false, panelInView = false;
  const mobileMQ = matchMedia('(max-width: 960px)');
  function updateBar() {
    ui.bar.hidden = !(mobileMQ.matches && builderInView && !panelInView && selected.size > 0);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { builderInView = en[0].isIntersecting; updateBar(); }).observe(builder);
    new IntersectionObserver((en) => { panelInView = en[0].isIntersecting; updateBar(); }).observe($('cbPanel'));
  }
  ui.bar.addEventListener('click', () => $('cbPanel').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }));
  mobileMQ.addEventListener('change', updateBar);

  /* ---------- 10) Ligações: preços nos cartões, botões, detalhes ---------- */
  cards.forEach((card, id) => {
    card.querySelector('[data-price]').textContent = priceLine(services[id]);
    card.querySelector('.cb-toggle').addEventListener('click', () => toggleServiceSelection(id));
  });
  ui.clear.addEventListener('click', clearCombination);
  ui.send.addEventListener('click', sendCombinationToForm);

  // "Detalhes" abre o card informativo já existente; dentro dele o CTA passa a adicionar/remover
  const dlg = document.getElementById('addonModal');
  let modalId = null;
  if (dlg) {
    builder.querySelectorAll('.cb-info').forEach((b) => b.addEventListener('click', () => {
      modalId = b.dataset.addon;
      $('mCta').textContent = selected.has(modalId) ? 'Remover da combinação' : 'Adicionar à combinação';
    }));
    dlg.addEventListener('click', (e) => {
      if (!modalId || !e.target.closest('#mCta')) return;
      e.preventDefault();                               // não navega para o formulário
      toggleServiceSelection(modalId);
    });
    dlg.addEventListener('close', () => { modalId = null; });
  }

  restoreCombinationState();
  initializeMagneticCards();
  updateCombinationSummary();
})();

// ===== Animações de seção: MÓDULOS DE SEGURANÇA (processo) e EXPANSÃO DE ENERGIA (pacotes) =====
// Os módulos usam camadas 3D em CSS (placas que se abrem); sinais e anéis de energia são desenhados em Canvas 2D
// (decorativo, pointer-events: none). Tudo é sincronizado por timelines GSAP (carregado com defer depois deste
// arquivo → início no DOMContentLoaded). Se o GSAP falhar ou o usuário preferir menos movimento, nada é tocado.
(function initializeSectionMotion() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onReady = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());

  // Presença na seção, com histerese: ENTRA quando está suficientemente visível (onEnter, no máximo uma vez por visita);
  // só é REARMADA depois de sair totalmente da área visível (onLeave). Permanecer na seção nunca repete o efeito.
  function presence(target, threshold, onEnter, onLeave) {
    if (!('IntersectionObserver' in window)) { onEnter(); return; }
    let inside = false;
    const steps = []; for (let i = 0; i <= 20; i++) steps.push(i / 20);
    const obs = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (!inside) {
        const vh = (e.rootBounds && e.rootBounds.height) || window.innerHeight;
        const need = Math.min(threshold, (vh * 0.9) / Math.max(1, e.boundingClientRect.height));   // seções altas nunca exigem mais do que cabe na tela
        if (e.isIntersecting && e.intersectionRatio >= need - 0.001) { inside = true; onEnter(); }
      } else if (!e.isIntersecting) { inside = false; onLeave(); }
    }, { threshold: steps, rootMargin: '0px 0px -8% 0px' });
    obs.observe(target);
  }

  onReady(() => {
    if (reduceMotion || !window.gsap) { const pl = document.querySelector('#pacotes .plans'); if (pl) pl.classList.add('pw-done'); return; }      // movimento reduzido: só o destaque final estático
    try { initializeProcessModules(); } catch (e) { console.warn('[Sentinela] Módulos do processo indisponíveis.', e); }
    try { initializePricingWave(); } catch (e) { console.warn('[Sentinela] Expansão dos pacotes indisponível.', e); }
  });

  /* ---------- utilidades compartilhadas ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const TAU = 6.2832;

  function makePath(pts) {                              // polilinha com distâncias acumuladas
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1];
    function at(len) {
      len = clamp(len, 0, total);
      let i = 1; while (i < cum.length - 1 && cum[i] < len) i++;
      const seg = (cum[i] - cum[i - 1]) || 1, t = (len - cum[i - 1]) / seg, a = pts[i - 1], b = pts[i];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: (b.x - a.x) / seg, dy: (b.y - a.y) / seg };
    }
    function trace(ctx, from, to) {
      from = clamp(from, 0, total); to = clamp(to, 0, total);
      if (to - from < 0.5) return false;
      const p = at(from);
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      for (let i = 1; i < pts.length; i++) if (cum[i] > from && cum[i] < to) ctx.lineTo(pts[i].x, pts[i].y);
      const q = at(to); ctx.lineTo(q.x, q.y);
      return true;
    }
    return { pts, cum, total, at, trace };
  }
  function timeAtFraction(easeName, f) {                // instante (0–1) em que o tween atinge a fração f do percurso
    const fn = gsap.parseEase(easeName); let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (fn(m) < f) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function makeParticles(max) {
    const list = [];
    return {
      spawn(x, y, vx, vy, life, size) { if (list.length < max) list.push({ x, y, vx, vy, life, max: life, size }); },
      step(dt) {
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i]; p.life -= dt;
          if (p.life <= 0) { list.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97;
        }
      },
      draw(ctx) {
        list.forEach((p) => {
          const a = p.life / p.max;
          ctx.globalAlpha = a;
          ctx.fillStyle = 'rgb(255,' + (90 + Math.round(130 * a)) + ',' + (100 + Math.round(120 * a)) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.55 + 0.45 * a), 0, TAU); ctx.fill();
        });
        ctx.globalAlpha = 1;
      },
      clear() { list.length = 0; },
    };
  }
  function drawBlooms(ctx, blooms, dt) {                // clarões pontuais: { x, y, t, dur, r0, r1, ring }
    for (let i = blooms.length - 1; i >= 0; i--) {
      const b = blooms[i]; b.t += dt;
      const k = b.t / b.dur;
      if (k >= 1) { blooms.splice(i, 1); continue; }
      const r = b.r0 + (b.r1 - b.r0) * (1 - Math.pow(1 - k, 3)), a = Math.pow(1 - k, 1.6);
      if (b.ring) {
        ctx.lineWidth = 2.5 * (1 - k) + 0.6; ctx.strokeStyle = 'rgba(255,70,90,' + (a * 0.9) + ')';
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        g.addColorStop(0, 'rgba(255,240,240,' + a + ')'); g.addColorStop(0.3, 'rgba(255,80,98,' + (a * 0.7) + ')'); g.addColorStop(1, 'rgba(229,37,56,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.fill();
      }
    }
  }
  function makeCanvas(className) {
    const cv = document.createElement('canvas');
    cv.className = className; cv.setAttribute('aria-hidden', 'true');
    return cv;
  }
  const unstyle = (el, props) => props.forEach((p) => el.style.removeProperty(p));

  /* ==========================================================================
     ANIMAÇÃO 1 — MÓDULOS DE SEGURANÇA (seção "Do primeiro contato à proteção contínua")
     Cada card nasce como um módulo fechado (duas placas metálicas + linha vermelha + indicador de etapa),
     inicializa, abre as placas, revela o conteúdo e trava no lugar.
     ========================================================================== */
  function initializeProcessModules() {
    const road = document.querySelector('#roadmap .roadmap');
    if (!road) return;
    const steps = Array.from(road.querySelectorAll('.step'));
    if (steps.length < 2) return;
    const nums = steps.map((s) => s.querySelector('.step__num'));
    const kids = steps.map((s) => Array.from(s.querySelectorAll('.step__body > *')));
    const host = road.parentElement;
    const small = matchMedia('(max-width: 720px)').matches;
    const PAD = 30;
    const last = steps.length - 1;

    let L = null, cv = null, ctx = null, finishCurrent = null;
    const sig = { len: 0, on: 0, lit: 0 }, run = { len: 0, on: 0 }, fx = { energy: 1 };
    let dpr = 1, cw = 0, ch = 0, padX = PAD, geo = null, state = 'idle';

    // PREPARAÇÃO (também usada no rearmamento): módulos fechados e conteúdo oculto. Só altera opacidade/camadas decorativas,
    // então o layout nunca muda e a seção pode ser rearmada fora da tela sem que o visitante perceba.
    function prepare() {
      // a entrada dos cards passa a ser conduzida por esta animação (o .reveal original sairia em conflito)
      steps.forEach((s) => s.classList.remove('reveal'));
      road.classList.remove('is-opened'); road.classList.add('process-fx');
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    // camadas decorativas do módulo (removidas ao final; o card volta a ser exatamente o original)
    L = steps.map((s, i) => {
      const wrap = document.createElement('span');
      wrap.className = 'ps-doors'; wrap.setAttribute('aria-hidden', 'true');
      let leds = '';
      for (let k = 0; k < steps.length; k++) leds += '<i class="ps-led" style="--k:' + k + '"></i>';
      wrap.innerHTML = '<span class="ps-inner"></span><span class="ps-door ps-door--t">' + leds + '</span><span class="ps-door ps-door--b"></span><span class="ps-seam"></span>';
      s.appendChild(wrap);
      const ring = document.createElement('i');
      ring.className = 'ps-ring'; ring.setAttribute('aria-hidden', 'true');
      nums[i].appendChild(ring);
      return {
        wrap, ring, inner: wrap.querySelector('.ps-inner'), top: wrap.querySelector('.ps-door--t'),
        bottom: wrap.querySelector('.ps-door--b'), seam: wrap.querySelector('.ps-seam'),
        leds: Array.from(wrap.querySelectorAll('.ps-led')),
      };
    });

    // estado inicial: módulos fechados, conteúdo oculto (só existe se o JS rodou)
    gsap.set(steps, { '--ps-glow': 0, '--ps-ring': 0, '--ps-angle': '0deg' });
    gsap.set(L.map((m) => m.seam), { scaleX: 0, opacity: 0 });
    gsap.set(L.map((m) => m.inner), { opacity: 0, xPercent: -100 });
    L.forEach((m, i) => gsap.set(m.leds, { opacity: 0.16 }));
    gsap.set(nums, { opacity: 0, scale: 0.5 });
    kids.forEach((k) => gsap.set(k, { opacity: 0, y: 12 }));

    // canvas dos sinais entre módulos (secundário)
    cv = makeCanvas('pscan');
    host.insertBefore(cv, road);
    ctx = cv.getContext('2d');
    sig.len = 0; sig.on = 0; sig.lit = 0; run.len = 0; run.on = 0; fx.energy = 1; geo = null; state = 'armed';
    }
    const particles = makeParticles(small ? 40 : 110), blooms = [];

    function sizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      const r = road.getBoundingClientRect(), vw = document.documentElement.clientWidth;
      padX = Math.max(10, Math.min(PAD, r.left - 1, vw - r.right - 1));          // nunca gera rolagem horizontal
      cw = road.offsetWidth + padX * 2; ch = road.offsetHeight + PAD * 2;
      cv.style.left = (road.offsetLeft - padX) + 'px'; cv.style.top = (road.offsetTop - PAD) + 'px';
      cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, padX * dpr, PAD * dpr);
    }
    // conexões reais entre os módulos (centro de cada número); entre fileiras contorna as bordas da grade
    function buildGeometry() {
      const P = nums.map((n, i) => ({
        x: steps[i].offsetLeft + n.offsetLeft + n.offsetWidth / 2,
        y: steps[i].offsetTop + n.offsetTop + n.offsetHeight / 2,
      }));
      const W = road.offsetWidth;
      const pts = [P[0]], mark = [0];
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1];
        if (Math.abs(a.y - b.y) >= 6) {
          if (Math.abs(a.x - b.x) < 4) pts.push({ x: -8, y: a.y }, { x: -8, y: b.y });
          else {
            const bottom = Math.max.apply(null, steps.filter((s, j) => Math.abs(P[j].y - a.y) < 6).map((s) => s.offsetTop + s.offsetHeight));
            const yMid = (bottom + steps[i + 1].offsetTop) / 2;
            pts.push({ x: W + 10, y: a.y }, { x: W + 10, y: yMid }, { x: -10, y: yMid }, { x: -10, y: b.y });
          }
        }
        pts.push(b); mark.push(pts.length - 1);
      }
      const path = makePath(pts);
      return { path, dist: mark.map((m) => path.cum[m]), P };
    }

    function drawSignals(dt) {
      if (!geo) return;
      const path = geo.path;
      ctx.clearRect(-padX, -PAD, cw, ch);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (sig.lit > 1 && fx.energy > 0.01 && path.trace(ctx, 0, sig.lit)) {      // conexões já confirmadas
        ctx.save();
        ctx.shadowColor = 'rgba(255,51,74,.85)'; ctx.shadowBlur = (small ? 6 : 12) * dpr;
        ctx.strokeStyle = 'rgba(229,37,56,' + (0.62 * fx.energy) + ')'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      const packet = (len, T, a, R) => {                                          // sinal: ponto luminoso com rastro curto
        const N = 22;
        for (let k = 0; k < N; k++) {
          const u0 = k / N, u1 = (k + 1) / N, kk = Math.pow(u1, 1.6);
          const s1 = len - T * (1 - u1), s0 = len - T * (1 - u0);
          if (s1 <= 0 || !path.trace(ctx, Math.max(0, s0), s1)) continue;
          ctx.strokeStyle = 'rgba(255,70,90,' + (0.5 * kk * a) + ')'; ctx.lineWidth = 6 * kk + 1; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,225,228,' + (0.95 * kk * a) + ')'; ctx.lineWidth = 2 * kk + 0.5; ctx.stroke();
        }
        const p = path.at(len), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
        g.addColorStop(0, 'rgba(255,240,240,' + a + ')'); g.addColorStop(0.3, 'rgba(255,90,105,' + (a * 0.7) + ')'); g.addColorStop(1, 'rgba(229,37,56,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.fill();
        return p;
      };
      let hp = null;
      if (sig.on > 0.01) hp = packet(sig.len, small ? 70 : 100, sig.on, small ? 12 : 16);
      if (run.on > 0.01) packet(run.len, 170, run.on, 22);                         // iluminação rápida pelas conexões (final)
      if (hp && !small) {
        for (let i = 0; i < 2; i++) {
          const ang = Math.random() * TAU, sp = 20 + Math.random() * 50;
          particles.spawn(hp.x, hp.y, -hp.dx * sp * 0.5 + Math.cos(ang) * sp * 0.5, -hp.dy * sp * 0.5 + Math.sin(ang) * sp * 0.5, 0.35 + Math.random() * 0.4, 0.8 + Math.random() * 1.2);
        }
      }
      particles.step(dt); particles.draw(ctx);
      drawBlooms(ctx, blooms, dt);
    }
    let lastT = 0;
    const tickDraw = (time) => { const dt = Math.min(0.05, Math.max(0.001, time - lastT)); lastT = time; drawSignals(dt); };

    /* ----- abertura de um módulo: inicialização → separação das placas → revelação → encaixe ----- */
    function openModule(i) {
      const m = L[i], s = steps[i], n = nums[i], k = kids[i];
      const o = gsap.timeline();
      // 1) inicialização: a linha vermelha acende no centro e o indicador de etapa liga
      o.to(m.seam, { scaleX: 1, opacity: 1, duration: 0.15, ease: 'power2.out' }, 0)
        .to(m.leds.slice(0, i + 1), { opacity: 1, duration: 0.12, stagger: 0.025, ease: 'none' }, 0.02)
        // 2) separação: placa superior sobe e a inferior desce, com leve profundidade 3D
        .to(m.top, { yPercent: -104, rotationX: -14, duration: 0.52, ease: 'power3.inOut' }, 0.14)
        .to(m.bottom, { yPercent: 104, rotationX: 14, duration: 0.52, ease: 'power3.inOut' }, 0.14)
        .to(m.seam, { scaleY: 5, duration: 0.2, ease: 'power2.out' }, 0.16)
        .to(m.seam, { opacity: 0, duration: 0.22, ease: 'power1.in' }, 0.4)
        // luz vermelha percorre brevemente o interior do módulo
        .to(m.inner, { opacity: 1, duration: 0.1, ease: 'none' }, 0.22)
        .to(m.inner, { xPercent: 100, duration: 0.5, ease: 'power1.inOut' }, 0.22)
        .to(m.inner, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0.55)
        // 3) revelação: número/ícone, título e descrição surgem enquanto as placas se afastam
        .to(n, { opacity: 1, scale: 1, duration: 0.34, ease: 'power3.out' }, 0.26)
        .to(k, { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out', stagger: 0.07 }, 0.33)
        // 4) encaixe e travamento: linha percorre a borda, número pulsa, módulo "assenta"
        .fromTo(s, { y: -3 }, { y: 0, duration: 0.22, ease: 'power2.out', immediateRender: false }, 0.62)
        .to(s, { '--ps-ring': 1, duration: 0.08, ease: 'none' }, 0.6)
        .to(s, { '--ps-angle': '360deg', duration: 0.42, ease: 'power2.inOut' }, 0.6)
        .to(s, { '--ps-ring': 0, duration: 0.2, ease: 'power1.in' }, 0.86)
        .to(s, { '--ps-glow': 1, duration: 0.14, ease: 'power2.out' }, 0.62)
        .to(s, { '--ps-glow': 0, duration: 0.5, ease: 'sine.inOut' }, 0.78)
        .fromTo(n, { scale: 1 }, { scale: 1.26, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, 0.66)
        .fromTo(m.ring, { scale: 0.8, opacity: 0.9 }, { scale: 2.7, opacity: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, 0.66);
      return o;
    }

    function animateProcessTimeline() {
      state = 'running';
      sizeCanvas(); geo = buildGeometry();
      const g = geo;
      lastT = gsap.ticker.time;
      gsap.ticker.add(tickDraw);

      const STAG = 0.5, MOD = 0.87;            // o módulo seguinte começa um instante antes do anterior terminar de encaixar
      const tl = gsap.timeline({ onComplete: finish });
      steps.forEach((s, i) => {
        const st = 0.1 + i * STAG;
        tl.add(openModule(i), st);
        if (i < last) {                          // sinal vermelho confirma a etapa e viaja ao próximo módulo
          tl.fromTo(sig, { len: g.dist[i] }, { len: g.dist[i + 1], duration: 0.46, ease: 'power2.inOut', immediateRender: false,
            onUpdate: () => { sig.lit = Math.max(sig.lit, sig.len); } }, st + 0.52);
          tl.to(sig, { on: 1, duration: 0.08, ease: 'none' }, st + 0.52);
          tl.call(() => { const p = g.path.at(g.dist[i + 1]); blooms.push({ x: p.x, y: p.y, t: 0, dur: 0.4, r0: 4, r1: 26 }); }, null, st + 0.98);
        }
      });
      // finalização: o sexto módulo opera; luz rápida percorre as conexões; sistema "operacional"
      const E = 0.1 + last * STAG + MOD;
      tl.to(sig, { on: 0, duration: 0.2 }, E - 0.15)
        .call(() => {
          const p = g.path.at(g.path.total);
          blooms.push({ x: p.x, y: p.y, t: 0, dur: 0.7, r0: 8, r1: 64 });
          blooms.push({ x: p.x, y: p.y, t: 0, dur: 0.8, r0: 6, r1: 56, ring: true });
          for (let q = 0; q < (small ? 6 : 18); q++) {
            const ang = Math.random() * TAU, sp = 50 + Math.random() * 120;
            particles.spawn(p.x, p.y, Math.cos(ang) * sp, Math.sin(ang) * sp, 0.5 + Math.random() * 0.6, 1 + Math.random() * 1.6);
          }
        }, null, E - 0.05)
        .fromTo(nums[last], { scale: 1 }, { scale: 1.34, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, E - 0.05)
        .fromTo(L[last].ring, { scale: 0.8, opacity: 0.95 }, { scale: 4, opacity: 0, duration: 0.8, ease: 'expo.out', immediateRender: false }, E - 0.05)
        .to(steps[last], { '--ps-glow': 1.5, duration: 0.2, ease: 'power2.out' }, E - 0.05)
        .to(steps[last], { '--ps-glow': 0, duration: 0.7, ease: 'sine.inOut' }, E + 0.2)
        .to(run, { on: 1, duration: 0.15 }, E)
        .to(run, { len: g.path.total, duration: 0.75, ease: 'power2.inOut' }, E)
        .to(run, { on: 0, duration: 0.25 }, E + 0.55)
        .to(fx, { energy: 0, duration: 0.5, ease: 'sine.inOut' }, E + 0.6);
      const safety = window.setTimeout(finish, 14000);                // rede de segurança (nunca deixa módulos fechados)

      finishCurrent = finish;
      function finish() {
        if (state === 'done') return;
        state = 'done'; finishCurrent = null;
        window.clearTimeout(safety);
        tl.kill(); gsap.killTweensOf([sig, run, fx]);
        gsap.killTweensOf(steps.concat(nums, kids.flat()));
        gsap.ticker.remove(tickDraw);
        L.forEach((m) => { gsap.killTweensOf([m.top, m.bottom, m.seam, m.inner, m.ring]); m.wrap.remove(); m.ring.remove(); });
        steps.forEach((s) => unstyle(s, ['--ps-glow', '--ps-ring', '--ps-angle', 'transform', 'translate', 'rotate', 'scale']));
        nums.forEach((n) => unstyle(n, ['opacity', 'transform', 'translate', 'rotate', 'scale']));
        kids.flat().forEach((k) => unstyle(k, ['opacity', 'transform', 'translate', 'rotate', 'scale']));
        particles.clear(); blooms.length = 0;
        cv.remove();
        road.classList.remove('process-fx');                            // volta ao CSS original, sem sobras
        road.classList.add('is-opened');
      }
    }

    // sair da seção: encerra com segurança (estado final válido, fora da tela) e prepara os módulos para nova execução
    function rearm() {
      if (state === 'running' && finishCurrent) finishCurrent();
      if (state === 'done') prepare();
    }
    prepare();
    presence(road, 0.2, () => { if (state === 'armed') animateProcessTimeline(); }, rearm);
  }

  /* ==========================================================================
     ANIMAÇÃO 2 — ENERGIZAÇÃO SEQUENCIAL DOS PACOTES (seção "Escolha seu nível de proteção")
     PROTOCOLO DE ENERGIZAÇÃO: traço percorrendo o perímetro de Essencial → Profissional → Enterprise → destaque final do Profissional
     ========================================================================== */
  function initializePricingWave() {
    const wrap = document.querySelector('#pacotes .plans');
    if (!wrap) return;
    const plans = Array.from(wrap.querySelectorAll('.plan'));
    if (plans.length !== 3) return;
    const pro = wrap.querySelector('.plan--featured') || plans[1];
    const VARS = ['--pw-ring', '--pw-fill', '--pw-glow', '--pw-peak', '--pw-bg', '--pw-lift', '--pw-zoom', '--pw-price', '--pw-ico'];
    const small = matchMedia('(max-width: 720px)').matches;
    const NSVG = 'http://www.w3.org/2000/svg';
    let running = false, wave = null, enterCall = null;
    let traces = [];

    wrap.classList.add('pw-ready');

    // traço vermelho que percorre o perímetro de um card (SVG: retângulo com cantos do card, stroke-dasharray/dashoffset)
    function makeTrace(card) {
      const w = card.offsetWidth, h = card.offsetHeight, r = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 14;
      const svg = document.createElementNS(NSVG, 'svg');
      svg.setAttribute('class', 'pw-trace'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.setAttribute('preserveAspectRatio', 'none');
      const mk = (cls, dash) => {
        const el = document.createElementNS(NSVG, 'rect');
        el.setAttribute('class', 'pw-t ' + cls); el.setAttribute('x', 0.75); el.setAttribute('y', 0.75);
        el.setAttribute('width', w - 1.5); el.setAttribute('height', h - 1.5); el.setAttribute('rx', Math.max(0, r - 0.75)); el.setAttribute('pathLength', 1);
        if (dash) { el.style.strokeDasharray = dash + ' 1'; el.style.strokeDashoffset = dash; }
        svg.appendChild(el); return el;
      };
      const t = { svg, base: mk('pw-t--base'), tail: mk('pw-t--tail', 0.42), head: mk('pw-t--head', 0.12) };
      card.appendChild(svg); return t;
    }

    // devolve cada card exatamente ao estilo original (nada fica gravado); o destaque final do Profissional vem da classe pw-done
    function resetPricingWave() {
      if (wave) { wave.kill(); wave = null; }
      running = false;
      gsap.killTweensOf(plans);
      traces.forEach((t) => { gsap.killTweensOf([t.base, t.tail, t.head]); t.svg.remove(); });
      traces = [];
      plans.forEach((p) => { p.classList.remove('pw-active'); VARS.forEach((v) => p.style.removeProperty(v)); });
      wrap.classList.remove('pw-ready');
    }
    function finishPricingWave() { resetPricingWave(); wrap.classList.add('pw-done'); }

    function animatePricingWave() {
      if (running) return;
      running = true;
      wrap.classList.remove('pw-done'); wrap.classList.add('pw-ready');
      traces = plans.map(makeTrace);
      plans.forEach((p) => { p.classList.add('pw-active'); gsap.set(p, { '--pw-ring': 0, '--pw-fill': 0, '--pw-glow': 0, '--pw-peak': 0, '--pw-bg': 0, '--pw-lift': '0px', '--pw-zoom': 0, '--pw-price': 0, '--pw-ico': 0 }); });
      wave = gsap.timeline({ onComplete: finishPricingWave });

      const LAP = small ? 0.6 : 0.75, STEP = small ? 0.5 : 0.55, T0 = 0.3;
      const REST = { '--pw-bg': 0.12, '--pw-glow': 0.08 };
      // Fase 1 — repouso: iluminação decorativa reduzida
      traces.forEach((t, i) => { wave.to(t.base, { opacity: 0.2, duration: 0.3, ease: 'sine.out' }, 0).to(plans[i], REST, 0); });

      // energização de um card: traço percorrendo o perímetro + luz interna + resposta 3D sem deslocar o layout
      const energize = (i, at, lap, k) => {
        const t = traces[i], card = plans[i];
        wave.set([t.head, t.tail], { opacity: 1, strokeWidth: k > 1 ? 3.6 : 2.6 }, at)
          .fromTo(t.head, { strokeDashoffset: 0.12 }, { strokeDashoffset: -1.3, duration: lap, ease: 'sine.inOut', immediateRender: false }, at)
          .fromTo(t.tail, { strokeDashoffset: 0.42 }, { strokeDashoffset: -1.0, duration: lap, ease: 'sine.inOut', immediateRender: false }, at)
          .to([t.head, t.tail], { opacity: 0, duration: 0.15 }, at + lap - 0.05)
          .to(t.base, { opacity: 0.55 * Math.min(k, 1.3), duration: 0.25, ease: 'power1.out' }, at)
          .to(card, { '--pw-bg': 0.75 * k, '--pw-glow': 0.5 * k, '--pw-lift': -5 * k + 'px', '--pw-zoom': k, '--pw-price': 0.5 * k, '--pw-ico': 0.5 * k, duration: 0.35, ease: 'power2.out' }, at)
          .to(card, { '--pw-bg': 0.12, '--pw-glow': 0.08, '--pw-lift': '0px', '--pw-zoom': 0, '--pw-price': 0, '--pw-ico': 0, duration: 0.6, ease: 'sine.inOut' }, at + lap * 0.85)
          .to(t.base, { opacity: 0.2, duration: 0.6, ease: 'sine.inOut' }, at + lap * 0.85);
      };

      // Fase 2 — energização individual: Essencial → Profissional → Enterprise
      [0, 1, 2].forEach((i, n) => energize(i, T0 + n * STEP, LAP, 1));

      // Fase 3 — os laterais reduzem a iluminação; segunda energização, mais marcante, no Profissional
      const T3 = T0 + 2 * STEP + LAP * 0.9;
      [0, 2].forEach((i) => wave.to(plans[i], { '--pw-bg': 0, '--pw-glow': 0, duration: 0.35, ease: 'sine.inOut' }, T3)
        .to(traces[i].base, { opacity: 0, duration: 0.35 }, T3));
      const proI = plans.indexOf(pro), LAP2 = small ? 0.75 : 0.85;
      energize(proI, T3 + 0.05, LAP2, 1.5);
      wave.to(pro, { '--pw-peak': 1, duration: 0.3, ease: 'power2.out' }, T3 + 0.05 + LAP2 * 0.6)
        .to(traces[proI].base, { opacity: 0.8, duration: 0.2 }, T3 + 0.05 + LAP2 * 0.8)
        .to({}, { duration: 0.1 }, T3 + 0.05 + LAP2);
    }

    // ao entrar: espera a entrada (.reveal) dos cards e roda a sequência; ao sair: encerra com segurança e rearma (cards no estilo original)
    presence(wrap, 0.25,
      () => { enterCall = gsap.delayedCall(0.7, animatePricingWave); },
      () => { if (enterCall) { enterCall.kill(); enterCall = null; } if (running) resetPricingWave(); wrap.classList.remove('pw-done'); });
  }
})();
