# TASK-24 — Health Endpoint

| Campo | Valor |
|-------|-------|
| Epic | E7 — Health & Security |
| Size | S |
| Status | Todo |
| Depends on | TASK-02 |

---

## Descrição

Implementar um endpoint de health check que permite monitorar o estado da aplicação: conectividade com o banco, estado do collector e métricas básicas do sistema.

---

## Acceptance Criteria

- [ ] `HealthModule` criado e registrado no `AppModule`
- [ ] **`GET /api/v1/health`** (público — sem autenticação):
  - Resposta em caso de saudável:
    ```json
    {
      "status": "ok",
      "timestamp": "2026-03-22T00:00:00Z",
      "database": "ok",
      "collector": {
        "isBlocked": false,
        "currentDelayMs": 500,
        "concurrencyLimit": 3
      },
      "index": {
        "totalCharacters": 1523,
        "confirmedCharacters": 1200,
        "activeCharacters": 900
      }
    }
    ```
  - Resposta em caso de falha (banco offline):
    ```json
    {
      "status": "degraded",
      "database": "error",
      ...
    }
    ```
  - HTTP 200 sempre (não usar 503 para evitar restart por health check de plataforma)

- [ ] Verificação do banco: executar `SELECT 1` via Prisma
- [ ] Estado do collector: via `TibiaRateLimitService.getStatus()`
- [ ] Métricas do index: counts simples do banco

---

## Arquivos a criar / modificar

```
src/modules/health/health.module.ts
src/modules/health/health.controller.ts
src/app.module.ts
```

---

## Notas

- Marcar o endpoint com `@Public()` — não requer autenticação
- Não expor informações sensíveis (sem credenciais, sem paths internos)
- Manter simples — este não é um sistema de APM, apenas um heartbeat básico
