"use strict";
(() => {
  const data = window.WAXTRAIL_RELEASES;
  const repoUrl = `https://github.com/${data.repo}`;
  const assetUrl = (tag, file) => `${repoUrl}/releases/download/${tag}/${encodeURIComponent(file)}`;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function detectOS() {
    const ua = navigator.userAgent || "";
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const text = `${platform} ${ua}`.toLowerCase();
    if (/android/.test(text)) return { os: "android" };
    if (/iphone|ipad|ipod/.test(text)) return { os: "ios" };
    if (/win/.test(text)) return { os: "windows", arch: "x64" };
    if (/mac/.test(text)) {
      // Safari em Apple Silicon se apresenta como Intel; sem sinal confiável, oferecemos os dois.
      return { os: "macos", arch: "arm64", ambiguous: true };
    }
    if (/linux|x11|cros/.test(text)) return { os: "linux", arch: "x86_64" };
    return { os: "unknown" };
  }

  function osName(os) {
    return { linux: "Linux", windows: "Windows", macos: "macOS" }[os] || "o seu sistema";
  }

  function renderPrimary(detected) {
    const label = document.querySelector("[data-download-label]");
    const note = document.querySelector("[data-download-note]");
    const link = document.querySelector("[data-download-primary]");
    const { version, tag, assets } = data.current;
    const match = assets.find(a => a.os === detected.os && (!detected.arch || a.arch === detected.arch)) || assets.find(a => a.os === detected.os);
    if (match && match.pending) {
      label.textContent = `Waxtrail ${version} para ${osName(match.os)}: em preparação`;
      note.innerHTML = `${escape(match.pending)} <a href="#download">Ver os pacotes disponíveis</a>.`;
      return;
    }
    if (!match) {
      label.textContent = `Baixar o Waxtrail ${version}`;
      note.textContent = detected.os === "android" || detected.os === "ios"
        ? "O Waxtrail é um aplicativo de computador. Abra esta página no Linux, Windows ou macOS para baixar."
        : "Escolha o pacote do seu sistema na lista abaixo.";
      return;
    }
    link.href = assetUrl(match.tag || tag, match.file);
    link.removeAttribute("data-download-primary");
    label.textContent = `Baixar para ${match.label} · ${match.version || version}`;
    const alt = detected.ambiguous ? assets.find(a => a.os === "macos" && a.arch !== match.arch) : null;
    note.innerHTML = `${escape(match.file)}${alt ? ` · Mac com Intel? <a href="${assetUrl(alt.tag || tag, alt.file)}">baixe a versão Intel</a>.` : ""} · <a href="${assetUrl(match.tag || tag, data.current.checksums)}">SHA256SUMS</a>`;
  }

  function renderCards(detected) {
    const holder = document.querySelector("[data-download-cards]");
    const { tag, assets, checksums } = data.current;
    holder.innerHTML = assets.map(asset => {
      const mine = asset.os === detected.os && (!detected.arch || asset.arch === detected.arch || detected.ambiguous);
      return `<article class="cartao${mine ? " destaque" : ""}">
        <p class="cartao-os">${escape(osName(asset.os))}${mine ? '<span class="tag">seu sistema</span>' : ""}</p>
        <h3>${escape(asset.label)}</h3>
        <p>${escape(asset.pending || asset.note)}</p>
        ${asset.pending ? `<span class="botao desativado" aria-disabled="true">Em preparação</span>` : `<a class="botao primario" href="${assetUrl(asset.tag || tag, asset.file)}">Baixar ${escape(asset.kind)}${asset.version ? ` · ${escape(asset.version)}` : ""}</a>`}
        <small><code>${escape(asset.file)}</code></small>
      </article>`;
    }).join("") + `<article class="cartao verificacao">
        <p class="cartao-os">Conferência</p>
        <h3>Somas SHA256</h3>
        <p>Confira o arquivo baixado antes de extrair: <code>sha256sum -c SHA256SUMS.txt</code> no Linux e macOS, ou <code>Get-FileHash</code> no PowerShell.</p>
        <a class="botao" href="${assetUrl(tag, checksums)}">Baixar ${escape(checksums)}</a>
        <small><a href="${repoUrl}/releases/tag/${tag}">Notas da release ${escape(data.current.version)}</a></small>
      </article>`;
  }

  function renderPrevious() {
    const list = document.querySelector("[data-v1-list]");
    const { tag, assets } = data.previous;
    list.innerHTML = assets.map(asset => `<li><a href="${assetUrl(tag, asset.file)}">${escape(asset.label)}</a> <code>${escape(asset.file)}</code></li>`).join("")
      + `<li><a href="${repoUrl}/releases/tag/${tag}">Notas da release ${escape(data.previous.version)}</a></li>`;
  }

  function wireLinks() {
    document.querySelectorAll("[data-repo-link]").forEach(a => { a.href = repoUrl; });
    document.querySelectorAll("[data-releases-link]").forEach(a => { a.href = `${repoUrl}/releases`; });
    document.querySelectorAll("[data-changelog-link]").forEach(a => { a.href = `${repoUrl}/blob/main/CHANGELOG.md`; });
    document.querySelectorAll("[data-issues-link]").forEach(a => { a.href = `${repoUrl}/issues`; });
    document.querySelectorAll("[data-version-text]").forEach(n => { n.textContent = data.current.version; });
    document.querySelectorAll("[data-version-badge]").forEach(n => { n.textContent = data.current.version.split(".").slice(0, 2).join("."); });
  }

  function tabs(detected) {
    const buttons = [...document.querySelectorAll('[role="tab"]')];
    const panels = buttons.map(b => document.getElementById(b.getAttribute("aria-controls")));
    function activate(button) {
      buttons.forEach((b, i) => {
        const on = b === button;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
    }
    buttons.forEach((b, i) => {
      b.addEventListener("click", () => activate(b));
      b.addEventListener("keydown", event => {
        const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = buttons[(i + delta + buttons.length) % buttons.length];
        next.focus();
        activate(next);
      });
    });
    const preferred = buttons.find(b => b.dataset.os === detected.os);
    if (preferred) activate(preferred);
  }

  function mobileMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.getElementById("menu-movel");
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Abrir menu" : "Fechar menu");
      menu.hidden = open;
    });
    menu.addEventListener("click", event => {
      if (event.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); menu.hidden = true; }
    });
  }

  async function refreshFromGitHub() {
    // Opcional: se a API responder, mostra a versão mais recente publicada. A página funciona sem isso.
    try {
      const response = await fetch(`https://api.github.com/repos/${data.repo}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
      if (!response.ok) return;
      const release = await response.json();
      const version = String(release.tag_name || "").replace(/^v/, "");
      if (version && version !== data.current.version) {
        const note = document.querySelector("[data-download-note]");
        note.insertAdjacentHTML("beforeend", ` · <a href="${escape(release.html_url)}">Há uma release mais nova: ${escape(version)}</a>`);
      }
    } catch (_) { /* offline ou repositório privado: silêncio */ }
  }

  const detected = detectOS();
  document.documentElement.dataset.os = detected.os;
  wireLinks();
  renderPrimary(detected);
  renderCards(detected);
  renderPrevious();
  tabs(detected);
  mobileMenu();
  refreshFromGitHub();
})();
