# TASK-22 — Daily Metrics Calculation Job

| Campo | Valor |
|-------|-------|
| Epic | E6 — Background Jobs |
| Size | M |
| Status | Todo |
| Depends on | TASK-21 |

---

## Descrição

Implementar o job que calcula e persiste as métricas diárias de cada personagem (XP ganho, levels ganhos, mortes do dia). Este job roda uma vez por dia, lê os snapshots do dia e deriva as métricas consolidadas.

---

## Acceptance Criteria

- [ ] `DailyMetricsJob` implementado dentro do `SchedulerModule`
- [ ] Cron: uma vez por dia (ex: 23:30 ou meia-noite)
- [ ] Fluxo:
  1. Determina a data alvo (dia anterior ou dia atual configurável)
  2. Para cada personagem `isConfirmedWorld = true` em mundos `isTracked = true`:
     - Busca snapshots do dia alvo em `character_snapshots`
     - Se 0 snapshots: pula (sem dados para o dia)
     - Se 1+ snapshots:
       - `expStart` = menor `experience` do dia (snapshot mais antigo)
       - `expEnd` = maior `experience` do dia (snapshot mais recente)
       - `expGained = expEnd - expStart` (mínimo 0 — não pode ser negativo por morte)
       - `levelStart` = level do snapshot mais antigo
       - `levelEnd` = level do snapshot mais recente
       - `levelsGained = levelEnd - levelStart`
       - `deathsCount` = count de `character_deaths` com `deathAt` no dia alvo
     - Upsert em `character_daily_metrics` (unique: characterId + date)
- [ ] Log: total de personagens processados, com métricas, pulados por falta de snapshot

---

## Arquivos a criar / modificar

```
src/modules/scheduler/jobs/daily-metrics.job.ts
src/config/schedule.config.ts (adicionar cron)
```

---

## Notas

- `expGained` nunca negativo — se o personagem morreu e perdeu XP, o campo fica 0 (não negativo)
- O upsert deve usar `(characterId, date)` como chave composta — o job pode ser reexecutado para recalcular o mesmo dia
- Processar em batches para não carregar todos os personagens de uma vez em memória
- A data usada em `character_daily_metrics.date` é o dia no timezone do servidor (ou UTC, desde que consistente)
- Este job é leve comparado aos outros — apenas lê snapshots e agrega, sem HTTP externo
