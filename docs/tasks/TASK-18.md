# TASK-18 — Discovery Module & Reconciliation Service

| Campo | Valor |
|-------|-------|
| Epic | E5 — Discovery System |
| Size | M |
| Status | Done |
| Depends on | TASK-15, TASK-16, TASK-17 |

---

## Descrição

Implementar o módulo de descoberta de personagens. Este serviço é o "cérebro" que decide como um personagem entra no master index. Centraliza a lógica de upsert de personagens descobertos por qualquer fonte, mantendo rastreabilidade da origem.

---

## Acceptance Criteria

- [ ] `DiscoveryModule` criado com `DiscoveryService`
- [ ] `DiscoveryService.discover(input: DiscoverInput): Promise<void>`
  - `DiscoverInput`:
    ```ts
    {
      characterName: string;
      world: string;
      source: DiscoverySource;      // enum da TASK-04
      sourceKey?: string;           // ex: "highscores:experience:page1"
      seenOnlineAt?: Date;          // se veio de online list
    }
    ```
  - Comportamento:
    - Se personagem não existe: insere em `characters` com `isConfirmedWorld = false`, `isActiveCandidate = true`
    - Se personagem existe: atualiza `lastSeenAt`; se `seenOnlineAt` fornecido, atualiza `lastSeenOnlineAt`
    - Sempre insere em `discovery_edges` para rastreabilidade
  - Operação idempotente — chamar múltiplas vezes com os mesmos dados não causa duplicatas

- [ ] `DiscoveryService.confirmWorld(characterName: string, world: string): Promise<void>`
  - Chamado pelo job de profile refresh quando perfil confirma o mundo
  - Atualiza `isConfirmedWorld = true` e `lastProfileScanAt`

- [ ] `DiscoveryService.getDiscoveryQueue(world: string, limit: number): Promise<Character[]>`
  - Retorna personagens com `isConfirmedWorld = false` para scan prioritário
  - Retorna personagens com `lastProfileScanAt` mais antigo para refresh periódico
  - Prioriza personagens nunca escaneados

- [ ] Testes unitários dos métodos principais

---

## Arquivos a criar / modificar

```
src/modules/discovery/discovery.module.ts
src/modules/discovery/discovery.service.ts
src/app.module.ts (importar DiscoveryModule)
```

---

## Notas

- `discovery_edges` nunca deve ser deduplicado — é um log de eventos, não um estado
- O upsert de `characters` deve usar `upsert` do Prisma com `create` + `update` para ser atômico
- `getDiscoveryQueue` é chamado pelos jobs — deve ser eficiente (índice em `lastProfileScanAt`)
- `DiscoveryModule` deve exportar `DiscoveryService` para uso nos jobs
