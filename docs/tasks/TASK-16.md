# TASK-16 — Parser — Highscores

| Campo | Valor |
|-------|-------|
| Epic | E4 — Collector Layer |
| Size | M |
| Status | Todo |
| Depends on | TASK-13 |

---

## Descrição

Implementar o parser que extrai dados de highscores a partir do HTML público do Tibia. O parser é isolado e stateless — recebe HTML e retorna dados estruturados.

---

## Acceptance Criteria

- [ ] `HighscoresParser` implementado em `src/modules/collector/parsers/highscores.parser.ts`
- [ ] Método: `parse(html: string, world: string, category: string, page: number): HighscoresParseResult`
  - `HighscoresParseResult`:
    ```ts
    {
      world: string;
      category: string;
      page: number;
      entries: Array<{
        rank: number;
        characterName: string;
        vocation: string;
        value: number;
      }>;
      parsedAt: Date;
    }
    ```
- [ ] Extrai corretamente:
  - Rank (posição no ranking)
  - Nome do personagem
  - Vocação
  - Valor da métrica (XP, nível, skill, etc.)
- [ ] Lida com páginas vazias (sem entries)
- [ ] Lança `ParseError` se HTML não corresponde ao formato esperado
- [ ] Testes unitários com HTML fixtures:
  - Página com entries
  - Página vazia
  - HTML inválido

---

## Arquivos a criar / modificar

```
src/modules/collector/parsers/highscores.parser.ts
test/parsers/highscores.parser.spec.ts
test/fixtures/highscores-page.html
```

---

## Notas

- `value` pode representar XP, level, magic level ou skill level dependendo da `category`
- Normalizar `characterName` (trim, preservar capitalização original)
- Normalizar `vocation` para `VocationEnum`
- O `rank` absoluto pode ser calculado com base no `page` e posição na lista se não estiver explícito no HTML
