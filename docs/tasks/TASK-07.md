# TASK-07 — Worlds Module — API Endpoints

| Campo | Valor |
|-------|-------|
| Epic | E3 — Core API Modules |
| Size | S |
| Status | Done |
| Depends on | TASK-02, TASK-06 |

---

## Descrição

Implementar os endpoints de leitura do módulo de mundos. Todos os dados são servidos do banco local — sem scraping durante a requisição.

---

## Acceptance Criteria

- [x] `WorldsModule` criado e registrado no `AppModule`
- [x] **`GET /api/v1/worlds`** (protegido):
  - Lista todos os mundos onde `isTracked = true`
  - Retorna: `{ id, name, region, pvpType, isTracked, lastOnlineCount, createdAt }`
- [x] **`GET /api/v1/worlds/:name`** (protegido):
  - Retorna dados de um mundo específico por nome
  - Retorna `404` se não encontrado
- [x] **`GET /api/v1/worlds/:name/online`** (protegido):
  - Retorna o último snapshot de jogadores online do mundo
  - Resposta inclui: `{ world, collectedAt, isStale, onlineCount, players: [{ characterName, level, vocation }] }`
  - `isStale = true` se `collectedAt` for mais antigo que 30 minutos
  - Retorna `404` se nenhum snapshot encontrado
- [x] DTOs de resposta tipados com `class-transformer`
- [x] `WorldsService` com métodos internos para cada query

---

## Arquivos a criar / modificar

```
src/modules/worlds/worlds.module.ts
src/modules/worlds/worlds.controller.ts
src/modules/worlds/worlds.service.ts
src/modules/worlds/dto/world-response.dto.ts
src/modules/worlds/dto/world-online-response.dto.ts
src/app.module.ts
```

---

## Notas

- O campo `isStale` é calculado em runtime, não armazenado
- Nenhuma lógica de scraping aqui — apenas leitura do Prisma
- O mundo "Calmera" deve ser inserido via seed (junto com o usuário admin da TASK-05)
- Usar `@SerializeOptions({ excludeExtraneousValues: true })` para garantir limpeza do response
