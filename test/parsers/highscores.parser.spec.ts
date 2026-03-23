import * as fs from 'fs';
import * as path from 'path';
import { HighscoresParser } from '../../src/modules/collector/parsers/highscores.parser';
import { CollectorParseError } from '../../src/modules/collector/collector.errors';
import { VocationEnum } from '../../src/common/enums/vocation.enum';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf-8');
}

describe('HighscoresParser', () => {
  let parser: HighscoresParser;

  beforeEach(() => {
    parser = new HighscoresParser();
  });

  describe('parse()', () => {
    it('should parse a page with entries correctly', () => {
      const html = loadFixture('highscores-page.html');
      const result = parser.parse(html, 'Calmera', 'level', 1);

      expect(result.world).toBe('Calmera');
      expect(result.category).toBe('level');
      expect(result.page).toBe(1);
      expect(result.entries).toHaveLength(3);
      expect(result.parsedAt).toBeInstanceOf(Date);

      const [first, second, third] = result.entries;

      expect(first.rank).toBe(1);
      expect(first.characterName).toBe('Eldera');
      expect(first.vocation).toBe(VocationEnum.ElderDruid);
      expect(first.value).toBe(350);

      expect(second.rank).toBe(2);
      expect(second.characterName).toBe('Swordlord');
      expect(second.vocation).toBe(VocationEnum.EliteKnight);
      expect(second.value).toBe(200);

      expect(third.rank).toBe(3);
      expect(third.characterName).toBe('Pixie Arrow');
      expect(third.vocation).toBe(VocationEnum.RoyalPaladin);
      expect(third.value).toBe(150);
    });

    it('should return empty entries for a page with no data rows', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Tibia - Highscores</title></head>
        <body>
          <table>
            <tr><td><b>Rank</b></td><td><b>Name</b></td><td><b>Vocation</b></td><td><b>World</b></td><td><b>Level</b></td></tr>
          </table>
        </body>
        </html>
      `;

      const result = parser.parse(html, 'Calmera', 'level', 1);
      expect(result.entries).toHaveLength(0);
    });

    it('should throw CollectorParseError on empty HTML', () => {
      expect(() => parser.parse('', 'Calmera', 'level', 1)).toThrow(
        CollectorParseError,
      );
    });

    it('should throw CollectorParseError when highscores table is not found', () => {
      const html = `
        <!DOCTYPE html>
        <html><head><title>Tibia</title></head>
        <body><p>Nothing here</p></body>
        </html>
      `;

      expect(() => parser.parse(html, 'Calmera', 'level', 1)).toThrow(
        CollectorParseError,
      );
    });

    it('should pass world, category and page through to result', () => {
      const html = loadFixture('highscores-page.html');
      const result = parser.parse(html, 'Antica', 'experience', 2);

      expect(result.world).toBe('Antica');
      expect(result.category).toBe('experience');
      expect(result.page).toBe(2);
    });

    it('should normalize unknown vocations to None', () => {
      const html = `
        <!DOCTYPE html>
        <html><head><title>Tibia</title></head>
        <body>
          <table>
            <tr><td><b>Rank</b></td><td><b>Name</b></td><td><b>Vocation</b></td><td><b>World</b></td><td><b>Level</b></td></tr>
            <tr>
              <td>1</td>
              <td><a href="#">SomeChar</a></td>
              <td>Unknown Job</td>
              <td>Calmera</td>
              <td>500</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const result = parser.parse(html, 'Calmera', 'level', 1);
      expect(result.entries[0].vocation).toBe(VocationEnum.None);
    });
  });
});
