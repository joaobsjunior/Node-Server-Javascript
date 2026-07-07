# secure-configuration

## ADDED Requirements

### Requirement: Segredos carregados via variáveis de ambiente
O sistema SHALL carregar todos os segredos (chave de autenticação de requisições, senha LDAP, credenciais SMTP) exclusivamente de variáveis de ambiente. Nenhum valor de segredo SHALL existir hardcoded em arquivos de código-fonte versionados.

#### Scenario: Segredos lidos do ambiente
- **WHEN** o servidor inicia com `KEY_REQUEST_AUTH`, `LDAP_PASSWORD`, `MAIL_USER` e `MAIL_PASS` definidas no ambiente
- **THEN** a configuração em memória usa esses valores e o servidor inicia normalmente

#### Scenario: Código-fonte sem segredos
- **WHEN** o código-fonte versionado é inspecionado
- **THEN** nenhum valor real de senha, chave ou credencial está presente em `config/config.js` ou em qualquer outro arquivo versionado

### Requirement: Falha explícita quando segredo obrigatório está ausente
O servidor SHALL abortar a inicialização com uma mensagem de erro clara (indicando o nome da variável ausente, nunca seu valor) quando uma variável de ambiente obrigatória não estiver definida.

#### Scenario: Variável obrigatória ausente
- **WHEN** o servidor inicia sem `KEY_REQUEST_AUTH` definida
- **THEN** o processo termina com código de saída diferente de zero e loga qual variável está ausente

### Requirement: Exemplo de configuração documentado
O repositório SHALL conter um arquivo `.env.example` listando todas as variáveis de ambiente suportadas com valores placeholder, e o README SHALL documentar as variáveis obrigatórias.

#### Scenario: Arquivo de exemplo presente
- **WHEN** um desenvolvedor clona o repositório
- **THEN** encontra `.env.example` com todas as variáveis nomeadas e sem valores reais de segredos

### Requirement: Parâmetros de rede configuráveis
Endereços de host e portas de serviços externos (gateway SOA) SHALL ser configuráveis via variáveis de ambiente ou arquivo de configuração, sem IPs hardcoded no código de inicialização.

#### Scenario: Gateway configurável
- **WHEN** `GATEWAY_HOST` e `GATEWAY_PORT` estão definidas no ambiente
- **THEN** o servidor usa esses valores em vez de qualquer IP fixo no código
