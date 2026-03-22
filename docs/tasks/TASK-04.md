# TASK-04 — Common Infrastructure

| Campo | Valor |
|-------|-------|
| Epic | E1 — Project Foundation |
| Size | M |
| Status | Todo |
| Depends on | TASK-01 |

---

## Descrição

Implementar toda a infraestrutura transversal do projeto: filtros globais de exceção, interceptors de resposta, pipes de validação, decorators reutilizáveis e utilitários comuns. Esses elementos serão usados por todos os módulos de domínio.

---

## Acceptance Criteria

- [ ] **Global Exception Filter** (`src/common/filters/http-exception.filter.ts`):
  - Captura todas as exceções não tratadas
  - Retorna payload padronizado: `{ statusCode, message, error, timestamp, path }`
  - Loga erros inesperados (5xx)
  - Registrado globalmente no `main.ts`

- [ ] **Response Interceptor** (`src/common/interceptors/response.interceptor.ts`):
  - Envolve respostas de sucesso em envelope padrão: `{ data, meta? }`
  - Aplicado globalmente

- [ ] **Validation Pipe** configurado globalmente no `main.ts`:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`

- [ ] **Decorators**:
  - `@CurrentUser()` — extrai o usuário do request JWT
  - `@Public()` — marca rotas como públicas (sem auth)

- [ ] **Enums** (`src/common/enums/`):
  - `UserRole` (`admin`, `client`, `internal`)
  - `DiscoverySource` (`online_list`, `highscores`, `guild`, `profile`, `user_lookup`)
  - `CollectorOutcome` (`success`, `timeout`, `network_error`, `parse_error`, `challenge`, `block`)
  - `VocationEnum` (vocações do Tibia)

- [ ] **Utilitários** (`src/common/utils/`):
  - `hash.util.ts` — gerar hash de deduplicação (SHA256)
  - `date.util.ts` — helpers de data com dayjs

- [ ] Tudo registrado e funcionando sem erros de build

---

## Arquivos a criar / modificar

```
src/common/filters/http-exception.filter.ts
src/common/interceptors/response.interceptor.ts
src/common/decorators/current-user.decorator.ts
src/common/decorators/public.decorator.ts
src/common/enums/user-role.enum.ts
src/common/enums/discovery-source.enum.ts
src/common/enums/collector-outcome.enum.ts
src/common/enums/vocation.enum.ts
src/common/utils/hash.util.ts
src/common/utils/date.util.ts
src/main.ts (registrar filter e pipes globais)
```

---

## Notas

- O `@Public()` decorator será usado na TASK-06 para marcar a rota de login
- O `hash.util.ts` será crítico na TASK-17 para deduplicate deaths
- Manter todos os enums alinhados com os valores aceitos pelo banco (Prisma enums ou strings)
