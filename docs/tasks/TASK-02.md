# TASK-02 — Prisma Schema — All Tables

| Campo | Valor |
|-------|-------|
| Epic | E1 — Project Foundation |
| Size | M |
| Status | Todo |
| Depends on | TASK-01 |

---

## Descrição

Criar o schema completo do Prisma com todos os modelos de dados definidos no CLAUDE.md (seção 12), configurar o datasource SQLite e executar a migration inicial.

Este é o contrato de dados do projeto — todas as outras tasks dependem da estrutura aqui definida.

---

## Acceptance Criteria

- [ ] `prisma/schema.prisma` criado com datasource SQLite
- [ ] Todos os 11 modelos criados com os campos corretos:
  - `users`
  - `worlds`
  - `characters`
  - `character_profiles`
  - `character_snapshots`
  - `character_daily_metrics`
  - `character_deaths`
  - `online_world_snapshots`
  - `online_players_snapshots`
  - `highscores_snapshots`
  - `discovery_edges`
- [ ] Relacionamentos definidos corretamente (foreign keys, relações 1:N)
- [ ] Índices criados para campos de busca frequente:
  - `characters.name`, `characters.world`
  - `character_snapshots.characterId`, `character_snapshots.collectedAt`
  - `character_deaths.dedupeHash`
  - `online_players_snapshots.world`, `online_players_snapshots.collectedAt`
  - `highscores_snapshots.world`, `highscores_snapshots.collectedAt`
- [ ] `prisma/prisma.module.ts` e `prisma/prisma.service.ts` criados
- [ ] `PrismaModule` importado no `AppModule`
- [ ] Migration inicial executada com `npx prisma migrate dev --name init`
- [ ] `npx prisma generate` executa sem erros
- [ ] `prisma/dev.db` criado corretamente

---

## Arquivos a criar / modificar

```
prisma/schema.prisma
prisma/migrations/ (gerado automaticamente)
src/prisma/prisma.module.ts
src/prisma/prisma.service.ts
src/app.module.ts (importar PrismaModule)
```

---

## Notas

- `character_deaths.dedupeHash` deve ter constraint `@unique` para evitar duplicatas
- `character_daily_metrics` deve ter índice composto `(characterId, date)` com `@@unique`
- Todos os modelos devem ter `createdAt` com `@default(now())`
- Campos `updatedAt` devem usar `@updatedAt`
- Usar `@@map` para manter nomes de tabela com underscore no banco (ex: `@@map("character_profiles")`)
