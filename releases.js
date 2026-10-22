/* Catálogo de downloads do Waxtrail. Atualize a cada release: a página lê
   daqui, sem depender da API do GitHub. Os nomes dos arquivos são os que a CI
   gera (.github/workflows/release.yml); o job "reunir" confere este bloco
   `current` contra os arquivos da release. Enquanto `published` for false, a
   página mostra os pacotes como "em preparação" e oferece a versão anterior. */
window.WAXTRAIL_RELEASES = {
  repo: "iamcalegari/waxtrail-site",
  /* Chave pública do minisign que assina o SHA256SUMS.txt de cada release
     (a segunda linha de app/packaging/release/minisign.pub). null enquanto a
     chave não existe: a página então não mostra o passo da assinatura. */
  minisignPublicKey: "RWRHH8JA44Yfssw2ywsxAHAhYSgsJN3Bi7upMesMZ+RpjOYH4BMOlCta",
  current: {
    version: "3.0.0",
    tag: "v3.0.0",
    date: "2026-10-22",
    published: true,
    assets: [
      {
        os: "linux",
        arch: "x86_64",
        flavor: "arch",
        label: "Arch, CachyOS e derivados",
        file: "waxtrail-bin-3.0.0-1-x86_64.pkg.tar.zst",
        kind: "pacote pacman",
        note: "sudo pacman -U no arquivo baixado. Substitui o Waxtrail 2.x, se estiver instalado; a biblioteca dele não é tocada.",
        alternative: { label: "PKGBUILD do waxtrail-bin", file: "waxtrail-bin-3.0.0-aur.tar.gz" },
      },
      {
        os: "linux",
        arch: "x86_64",
        flavor: "deb",
        label: "Debian 12, Ubuntu 22.04 ou mais novos",
        file: "Waxtrail-3.0.0-linux-amd64.deb",
        kind: ".deb",
        note: "sudo apt install ./arquivo.deb instala junto as dependências da sua distribuição.",
      },
      {
        os: "linux",
        arch: "x86_64",
        flavor: "appimage",
        label: "Qualquer distribuição, sem instalar",
        file: "Waxtrail-3.0.0-linux-x86_64.AppImage",
        kind: "AppImage",
        note: "Torne executável e abra. Não precisa de libfuse2; leva o próprio WebKitGTK.",
      },
      {
        os: "linux",
        arch: "x86_64",
        flavor: "tar",
        label: "Outras distribuições",
        file: "Waxtrail-3.0.0-linux-x86_64.tar.gz",
        kind: ".tar.gz",
        note: "Usa o WebKitGTK 4.1 do sistema; o instalar.sh incluído põe o app na sua conta, sem root.",
      },
      {
        os: "windows",
        arch: "x64",
        label: "Windows 10 e 11 (64 bits)",
        file: "Waxtrail-3.0.0-windows-x64-setup.exe",
        kind: "instalador",
        note: "Instala na sua conta, sem pedir administrador, com atalho no menu Iniciar e desinstalador. Sem assinatura: o SmartScreen pede confirmação.",
        alternative: { label: ".zip sem instalador", file: "Waxtrail-3.0.0-windows-x64.zip" },
      },
      {
        os: "macos",
        arch: "arm64",
        label: "macOS Apple Silicon",
        file: "Waxtrail-3.0.0-macos-arm64.dmg",
        kind: ".dmg",
        note: "M1 ou mais novo, macOS 12 ou mais novo. Sem notarização: libere em Ajustes do Sistema › Privacidade e Segurança.",
      },
      {
        os: "macos",
        arch: "x64",
        label: "macOS Intel",
        file: "Waxtrail-3.0.0-macos-x64.dmg",
        kind: ".dmg",
        note: "Macs com processador Intel, macOS 12 ou mais novo.",
      },
    ],
    checksums: "SHA256SUMS.txt",
  },
  previous: {
    version: "2.1.2",
    tag: "v2.1.2",
    assets: [
      { label: "Arch Linux (pacman)", file: "waxtrail-2.1.2-1-x86_64.pkg.tar.zst" },
      { label: "Debian 12 / Ubuntu 22.04+ (.deb)", file: "Waxtrail-2.1.2-linux-amd64.deb" },
      { label: "Linux, outras distribuições (.tar.gz)", file: "Waxtrail-2.1.2-linux-x86_64.tar.gz" },
      { label: "Windows 64 bits (instalador)", file: "Waxtrail-2.1.2-windows-x64-setup.exe" },
      { label: "Windows 64 bits (.zip)", file: "Waxtrail-2.1.2-windows-x64.zip" },
      { label: "macOS Apple Silicon (.dmg)", file: "Waxtrail-2.1.2-macos-arm64.dmg" },
      { label: "macOS Intel (.dmg)", file: "Waxtrail-2.1.2-macos-x64.dmg" },
      { label: "Somas SHA256", file: "SHA256SUMS.txt" },
    ],
  },
};
