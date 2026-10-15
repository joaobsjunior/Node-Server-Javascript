# Proposta: corrigir as vulnerabilidades remanescentes

## Motivação

Após o hardening anterior (`harden-server-security`), uma revisão do código mostrou que as
vulnerabilidades mais graves estavam no próprio código, não nas dependências:

- **Injeção de SQL**: os arquivos `.sql` eram compilados com `lodash.template` e os valores do
  usuário (e-mail/senha) eram interpolados no texto do comando.
- **Execução remota de código latente**: `populateToService` (annotation-js) montava código
  JavaScript com valores da requisição e o executava com `eval`.
- **Token de autenticação inseguro**: AES (crypto-js, descontinuado) carregando e-mail e hash da
  senha, sem expiração e sem proteção de integridade.
- **Vazamento de informação**: respostas de erro incluíam o SQL completo, stack trace e classes
  Java internas.
- **Credenciais em texto puro**: SMTP com `ignoreTLS: true`; usuário/senha do banco na URL JDBC e
  no código-fonte; chave AES fixa (`'teste'`) em código morto.
- **Disponibilidade**: rota sem documentação Swagger derrubava o processo; BIGINT lido com `getInt`
  lançava exceção fora do callback; upload multipart sem limites; socket com timeout de 2h; sem
  proteção contra força bruta no login; verificação `onlyLocalhost` via cabeçalho `Host` forjável.
- **Dependências**: nodemailer vulnerável (5 avisos), helmet 3 e chalk 1 obsoletos.

## Escopo

Eliminar cada item acima mantendo o comportamento funcional (mesmas rotas, mesmo formato de
resposta, mesmos arquivos `.sql` com placeholders `${nome}`), com teste de fumaça ponta a ponta.
