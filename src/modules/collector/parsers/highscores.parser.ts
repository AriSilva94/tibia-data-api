import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { VocationEnum } from '../../../common/enums/vocation.enum';
import { CollectorParseError } from '../collector.errors';

export interface HighscoresEntry {
  rank: number;
  characterName: string;
  vocation: string;
  value: number;
}

export interface HighscoresParseResult {
  world: string;
  category: string;
  page: number;
  entries: HighscoresEntry[];
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

@Injectable()
export class HighscoresParser {
  parse(
    html: string,
    world: string,
    category: string,
    page: number,
  ): HighscoresParseResult {
    if (!html || html.trim().length === 0) {
      throw new CollectorParseError('Empty HTML provided to HighscoresParser');
    }

    const $ = cheerio.load(html);
    const entries = this.extractEntries($, page);

    return {
      world,
      category,
      page,
      entries,
      parsedAt: new Date(),
    };
  }

  private extractEntries(
    $: cheerio.CheerioAPI,
    page: number,
  ): HighscoresEntry[] {
    const entries: HighscoresEntry[] = [];
    let tableFound = false;

    $('table').each((_, table) => {
      const $table = $(table);
      const headerRow = $table.find('tr').first();
      const headerText = headerRow.text();

      // Identify the highscores table by the presence of "Rank" and "Name" headers
      if (!headerText.includes('Rank') || !headerText.includes('Name')) {
        return;
      }

      tableFound = true;

      let dataRowIndex = 0;

      $table.find('tr').each((rowIndex, row) => {
        if (rowIndex === 0) return; // skip header row

        const cells = $(row).find('td');
        // Table has 5 columns: Rank, Name, Vocation, World, Value
        if (cells.length < 5) return;

        dataRowIndex++;

        const rankText = $(cells[0]).text().trim();
        const nameEl = $(cells[1]).find('a');
        const characterName = (
          nameEl.length ? nameEl.text() : $(cells[1]).text()
        ).trim();
        const vocation = normalizeVocation($(cells[2]).text().trim());
        // cells[3] is World — skip
        const valueText = $(cells[4]).text().trim();
        const value = parseInt(valueText.replace(/[^0-9]/g, ''), 10);

        // Rank may be explicit in the cell or derived from page position
        const rank = parseInt(rankText, 10);
        const resolvedRank = isNaN(rank)
          ? (page - 1) * 50 + dataRowIndex
          : rank;

        if (!characterName || isNaN(value)) return;

        entries.push({ rank: resolvedRank, characterName, vocation, value });
      });

      return false; // break — one table is enough
    });

    if (!tableFound) {
      throw new CollectorParseError(
        'Could not find highscores table in HTML',
      );
    }

    return entries;
  }
}
