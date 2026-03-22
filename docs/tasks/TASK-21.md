# TASK-21 — Character Profile Refresh Job

| Campo | Valor |
|-------|-------|
| Epic | E6 — Background Jobs |
| Size | M |
| Status | Todo |
| Depends on | TASK-17, TASK-18 |

---

## Descrição

Implementar o job que faz refresh periódico dos perfis individuais de personagens indexados. Este é o job mais importante para manutenção da base: confirma o mundo de cada personagem, atualiza dados de perfil, salva snapshots históricos e coleta mortes recentes.

---

## Acceptance Criteria

- [ ] `CharacterRefreshJob` implementado dentro do `SchedulerModule`
- [ ] Cron configurável (ex: a cada 2 horas)
- [ ] Fluxo:
  1. Verifica `TibiaRateLimitService.isBlocked()`
  2. Busca lote de personagens via `DiscoveryService.getDiscoveryQueue(world, limit)`
     - Prioridade: nunca escaneados > mais antigos
     - Limit configurável (ex: 100 por execução)
  3. Para cada personagem (com concorrência controlada pelo p-limit):
     - Aplica delay via `TibiaRateLimitService.getDelayMs()`
     - Fetch do perfil via `TibiaHttpClientService.fetch(url)`
     - Classifica outcome
     - Se `success`:
       - Parseia com `CharacterParser`
       - Verifica se `world == Calmera` → chama `DiscoveryService.confirmWorld()`
       - Se mundo diferente: marca `isActiveCandidate = false`, não atualiza perfil
       - Upsert em `character_profiles`
       - Insere em `character_snapshots` com `sourceType = 'profile_refresh'`
       - Insere mortes em `character_deaths` usando `dedupeHash` (upsert com skipDuplicate)
       - Atualiza `characters.lastProfileScanAt`
- [ ] Log por execução: total processado, confirmados, fora do mundo, erros

---

## Arquivos a criar / modificar

```
src/modules/scheduler/jobs/character-refresh.job.ts
src/config/schedule.config.ts (adicionar cron e batch size)
```

---

## Notas

- Concorrência: máximo 3 requests simultâneos para não sobrecarregar (configurável)
- Personagens fora do mundo Calmera devem ter `isActiveCandidate = false` — não são removidos do index, apenas depriorizados
- O snapshot de `character_snapshots` deve ser inserido mesmo que o perfil não mude — é o histórico que importa
- `skipDuplicates` no `character_deaths` usando o `dedupeHash` como chave única
- Em caso de personagem deletado/não encontrado: marcar `isActiveCandidate = false`
