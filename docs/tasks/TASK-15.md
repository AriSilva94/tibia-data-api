# TASK-15 — Parser — Online World List

| Campo | Valor |
|-------|-------|
| Epic | E4 — Collector Layer |
| Size | M |
| Status | Todo |
| Depends on | TASK-13 |

---

## Descrição

Implementar o parser que extrai a lista de jogadores online de um mundo a partir do HTML público do Tibia. O parser deve ser isolado: recebe HTML, retorna dados estruturados — sem side effects, sem banco, sem HTTP.

---

## Acceptance Criteria

- [ ] `OnlineParser` implementado em `src/modules/collector/parsers/online.parser.ts`
- [ ] Método: `parse(html: string): OnlineParseResult`
  - `OnlineParseResult`:
    ```ts
    {
      world: string;
      onlineCount: number;
      players: Array<{
        name: string;
        level: number;
        vocation: string;
      }>;
      parsedAt: Date;
    }
    ```
- [ ] Parser usa Cheerio para extrair dados da tabela de jogadores online
- [ ] Retorna `null` ou lança `ParseError` se o HTML não corresponde ao formato esperado
- [ ] Extrai corretamente:
  - Nome do mundo (do título ou da página)
  - Total de online count
  - Lista de players com nome, level e vocation
- [ ] Lida graciosamente com tabela vazia (mundo com 0 players online)
- [ ] Testes unitários do parser com HTML fixtures:
  - Caso com players
  - Caso com 0 players
  - Caso com HTML inválido/inesperado

---

## Arquivos a criar / modificar

```
src/modules/collector/parsers/online.parser.ts
test/parsers/online.parser.spec.ts
test/fixtures/online-page.html (fixture de exemplo)
```

---

## Notas

- O parser não deve conhecer a URL — recebe apenas o HTML bruto
- Usar seletores CSS estáveis do Cheerio (não depender de classes geradas dinamicamente)
- Normalizar nomes de vocação para o enum `VocationEnum` definido na TASK-04
- Trim e sanitize todos os strings extraídos
