import * as fs from 'fs';
import * as path from 'path';
import { OnlineParser } from '../../src/modules/collector/parsers/online.parser';
import { CollectorParseError } from '../../src/modules/collector/collector.errors';
import { VocationEnum } from '../../src/common/enums/vocation.enum';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf-8');
}

describe('OnlineParser', () => {
  let parser: OnlineParser;

  beforeEach(() => {
    parser = new OnlineParser();
  });

  describe('parse()', () => {
    it('should parse a page with players correctly', () => {
      const html = loadFixture('online-page.html');
      const result = parser.parse(html);

      expect(result.world).toBe('Calmera');
      expect(result.onlineCount).toBe(3);
      expect(result.players).toHaveLength(3);
      expect(result.parsedAt).toBeInstanceOf(Date);

      const [first, second, third] = result.players;

      expect(first.name).toBe('Eldera');
      expect(first.level).toBe(350);
      expect(first.vocation).toBe(VocationEnum.ElderDruid);

      expect(second.name).toBe('Swordlord');
      expect(second.level).toBe(200);
      expect(second.vocation).toBe(VocationEnum.EliteKnight);

      expect(third.name).toBe('Pixie Arrow');
      expect(third.level).toBe(150);
      expect(third.vocation).toBe(VocationEnum.RoyalPaladin);
    });

    it('should parse a page with 0 players online', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Tibia - Calmera</title></head>
        <body>
          <table>
            <tr><th colspan="3">Players Online (0)</th></tr>
            <tr><td>Name</td><td>Level</td><td>Vocation</td></tr>
          </table>
        </body>
        </html>
      `;

      const result = parser.parse(html);

      expect(result.world).toBe('Calmera');
      expect(result.onlineCount).toBe(0);
      expect(result.players).toHaveLength(0);
    });

    it('should throw CollectorParseError on empty HTML', () => {
      expect(() => parser.parse('')).toThrow(CollectorParseError);
      expect(() => parser.parse('   ')).toThrow(CollectorParseError);
    });

    it('should throw CollectorParseError when Players Online table is missing', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Tibia - Calmera</title></head>
        <body><p>Some unrelated content</p></body>
        </html>
      `;

      expect(() => parser.parse(html)).toThrow(CollectorParseError);
    });

    it('should throw CollectorParseError when world name cannot be extracted', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title></title></head>
        <body>
          <table>
            <tr><th colspan="3">Players Online (0)</th></tr>
            <tr><td>Name</td><td>Level</td><td>Vocation</td></tr>
          </table>
        </body>
        </html>
      `;

      expect(() => parser.parse(html)).toThrow(CollectorParseError);
    });

    it('should normalize unknown vocations to None', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Tibia - Calmera</title></head>
        <body>
          <table>
            <tr><th colspan="3">Players Online (1)</th></tr>
            <tr><td>Name</td><td>Level</td><td>Vocation</td></tr>
            <tr>
              <td><a href="#">TestPlayer</a></td>
              <td>100</td>
              <td>Unknown Vocation</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const result = parser.parse(html);
      expect(result.players[0].vocation).toBe(VocationEnum.None);
    });
  });
});
