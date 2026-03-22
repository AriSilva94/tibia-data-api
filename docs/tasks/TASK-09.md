# TASK-09 — Characters Module — Snapshots Endpoint

| Campo | Valor |
|-------|-------|
| Epic | E3 — Core API Modules |
| Size | S |
| Status | Todo |
| Depends on | TASK-08 |

---

## Descrição

Adicionar o endpoint de snapshots históricos ao módulo de personagens. Permite ao front-end visualizar o histórico de XP e level de um personagem ao longo do tempo.

---

## Acceptance Criteria

- [ ] **`GET /api/v1/characters/:name/snapshots`** (protegido):
  - Retorna snapshots históricos do personagem
  - Suporta query params:
    - `from` — data inicial (ISO 8601)
    - `to` — data final (ISO 8601)
    - `limit` — máximo de registros (default: 100, max: 500)
  - Retorna `404` se personagem não encontrado
  - Resposta: `{ characterName, world, snapshots: [{ collectedAt, level, experience, vocation, guildName, sourceType }] }`
  - Ordenação: `collectedAt DESC`

- [ ] `CharactersService.getSnapshots(name, filters)` implementado
- [ ] DTO de query com validações de data e limit

---

## Arquivos a criar / modificar

```
src/modules/characters/characters.controller.ts (novo endpoint)
src/modules/characters/characters.service.ts (novo método)
src/modules/characters/dto/snapshots-query.dto.ts
src/modules/characters/dto/snapshots-response.dto.ts
```

---

## Notas

- Validar que `from` <= `to` se ambos fornecidos
- `sourceType` indica a origem do snapshot: `online_list`, `profile_refresh`, etc.
- Limitar por `limit` para evitar respostas enormes
