"use strict";
/* Página do Waxtrail: detecta o sistema, monta os botões principais, os pacotes
   de cada sistema, a conferência e a versão anterior a partir de releases.js,
   as abas de instalação, os botões de copiar e o menu móvel. Funciona sem a API
   do GitHub; a consulta à última release é só um extra. Sem JS (ou sem o
   catálogo), os botões levam à lista de releases e todos os sistemas ficam à
   vista. A Fila animada e o A/B ficam em fila-demo.js. */
(() => {
  const dados = window.WAXTRAIL_RELEASES;
  if (!dados) return;
  const repoUrl = `https://github.com/${dados.repo}`;
  const urlArquivo = (tag, arquivo) => `${repoUrl}/releases/download/${tag}/${encodeURIComponent(arquivo)}`;
  const urlNotas = (tag) => `${repoUrl}/releases/tag/${encodeURIComponent(tag)}`;
  const escapar = (valor) =>
    String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const todos = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
  const atual = dados.current;
  const anterior = dados.previous;
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
  // Linux o navegador não sabe a distribuição, e a aba já diz "seu sistema".
  const ehMeu = (a, sistema) => {
    const exatos = atual.assets.filter((x) => x.os === sistema.os && x.arch === sistema.arch);
    return exatos.length === 1 && exatos[0] === a;
  };

  function preencherTextos() {
    const versaoPacman = atual.version.replace(/-/g, "");
    for (const n of todos("[data-versao]")) n.textContent = atual.version;
    for (const n of todos("[data-versao-pacman]")) n.textContent = versaoPacman;
    for (const n of todos("[data-versao-curta]")) n.textContent = atual.version.split(".").slice(0, 2).join(".");
    for (const n of todos("[data-versao-anterior]")) n.textContent = anterior.version;
    for (const n of todos("[data-link-releases]")) n.href = `${repoUrl}/releases`;
    for (const n of todos("[data-link-problemas]")) n.href = `${repoUrl}/issues`;
    for (const n of todos("[data-link-seguranca]")) n.href = `${repoUrl}/security/advisories/new`;
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
        n.textContent = `O Waxtrail ${atual.version} está em preparação: os pacotes abaixo entram aqui no dia da release. Enquanto isso, a versão ${anterior.version} continua disponível no fim desta seção.`;
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
        nota: `Os pacotes saem no dia da release. <a href="#anterior">Ver os sistemas e a versão ${escapar(anterior.version)}</a>.`,
      };
    }
    if (sistema.os === "linux") {
      // O navegador não sabe a distribuição: o botão leva à lista e a nota traz os links diretos.
      return {
        rotulo: `Baixar para Linux · ${version}`,
        href: "#instalacao",
        nota: `${assets
          .filter((a) => a.os === "linux")
          .map((a) => `<a href="${urlArquivo(tag, a.file)}">${escapar(rotuloLinux(a))}</a>`)
          .join(" · ")} · ${somas}`,
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
      nota: `<code>${escapar(escolhido.file)}</code>${
        outro ? ` · Mac com Intel? <a href="${urlArquivo(tag, outro.file)}">baixe a versão Intel</a>` : ""
      } · ${somas}`,
    };
  }

  function montarPrincipal(sistema) {
    const oferta = principal(sistema);
    for (const botao of todos("[data-download-principal]")) {
      const rotulo = botao.querySelector("[data-download-rotulo]");
      const nota = botao.parentElement.parentElement.querySelector("[data-download-nota]");
      if (!publicada && botao.dataset.downloadPrincipal === "secao") {
        // Dentro da própria seção, "em preparação" é estado, não link.
        botao.removeAttribute("href");
        botao.setAttribute("aria-disabled", "true");
        botao.classList.remove("botao-p");
        rotulo.textContent = `${atual.version} em preparação`;
        if (nota) {
          nota.innerHTML = `Os pacotes entram aqui no dia da release. Enquanto isso, a <a href="#anterior">versão ${escapar(anterior.version)}</a> continua disponível.`;
        }
        continue;
      }
      botao.href = oferta.href;
      rotulo.textContent = oferta.rotulo;
      if (nota) nota.innerHTML = oferta.nota;
    }
  }

  function linhaGenerica(a) {
    const linha = document.createElement("div");
    linha.className = "pacote";
    linha.dataset.pacote = `${a.os}/${a.flavor || a.arch}`;
    linha.innerHTML = `<div class="pacote-id"><h4 data-pacote-nome></h4><code class="pacote-arquivo" data-pacote-arquivo></code></div>
      <div class="pacote-instrucao"><p>${escapar(a.note)}</p></div>
      <div class="pacote-acao" data-pacote-acao></div>`;
    return linha;
  }

  function montarPacotes(sistema) {
    const { tag, assets } = atual;
    const usadas = new Set();
    for (const a of assets) {
      let linha = document.querySelector(`[data-pacote="${a.os}/${a.flavor || a.arch}"]`);
      if (!linha) {
        const painel = document.getElementById(`inst-${a.os}`);
        if (!painel) continue;
        linha = linhaGenerica(a);
        painel.appendChild(linha);
      }
      usadas.add(linha);
      const meu = ehMeu(a, sistema);
      const nome = linha.querySelector("[data-pacote-nome]");
      nome.textContent = a.label;
      if (meu) nome.insertAdjacentHTML("beforeend", ' <span class="etiqueta">seu sistema</span>');
      linha.querySelector("[data-pacote-arquivo]").textContent = a.file;
      linha.classList.toggle("destaque", meu);
      linha.querySelector("[data-pacote-acao]").innerHTML = publicada
        ? `<a class="botao${meu ? " botao-p" : ""}" href="${urlArquivo(tag, a.file)}">Baixar ${escapar(a.kind)}</a>${
            a.alternative ? `<a href="${urlArquivo(tag, a.alternative.file)}">${escapar(a.alternative.label)}</a>` : ""
          }`
        : `<span class="botao" aria-disabled="true">Em preparação</span>`;
    }
    for (const linha of todos("[data-pacote]")) if (!usadas.has(linha)) linha.hidden = true;
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
            .join(" · ")
        : `As somas${dados.minisignPublicKey ? " e a assinatura" : ""} da ${escapar(version)} saem junto com os pacotes.`;
    }
  }

  function montarAnterior() {
    const lista = document.querySelector("[data-lista-anterior]");
    if (!lista || !anterior) return;
    const { tag, assets } = anterior;
    lista.innerHTML = `${assets
      .map((a) => `<li><a href="${urlArquivo(tag, a.file)}">${escapar(a.label)}</a> <code>${escapar(a.file)}</code></li>`)
      .join("")}<li><a href="${urlNotas(tag)}">Notas da release ${escapar(anterior.version)}</a></li>`;
    if (!publicada) document.getElementById("anterior")?.setAttribute("open", "");
  }

  function abas(sistema) {
    const botoes = todos('[role="tab"]');
    if (!botoes.length) return;
    const paineis = botoes.map((b) => document.getElementById(b.getAttribute("aria-controls")));
    const ativar = (botao) => {
      botoes.forEach((b, i) => {
        const ligado = b === botao;
        b.setAttribute("aria-selected", String(ligado));
        b.tabIndex = ligado ? 0 : -1;
        paineis[i].hidden = !ligado;
      });
    };
    botoes.forEach((b, i) => {
      b.addEventListener("click", () => ativar(b));
      b.addEventListener("keydown", (evento) => {
        const passo = evento.key === "ArrowRight" ? 1 : evento.key === "ArrowLeft" ? -1 : 0;
        let proximo = null;
        if (passo) proximo = botoes[(i + passo + botoes.length) % botoes.length];
        else if (evento.key === "Home") proximo = botoes[0];
        else if (evento.key === "End") proximo = botoes[botoes.length - 1];
        if (!proximo) return;
        evento.preventDefault();
        proximo.focus();
        ativar(proximo);
      });
    });
    const preferido = botoes.find((b) => b.dataset.os === sistema.os);
    if (preferido) preferido.insertAdjacentHTML("beforeend", ' <span class="etiqueta">seu sistema</span>');
    ativar(preferido || botoes[0]);
  }

  function menuMovel() {
    const alternar = document.querySelector(".menu-alternar");
    const menu = document.getElementById("menu-movel");
    if (!alternar || !menu) return;
    const fechar = () => {
      alternar.setAttribute("aria-expanded", "false");
      alternar.setAttribute("aria-label", "Abrir menu");
      menu.hidden = true;
    };
    alternar.addEventListener("click", () => {
      const aberto = alternar.getAttribute("aria-expanded") === "true";
      alternar.setAttribute("aria-expanded", String(!aberto));
      alternar.setAttribute("aria-label", aberto ? "Abrir menu" : "Fechar menu");
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
    for (const botao of todos(".copiar")) {
      botao.hidden = false;
      const codigo = botao.parentElement.querySelector("pre");
      const voltar = () => setTimeout(() => (botao.textContent = "Copiar"), 1600);
      const selecionar = () => {
        const faixa = document.createRange();
        faixa.selectNodeContents(codigo);
        const selecao = getSelection();
        selecao.removeAllRanges();
        selecao.addRange(faixa);
        botao.textContent = "Selecionado";
        voltar();
      };
      botao.addEventListener("click", () => {
        if (!navigator.clipboard) return selecionar();
        navigator.clipboard.writeText(codigo.textContent).then(() => {
          botao.textContent = "Copiado";
          voltar();
        }, selecionar);
      });
    }
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
      const versao = String(release.tag_name || "").replace(/^v/, "");
      if (versao && versao !== atual.version) {
        for (const nota of todos("[data-download-nota]")) {
          nota.insertAdjacentHTML("beforeend", ` · <a href="${escapar(release.html_url)}">há uma versão mais nova: ${escapar(versao)}</a>`);
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
  montarSomas();
  montarAnterior();
  abas(sistema);
  menuMovel();
  botoesDeCopiar();
  avisarVersaoNova();
})();
