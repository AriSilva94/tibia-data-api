# TASK-13 — Tibia HTTP Client Service

| Campo | Valor |
|-------|-------|
| Epic | E4 — Collector Layer |
| Size | M |
| Status | Done |
| Depends on | TASK-03, TASK-04 |

---

## Descrição

Implementar o cliente HTTP responsável por fazer requisições às páginas públicas do Tibia. Este serviço é o núcleo da camada de coleta e deve ser resiliente: classifica cada outcome, aplica retry com backoff e nunca bloqueia o fluxo da API.

---

## Acceptance Criteria

- [ ] `CollectorModule` criado com `TibiaHttpClientService`
- [ ] Método principal: `fetch(url: string): Promise<FetchResult>`
  - `FetchResult`:
    ```ts
    {
      outcome: CollectorOutcome;
      html?: string;
      statusCode?: number;
      error?: string;
      durationMs: number;
    }
    ```
- [ ] Classificação de outcome:
  - `success` — resposta 200 com HTML válido
  - `timeout` — request excedeu timeout configurado
  - `network_error` — erro de conexão
  - `parse_error` — resposta recebida mas HTML inesperado/inválido
  - `challenge` — suspeita de Cloudflare challenge (detectado por heurísticas no HTML ou status 403/503)
  - `block` — status 429 ou padrão de bloqueio identificado
- [ ] Retry automático com backoff exponencial:
  - Máximo de 3 tentativas
  - Espera: 1s, 3s, 9s
  - Não retentar em caso de `challenge` ou `block` (aguardar próximo ciclo)
- [ ] Timeout configurável via `ConfigService` (default: 15s)
- [ ] User-Agent configurável
- [ ] Log de cada request com outcome e duração
- [ ] Headers mínimos para simular browser razoável

---

## Arquivos a criar / modificar

```
src/modules/collector/collector.module.ts
src/modules/collector/services/tibia-http-client.service.ts
src/common/enums/collector-outcome.enum.ts (já criado na TASK-04)
```

---

## Notas

- Usar `axios` ou `node-fetch` — preferir `axios` pela facilidade de interceptors e timeout
- Heurística de challenge: verificar se o HTML contém strings como `"cf-browser-verification"`, `"Checking your browser"`, `"challenge-form"`
- Nunca usar este serviço diretamente em controllers — apenas nos jobs/scheduler
- O módulo deve ser `global: false` (apenas importado por quem precisar dentro do collector)
