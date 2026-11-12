"use strict";
/* Página do Waxtrail: detecta o sistema, monta os botões principais, os pacotes
   de cada sistema, a conferência e a versão anterior a partir de releases.js, o
   menu do celular e os botões de copiar. Funciona sem a API do GitHub; a consulta
   à última release é só um extra. Sem JS (ou sem o catálogo), os botões levam à
   lista de releases e os três sistemas ficam à vista. A linha e o percurso da
   abertura ficam em trilha.js; a Fila viva e o A/B, em fila-demo.js. */
(() => {
  const todos = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
  const escapar = (valor) =>
    String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const SEP = '<span class="sep"> · </span>';

  function menuMovel() {
    const alternar = document.querySelector(".menu-alternar");
    const menu = document.getElementById("menu-movel");
    if (!alternar || !menu) return;
    const fechar = () => {
      alternar.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    };
    fechar();
    alternar.addEventListener("click", () => {
      const aberto = alternar.getAttribute("aria-expanded") === "true";
      alternar.setAttribute("aria-expanded", String(!aberto));
      menu.hidden = aberto;
    });
    menu.addEventListener("click", (evento) => {
      if (evento.target.closest("a")) fechar();
    });
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && !menu.hidden) {
        fechar();
        alternar.focus();
      }
    });
  }

  function botoesDeCopiar() {
    /* O rótulo do botão em foco muda sem ser anunciado: o resultado vai também para uma região de aviso. */
    const aviso = document.createElement("span");
    aviso.className = "so-leitor";
    aviso.setAttribute("role", "status");
    document.body.append(aviso);
    for (const botao of todos(".copiar")) {
      botao.hidden = false;
      const codigo = botao.parentElement.querySelector("pre");
      let espera = 0;
      const responder = (texto) => {
        botao.textContent = texto;
        aviso.textContent = texto;
        clearTimeout(espera);
        espera = setTimeout(() => {
          botao.textContent = "Copiar";
          aviso.textContent = "";
        }, 1600);
      };
      const selecionar = () => {
        const faixa = document.createRange();
        faixa.selectNodeContents(codigo);
        const selecao = getSelection();
        selecao.removeAllRanges();
        selecao.addRange(faixa);
        responder("Selecionado");
      };
      botao.addEventListener("click", () => {
        if (!navigator.clipboard) return selecionar();
        navigator.clipboard.writeText(codigo.textContent).then(() => responder("Copiado"), selecionar);
      });
    }
  }

  /* Abaixo de 1080 px as capturas rolam de lado dentro do quadro: quem usa teclado precisa alcançá-lo. */
  function quadrosRolaveis() {
    const estreita = window.matchMedia("(max-width: 1079.98px)");
    const ajustar = () => {
      for (const quadro of todos(".quadro")) {
        if (estreita.matches) quadro.tabIndex = 0;
        else quadro.removeAttribute("tabindex");
      }
    };
    ajustar();
    estreita.addEventListener?.("change", ajustar);
  }

  menuMovel();
  quadrosRolaveis();

  const dados = window.WAXTRAIL_RELEASES;
  if (!dados) {
    botoesDeCopiar();
    return;
  }
  const repoUrl = `https://github.com/${dados.repo}`;
  const urlArquivo = (tag, arquivo) => `${repoUrl}/releases/download/${tag}/${encodeURIComponent(arquivo)}`;
  const urlNotas = (tag) => `${repoUrl}/releases/tag/${encodeURIComponent(tag)}`;
  const atual = dados.current;
  /* `previous` é opcional: sem ele, os textos fixos do HTML ficam e o bloco da versão anterior some. */
  const anterior = dados.previous || null;
  const publicada = atual.published !== false;

  function detectarSistema() {
    const ua = navigator.userAgent || "";
    const plataforma = navigator.userAgentData?.platform || navigator.platform || "";
    const texto = `${plataforma} ${ua}`.toLowerCase();
    if (/android/.test(texto)) return { os: "android" };
    if (/iphone|ipad|ipod/.test(texto)) return { os: "ios" };
    if (/win/.test(texto)) return { os: "windows", arch: "x64" };
    // O Safari num Mac Apple Silicon se apresenta como Intel: oferecemos os dois.
    if (/mac/.test(texto)) return { os: "macos", arch: "arm64", ambiguo: true };
    if (/linux|x11|cros/.test(texto)) return { os: "linux", arch: "x86_64" };
    return { os: "desconhecido" };
  }

  const rotuloLinux = (a) =>
    ({ arch: "Arch (pacman)", deb: "Debian/Ubuntu (.deb)", appimage: "AppImage", tar: ".tar.gz" })[a.flavor] || a.label;
  // Nome curto para o botão; o rótulo completo do catálogo fica na lista de pacotes.
  const rotuloCurto = (a) =>
    a.os === "windows" ? "Windows" : a.os === "macos" ? (a.arch === "arm64" ? "Mac com Apple Silicon" : "Mac com Intel") : a.label;
  // Destaca um pacote só quando ele é inequívoco (Windows, Mac Apple Silicon): no
  // Linux o navegador não sabe a distribuição, e o grupo já diz "seu sistema".
  const ehMeu = (a, sistema) => {
    const exatos = atual.assets.filter((x) => x.os === sistema.os && x.arch === sistema.arch);
    return exatos.length === 1 && exatos[0] === a;
  };

  /* "2026-10-22" → "22 de outubro de 2026", sem depender do fuso de quem lê. */
  function dataPorExtenso(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return "";
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const mes = meses[Number(m[2]) - 1];
    return mes ? `${Number(m[3])} de ${mes} de ${m[1]}` : "";
  }

  function preencherTextos() {
    const versaoPacman = atual.version.replace(/-/g, "");
    for (const n of todos("[data-versao]")) n.textContent = atual.version;
    for (const n of todos("[data-versao-pacman]")) n.textContent = versaoPacman;
    for (const n of todos("[data-versao-curta]")) n.textContent = atual.version.split(".").slice(0, 2).join(".");
    if (anterior) for (const n of todos("[data-versao-anterior]")) n.textContent = anterior.version;
    for (const n of todos("[data-link-releases]")) n.href = `${repoUrl}/releases`;
    for (const n of todos("[data-link-problemas]")) n.href = `${repoUrl}/issues`;
    for (const n of todos("[data-link-seguranca]")) n.href = `${repoUrl}/security/advisories/new`;
    const data = dataPorExtenso(atual.date);
    if (data) for (const n of todos("[data-data-release]")) n.textContent = data;
    const chave = dados.minisignPublicKey;
    for (const n of todos("[data-chave-minisign]")) {
      if (chave) {
        for (const c of todos("code[data-minisign]", n)) c.textContent = `minisign -Vm SHA256SUMS.txt -P ${chave}`;
      } else {
        n.hidden = true;
      }
    }
    if (!publicada) {
      for (const n of todos("[data-download-estado]")) {
        n.textContent = `O Waxtrail ${atual.version} está em preparação: os pacotes abaixo entram aqui no dia da release.${
          anterior ? ` Enquanto isso, a versão ${anterior.version} continua disponível no fim desta seção.` : ""
        }`;
      }
    }
  }

  /* O que o botão principal oferece; vale para o da abertura e o da seção de download. */
  function principal(sistema) {
    const { version, tag, assets, checksums } = atual;
    const somas = `<a href="${urlArquivo(tag, checksums)}">SHA256SUMS</a>`;
    if (!publicada) {
      return {
        rotulo: `Waxtrail ${version}: em preparação`,
        href: "#download",
        nota: `Os pacotes saem no dia da release.${anterior ? ` <a href="#anterior">Ver os sistemas e a versão ${escapar(anterior.version)}</a>.` : ""}`,
      };
    }
    const doLinux = assets.filter((a) => a.os === "linux");
    if (sistema.os === "linux" && doLinux.length) {
      // O navegador não sabe a distribuição: o botão leva à lista e a nota traz os links diretos.
      return {
        rotulo: `Baixar para Linux · ${version}`,
        href: "#instalacao",
        nota: `${doLinux
          .map((a) => `<a href="${urlArquivo(tag, a.file)}">${escapar(rotuloLinux(a))}</a>`)
          .join(SEP)}${SEP}${somas}`,
      };
    }
    const escolhido =
      assets.find((a) => a.os === sistema.os && (!sistema.arch || a.arch === sistema.arch)) ||
      assets.find((a) => a.os === sistema.os);
    if (!escolhido) {
      return {
        rotulo: `Baixar o Waxtrail ${version}`,
        href: "#instalacao",
        nota: escapar(
          sistema.os === "android" || sistema.os === "ios"
            ? "O Waxtrail é um aplicativo de computador: abra esta página no Linux, no Windows ou no macOS para baixar."
            : "Escolha o pacote do seu sistema na lista abaixo.",
        ),
      };
    }
    const outro = sistema.ambiguo ? assets.find((a) => a.os === "macos" && a.arch !== escolhido.arch) : null;
    return {
      rotulo: `Baixar para ${rotuloCurto(escolhido)} · ${version}`,
      href: urlArquivo(tag, escolhido.file),
      nota: `<code translate="no">${escapar(escolhido.file)}</code>${
        outro ? `${SEP}Mac com Intel? <a href="${urlArquivo(tag, outro.file)}">baixe a versão Intel</a>` : ""
      }${SEP}${somas}`,
    };
  }

  const notaDe = (botao) => (botao.closest("[data-download-bloco]") || botao.parentElement).querySelector("[data-download-nota]");

  function montarPrincipal(sistema) {
    const oferta = principal(sistema);
    for (const botao of todos("[data-download-principal]")) {
      const rotulo = botao.querySelector("[data-download-rotulo]");
      const nota = notaDe(botao);
      const naSecao = botao.dataset.downloadPrincipal === "secao";
      if (!publicada && naSecao) {
        // Dentro da própria seção, "em preparação" é estado, não link.
        botao.removeAttribute("href");
        botao.setAttribute("aria-disabled", "true");
        botao.classList.remove("botao-p");
        rotulo.textContent = `${atual.version} em preparação`;
        if (nota) {
          nota.innerHTML = `Os pacotes entram aqui no dia da release.${
            anterior ? ` Enquanto isso, a <a href="#anterior">versão ${escapar(anterior.version)}</a> continua disponível.` : ""
          }`;
        }
        continue;
      }
      botao.href = oferta.href;
      rotulo.textContent = oferta.rotulo;
      if (nota) {
        // Na abertura, o caminho para os outros pacotes fica sempre à mão.
        const outros = !naSecao && publicada && ["linux", "windows", "macos"].includes(sistema.os) ? `${SEP}<a href="#download">Outros sistemas</a>` : "";
        nota.innerHTML = oferta.nota + outros;
      }
    }
  }

  function linhaGenerica(a) {
    const linha = document.createElement("div");
    linha.className = "pacote parada";
    linha.dataset.pacote = `${a.os}/${a.flavor || a.arch}`;
    linha.innerHTML = `<div><h4 data-pacote-nome></h4><code class="arquivo" translate="no" data-pacote-arquivo></code></div>
      <div class="instrucao"><p>${escapar(a.note)}</p></div>
      <div class="acao" data-pacote-acao></div>`;
    return linha;
  }

  function montarPacotes(sistema) {
    const { tag, assets } = atual;
    const usadas = new Set();
    for (const a of assets) {
      let linha = document.querySelector(`[data-pacote="${a.os}/${a.flavor || a.arch}"]`);
      // Sem linha no HTML, ou a linha já é de outro pacote (mesmo sabor, outra arquitetura): linha genérica.
      if (!linha || usadas.has(linha)) {
        const grupo = document.getElementById(`inst-${a.os}`);
        if (!grupo) continue;
        const repetida = !!linha;
        linha = linhaGenerica(a);
        if (repetida) linha.dataset.pacote += `/${a.arch}`;
        grupo.appendChild(linha);
      }
      usadas.add(linha);
      const meu = ehMeu(a, sistema);
      const nome = linha.querySelector("[data-pacote-nome]");
      nome.textContent = a.label;
      if (meu) nome.insertAdjacentHTML("beforeend", ' <span class="etiqueta">seu sistema</span>');
      linha.querySelector("[data-pacote-arquivo]").textContent = a.file;
      linha.classList.toggle("destaque", meu);
      linha.querySelector("[data-pacote-acao]").innerHTML = publicada
        ? `<a class="botao" href="${urlArquivo(tag, a.file)}">Baixar ${escapar(a.kind)}</a>${
            a.alternative ? `<a href="${urlArquivo(tag, a.alternative.file)}">${escapar(a.alternative.label)}</a>` : ""
          }`
        : `<span class="botao" aria-disabled="true">Em preparação</span>`;
    }
    for (const linha of todos("[data-pacote]")) if (!usadas.has(linha)) linha.hidden = true;
    for (const grupo of todos("[data-grupo]")) {
      if (!todos("[data-pacote]", grupo).some((linha) => !linha.hidden)) grupo.hidden = true;
    }
  }

  /* Sem abas: os três sistemas ficam à vista; o detectado sobe e ganha a marca. */
  function marcarGrupo(sistema) {
    const grupo = document.querySelector(`[data-grupo="${sistema.os}"]`);
    if (!grupo || grupo.hidden) return;
    const cabeca = grupo.querySelector(".grupo-cab");
    cabeca.classList.add("meu");
    cabeca.querySelector("h3").insertAdjacentHTML("afterend", ' <span class="etiqueta">seu sistema</span>');
    grupo.parentElement.prepend(grupo);
  }

  function montarSomas() {
    const { tag, checksums, version } = atual;
    for (const n of todos("[data-somas]")) {
      n.innerHTML = publicada
        ? [
            `<a href="${urlArquivo(tag, checksums)}">${escapar(checksums)}</a>`,
            dados.minisignPublicKey ? `<a href="${urlArquivo(tag, `${checksums}.minisig`)}">${escapar(checksums)}.minisig</a>` : "",
            `<a href="${urlNotas(tag)}">Notas da release ${escapar(version)}</a>`,
          ]
            .filter(Boolean)
            .join(" ")
        : `As somas${dados.minisignPublicKey ? " e a assinatura" : ""} da ${escapar(version)} saem junto com os pacotes.`;
    }
  }

  function montarAnterior() {
    const lista = document.querySelector("[data-lista-anterior]");
    if (!anterior) {
      const bloco = document.getElementById("anterior");
      if (bloco) bloco.hidden = true;
      return;
    }
    if (!lista) return;
    const { tag, assets } = anterior;
    lista.innerHTML = `${assets
      .map((a) => `<li><a href="${urlArquivo(tag, a.file)}">${escapar(a.label)}</a> <code translate="no">${escapar(a.file)}</code></li>`)
      .join("")}<li><a href="${urlNotas(tag)}">Notas da release ${escapar(anterior.version)}</a></li>`;
    if (!publicada) document.getElementById("anterior")?.setAttribute("open", "");
  }

  /* a > b por maior.menor.correção; com os três iguais, a final é mais nova que a pré-release ("3.1.0" > "3.1.0-rc.1"). */
  function maisNova(a, b) {
    const partes = (v) => String(v).split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);
    const pre = (v) => /^\d+(\.\d+)*-/.test(String(v));
    if (!/^\d+\.\d+/.test(String(a))) return false;
    const x = partes(a);
    const y = partes(b);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    return pre(b) && !pre(a);
  }

  async function avisarVersaoNova() {
    // Extra opcional: se a API responder com uma release mais nova que o catálogo, avisa.
    if (!publicada) return;
    try {
      const resposta = await fetch(`https://api.github.com/repos/${dados.repo}/releases/latest`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!resposta.ok) return;
      const release = await resposta.json();
      const tag = String(release.tag_name || "");
      const versao = tag.replace(/^v/, "");
      if (maisNova(versao, atual.version)) {
        // O link é montado aqui, no repositório do catálogo; nada da resposta vira endereço.
        for (const nota of todos("[data-download-nota]")) {
          nota.insertAdjacentHTML("beforeend", `${SEP}<a href="${urlNotas(tag)}">há uma versão mais nova: ${escapar(versao)}</a>`);
        }
      }
    } catch (_) {
      /* sem rede ou limite da API: silêncio */
    }
  }

  const sistema = detectarSistema();
  document.documentElement.dataset.os = sistema.os;
  preencherTextos();
  montarPrincipal(sistema);
  montarPacotes(sistema);
  marcarGrupo(sistema);
  montarSomas();
  montarAnterior();
  botoesDeCopiar();
  avisarVersaoNova();
})();
