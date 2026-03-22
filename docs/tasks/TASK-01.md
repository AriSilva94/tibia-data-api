# TASK-01 — Project Bootstrap

| Campo | Valor |
|-------|-------|
| Epic | E1 — Project Foundation |
| Size | S |
| Status | Done |
| Depends on | — |

---

## Descrição

Inicializar o projeto NestJS com toda a estrutura base: TypeScript, estrutura de pastas conforme o CLAUDE.md, arquivos de configuração iniciais e dependências instaladas.

Esta é a task zero — nenhuma outra pode começar sem ela.

---

## Acceptance Criteria

- [ ] Projeto NestJS criado com `nest new`
- [ ] TypeScript configurado (`tsconfig.json`, `tsconfig.build.json`)
- [ ] Estrutura de pastas criada conforme seção 16 do CLAUDE.md:
  - `src/common/` com subpastas (constants, decorators, dto, enums, filters, guards, interceptors, pipes, utils)
  - `src/config/`
  - `src/modules/` com subpastas para todos os módulos previstos
  - `src/prisma/`
- [ ] Todas as dependências instaladas:
  - `@nestjs/schedule`, `@nestjs/jwt`, `@nestjs/passport`
  - `passport`, `passport-jwt`
  - `prisma`, `@prisma/client`
  - `cheerio`
  - `bcrypt`, `@types/bcrypt`
  - `class-validator`, `class-transformer`
  - `p-limit`
  - `dayjs`
- [ ] `.env.example` criado com todas as variáveis necessárias
- [ ] `.gitignore` configurado (node_modules, .env, prisma/dev.db)
- [ ] `nest-cli.json` configurado corretamente
- [ ] `eslint` e `prettier` configurados
- [ ] `npm run build` executa sem erros
- [ ] `npm run start:dev` sobe a aplicação sem erros

---

## Arquivos a criar / modificar

```
package.json
tsconfig.json
tsconfig.build.json
nest-cli.json
.env.example
.gitignore
eslint.config.mjs
.prettierrc
src/main.ts
src/app.module.ts
src/app.controller.ts (pode remover o padrão)
src/app.service.ts (pode remover o padrão)
```

---

## Notas

- O `main.ts` deve já definir o global prefix `api/v1`
- Habilitar `ValidationPipe` globalmente no bootstrap
- Definir porta via variável de ambiente com fallback para 3000
