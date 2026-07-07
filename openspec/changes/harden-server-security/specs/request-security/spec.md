# request-security

## ADDED Requirements

### Requirement: CORS restrito a origens permitidas
O servidor SHALL responder com cabeçalhos CORS apenas para origens presentes em uma lista de permissões configurável via variável de ambiente (`CORS_ORIGINS`, separada por vírgulas). O servidor SHALL NOT usar `Access-Control-Allow-Origin: *`.

#### Scenario: Origem permitida
- **WHEN** uma requisição chega com header `Origin` presente na lista `CORS_ORIGINS`
- **THEN** a resposta inclui `Access-Control-Allow-Origin` com essa origem específica

#### Scenario: Origem não permitida
- **WHEN** uma requisição chega com header `Origin` ausente da lista `CORS_ORIGINS`
- **THEN** a resposta não inclui cabeçalhos `Access-Control-Allow-*`

### Requirement: Limite de payload seguro
O servidor SHALL limitar o tamanho do corpo das requisições (JSON e urlencoded) a um valor configurável via `BODY_LIMIT`, com padrão de 1mb.

#### Scenario: Payload dentro do limite
- **WHEN** uma requisição POST com corpo de 500kb é recebida
- **THEN** a requisição é processada normalmente

#### Scenario: Payload acima do limite
- **WHEN** uma requisição POST com corpo maior que o limite configurado é recebida
- **THEN** o servidor responde com status 413 (Payload Too Large)

### Requirement: Códigos de status corretos na autenticação
O middleware de autenticação SHALL responder 401 quando o token está ausente, inválido ou não pode ser descriptografado/parseado, e 403 quando o acesso é negado por autorização. O middleware SHALL NOT responder 500 para falhas de autenticação nem vazar detalhes internos (stack trace, mensagens de exceção) no corpo da resposta.

#### Scenario: Token ausente
- **WHEN** uma requisição a rota protegida chega sem o header `token`
- **THEN** a resposta tem status 401 com corpo de erro genérico

#### Scenario: Token inválido ou corrompido
- **WHEN** o header `token` contém valor que falha na descriptografia ou no parse do JSON
- **THEN** a resposta tem status 401 e o processo não lança exceção não tratada

#### Scenario: Credenciais rejeitadas
- **WHEN** o token é descriptografado mas as credenciais não são validadas pelo repositório de login
- **THEN** a resposta tem status 401 e a requisição é encerrada (nunca fica pendurada sem resposta)

### Requirement: Autenticação sempre responde
O middleware de autenticação SHALL garantir que todo caminho de execução (sucesso, falha de credencial, erro interno) resulte em `next()` ou em uma resposta HTTP encerrada.

#### Scenario: Falha na verificação de login
- **WHEN** `checkLogin` retorna resultado sem sucesso ou com erro
- **THEN** o cliente recebe uma resposta HTTP (401 ou 500 conforme o caso) dentro do timeout padrão, sem requisição pendurada
