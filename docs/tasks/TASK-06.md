# TASK-06 — Auth Module (JWT)

| Campo | Valor |
|-------|-------|
| Epic | E2 — Authentication & Users |
| Size | M |
| Status | Done |
| Depends on | TASK-05 |

---

## Descrição

Implementar autenticação completa com JWT. Inclui o endpoint de login, estratégia Passport JWT, guard global de autenticação e endpoint `/me`.

---

## Acceptance Criteria

- [x] `AuthModule` criado e registrado no `AppModule`
- [x] **Endpoint `POST /api/v1/auth/login`** (público):
  - Recebe `{ email, password }`
  - Valida credenciais via `UsersService`
  - Retorna `{ accessToken, user: { id, email, role } }`
  - Retorna `401` se credenciais inválidas
- [x] **Endpoint `GET /api/v1/auth/me`** (protegido):
  - Retorna dados do usuário logado
  - Retorna `401` se token inválido ou ausente
- [x] `JwtStrategy` implementada com `passport-jwt`:
  - Extrai token do header `Authorization: Bearer <token>`
  - Valida e decodifica o payload
  - Injeta usuário no `request.user`
- [x] **`JwtAuthGuard`** global:
  - Aplicado em todas as rotas por padrão via `APP_GUARD`
  - Rotas marcadas com `@Public()` são ignoradas pelo guard
- [x] `LoginDto` com validações:
  - `email` — obrigatório, formato email
  - `password` — obrigatório, string
- [x] `JWT_SECRET` lido via `ConfigService`
- [x] `JWT_EXPIRES_IN` configurável (ex: `7d`)

---

## Arquivos a criar / modificar

```
src/modules/auth/auth.module.ts
src/modules/auth/auth.controller.ts
src/modules/auth/auth.service.ts
src/modules/auth/strategies/jwt.strategy.ts
src/modules/auth/guards/jwt-auth.guard.ts
src/modules/auth/dto/login.dto.ts
src/app.module.ts (registrar JwtAuthGuard como APP_GUARD)
```

---

## Notas

- O guard global deve usar `Reflector` para checar o metadata `isPublic` do decorator `@Public()`
- Não usar `LocalStrategy` — validar credenciais diretamente no `AuthService`
- O payload do JWT deve conter: `sub` (userId), `email`, `role`
- `bcrypt.compare` para verificar a senha
