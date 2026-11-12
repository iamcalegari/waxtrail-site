"use strict";
/* A linha da página. O desenho da linha no carregamento é só CSS (styles.css);
   aqui ficam o percurso do ponto âmbar pelas paradas da abertura, com os estados
   reais da Fila e uma faixa de exemplo, e o w do rodapé, que se desenha quando
   entra na tela. O percurso só anda com a abertura na tela, a aba visível, sem
   movimento reduzido, sem o ponteiro numa parada e sem a pausa pedida no botão.
   Sem JS, o HTML já traz o quadro de repouso ("Baixando 67 %"). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* O w do fecho. */
  const fim = $("#fim");
  if (fim && "IntersectionObserver" in window) {
    new IntersectionObserver(
      (entradas, obs) => {
        if (entradas.some((e) => e.isIntersecting)) {
          fim.classList.add("vista");
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    ).observe(fim);
  } else if (fim) fim.classList.add("vista");

  /* O percurso. */
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
  const abre = $(".abre");
  const lista = $("#paradas");
  const trilha = $("#trilha-d");
  const ponto = $("#ponto-d");
  const pct = $("#pct");
  const pausa = $("#pausa");
  if (!abre || !lista || !trilha || !ponto || !pct || !pausa || !trilha.getTotalLength) return;

  const paradas = $$("li", lista);
  const total = trilha.getTotalLength();
  if (!total) return;
  /* O comprimento da linha até cada furo, da geometria do `d` de #trilha-d (mude
     os dois juntos): a espiral são três meias-voltas de raio 3, 7 e 11 (21π), a
     haste desce 20 com o primeiro furo a 15, a curva de raio 8 soma 4π e o trecho
     horizontal começa em x = 38,75. Medir com getPointAtLength custava 21 mil
     chamadas e travava a página por segundos no carregamento. */
  const HASTE = 21 * Math.PI;
  const TRECHO = HASTE + 20 + 4 * Math.PI - 38.75;
  const L = [HASTE + 15, ...[41.5, 48.5, 55.5, 62.5, 69.5].map((x) => TRECHO + x)];
  /* A saída: depois do trecho horizontal (até x = 73,25) e da curva, 1,4 abaixo. */
  const saida = TRECHO + 73.25 + 4 * Math.PI + 1.4;
  const BAIXANDO = 3;
  const ESPERA = [1.5, 1.9, 1.5, 3.2, 1.7, 2.6];
  const VIAGEM = [2.6, 1.0, 0.9, 0.9, 0.9, 0.9];
  const trechos = [];
  let relogio = 0;
  for (let i = 0; i < L.length; i++) {
    trechos.push({ tipo: "viagem", i, de: i ? L[i - 1] : 0, ate: L[i], t0: relogio, t1: (relogio += VIAGEM[i]) });
    trechos.push({ tipo: "parada", i, em: L[i], t0: relogio, t1: (relogio += ESPERA[i]) });
  }
  trechos.push({ tipo: "saida", i: L.length, de: L[L.length - 1], ate: saida, t0: relogio, t1: (relogio += 1.3) });
  trechos.push({ tipo: "pausa", i: L.length, t0: relogio, t1: (relogio += 0.7) });
  const CICLO = relogio;
  /* Vai e vem (ease-in-out cúbico): o ponto já está na tela e se move por ela. */
  const suave = (f) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2);

  let ativa = BAIXANDO;
  let textoPct = "67 %";
  let pintado = -1;
  const marcar = (i) => {
    if (i === ativa) return;
    ativa = i;
    paradas.forEach((li, k) => li.classList.toggle("ativa", k === i));
  };
  const pintar = (t) => {
    const tr = trechos.find((x) => t >= x.t0 && t < x.t1) || trechos[0];
    const f = (t - tr.t0) / (tr.t1 - tr.t0);
    let l = 0;
    let opacidade = 1;
    if (tr.tipo === "viagem") {
      l = tr.de + (tr.ate - tr.de) * suave(f);
      marcar(f > 0.85 ? tr.i : tr.i - 1);
    } else if (tr.tipo === "parada") {
      l = tr.em;
      marcar(tr.i);
    } else if (tr.tipo === "saida") {
      l = tr.de + (tr.ate - tr.de) * suave(f);
      opacidade = 1 - f;
      marcar(f < 0.3 ? L.length - 1 : -1);
    } else {
      opacidade = 0;
      marcar(-1);
    }
    /* Parado numa parada, o ponto não se mede nem se reescreve a cada quadro. */
    if (l !== pintado) {
      pintado = l;
      const p = trilha.getPointAtLength(l);
      ponto.setAttribute("transform", `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})`);
    }
    ponto.style.opacity = opacidade.toFixed(2);
    const novo =
      tr.tipo === "parada" && tr.i === BAIXANDO
        ? `${Math.min(100, Math.floor(f * 104))} %`
        : tr.i > BAIXANDO
          ? "100 %"
          : "0 %";
    if (novo !== textoPct) {
      textoPct = novo;
      pct.textContent = novo;
    }
  };

  /* Começa de onde o quadro de repouso está: "Baixando 67 %". */
  const inicio = trechos.find((x) => x.tipo === "parada" && x.i === BAIXANDO);
  const T0 = inicio.t0 + (inicio.t1 - inicio.t0) * (67 / 104);
  let t = T0;
  let ultimo = 0;
  let quadro = 0;
  let naTela = true;
  let emCima = false;
  let pedida = false;
  let desenhada = false;
  const podeAndar = () => desenhada && !reduzido.matches && naTela && !emCima && !pedida && !document.hidden;
  const passo = (agora) => {
    quadro = 0;
    if (!podeAndar()) return;
    const dt = ultimo ? Math.min(0.1, (agora - ultimo) / 1000) : 0;
    ultimo = agora;
    t = (t + dt) % CICLO;
    pintar(t);
    quadro = requestAnimationFrame(passo);
  };
  const conferir = () => {
    if (podeAndar() && !quadro) {
      ultimo = 0;
      quadro = requestAnimationFrame(passo);
    }
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entradas) => {
        naTela = entradas[0].isIntersecting;
        conferir();
      },
      { threshold: 0.2 },
    ).observe(abre);
  }
  for (const li of paradas) {
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") emCima = true;
    });
    li.addEventListener("pointerleave", () => {
      emCima = false;
      conferir();
    });
  }
  document.addEventListener("visibilitychange", conferir);
  const aoMudarMovimento = () => {
    pausa.hidden = reduzido.matches;
    if (reduzido.matches) {
      /* Volta ao quadro de repouso. */
      t = T0;
      pintar(t);
    }
    conferir();
  };
  reduzido.addEventListener?.("change", aoMudarMovimento);
  pausa.hidden = reduzido.matches;
  pausa.addEventListener("click", () => {
    pedida = !pedida;
    pausa.textContent = pedida ? "Continuar o percurso" : "Pausar o percurso";
    conferir();
  });
  /* Espera a linha terminar de se desenhar (2 s no CSS). */
  setTimeout(() => {
    desenhada = true;
    conferir();
  }, 2300);
})();
