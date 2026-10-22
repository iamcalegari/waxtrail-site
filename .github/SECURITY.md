# Segurança do Waxtrail

Só a última versão publicada recebe correções de segurança.

Achou uma falha? Não abra uma issue pública. Reporte em particular pelo
GitHub: <https://github.com/iamcalegari/waxtrail-site/security/advisories/new>.
A resposta vem por lá.

Para conferir um pacote: cada release traz o `SHA256SUMS.txt` e a assinatura
dele (`SHA256SUMS.txt.minisig`). Confira a assinatura com a chave pública da
página (`minisign -Vm SHA256SUMS.txt -P <chave>`) e depois o arquivo
(`sha256sum -c SHA256SUMS.txt --ignore-missing`).
