# TASK-23 — Discovery Reconciliation Job

| Campo | Valor |
|-------|-------|
| Epic | E6 — Background Jobs |
| Size | S |
| Status | Done |
| Depends on | TASK-18, TASK-19, TASK-20 |

---

## Descrição

Implementar o job de reconciliação do discovery index. Este job de manutenção limpa inconsistências, depriorizamos personagens inativos e garante que o master index reflita o estado real do mundo.

---

## Acceptance Criteria

- [ ] `DiscoveryReconciliationJob` implementado dentro do `SchedulerModule`
- [ ] Cron: uma vez por dia (ex: 04:00)
- [ ] Tarefas do job:
  1. **Deprioritize inativos**: personagens com `lastSeenAt` > 30 dias e `isActiveCandidate = true` → marca `isActiveCandidate = false`
     - Lógica: se não apareceu em nenhuma fonte há 30 dias, é candidato inativo
  2. **Reativar se aparecer novamente**: personagens com `isActiveCandidate = false` que aparecem em novo snapshot online → `DiscoveryService.discover()` já lida com isso (atualiza `lastSeenAt`)
  3. **Log de estado do index**:
     - Total de personagens indexados
     - Confirmados no mundo
     - Ativos
     - Inativos (depriorizados)
     - Aguardando confirmação de mundo
- [ ] Job não faz requisições HTTP — apenas operações internas de banco

---

## Arquivos a criar / modificar

```
src/modules/scheduler/jobs/discovery-reconciliation.job.ts
src/config/schedule.config.ts (adicionar cron)
```

---

## Notas

- Threshold de 30 dias configurável via `ConfigService`
- Este job é puramente de manutenção — não descarta dados, apenas muda flags
- O log de estado do index é valioso para monitorar o crescimento da base ao longo do tempo
- Personagens `isActiveCandidate = false` ainda aparecem na API — apenas não são priorizados para refresh
