# TASK-19 — Scheduler Setup & World Online Job

| Campo | Valor |
|-------|-------|
| Epic | E6 — Background Jobs |
| Size | M |
| Status | Done |
| Depends on | TASK-15, TASK-18 |

---

## Descrição

Configurar o módulo de scheduler (`@nestjs/schedule`) e implementar o primeiro job de produção: coleta da lista de jogadores online do mundo Calmera. Este job é a principal fonte de descoberta de personagens em tempo real.

---

## Acceptance Criteria

- [ ] `SchedulerModule` criado e `ScheduleModule.forRoot()` registrado no `AppModule`
- [ ] `WorldOnlineJob` implementado:
  - Cron configurável via `ConfigService` (ex: a cada 5 minutos)
  - Fluxo:
    1. Consulta `TibiaRateLimitService.isBlocked()` — se bloqueado, pula
    2. Busca a URL da lista online para cada mundo `isTracked = true`
    3. Chama `TibiaHttpClientService.fetch(url)`
    4. Classifica outcome — reporta a `TibiaRateLimitService`
    5. Se `success`: parseia com `OnlineParser`
    6. Salva snapshot em `online_world_snapshots`
    7. Salva cada player em `online_players_snapshots`
    8. Chama `DiscoveryService.discover()` para cada player
    9. Atualiza `worlds.lastOnlineCount` e `worlds.updatedAt`
  - Aplica delay entre worlds via `TibiaRateLimitService.getDelayMs()`
  - Concorrência: 1 mundo por vez (Calmera only no MVP)
- [ ] Log estruturado a cada execução:
  - Mundo, quantidade de online, duração total, outcome
- [ ] Job não lança exceção não tratada — erros são capturados e logados

---

## Arquivos a criar / modificar

```
src/modules/scheduler/scheduler.module.ts
src/modules/scheduler/jobs/world-online.job.ts
src/app.module.ts (importar SchedulerModule)
src/config/schedule.config.ts (adicionar cron do job)
```

---

## Notas

- Usar `@Cron()` decorator do `@nestjs/schedule`
- O job deve ser idempotente — rodar duas vezes sem crash
- `online_players_snapshots` deve usar `createMany` com `skipDuplicates` para performance
- `DiscoveryService.discover()` para cada player com `source: DiscoverySource.ONLINE_LIST`
- Em caso de challenge/block, logar warning e aguardar próximo ciclo
