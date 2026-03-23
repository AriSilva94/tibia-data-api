import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { VocationEnum } from '../../../common/enums/vocation.enum';
import { buildDedupeHash } from '../../../common/utils/hash.util';
import { CollectorParseError } from '../collector.errors';

export interface CharacterDeath {
  deathAt: Date;
  level: number;
  killersRaw: string;
  dedupeHash: string;
}

export interface CharacterParseResult {
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
  deaths: CharacterDeath[];
  parsedAt: Date;
}

const VOCATION_MAP: Record<string, VocationEnum> = {
  None: VocationEnum.None,
  Knight: VocationEnum.Knight,
  'Elite Knight': VocationEnum.EliteKnight,
  Paladin: VocationEnum.Paladin,
  'Royal Paladin': VocationEnum.RoyalPaladin,
  Sorcerer: VocationEnum.Sorcerer,
  'Master Sorcerer': VocationEnum.MasterSorcerer,
  Druid: VocationEnum.Druid,
  'Elder Druid': VocationEnum.ElderDruid,
};

function normalizeVocation(raw: string): string {
  return VOCATION_MAP[raw.trim()] ?? VocationEnum.None;
}

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/**
 * Parses Tibia death dates: "Jan 14 2024, 08:15:00 CET" → UTC Date.
 * Uses Date.UTC to avoid relying on non-standard date string parsing.
 */
function parseTibiaDate(dateStr: string): Date {
  const match = dateStr
    .trim()
    .match(/^(\w{3}) (\d{1,2}) (\d{4}), (\d{2}):(\d{2}):(\d{2}) (CET|CEST)$/);

  if (!match) {
    throw new CollectorParseError(`Cannot parse Tibia date: "${dateStr}"`);
  }

  const [, mon, day, year, hour, min, sec, tz] = match;
  const monthIndex = MONTH_MAP[mon];

  if (monthIndex === undefined) {
    throw new CollectorParseError(`Unknown month abbreviation: "${mon}"`);
  }

  const offsetHours = tz === 'CEST' ? 2 : 1;

  // Build the UTC timestamp: local time minus the timezone offset
  const localUtcMs = Date.UTC(
    parseInt(year, 10),
    monthIndex,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(min, 10),
    parseInt(sec, 10),
  );

  return new Date(localUtcMs - offsetHours * 3600 * 1000);
}

/**
 * Removes thousands separators from Tibia experience strings (e.g. "1,234,567" → 1234567)
 */
function parseExperience(raw: string): number {
  return parseInt(raw.replace(/,/g, ''), 10);
}

@Injectable()
export class CharacterParser {
  parse(html: string): CharacterParseResult {
    if (!html || html.trim().length === 0) {
      throw new CollectorParseError('Empty HTML provided to CharacterParser');
    }

    const $ = cheerio.load(html);

    // Detect "character does not exist" page (exact Tibia error message)
    const bodyText = $('body').text();
    if (bodyText.includes('Character does not exist')) {
      throw new CollectorParseError('Character not found');
    }

    const fields = this.extractFields($);

    const name = fields['Name'];
    const world = fields['World'];
    const vocationRaw = fields['Vocation'];
    const levelRaw = fields['Level'];
    const experienceRaw = fields['Experience Points'] ?? fields['Experience'];
    const sex = fields['Sex'];
    const residence = fields['Residence'];
    const accountStatusRaw = fields['Account Status'];

    if (!name || !world || !vocationRaw || !levelRaw || !sex || !residence || !accountStatusRaw) {
      throw new CollectorParseError(
        'Missing required character fields in HTML',
      );
    }

    const level = parseInt(levelRaw, 10);
    const experience = experienceRaw ? parseExperience(experienceRaw) : 0;

    if (isNaN(level)) {
      throw new CollectorParseError(`Invalid level value: "${levelRaw}"`);
    }

    const guildName = this.extractGuildName($, fields['Guild Membership']);
    const formerNamesRaw = fields['Former Names'] ?? null;

    const deaths = this.extractDeaths($, name);

    return {
      name: name.trim(),
      world: world.trim(),
      level,
      experience,
      vocation: normalizeVocation(vocationRaw),
      sex: sex.trim().toLowerCase(),
      residence: residence.trim(),
      guildName,
      formerNamesRaw,
      accountStatusRaw: accountStatusRaw.trim(),
      deaths,
      parsedAt: new Date(),
    };
  }

