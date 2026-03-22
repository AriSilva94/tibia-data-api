# TASK-17 — Parser — Character Profile & Deaths

| Campo | Valor |
|-------|-------|
| Epic | E4 — Collector Layer |
| Size | M |
| Status | Todo |
| Depends on | TASK-13 |

---

## Descrição

Implementar o parser que extrai dados de perfil individual de um personagem e seu histórico de mortes recentes a partir do HTML público do Tibia. É o parser mais rico em informações e mais crítico para a qualidade dos dados.

---

## Acceptance Criteria

- [ ] `CharacterParser` implementado em `src/modules/collector/parsers/character.parser.ts`
- [ ] Método: `parse(html: string): CharacterParseResult`
  - `CharacterParseResult`:
    ```ts
    {
      name: string;
      world: string;
      level: number;
      experience: number;
      vocation: string;
      sex: string;
      residence: string;
      guildName: string | null;
      formerNamesRaw: string | null;
      accountStatusRaw: string;
      deaths: Array<{
        deathAt: Date;
        level: number;
        killersRaw: string;
        dedupeHash: string;  // SHA256 de (name + deathAt + level + killersRaw)
      }>;
      parsedAt: Date;
    }
    ```
- [ ] Extrai todos os campos do bloco de informações do personagem
- [ ] Extrai lista de mortes recentes com data, nível e causador(es)
- [ ] Gera `dedupeHash` para cada morte usando `hash.util.ts` da TASK-04
- [ ] Lança `ParseError` se personagem não encontrado (página de "Character not found")
- [ ] Lança `ParseError` se HTML inesperado
- [ ] Testes unitários com fixtures:
  - Personagem com guild e mortes
  - Personagem sem guild e sem mortes
  - Personagem não encontrado
  - HTML inválido

---

## Arquivos a criar / modificar

```
src/modules/collector/parsers/character.parser.ts
test/parsers/character.parser.spec.ts
test/fixtures/character-page-full.html
test/fixtures/character-page-not-found.html
```

---

## Notas

- `experience` no Tibia vem formatado com vírgulas (ex: `1,234,567,890`) — remover antes de parsear como number
- `killersRaw` deve preservar o texto original da morte (ex: `"a demon"`, `"Xablau the Destroyer at level 300"`)
- O hash de deduplicação garante que a mesma morte não seja inserida duas vezes mesmo que o perfil seja scaneado múltiplas vezes
- Datas das mortes no Tibia têm formato específico — usar `date.util.ts` para normalizar para UTC
