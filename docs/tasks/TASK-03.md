# TASK-03 — Global Config Module

| Campo | Valor |
|-------|-------|
| Epic | E1 — Project Foundation |
| Size | S |
| Status | Todo |
| Depends on | TASK-01 |

---

## Descrição

Criar o módulo de configuração global usando `@nestjs/config`, centralizando todas as variáveis de ambiente com tipagem forte e validação na inicialização.

---

## Acceptance Criteria

- [ ] `@nestjs/config` instalado e `ConfigModule` registrado globalmente no `AppModule`
- [ ] Arquivo `src/config/app.config.ts` criado com:
  - `PORT`
  - `NODE_ENV`
  - `API_PREFIX` (padrão: `api/v1`)
- [ ] Arquivo `src/config/auth.config.ts` criado com:
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
- [ ] Arquivo `src/config/database.config.ts` criado com:
  - `DATABASE_URL`
- [ ] Arquivo `src/config/schedule.config.ts` criado com:
  - Intervalos dos jobs (ex: `ONLINE_JOB_CRON`, `HIGHSCORES_JOB_CRON`, etc.)
- [ ] `.env.example` atualizado com todas as variáveis
- [ ] Validação de variáveis obrigatórias na inicialização (ex: `JWT_SECRET` não pode ser undefined em produção)
- [ ] Todos os configs acessíveis via `ConfigService` tipado

---

## Arquivos a criar / modificar

```
src/config/app.config.ts
src/config/auth.config.ts
src/config/database.config.ts
src/config/schedule.config.ts
src/app.module.ts
.env.example
```

---

## Notas

- Usar `registerAs` do `@nestjs/config` para namespaced configs
- Variáveis de ambiente devem ter valores default sensatos para dev local
- Nunca commitar `.env` com valores reais
