"use strict";
/* Demonstrações da página: a Fila animada da abertura e o A/B da seção
   "Ouça antes de levar para o set". Dados fictícios. O HTML já traz a Fila no
   quadro de repouso (T0), igual ao que este script pinta no primeiro passo; a
   animação só roda com a Fila na tela, a aba visível, sem movimento reduzido,
   sem o ponteiro em cima e sem a pausa pedida no botão. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const virgula = (n, d = 1) => n.toFixed(d).replace(".", ",");
  const mmss = (s) => {
    const t = Math.max(0, Math.round(s));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  };
  const movimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const temaClaro = window.matchMedia("(prefers-color-scheme: light)");

  /* ---------- Fila ----------
     Cada faixa tem um roteiro em segundos do ciclo: aparece (ap), termina a busca
     (pr), sai da fila do peer (fi), termina o download (ba) e a conferência (co). */
  const CICLO = 50;
  const T0 = 16;
  const FAIXAS = [
    { t: "Night Shift", v: "(Extended Mix)", a: "Lúcia Varela", c: ["#6f8a73", "#27302a"], ap: 3.4, pr: 5.5, fi: 5.5, ba: 13, co: 14.5, pos: 0, fim: "pronta", ver: "Extended Mix", q: "FLAC 16/44", fonte: "6:48", arq: "6:48", bpm: 124, tom: "8A", vel: 2.3 },
    { t: "Concrete Garden", v: "", a: "Tomás Reis, Ilha Baixa", c: ["#c9b48a", "#3a4a46"], ap: 3.7, pr: 7, fi: 9.5, ba: 21, co: 22.5, pos: 2, fim: "conferida", ver: "Extended Mix", q: "WAV", fonte: "3:58", arq: "7:12", delta: "+3:14", bpm: 126, tom: "11B", vel: 2.1 },
    { t: "Pulso Fraco", v: "(Original Mix)", a: "Marrom Quente", c: ["#8a5a3c", "#2b2522"], ap: 4.0, pr: 6, fi: 6, ba: 16, co: 18, pos: 0, fim: "pronta", ver: "Original Mix", q: "AIFF", fonte: "6:05", arq: "6:05", bpm: 122, tom: "5A", vel: 1.6 },
    { t: "Saudade Dub", v: "", a: "Vera Lund", c: ["#7a8fa6", "#232a33"], ap: 4.3, pr: 12, fi: 12, ba: 19, co: 20.5, pos: 0, fim: "conferir", ver: "Radio Edit", radio: true, q: "MP3 320", fonte: "3:24", arq: "3:21", bpm: 123, tom: "2A", vel: 1.1 },
    { t: "Rua 7", v: "(Extended Mix)", a: "Nuno Sal", c: ["#d6c27a", "#3b3524"], ap: 4.6, pr: 7.5, fi: 14, ba: 27, co: 28.5, pos: 3, fim: "pronta", ver: "Extended Mix", q: "FLAC 24/48", fonte: "7:01", arq: "7:01", bpm: 125, tom: "9A", vel: 1.9 },
    { t: "Keep It Low", v: "", a: "DAVI, Melissa Rocha", c: ["#d98aa0", "#3a2a30"], ap: 4.9, pr: 8, fi: 8, ba: 17, co: 18.5, pos: 0, fim: "pronta", ver: "Extended Mix", q: "FLAC 16/44", fonte: "6:30", arq: "6:30", bpm: 124, tom: "7B", vel: 2.6 },
    { t: "Temporal", v: "(Club Mix)", a: "Oriente Público", c: ["#5f7fb0", "#1f2633"], ap: 5.2, pr: 9, fi: 18, ba: 33, co: 34.5, pos: 4, fim: "pronta", ver: "Club Mix", q: "FLAC 24/48", fonte: "7:40", arq: "7:40", bpm: 127, tom: "10A", vel: 1.4 },
    { t: "Fogo Baixo", v: "", a: "Amaral, Teixeira", c: ["#b0624a", "#2e211d"], ap: 5.5, pr: 17, fi: 17, ba: 17, co: 17, pos: 0, fim: "nao", fonte: "5:52", bpm: 121, tom: "4A" },
    { t: "Linha Amarela", v: "(Extended Mix)", a: "Cais", c: ["#e0c35a", "#2c2a22"], ap: 5.8, pr: 9.5, fi: 12, ba: 26, co: 27.5, pos: 2, fim: "pronta", ver: "Extended Mix", q: "FLAC 16/44", fonte: "6:58", arq: "6:58", bpm: 125, tom: "1A", vel: 1.2 },
    { t: "Sol de Inverno", v: "", a: "Helena Sá", c: ["#9aa7b0", "#262a2e"], ap: 6.1, pr: 11, fi: 21, ba: 38, co: 39.5, pos: 5, fim: "pronta", ver: "Extended Mix", q: "WAV", fonte: "3:50", arq: "7:15", delta: "+3:25", bpm: 123, tom: "6B", vel: 1.8 },
  ];
  /* As outras 22 faixas da playlist ficam abaixo da dobra; contam nos números do cabeçalho. */
  const OCULTAS = Array.from({ length: 22 }, (_, k) => {
    const pronta = 8 + (31 * (k + 1)) / 22.5;
    return { pronta, baixa: pronta - 7, fila: pronta - 10, prob: k === 15, mp3: k === 4 || k === 13, vel: 0.9 + ((k * 37) % 10) / 14 };
  });
  const OK = '<svg class="ok" aria-hidden="true"><use href="#i-ok"/></svg>';

  function estado(fx, t) {
    if (t < fx.ap || t >= CICLO - 2.5) return { k: "oculta" };
    if (t < fx.pr) {
      const dt = t - fx.ap;
      return { k: "procurando", sub: dt > 2.4 ? `${1 + (Math.floor(dt * 0.8) % 4)} peers respondendo` : "pedindo Extended" };
    }
    if (fx.fim === "nao") return { k: "nao" };
    if (t < fx.fi) {
      const f = (t - fx.pr) / (fx.fi - fx.pr);
      return { k: "fila", pos: Math.max(1, Math.ceil(fx.pos * (1 - f))) };
    }
    if (t < fx.ba) {
      const f = (t - fx.fi) / (fx.ba - fx.fi);
      return { k: "baixando", f, vel: fx.vel * (0.85 + 0.15 * Math.sin(t * 1.7 + fx.ap * 3)) };
    }
    if (t < fx.co) return { k: "conferindo" };
    return { k: fx.fim };
  }

  const fila = $("#fila");
  const tabela = $("#tabela");
  if (fila && tabela) {
    const existentes = $$(".linha:not(.cabeca)", tabela);
    const linhas = FAIXAS.map((fx, i) => {
      let el = existentes[i];
      if (!el) {
        el = document.createElement("div");
        el.className = "linha";
        el.innerHTML =
          `<span class="c-num">${i + 1}</span>` +
          `<span class="c-faixa"><span class="capa" style="--c1:${fx.c[0]};--c2:${fx.c[1]}"></span><span class="faixa-txt"><b>${fx.t}${fx.v ? ` <i>${fx.v}</i>` : ""}</b><span>${fx.a}</span></span></span>` +
          '<span class="c-info"><span class="c-versao"></span><span class="c-qual"></span><span class="c-dur"></span></span>' +
          '<span class="c-estado"><span class="estado-linha"></span><span class="prog desligada"><span></span></span></span>' +
          '<span class="c-bpm"></span><span class="c-tom"></span>';
        tabela.appendChild(el);
      }
      return {
        el,
        versao: $(".c-versao", el),
        qual: $(".c-qual", el),
        dur: $(".c-dur", el),
        est: $(".estado-linha", el),
        prog: $(".prog", el),
        progBarra: $(".prog span", el),
        bpm: $(".c-bpm", el),
        tom: $(".c-tom", el),
        cache: {},
      };
    });
    const por = (l, chave, html) => {
      if (l.cache[chave] !== html) {
        l.cache[chave] = html;
        l[chave].innerHTML = html;
      }
    };

    const pintarLinha = (l, fx, e) => {
      l.el.classList.toggle("oculta", e.k === "oculta");
      const escolhida = !["oculta", "procurando", "nao"].includes(e.k);
      por(
        l,
        "versao",
        escolhida
          ? `<span class="tag${fx.radio ? " t-radio" : ""}">${fx.ver}</span>${fx.radio ? "<small>sem Extended na rede</small>" : ""}`
          : `<span class="vazio">—</span><small>${e.k === "nao" ? "sem Extended na rede" : "pedida: Extended"}</small>`,
      );
      por(l, "qual", escolhida ? fx.q : '<span class="vazio">—</span>');
      por(
        l,
        "dur",
        escolhida
          ? `${fx.fonte} × ${fx.arq}${fx.delta ? `<span class="delta">${fx.delta}</span>` : ""}`
          : `${fx.fonte} × <span class="vazio">–:––</span>`,
      );
      let html = "";
      switch (e.k) {
        case "procurando":
          html = `<span class="e e-proc"><i class="pt"></i>Procurando</span><small>${e.sub}</small>`;
          break;
        case "fila":
          html = `<span class="e e-fila"><i class="pt"></i>Na fila</span><small>posição ${e.pos} no peer</small>`;
          break;
        case "baixando":
          html = `<span class="e e-baix">Baixando <b>${Math.floor(e.f * 100)} %</b></span><small>${virgula(e.vel)} MB/s</small>`;
          break;
        case "conferindo":
          html = '<span class="e e-conf"><i class="pt"></i>Conferindo duração e tags</span><small>decodificando</small>';
          break;
        case "pronta":
          html = `<span class="e e-pronta">${OK}Pronta</span>`;
          break;
        case "conferida":
          html = `<span class="e e-pronta">${OK}Pronta</span><small>conferida de ouvido</small>`;
          break;
        case "conferir":
          html = '<span class="e e-aconf">A conferir</span><span class="mini">Ouvir A/B</span>';
          break;
        case "nao":
          html = '<span class="e e-nao">Não encontrada em Extended</span><small>Tentar versão comum ›</small>';
          break;
      }
      por(l, "est", html);
      const baixando = e.k === "baixando";
      l.prog.classList.toggle("desligada", !baixando);
      l.progBarra.style.transform = `scaleX(${baixando ? e.f.toFixed(3) : 0})`;
      const analisada = ["pronta", "conferida", "conferir"].includes(e.k);
      por(l, "bpm", analisada || e.k === "nao" ? String(fx.bpm) : '<span class="vazio">—</span>');
      por(
        l,
        "tom",
        analisada ? `<span class="tom" style="--tom-cor:var(--camelot-${parseInt(fx.tom, 10)})">${fx.tom}</span>` : '<span class="vazio">—</span>',
      );
    };

    const campo = $("#link-campo");
    const estadoLink = $("#link-estado");
    const LINK = "open.spotify.com/playlist/7Hx2…";
    const num = { prontas: $("#n-prontas"), vel: $("#n-vel"), min: $("#n-min"), sp: $("#n-sp"), mp3: $("#n-mp3") };
    const chip = { pronta: $("#c-pronta"), baix: $("#c-baix"), fila: $("#c-fila"), proc: $("#c-proc"), conf: $("#c-conf"), prob: $("#c-prob") };
    const barra = { baix: $("#b-baix"), pronta: $("#b-pronta"), prob: $("#b-prob") };
    const pe = $("#fila-relogio");
    const texto = (el, v) => {
      if (el.textContent !== v) el.textContent = v;
    };
    let faseLink = "lida";

    const pintar = (t) => {
      // campo do link: vazio → Ctrl+V → lendo → lida
      let fase = t < 0.6 ? "vazio" : t < 1.1 ? "colando" : t < 3.2 ? "lendo" : "lida";
      if (t >= CICLO - 1) fase = "vazio";
      if (fase !== faseLink) {
        faseLink = fase;
        if (fase === "vazio") campo.innerHTML = '<span class="vazio">Cole o link de uma playlist do Spotify ou do SoundCloud</span>';
        else if (fase === "colando") campo.innerHTML = `<span class="colado">${LINK}</span>`;
        else if (fase === "lendo") $(".colado", campo)?.classList.add("assentado");
        else if (!$(".colado", campo)) campo.innerHTML = `<span class="colado assentado">${LINK}</span>`;
        estadoLink.textContent = fase === "lendo" ? "Lendo a playlist na página da fonte…" : fase === "lida" ? "32 faixas lidas · 3 h 21 min" : "";
        $("#kbd-ctrl").classList.toggle("ativo", fase === "colando");
        $("#kbd-v").classList.toggle("ativo", fase === "colando");
        fila.classList.toggle("lendo", fase === "vazio" || fase === "colando");
      }

      const n = { pronta: 0, baix: 0, fila: 0, proc: 0, conf: 0, prob: 0, sp: 0, mp3: 0 };
      let vel = 0;
      FAIXAS.forEach((fx, i) => {
        const e = estado(fx, t);
        pintarLinha(linhas[i], fx, e);
        const k = e.k === "oculta" ? "procurando" : e.k;
        if (k === "pronta" || k === "conferida") {
          n.pronta++;
          n.sp++;
        } else if (k === "conferir") {
          n.conf++;
          n.mp3++;
        } else if (k === "nao") n.prob++;
        else if (k === "baixando") {
          n.baix++;
          vel += e.vel;
        } else if (k === "fila") n.fila++;
        else n.proc++;
      });
      for (const o of OCULTAS) {
        if (t >= o.pronta) {
          if (o.prob) n.prob++;
          else {
            n.pronta++;
            if (o.mp3) n.mp3++;
            else n.sp++;
          }
        } else if (t >= o.baixa) {
          n.baix++;
          vel += o.vel * (0.85 + 0.15 * Math.sin(t * 2.1 + o.pronta));
        } else if (t >= o.fila) n.fila++;
        else n.proc++;
      }
      const lida = t >= 3.2 && t < CICLO - 2.5;
      if (!lida) {
        n.pronta = n.baix = n.fila = n.conf = n.prob = n.sp = n.mp3 = 0;
        n.proc = 32;
        vel = 0;
      }
      const fim = lida && n.baix === 0 && n.fila === 0 && n.proc === 0;
      texto(num.prontas, String(n.pronta));
      texto(num.vel, virgula(vel));
      texto(num.min, !lida ? "—" : fim ? "pronto" : `≈ ${Math.max(1, Math.ceil(((39.5 - t) / 39.5) * 12))} min`);
      texto(num.sp, String(n.sp));
      const mp3 = n.mp3 ? `sem perdas<br>${n.mp3} em MP3 320` : "sem perdas<br>&nbsp;";
      if (num.mp3.dataset.html !== mp3) {
        num.mp3.dataset.html = mp3;
        num.mp3.innerHTML = mp3;
      }
      texto(chip.pronta, String(n.pronta));
      texto(chip.baix, String(n.baix));
      texto(chip.fila, String(n.fila));
      texto(chip.proc, String(n.proc));
      texto(chip.conf, String(n.conf));
      texto(chip.prob, String(n.prob));
      barra.pronta.style.transform = `scaleX(${(n.pronta / 32).toFixed(3)})`;
      barra.baix.style.transform = `scaleX(${((n.pronta + n.baix) / 32).toFixed(3)})`;
      barra.prob.style.transform = `scaleX(${(n.prob / 32).toFixed(3)})`;
      texto(pe, !lida ? "Aguardando o link" : fim ? "Lote concluído · 2 faixas pedem atenção" : "Lote rodando");
    };

    /* Relógio da demonstração: só anda quando tudo permite; fora disso, nenhum quadro é pedido. */
    let t = T0;
    let visivel = true;
    let mouse = false;
    let pausaPedida = false;
    let quadro = 0;
    let ultimo = 0;
    let acumulado = 0;
    const pode = () => !movimento.matches && visivel && !mouse && !pausaPedida && !document.hidden;
    const passo = (agora) => {
      quadro = 0;
      if (!pode()) return;
      const dt = ultimo ? Math.min(0.1, (agora - ultimo) / 1000) : 0;
      ultimo = agora;
      t = (t + dt) % CICLO;
      acumulado += dt;
      if (acumulado >= 0.1) {
        acumulado = 0;
        pintar(t);
      }
      quadro = requestAnimationFrame(passo);
    };
    const agendar = () => {
      if (pode()) {
        if (!quadro) {
          ultimo = 0;
          quadro = requestAnimationFrame(passo);
        }
      } else if (quadro) {
        cancelAnimationFrame(quadro);
        quadro = 0;
      }
    };

    pintar(t);
    const botaoPausa = $("[data-fila-pausa]");
    const ajustarBotao = () => {
      botaoPausa.hidden = movimento.matches;
      botaoPausa.textContent = pausaPedida ? "Continuar a demonstração" : "Pausar a demonstração";
    };
    ajustarBotao();
    botaoPausa.addEventListener("click", () => {
      pausaPedida = !pausaPedida;
      ajustarBotao();
      agendar();
    });
    fila.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") {
        mouse = true;
        agendar();
      }
    });
    fila.addEventListener("pointerleave", () => {
      mouse = false;
      agendar();
    });
    document.addEventListener("visibilitychange", agendar);
    movimento.addEventListener?.("change", () => {
      if (movimento.matches) {
        t = T0;
        pintar(t);
      }
      ajustarBotao();
      agendar();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entradas) => {
        visivel = entradas[0].isIntersecting;
        agendar();
      }).observe(fila);
    }
    agendar();
  }

  /* ---------- Conferir A/B ----------
     Régua comum em segundos da Extended (7:12 = 432 s). A versão de 3:58 começa em
     1:36; a prévia é o trecho de 30 s entre 1:02 e 1:32 dessa versão, ou seja,
     2:38–3:08 na régua. */
  const ondas = $("#ondas");
  if (!ondas) return;
  const TOTAL = 432;
  const INTRO = 96;
  const CORPO = 238;
  const PREV_INI = INTRO + 62;
  const PREV_FIM = PREV_INI + 30;
  const ab = { lado: "b", pos: 165, tocando: false };
  const cores = () => {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    return { base: v("--line-forte"), ativo: v("--ambar"), inativo: v("--txt-3"), tocado: v("--txt-2") };
  };
  const ruido = (i) => {
    let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };
  const envCorpo = (m) => (m < 30 ? 0.68 : m < 94 ? 0.82 : m < 126 ? 0.3 : m < 204 ? 0.96 : 0.72);
  const envB = (s) => {
    if (s < INTRO) return 0.26 + 0.2 * (s / INTRO) + (s > 64 ? 0.1 : 0);
    if (s < INTRO + CORPO) return envCorpo(s - INTRO);
    return Math.max(0.12, 0.62 - 0.44 * ((s - INTRO - CORPO) / (TOTAL - INTRO - CORPO)));
  };
  const envA = (s) => (s >= PREV_INI && s <= PREV_FIM ? envCorpo(s - INTRO) : 0);
  const desenhar = (id, env, ativo, c) => {
    const cv = document.getElementById(id);
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const largura = 3;
    const barras = Math.floor(w / largura);
    const dt = TOTAL / barras;
    for (let i = 0; i < barras; i++) {
      const s = (i + 0.5) * dt;
      const e = env(s);
      if (!e) continue;
      const a = Math.max(1.5, e * (0.55 + 0.45 * ruido(i)) * (h - 18));
      ctx.fillStyle = s <= ab.pos ? (ativo ? c.ativo : c.tocado) : ativo ? c.inativo : c.base;
      ctx.fillRect(i * largura, (h - a) / 2 + 4, 2, a);
    }
  };
  const cabeca = $("#cabeca-ab");
  const relogio = $("#ab-relogio");
  const trecho = $("#trecho");
  const pintarAB = () => {
    const c = cores();
    desenhar("onda-a", envA, ab.lado === "a", c);
    desenhar("onda-b", envB, ab.lado === "b", c);
    cabeca.style.transform = `translateX(${((ab.pos / TOTAL) * ondas.clientWidth).toFixed(1)}px)`;
    trecho.style.left = `${(PREV_INI / TOTAL) * 100}%`;
    trecho.style.width = `${(30 / TOTAL) * 100}%`;
    relogio.textContent = ab.lado === "b" ? `B ${mmss(ab.pos)} / 7:12` : `A ${mmss(ab.pos - PREV_INI)} / 0:30 da prévia`;
    for (const b of $$(".ab-lado")) b.setAttribute("aria-pressed", String(b.dataset.lado === ab.lado));
  };
  const botaoTocar = $("#tocar");
  const iconeTocar = $("#tocar-icone");
  const tocar = (sim) => {
    ab.tocando = sim;
    iconeTocar.setAttribute("d", sim ? "M4 2.5h3v11H4zM9 2.5h3v11H9z" : "M4 2.5v11l9-5.5z");
    botaoTocar.setAttribute("aria-label", sim ? "Pausar" : "Tocar");
    if (!sim) return;
    let antes = 0;
    const rodar = (agora) => {
      if (!ab.tocando) return;
      const dt = antes ? (agora - antes) / 1000 : 0;
      antes = agora;
      ab.pos += dt;
      if (ab.pos > PREV_FIM) ab.pos = PREV_INI;
      pintarAB();
      requestAnimationFrame(rodar);
    };
    requestAnimationFrame(rodar);
  };
  botaoTocar.addEventListener("click", () => tocar(!ab.tocando));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && ab.tocando) tocar(false);
  });
  for (const b of $$(".ab-lado")) {
    b.addEventListener("click", () => {
      ab.lado = b.dataset.lado;
      pintarAB();
    });
  }
  for (const o of $$(".onda")) {
    o.addEventListener("click", (e) => {
      const r = ondas.getBoundingClientRect();
      ab.pos = Math.min(PREV_FIM, Math.max(PREV_INI, ((e.clientX - r.left) / r.width) * TOTAL));
      pintarAB();
    });
  }
  $("#ab").addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if ((k === "a" || k === "b") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      ab.lado = k;
      pintarAB();
    }
  });
  const status = $("#ab-status");
  for (const b of $$("[data-veredito]")) {
    b.addEventListener("click", () => {
      status.textContent =
        b.dataset.veredito === "sim"
          ? "Marcada como conferida. O arquivo fica na pasta da playlist."
          : "Marcada como não é esta. O Waxtrail abre os outros candidatos.";
    });
  }
  pintarAB();
  temaClaro.addEventListener?.("change", pintarAB);
  if ("ResizeObserver" in window) new ResizeObserver(pintarAB).observe(ondas);
  else window.addEventListener("resize", pintarAB);
})();
