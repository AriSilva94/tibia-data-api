# TASK-12 — Highscores Module — API Endpoints

| Campo | Valor |
|-------|-------|
| Epic | E3 — Core API Modules |
| Size | S |
| Status | Done |
| Depends on | TASK-02, TASK-06 |

---

## Descrição

Implementar os endpoints de leitura do módulo de highscores. Expõe os rankings armazenados localmente, coletados pelo job de highscores.

---

## Acceptance Criteria

- [x] `HighscoresModule` criado e registrado no `AppModule`
- [x] **`GET /api/v1/highscores`** (protegido):
  - Suporta query params:
    - `world` — obrigatório
    - `category` — categoria do ranking (ex: `experience`, `magic`, `sword`, etc.)
    - `page` — página do ranking (default: 1)
  - Retorna o snapshot mais recente para os filtros dados
  - Resposta:
    ```json
    {
      "world": "Calmera",
      "category": "experience",
      "collectedAt": "...",
      "isStale": false,
      "entries": [
        { "rank": 1, "characterName": "...", "vocation": "...", "value": "123456789" }
      ]
    }
    ```
  - `isStale = true` se `collectedAt` mais antigo que 24h
  - Retorna `404` se nenhum snapshot para os filtros

- [x] `HighscoresService` com query interna eficiente (buscar o `collectedAt` mais recente para world+category+page)

---

## Arquivos a criar / modificar

```
src/modules/highscores/highscores.module.ts
src/modules/highscores/highscores.controller.ts
src/modules/highscores/highscores.service.ts
src/modules/highscores/dto/highscores-query.dto.ts
src/modules/highscores/dto/highscores-response.dto.ts
src/app.module.ts
```

---

## Notas

- A query deve buscar o `MAX(collectedAt)` para o grupo world+category+page e depois retornar todos os entries desse timestamp
- Categorias válidas devem ser definidas como enum ou constante
- `isStale` calculado em runtime
