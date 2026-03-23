# TASK-20 — Highscores Sync Job

| Campo | Valor |
|-------|-------|
| Epic | E6 — Background Jobs |
| Size | M |
| Status | Done |
| Depends on | TASK-16, TASK-18 |

---

## Descrição

Implementar o job de sincronização de highscores. Este job coleta os rankings públicos do Tibia para o mundo Calmera, armazena os snapshots e usa os nomes dos personagens como fonte adicional de descoberta.

---

## Acceptance Criteria

- [ ] `HighscoresSyncJob` implementado dentro do `SchedulerModule`
- [ ] Cron configurável (ex: 1x por dia, às 03:00)
- [ ] Categorias a coletar configuráveis (ex: `experience`, `magic`, `sword`, `axe`, `club`, `distance`, `shielding`, `fist`, `fishing`, `achievements`)
- [ ] Fluxo por categoria:
  1. Verifica `TibiaRateLimitService.isBlocked()`
  2. Para cada página (1 a N — enquanto houver entries):
     - Aplica delay via `TibiaRateLimitService.getDelayMs()`
     - Busca a URL de highscores para world + category + page
     - Chama `TibiaHttpClientService.fetch(url)`
     - Classifica outcome
     - Se `success`: parseia com `HighscoresParser`
     - Salva entries em `highscores_snapshots` com `createMany + skipDuplicates`
     - Chama `DiscoveryService.discover()` para cada nome encontrado
  3. Para quando a página retornar 0 entries
- [ ] Aplica concorrência controlada entre requests (p-limit via `TibiaRateLimitService`)
- [ ] Log por categoria: total de entries coletados, páginas, duração

---

## Arquivos a criar / modificar

```
src/modules/scheduler/jobs/highscores-sync.job.ts
src/config/schedule.config.ts (adicionar cron e lista de categorias)
```

---

## Notas

- Este job é o mais demorado — pode coletar centenas de páginas
- Importante: não deletar snapshots antigos — o histórico de highscores é valioso
- `collectedAt` deve ser o mesmo timestamp para todas as entries de uma mesma execução do job (não o timestamp de cada request individual)
- Se uma categoria falhar no meio, as páginas já coletadas são válidas e devem ser mantidas
- `source: DiscoverySource.HIGHSCORES` no `DiscoveryService.discover()`
