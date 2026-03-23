import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { VocationEnum } from '../../../common/enums/vocation.enum';
import { CollectorParseError } from '../collector.errors';

export interface OnlinePlayer {
  name: string;
  level: number;
  vocation: string;
}

export interface OnlineParseResult {
  world: string;
  onlineCount: number;
  players: OnlinePlayer[];
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
export class OnlineParser {
  private readonly logger = new Logger(OnlineParser.name);

  parse(html: string): OnlineParseResult {
    if (!html || html.trim().length === 0) {
      throw new CollectorParseError('Empty HTML provided to OnlineParser');
    }

    const $ = cheerio.load(html);

    const world = this.extractWorld($);
    if (!world) {
      throw new CollectorParseError(
        'Could not extract world name from online page',
      );
    }

    let onlineCount = 0;
    const players: OnlinePlayer[] = [];
    let tableFound = false;

    $('table').each((_, table) => {
      const $table = $(table);
      const headerText = $table.find('th').first().text().trim();
      const match = headerText.match(/Players Online\s*\((\d+)\)/i);

      if (!match) return;

      tableFound = true;
      onlineCount = parseInt(match[1], 10);

      let headerRowPassed = false;

      $table.find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 3) return;

        const firstCellText = $(cells[0]).text().trim();

        // Skip the column-header row ("Name", "Level", "Vocation")
        if (firstCellText === 'Name') {
          headerRowPassed = true;
          return;
        }

        if (!headerRowPassed) return;

        const nameEl = $(cells[0]).find('a');
        const name = (nameEl.length ? nameEl.text() : firstCellText).trim();
        const level = parseInt($(cells[1]).text().trim(), 10);
        const vocation = normalizeVocation($(cells[2]).text().trim());

        if (name && !isNaN(level)) {
          players.push({ name, level, vocation });
        }
      });

      return false; // break — found the right table
    });

    if (!tableFound) {
      throw new CollectorParseError(
        'Could not find Players Online table in HTML',
      );
    }

    if (players.length !== onlineCount) {
      this.logger.warn(
        `OnlineParser: header reports ${onlineCount} players but parsed ${players.length} rows for world "${world}"`,
      );
    }

    return {
      world,
      onlineCount,
      players,
      parsedAt: new Date(),
    };
  }

  private extractWorld($: cheerio.CheerioAPI): string | null {
    // Try page title: "Tibia - Calmera" — take only the last segment after the final separator
    const title = $('title').text().trim();
    const parts = title.split(/\s*[-–]\s*/);
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 1].trim();
      // Sanity-check: must be a short non-empty word (world names are single words)
      if (candidate && candidate.length <= 30 && !candidate.includes(' ')) {
        return candidate;
      }
    }

    // Fallback: first h1 or h2
    const heading = $('h1, h2').first().text().trim();
    if (heading) return heading;

    return null;
  }
}
