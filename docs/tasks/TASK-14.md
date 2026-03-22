# TASK-14 — Rate Limit & Concurrency Service

| Campo | Valor |
|-------|-------|
| Epic | E4 — Collector Layer |
| Size | S |
| Status | Todo |
| Depends on | TASK-13 |

---

## Descrição

Implementar o serviço de controle de concorrência e rate limit para a camada de coleta. Garante que o sistema não sobrecarregue a fonte de dados e consiga se auto-regular quando detecta sinais de bloqueio.

---

## Acceptance Criteria

- [ ] `TibiaRateLimitService` implementado dentro do `CollectorModule`
- [ ] Controle de concorrência via `p-limit`:
  - Limite padrão configurável (ex: 3 requests paralelos)
  - Método `getConcurrencyLimit()` retorna o `p-limit` ativo
- [ ] Sistema de backpressure:
  - `reportSuccess()` — registra sucesso, pode aumentar concorrência gradualmente
  - `reportChallenge()` — reduz concorrência para 1, aumenta delay entre requests
  - `reportBlock()` — pausa toda coleta por N minutos (configurável)
  - Estado de bloqueio consultável via `isBlocked(): boolean`
  - `getDelayMs()` — retorna delay atual entre requests (aumenta em backoff)
- [ ] Estado interno resetado após período de recuperação (ex: 15 minutos após block)
- [ ] Log de mudanças de estado (normal → backoff → blocked → recovery)

---

## Arquivos a criar / modificar

```
src/modules/collector/services/tibia-rate-limit.service.ts
src/modules/collector/collector.module.ts (registrar serviço)
```

---

## Notas

- O delay entre requests deve ser inserido pelos jobs — este serviço apenas informa o delay a ser usado
- Concorrência mínima nunca abaixo de 1
- O estado de bloqueio não persiste no banco — é memória do processo (reiniciar o servidor reseta o estado)
- Expor estado via método `getStatus()` para uso no health endpoint futuro
