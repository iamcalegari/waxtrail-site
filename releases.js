/* Catálogo de downloads. Atualize a cada release; a página lê daqui sem depender da API do GitHub. */
window.WAXTRAIL_RELEASES = {
  repo: "iamcalegari/waxtrail-site",
  current: {
    version: "2.1.0",
    tag: "v2.1.0",
    date: "2026-09-29",
    assets: [
      { os: "linux", arch: "x86_64", label: "Linux x86_64", file: "Waxtrail-2.1.0-linux-x86_64.tar.gz", kind: "tar.gz", note: "Pasta autocontida com Python e Qt. Extraia e execute." },
      { os: "windows", arch: "x64", label: "Windows 10/11 64 bits", file: "Waxtrail-2.1.0-windows-x64.zip", kind: "zip", note: "Extraia e abra Waxtrail.exe. Sem instalador, sem registro." },
      { os: "macos", arch: "arm64", label: "macOS Apple Silicon", file: "Waxtrail-2.1.0-macos-arm64.dmg", kind: "dmg", note: "M1 ou mais novo. Arraste para Aplicativos." },
      { os: "macos", arch: "x64", label: "macOS Intel", file: "Waxtrail-2.1.0-macos-x64.dmg", kind: "dmg", note: "Macs com processador Intel." }
    ],
    checksums: "SHA256SUMS.txt"
  },
  previous: {
    version: "1.0.1",
    tag: "v1.0.1",
    assets: [
      { label: "Arch Linux (pacman)", file: "waxtrail-1.0.1-1-x86_64.pkg.tar.zst" },
      { label: "Debian 12 / Ubuntu 24.04 (.deb)", file: "Waxtrail-1.0.1-linux-amd64.deb" },
      { label: "Windows 64 bits (instalador)", file: "Waxtrail-1.0.1-windows-x64-setup.exe" },
      { label: "macOS Apple Silicon (.dmg)", file: "Waxtrail-1.0.1-macos-arm64.dmg" },
      { label: "macOS Intel (.dmg)", file: "Waxtrail-1.0.1-macos-x64.dmg" },
      { label: "Somas SHA256", file: "SHA256SUMS.txt" },
      { label: "Instruções de instalação da 1.0.1", file: "INSTALACAO.md" }
    ]
  }
};
