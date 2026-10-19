# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sentinela: landing page fictícia (pt-BR) de consultoria de cibersegurança, estética "Hacker Elegante" (preto/grafite, vermelho, prata; temas claro/escuro via `data-theme`). HTML/CSS/JS puro, sem build/lint/testes; GSAP 3.12.5 core (sem ScrollTrigger) e three.js só na intro, via CDN. Rodar: `python -m http.server 5173` (Ctrl+F5 por causa do cache).
Estado do configurador = `aria-pressed` dos 8 botões `.cb-toggle`; todo o resto só lê ou clica neles; preços e formulário ficam só em `script.js`. Ao reordenar seções, ajuste navegação lateral, navbar, portais (`experience.js`) e gradientes `--fx-b*`.
Regras: respeitar `prefers-reduced-motion`, sem rolagem horizontal, uma animação principal por vez, sem fundos animados; não inventar prazos/números nem mudar preços e textos sem pedido; simulações rotuladas como exemplo.
O painel do navegador do app é inativo (rAF, `IntersectionObserver` e transições não avançam): teste com cópia temporária do `index.html` com shim e apague-a depois; não declare testes não executados.
Ícones interativos (botões, controles, alvos, nós, setas, ícones de seleção): siga estritamente o que já existe nos arquivos e foi criado (SVG, classes, estados, tamanhos e comportamento); reutilize esses padrões e não crie, troque nem redesenhe ícones sem pedido explícito.
