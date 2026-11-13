// Carrega o mapa do Google só depois do clique. Sem JavaScript, a caixa fica oculta e valem os links para o Google Maps do mapa ilustrado.
const botao = document.querySelector('[data-mapa]');
if (botao) {
  const area = botao.closest('[data-mapa-area]');
  area.hidden = false;
  botao.hidden = false;
  botao.addEventListener('click', () => {
    const mapa = document.createElement('iframe');
    mapa.src = botao.dataset.mapa;
    mapa.title = 'Mapa com a localização da clínica';
    area.classList.add('mapa--aberto');
    area.replaceChildren(mapa);
    mapa.focus();
  });
}
