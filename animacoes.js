// Movimento e interação dos componentes da Etapa 5B. Sem biblioteca.
// Regras (docs/PLANO.md): sem JavaScript, todo o conteúdo continua visível; com movimento reduzido,
// tudo aparece pronto e o vídeo de fundo não toca; o carrossel nunca avança sozinho.
(() => {
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const comMovimento = () => !reduzido.matches;
  if (comMovimento()) document.documentElement.classList.add('movimento');

  // Janela por cima da página: fecha com Esc (nativo), com o botão e com clique fora.
  function prepararDialogo(dialogo, aoFechar) {
    dialogo.querySelector('[data-fechar]')?.addEventListener('click', () => dialogo.close());
    dialogo.addEventListener('click', (e) => {
      if (e.target === dialogo) dialogo.close();
    });
    if (aoFechar) dialogo.addEventListener('close', aoFechar);
  }

  // ---------- Primeira tela com vídeo ----------
  for (const secao of document.querySelectorAll('.hero-video')) {
    const trecho = secao.querySelector('[data-trecho]');
    const pausa = secao.querySelector('[data-pausa]');
    // botão só com ícone: o nome acessível e a dica do mouse acompanham o estado
    const rotular = (pausado) => {
      const texto = pausado ? 'Retomar o vídeo de fundo' : 'Pausar o vídeo de fundo';
      pausa.setAttribute('aria-label', texto);
      pausa.title = texto;
      pausa.classList.toggle('pausado', pausado);
    };
    const tocar = () =>
      trecho
        .play()
        .then(() => {
          trecho.classList.add('tocando');
          if (pausa) {
            pausa.hidden = false;
            rotular(false);
          }
        })
        .catch(() => {});
    // o vídeo só começa depois que a página carregou, para não disputar a rede com a capa, que é o LCP
    const comecar = () => trecho && comMovimento() && tocar();
    if (document.readyState === 'complete') comecar();
    else window.addEventListener('load', comecar, { once: true });
    pausa?.addEventListener('click', () => (trecho.paused ? tocar() : trecho.pause()));
    // o vídeo de fundo também pode parar por fora, quando o vídeo completo começa
    trecho?.addEventListener('pause', () => pausa && rotular(true));
    // quem passar a pedir movimento reduzido com a página aberta vê a capa parada
    reduzido.addEventListener('change', () => {
      if (reduzido.matches && trecho) {
        trecho.pause();
        trecho.classList.remove('tocando');
        if (pausa) pausa.hidden = true;
      }
    });
  }

  // ---------- Seção do vídeo completo ----------
  // O botão grande sobre a capa toca o vídeo; os controles nativos só aparecem depois do play.
  for (const sessao of document.querySelectorAll('[data-video-sessao]')) {
    const video = sessao.querySelector('video');
    const play = sessao.querySelector('[data-play]');
    const fundo = document.querySelector('[data-trecho]');
    video.controls = false;
    play.hidden = false;
    play.addEventListener('click', () => {
      play.hidden = true;
      video.play().catch(() => {});
      video.focus();
    });
    video.addEventListener('play', () => {
      play.hidden = true;
      video.controls = true;
      // dois vídeos ao mesmo tempo distraem: o de fundo para enquanto este toca
      fundo?.pause();
    });
  }

  // ---------- Passos: a linha dourada acompanha a rolagem ----------
  const trilhas = [...document.querySelectorAll('[data-trilha]')];
  if (trilhas.length && comMovimento()) {
    const visiveis = new Set();
    let agendado = false;
    const centro = (passo) => {
      const r = passo.querySelector('.trilha__marco').getBoundingClientRect();
      return r.top + r.height / 2;
    };
    const atualizar = () => {
      agendado = false;
      const alvo = window.innerHeight * 0.65;
      for (const trilha of visiveis) {
        const passos = [...trilha.querySelectorAll('[data-passo]')];
        const centros = passos.map(centro);
        passos.forEach((passo, i) => {
          passo.classList.toggle('alcancado', centros[i] <= alvo);
          if (i < passos.length - 1) {
            const fracao = (alvo - centros[i]) / (centros[i + 1] - centros[i]);
            passo.style.setProperty('--trecho', Math.min(1, Math.max(0, fracao)).toFixed(3));
          }
        });
      }
    };
    const agendar = () => {
      if (!agendado) {
        agendado = true;
        requestAnimationFrame(atualizar);
      }
    };
    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
      agendar();
    });
    for (const trilha of trilhas) {
      trilha.querySelectorAll('[data-passo]').forEach((p) => p.style.setProperty('--trecho', 0));
      observador.observe(trilha);
    }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
  }

  // ---------- Mapa ilustrado: estradas e alfinete quando o mapa aparece ----------
  const mapas = document.querySelectorAll('[data-mapa-ilustrado]');
  if (mapas.length && comMovimento()) {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add('visivel');
            observador.unobserve(e.target);
          }
        }
      },
      { threshold: 0.35 },
    );
    mapas.forEach((m) => observador.observe(m));
  }

  // ---------- Carrossel de avaliações ----------
  for (const carrossel of document.querySelectorAll('[data-carrossel]')) {
    const faixa = carrossel.querySelector('.carrossel__faixa');
    const controles = carrossel.querySelector('.carrossel__controles');
    const anterior = carrossel.querySelector('[data-anterior]');
    const proxima = carrossel.querySelector('[data-proxima]');
    const passo = () => faixa.querySelector('li').getBoundingClientRect().width + parseFloat(getComputedStyle(faixa.querySelector('ul')).columnGap || 0);
    const estado = () => {
      const fim = faixa.scrollWidth - faixa.clientWidth;
      controles.hidden = fim <= 4;
      anterior.setAttribute('aria-disabled', String(faixa.scrollLeft <= 4));
      proxima.setAttribute('aria-disabled', String(faixa.scrollLeft >= fim - 4));
    };
    const mover = (sentido) => faixa.scrollBy({ left: sentido * passo(), behavior: comMovimento() ? 'smooth' : 'auto' });
    anterior.addEventListener('click', () => anterior.getAttribute('aria-disabled') !== 'true' && mover(-1));
    proxima.addEventListener('click', () => proxima.getAttribute('aria-disabled') !== 'true' && mover(1));
    faixa.addEventListener('scroll', estado, { passive: true });
    window.addEventListener('resize', estado);
    estado();
  }

  // ---------- Galeria: ampliação ao clicar ----------
  for (const galeria of document.querySelectorAll('[data-galeria]')) {
    const dialogo = galeria.nextElementSibling;
    if (!dialogo?.matches('[data-lupa]') || !dialogo.showModal) continue;
    const links = [...galeria.querySelectorAll('[data-ampliar]')];
    const img = dialogo.querySelector('img');
    const legenda = dialogo.querySelector('figcaption');
    let atual = 0;
    let origem = null;
    const mostrar = (i) => {
      atual = (i + links.length) % links.length;
      const link = links[atual];
      const miniatura = link.querySelector('img');
      img.src = link.href;
      img.alt = miniatura.alt;
      legenda.textContent = link.closest('figure').querySelector('figcaption')?.textContent || '';
    };
    prepararDialogo(dialogo, () => origem?.focus());
    links.forEach((link, i) =>
      link.addEventListener('click', (e) => {
        e.preventDefault();
        origem = link;
        mostrar(i);
        dialogo.showModal();
      }),
    );
    dialogo.querySelector('[data-anterior]').addEventListener('click', () => mostrar(atual - 1));
    dialogo.querySelector('[data-proxima]').addEventListener('click', () => mostrar(atual + 1));
    dialogo.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') mostrar(atual - 1);
      if (e.key === 'ArrowRight') mostrar(atual + 1);
    });
  }
})();
