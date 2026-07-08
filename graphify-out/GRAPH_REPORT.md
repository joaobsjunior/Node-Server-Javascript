# Graph Report - .  (2026-07-07)

## Corpus Check
- 14 files · ~9,503 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 293 nodes · 328 edges · 25 communities (17 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.95)
- Token cost: 54,202 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Repositório de Login|Repositório de Login]]
- [[_COMMUNITY_Utilitários AppUtil|Utilitários AppUtil]]
- [[_COMMUNITY_Login Controller|Login Controller]]
- [[_COMMUNITY_AppUtil e Interceptor|AppUtil e Interceptor]]
- [[_COMMUNITY_Conector JDBC|Conector JDBC]]
- [[_COMMUNITY_Hardening de Segurança|Hardening de Segurança]]
- [[_COMMUNITY_Metadados do Pacote|Metadados do Pacote]]
- [[_COMMUNITY_Dependências NPM|Dependências NPM]]
- [[_COMMUNITY_Serviço de CEP|Serviço de CEP]]
- [[_COMMUNITY_Geração de Rotas|Geração de Rotas]]
- [[_COMMUNITY_Bootstrap do Servidor|Bootstrap do Servidor]]
- [[_COMMUNITY_Sistema de Logs|Sistema de Logs]]
- [[_COMMUNITY_Configuração por Ambiente|Configuração por Ambiente]]
- [[_COMMUNITY_Resource Base SOA|Resource Base SOA]]
- [[_COMMUNITY_Roteador Principal|Roteador Principal]]
- [[_COMMUNITY_Modelo de Mensagem|Modelo de Mensagem]]
- [[_COMMUNITY_Utils Genérico|Utils Genérico]]
- [[_COMMUNITY_Opções HTTP|Opções HTTP]]
- [[_COMMUNITY_Geração de Relatórios|Geração de Relatórios]]
- [[_COMMUNITY_Conector SOA|Conector SOA]]
- [[_COMMUNITY_Deploy App Engine|Deploy App Engine]]
- [[_COMMUNITY_Metadados OpenSpec|Metadados OpenSpec]]

