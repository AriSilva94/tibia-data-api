import * as fs from 'fs';
import * as path from 'path';
import { CharacterParser } from '../../src/modules/collector/parsers/character.parser';
import { CollectorParseError } from '../../src/modules/collector/collector.errors';
import { VocationEnum } from '../../src/common/enums/vocation.enum';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(filename: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf-8');
}

describe('CharacterParser', () => {
  let parser: CharacterParser;

  beforeEach(() => {
    parser = new CharacterParser();
  });

  describe('parse()', () => {
    it('should parse a full character page with guild and deaths', () => {
      const html = loadFixture('character-page-full.html');
      const result = parser.parse(html);

      expect(result.name).toBe('Eldera');
      expect(result.world).toBe('Calmera');
      expect(result.level).toBe(350);
      expect(result.experience).toBe(1234567890);
      expect(result.vocation).toBe(VocationEnum.ElderDruid);
      expect(result.sex).toBe('female');
      expect(result.residence).toBe('Thais');
      expect(result.guildName).toBe('Cool Guild');
      expect(result.formerNamesRaw).toBe('Eldera Old, Eldera Ancient');
      expect(result.accountStatusRaw).toBe('Premium Account');
      expect(result.parsedAt).toBeInstanceOf(Date);
    });

    it('should parse deaths correctly', () => {
      const html = loadFixture('character-page-full.html');
      const result = parser.parse(html);

      expect(result.deaths).toHaveLength(2);

      const [firstDeath, secondDeath] = result.deaths;

      // Jan 14 2024, 08:15:00 CET = 07:15:00 UTC
      expect(firstDeath.deathAt).toBeInstanceOf(Date);
      expect(firstDeath.deathAt.getUTCFullYear()).toBe(2024);
      expect(firstDeath.deathAt.getUTCMonth()).toBe(0); // January = 0
      expect(firstDeath.deathAt.getUTCDate()).toBe(14);
      expect(firstDeath.deathAt.getUTCHours()).toBe(7);
      expect(firstDeath.deathAt.getUTCMinutes()).toBe(15);
      expect(firstDeath.killersRaw).toBe('a demon');
      expect(firstDeath.level).toBe(349);
      expect(firstDeath.dedupeHash).toBeTruthy();
      expect(typeof firstDeath.dedupeHash).toBe('string');
      expect(firstDeath.dedupeHash).toHaveLength(64); // SHA256 hex length

      expect(secondDeath.killersRaw).toBe(
        'Xablau the Destroyer at level 300',
      );
      expect(secondDeath.level).toBe(345);
    });

    it('should generate unique dedupeHash per death', () => {
      const html = loadFixture('character-page-full.html');
      const result = parser.parse(html);

      const hashes = result.deaths.map((d) => d.dedupeHash);
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it('should parse a character without guild and without deaths', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Tibia - Character Information</title></head>
        <body>
          <table>
            <tr><th colspan="2">Character Information</th></tr>
            <tr><td><b>Name:</b></td><td>BasicPlayer</td></tr>
            <tr><td><b>Sex:</b></td><td>male</td></tr>
            <tr><td><b>Vocation:</b></td><td>Knight</td></tr>
            <tr><td><b>Level:</b></td><td>50</td></tr>
            <tr><td><b>Experience Points:</b></td><td>5,000,000</td></tr>
            <tr><td><b>World:</b></td><td><a href="#">Calmera</a></td></tr>
            <tr><td><b>Residence:</b></td><td>Rookgaard</td></tr>
            <tr><td><b>Account Status:</b></td><td>Free Account</td></tr>
          </table>
        </body>
        </html>
      `;

      const result = parser.parse(html);

      expect(result.name).toBe('BasicPlayer');
      expect(result.vocation).toBe(VocationEnum.Knight);
      expect(result.guildName).toBeNull();
      expect(result.formerNamesRaw).toBeNull();
      expect(result.deaths).toHaveLength(0);
      expect(result.experience).toBe(5000000);
    });

    it('should throw CollectorParseError when character does not exist', () => {
      const html = loadFixture('character-page-not-found.html');
      expect(() => parser.parse(html)).toThrow(CollectorParseError);
      expect(() => parser.parse(html)).toThrow('Character not found');
    });

    it('should throw CollectorParseError on empty HTML', () => {
      expect(() => parser.parse('')).toThrow(CollectorParseError);
    });

    it('should throw CollectorParseError when required fields are missing', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Tibia</title></head>
        <body><p>Just some random content</p></body>
        </html>
      `;

      expect(() => parser.parse(html)).toThrow(CollectorParseError);
    });

    it('should strip commas from experience value', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Tibia</title></head>
        <body>
          <table>
            <tr><th colspan="2">Character Information</th></tr>
            <tr><td><b>Name:</b></td><td>RichPlayer</td></tr>
            <tr><td><b>Sex:</b></td><td>male</td></tr>
            <tr><td><b>Vocation:</b></td><td>Sorcerer</td></tr>
            <tr><td><b>Level:</b></td><td>1000</td></tr>
            <tr><td><b>Experience Points:</b></td><td>9,999,999,999</td></tr>
            <tr><td><b>World:</b></td><td><a href="#">Calmera</a></td></tr>
            <tr><td><b>Residence:</b></td><td>Thais</td></tr>
            <tr><td><b>Account Status:</b></td><td>Premium Account</td></tr>
          </table>
        </body>
        </html>
      `;

      const result = parser.parse(html);
      expect(result.experience).toBe(9999999999);
    });
  });
});