  /**
   * Extracts label→value pairs from the Character Information table only.
   * Scopes to the first table containing a "Character Information" heading to
   * avoid contamination from other tables on the page (e.g. the deaths table).
   * Expects rows like: <td><b>Label:</b></td><td>Value</td>
   */
  private extractFields($: cheerio.CheerioAPI): Record<string, string> {
    const fields: Record<string, string> = {};

    // Target only the character info table by its heading
    const infoTable = this.findTableByHeading($, 'Character Information');
    const scope = infoTable ?? $('body'); // fallback to full body if heading not found

    scope.find('tr').each((_, row) => {
      const tds = $(row).find('td');
      if (tds.length < 2) return;

      const labelTd = $(tds[0]);
      const valueTd = $(tds[1]);

      // Label is inside a <b> tag or directly in the td
      const labelRaw = (labelTd.find('b').text() || labelTd.text()).trim();
      const label = labelRaw.replace(/:$/, ''); // remove trailing colon

      if (!label) return;

      const value = valueTd.text().trim();
      fields[label] = value;
    });

    return fields;
  }

  private extractGuildName(
    $: cheerio.CheerioAPI,
    guildFieldValue: string | undefined,
  ): string | null {
    if (!guildFieldValue) return null;

    // Value is typically: "Member of the <a>Guild Name</a>"
    // We look for an anchor in the guild membership td, scoped to the info table
    let guildName: string | null = null;

    const infoTable = this.findTableByHeading($, 'Character Information');
    const scope = infoTable ?? $('body');

    scope.find('tr').each((_, row) => {
      const tds = $(row).find('td');
      if (tds.length < 2) return;

      const labelTd = $(tds[0]);
      const label = (labelTd.find('b').text() || labelTd.text())
        .trim()
        .replace(/:$/, '');

      if (label === 'Guild Membership') {
        const anchor = $(tds[1]).find('a').last();
        guildName = anchor.length ? anchor.text().trim() : null;
        return false; // break
      }
    });

    return guildName;
  }

  private findTableByHeading(
    $: cheerio.CheerioAPI,
    heading: string,
  ): cheerio.Cheerio<cheerio.Element> | null {
    let found: cheerio.Cheerio<cheerio.Element> | null = null;

    $('table').each((_, table) => {
      const $table = $(table);
      if ($table.find('th').first().text().includes(heading)) {
        found = $table;
        return false; // break
      }
    });

    return found;
  }

  private extractDeaths(
    $: cheerio.CheerioAPI,
    characterName: string,
  ): CharacterDeath[] {
    const deaths: CharacterDeath[] = [];

    // Find the deaths table by locating a <th> or heading containing "Character Deaths"
    $('table').each((_, table) => {
      const $table = $(table);
      const thText = $table.find('th').first().text().trim();

      if (!thText.includes('Character Deaths')) return;

      $table.find('tr').each((rowIndex, row) => {
        if (rowIndex === 0) return; // skip heading row

        const cells = $(row).find('td');
        if (cells.length < 2) return;

        const firstCellText = $(cells[0]).text().trim();

        // Skip the column-header row ("Date", "Killed by")
        if (firstCellText === 'Date') return;

        const dateStr = firstCellText;
        const killersRaw = $(cells[1]).text().trim();

        // Extract level from the "Killed by" column context
        // The death row may contain level info in a separate cell
        const levelRaw = cells.length >= 3 ? $(cells[2]).text().trim() : '';
        const level = parseInt(levelRaw, 10);
        const resolvedLevel = isNaN(level) ? 0 : level;

        let deathAt: Date;
        try {
          deathAt = parseTibiaDate(dateStr);
        } catch {
          return; // skip malformed death entries
        }

        const dedupeHash = buildDedupeHash([
          characterName,
          deathAt.toISOString(),
          resolvedLevel,
          killersRaw,
        ]);

        deaths.push({ deathAt, level: resolvedLevel, killersRaw, dedupeHash });
      });

      return false; // break — one deaths table is enough
    });

    return deaths;
  }
}
