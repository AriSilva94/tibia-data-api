# TASK-25 — Security Hardening

| Campo | Valor |
|-------|-------|
| Epic | E7 — Health & Security |
| Size | M |
| Status | Todo |
| Depends on | TASK-06, TASK-04 |

---

## Descrição

Aplicar todas as camadas de segurança recomendadas: CORS, rate limiting no login, helmet, sanitização de inputs e estruturação de logs. Esta task garante que a API esteja pronta para exposição controlada.

---

## Acceptance Criteria

- [ ] **CORS** configurado no `main.ts`:
  - `origin` restrito a lista de origens permitidas (via env `ALLOWED_ORIGINS`)
  - Métodos e headers permitidos explícitos

- [ ] **Rate Limiting** no endpoint de login:
  - Instalar `@nestjs/throttler`
  - Configurar limite no endpoint `POST /api/v1/auth/login` (ex: 10 tentativas por minuto por IP)
  - Retorna `429 Too Many Requests` quando excedido

- [ ] **Helmet** instalado e configurado:
  - Headers de segurança HTTP padrão (X-Frame-Options, X-Content-Type-Options, etc.)

- [ ] **Structured Logging** com níveis:
  - Usar logger nativo do NestJS com contexto em todas as classes
  - Log de cada request (método, rota, status, duração) via interceptor ou middleware
  - Nível de log configurável via env `LOG_LEVEL` (debug, log, warn, error)
  - Logs de jobs com contexto identificado (`[WorldOnlineJob]`, etc.)

- [ ] **Global Exception Filter** revisado (da TASK-04):
  - Não vazar stack trace em produção (`NODE_ENV === 'production'`)
  - Logar todos os 5xx com stack completo

- [ ] **Validação de inputs** global já configurada na TASK-04 — verificar está ativa:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`

- [ ] Variáveis de ambiente do `.env.example` atualizadas com as novas (ALLOWED_ORIGINS, LOG_LEVEL)

---

## Arquivos a criar / modificar

```
src/main.ts (CORS, Helmet, global pipes)
src/modules/auth/auth.controller.ts (Throttler no login)
src/common/interceptors/logging.interceptor.ts
src/common/filters/http-exception.filter.ts (ajuste para prod)
.env.example
package.json (instalar @nestjs/throttler, helmet)
```

---

## Notas

- `helmet` é middleware Express — instalar com `app.use(helmet())`
- `ALLOWED_ORIGINS` pode ser `*` em dev, mas deve ser restrito em produção
- Não usar `console.log` em nenhum lugar — sempre `this.logger = new Logger(ClassName.name)`
- Stack trace nunca deve aparecer em resposta HTTP — apenas nos logs internos