## God Nodes (most connected - your core abstractions)
1. `AppUtil` - 35 edges
2. `Design: Harden Server Security` - 6 edges
3. `Spec: request-security (delta)` - 5 edges
4. `Spec: secure-configuration (delta)` - 5 edges
5. `LoginRepository` - 4 edges
6. `ResourceBase` - 4 edges
7. `generateStandardRoute()` - 4 edges
8. `Route` - 4 edges
9. `init()` - 4 edges
10. `jdbc` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Requirement: Documented configuration example (.env.example + README)` --references--> `README: Environment Variables Documentation`  [EXTRACTED]
  openspec/changes/harden-server-security/specs/secure-configuration/spec.md → README.md
- `Tasks: Harden Server Security` --references--> `README: Environment Variables Documentation`  [EXTRACTED]
  openspec/changes/harden-server-security/tasks.md → README.md
- `README: Environment Variables Documentation` --references--> `KEY_REQUEST_AUTH Environment Variable`  [EXTRACTED]
  README.md → openspec/changes/harden-server-security/design.md
- `Design: Harden Server Security` --conceptually_related_to--> `Proposal: Harden Server Security`  [INFERRED]
  openspec/changes/harden-server-security/design.md → openspec/changes/harden-server-security/proposal.md
- `D1: Native env reading without mandatory dotenv` --rationale_for--> `Requirement: Secrets loaded via environment variables`  [INFERRED]
  openspec/changes/harden-server-security/design.md → openspec/changes/harden-server-security/specs/secure-configuration/spec.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Harden Server Security OpenSpec Change Artifacts** — openspec_changes_harden_server_security_proposal_harden_server_security, openspec_changes_harden_server_security_design_harden_server_security, openspec_changes_harden_server_security_tasks_harden_server_security, openspec_changes_harden_server_security_specs_request_security_spec_request_security, openspec_changes_harden_server_security_specs_secure_configuration_spec_secure_configuration, openspec_changes_harden_server_security_openspec_changes_harden_server_security_openspec_changes_harden_server_security_openspec_change_metadata [EXTRACTED 1.00]
- **Environment-Based Secret Configuration Flow** — openspec_changes_harden_server_security_design_d1_native_env_reading, openspec_changes_harden_server_security_specs_secure_configuration_spec_env_secrets, openspec_changes_harden_server_security_specs_secure_configuration_spec_fail_fast_missing_secret, openspec_changes_harden_server_security_specs_secure_configuration_spec_env_example, openspec_changes_harden_server_security_design_key_request_auth, readme_env_vars [INFERRED 0.85]

## Communities (25 total, 8 thin omitted)

### Community 0 - "Repositório de Login"
Cohesion: 0.06
Nodes (24): AppUtil, CryptoJS, dbConfig, dbEngine, dbGeneric, fs, Login, LoginRepository (+16 more)

### Community 2 - "Login Controller"
Cohesion: 0.08
Nodes (17): appUtil, Login, LoginController, messageEnum, Response, Login, AppUtil, Login (+9 more)

### Community 3 - "AppUtil e Interceptor"
Cohesion: 0.08
Nodes (18): _array, Mensagem, messageEnum, ResponseData, AppUtil, base64url, CryptoJS, jws (+10 more)

### Community 4 - "Conector JDBC"
Cohesion: 0.09
Nodes (20): appUtil, baseEnum, DatabaseGeneric, dbConfig, fs, java, JDBC, JDBCResultSet (+12 more)

### Community 5 - "Hardening de Segurança"
Cohesion: 0.13
Nodes (24): D1: Native env reading without mandatory dotenv, D2: CORS allowlist in existing manual middleware, D3: Fix interceptor without changing token contract, D4: Configurable payload limit with 1mb default, D5: Remove spawn monkey-patch and hardcoded gateway IP, Design: Harden Server Security, KEY_REQUEST_AUTH Environment Variable, child_process.spawn Monkey-Patch (removed) (+16 more)

### Community 6 - "Metadados do Pacote"
Cohesion: 0.09
Nodes (22): author, description, engines, node, java, lodash, uuid, license (+14 more)

### Community 7 - "Dependências NPM"
Cohesion: 0.12
Nodes (16): dependencies, annotation-js, base64url, body-parser, bunyan, chalk, crypto-js, express (+8 more)

### Community 8 - "Serviço de CEP"
Cohesion: 0.18
Nodes (8): AppUtil, CEPService, fs, messageEnum, Response, ResponseData, routeCreator, _

### Community 9 - "Geração de Rotas"
Cohesion: 0.29
Nodes (9): createRoute(), generateDirectRoute(), generateDominiosRoute(), generateStandardCRUDRoute(), generateStandardListRoute(), generateStandardRoute(), init(), makePublic() (+1 more)

### Community 10 - "Bootstrap do Servidor"
Cohesion: 0.31
Nodes (9): chalk, configServer(), init(), jws, mail, os, Route, setDependencies() (+1 more)

### Community 11 - "Sistema de Logs"
Cohesion: 0.31
Nodes (8): config, generateLogInterface(), init(), log(), logInterface, logStreams, makePublic(), setDependencies()

### Community 12 - "Configuração por Ambiente"
Cohesion: 0.25
Nodes (5): config, corsOrigins, mailPass, mailUser, sendEmail

### Community 13 - "Resource Base SOA"
Cohesion: 0.29
Nodes (3): ResourceBase, routeCreator, soaConnector

### Community 14 - "Roteador Principal"
Cohesion: 0.29
Nodes (3): entryPoints, path, Route

## Knowledge Gaps
- **135 isolated node(s):** `Login`, `appUtil`, `messageEnum`, `Response`, `dbEngine` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppUtil` connect `Utilitários AppUtil` to `AppUtil e Interceptor`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Dependências NPM` to `Metadados do Pacote`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `Login`, `appUtil`, `messageEnum` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Repositório de Login` be split into smaller, more focused modules?**
  _Cohesion score 0.06417112299465241 - nodes in this community are weakly interconnected._
- **Should `Utilitários AppUtil` be split into smaller, more focused modules?**
  _Cohesion score 0.06417112299465241 - nodes in this community are weakly interconnected._
- **Should `Login Controller` be split into smaller, more focused modules?**
  _Cohesion score 0.08262108262108261 - nodes in this community are weakly interconnected._
- **Should `AppUtil e Interceptor` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._