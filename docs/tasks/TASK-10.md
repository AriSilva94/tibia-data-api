# TASK-10 — Characters Module — Daily XP Endpoint

| Campo | Valor |
|-------|-------|
| Epic | E3 — Core API Modules |
| Size | S |
| Status | Todo |
| Depends on | TASK-08 |

---

## Descrição

Adicionar o endpoint de XP diário ao módulo de personagens. Os dados são servidos da tabela `character_daily_metrics`, que é populada pelo job de métricas (TASK-22).

---

## Acceptance Criteria

- [ ] **`GET /api/v1/characters/:name/xp`** (protegido):
  - Retorna métricas diárias de XP do personagem
  - Suporta query params:
    - `from` — data inicial (YYYY-MM-DD)
    - `to` — data final (YYYY-MM-DD)
    - `limit` — máximo de dias (default: 30, max: 90)
  - Retorna `404` se personagem não encontrado
  - Retorna lista vazia se não há métricas ainda (não é erro)
  - Resposta:
    ```json
    {
      "characterName": "...",
      "world": "...",
      "metrics": [
        {
          "date": "2026-03-22",
          "expGained": 12500000,
          "expStart": 100000000,
          "expEnd": 112500000,
          "levelStart": 300,
          "levelEnd": 300,
          "levelsGained": 0,
          "deathsCount": 1
        }
      ]
    }
    ```
  - Ordenação: `date DESC`

- [ ] `CharactersService.getDailyXp(name, filters)` implementado
- [ ] DTO de query e resposta tipados

---

## Arquivos a criar / modificar

```
src/modules/characters/characters.controller.ts (novo endpoint)
src/modules/characters/characters.service.ts (novo método)
src/modules/characters/dto/daily-xp-query.dto.ts
src/modules/characters/dto/daily-xp-response.dto.ts
```

---

## Notas

- Datas no formato `YYYY-MM-DD` (não datetime) pois representam o dia, não um instante
- `deathsCount` vem da tabela `character_daily_metrics` — é calculado pelo job, não consultado em tempo real
- Se nenhum dado ainda, retornar `{ characterName, world, metrics: [] }` com status 200
