# TASK-08 — Characters Module — List & Profile

| Campo | Valor |
|-------|-------|
| Epic | E3 — Core API Modules |
| Size | M |
| Status | Done |
| Depends on | TASK-02, TASK-06 |

---

## Descrição

Implementar os endpoints base do módulo de personagens: listagem com filtros e busca de perfil individual. As outras rotas de characters (snapshots, XP, deaths) são implementadas nas tasks seguintes.

---

## Acceptance Criteria

- [x] `CharactersModule` criado e registrado no `AppModule`
- [x] **`GET /api/v1/characters`** (protegido):
  - Lista personagens indexados
  - Suporta query params:
    - `world` — filtra por mundo
    - `name` — busca parcial por nome (case-insensitive)
    - `isOnline` — filtra por online (booleano)
    - `page` e `limit` — paginação (default: page=1, limit=50)
  - Resposta: `{ data: [...], meta: { total, page, limit, totalPages } }`
  - Cada item: `{ id, name, world, level, vocation, lastSeenAt, lastSeenOnlineAt, isConfirmedWorld }`

- [x] **`GET /api/v1/characters/:name`** (protegido):
  - Busca personagem por nome (case-insensitive)
  - Retorna dados do `characters` + `character_profiles` em join
  - Retorna `404` se não encontrado
  - Resposta: `{ id, name, world, level, experience, vocation, guildName, residence, sex, lastFetchedAt, lastSeenAt, lastSeenOnlineAt, isConfirmedWorld, discoverySource }`

- [x] `CharactersService` com métodos:
  - `findAll(filters)` — query com paginação
  - `findByName(name)` — busca case-insensitive

- [x] DTOs de resposta e query tipados

---

## Arquivos a criar / modificar

```
src/modules/characters/characters.module.ts
src/modules/characters/characters.controller.ts
src/modules/characters/characters.service.ts
src/modules/characters/dto/character-list-query.dto.ts
src/modules/characters/dto/character-response.dto.ts
src/modules/characters/dto/character-profile-response.dto.ts
src/app.module.ts
```

---

## Notas

- A busca por nome deve usar `mode: 'insensitive'` do Prisma (SQLite suporta via `LIKE`)
- O join com `character_profiles` deve ser `LEFT JOIN` — perfil pode não existir ainda para personagens recém descobertos
- `level` e `vocation` no list vêm do `character_profiles`; se não existir, retornar null
