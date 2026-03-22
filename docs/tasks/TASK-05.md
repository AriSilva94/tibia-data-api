# TASK-05 — Users Module

| Campo | Valor |
|-------|-------|
| Epic | E2 — Authentication & Users |
| Size | S |
| Status | Todo |
| Depends on | TASK-02, TASK-03 |

---

## Descrição

Implementar o módulo de usuários da API. Este módulo não expõe endpoints públicos de criação — usuários são criados via seed ou internamente. O foco é o serviço de lookup que será consumido pelo módulo de Auth.

---

## Acceptance Criteria

- [ ] `UsersModule` criado e importado no `AppModule`
- [ ] `UsersService` com os métodos:
  - `findByEmail(email: string)` — retorna usuário ou null
  - `findById(id: number)` — retorna usuário ou null
  - `create(data: CreateUserDto)` — cria usuário com senha hasheada via bcrypt
- [ ] `CreateUserDto` com validações (`class-validator`):
  - `email` — obrigatório, formato email
  - `password` — obrigatório, mínimo 8 caracteres
  - `role` — opcional, default `admin`
- [ ] Senha nunca retornada em nenhum método público
- [ ] **Seed script** (`prisma/seed.ts`) criado:
  - Cria um usuário admin padrão usando variáveis de ambiente
  - Executa com `npx prisma db seed`
- [ ] `package.json` com script `prisma.seed` apontando para o seed

---

## Arquivos a criar / modificar

```
src/modules/users/users.module.ts
src/modules/users/users.service.ts
src/modules/users/dto/create-user.dto.ts
prisma/seed.ts
package.json (script de seed)
src/app.module.ts (importar UsersModule)
```

---

## Notas

- `bcrypt` rounds: usar 10 como padrão
- O `UsersService` deve ser `exported` pelo módulo para que o `AuthModule` possa importá-lo
- A senha deve ser removida do objeto antes de qualquer retorno (`const { passwordHash, ...rest } = user`)
