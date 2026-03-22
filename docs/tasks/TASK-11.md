# TASK-11 — Characters Module — Deaths Endpoint

| Campo | Valor |
|-------|-------|
| Epic | E3 — Core API Modules |
| Size | S |
| Status | Done |
| Depends on | TASK-08 |

---

## Descrição

Adicionar o endpoint de mortes ao módulo de personagens. Os dados são servidos da tabela `character_deaths`, populada pelo job de profile refresh (TASK-21).

---

## Acceptance Criteria

- [x] **`GET /api/v1/characters/:name/deaths`** (protegido):
  - Retorna histórico de mortes do personagem
  - Suporta query params:
    - `from` — data inicial (ISO 8601)
    - `to` — data final (ISO 8601)
    - `limit` — máximo de registros (default: 50, max: 200)
  - Retorna `404` se personagem não encontrado
  - Retorna lista vazia se não há mortes (não é erro)
  - Resposta:
    ```json
    {
      "characterName": "...",
      "world": "...",
      "deaths": [
        {
          "deathAt": "2026-03-22T14:30:00Z",
          "level": 298,
          "killersRaw": "a demon",
          "collectedAt": "2026-03-22T15:00:00Z"
        }
      ]
    }
    ```
  - Ordenação: `deathAt DESC`

- [x] `CharactersService.getDeaths(name, filters)` implementado
- [x] DTO de query e resposta tipados

---

## Arquivos a criar / modificar

```
src/modules/characters/characters.controller.ts (novo endpoint)
src/modules/characters/characters.service.ts (novo método)
src/modules/characters/dto/deaths-query.dto.ts
src/modules/characters/dto/deaths-response.dto.ts
```

---

## Notas

- `killersRaw` é armazenado como string (JSON string ou texto livre do HTML parseado)
- Mortes são deduplicadas no momento da inserção via `dedupeHash` (TASK-17) — aqui só lemos
- `dedupeHash` não deve ser exposto na resposta da API
