import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { CollectorParseError } from '../collector.errors';

export interface WorldEntry {
  name: string;
  status: 'online' | 'offline';
  playersOnline: number;
  region: string | null;
  pvpType: string | null;
}

@Injectable()
export class WorldsListParser {
  parse(html: string): WorldEntry[] {
    if (!html || html.trim().length === 0) {
      throw new CollectorParseError('Empty HTML provided to WorldsListParser');
    }

    const $ = cheerio.load(html);
    const worlds: WorldEntry[] = [];

    // Data rows on the worlds list page use class "Odd" or "Even"
    // Columns: World Name | Status | Players Online | PvP Type | Additional Info
    $('tr.Odd, tr.Even').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      const nameEl = $(cells[0]).find('a');
      if (!nameEl.length) return;

      const name = nameEl.text().replace(/\u00a0/g, ' ').trim();
      if (!name) return;

      const rawStatus = $(cells[1]).text().replace(/\u00a0/g, ' ').trim().toLowerCase();
      const status: 'online' | 'offline' = rawStatus === 'online' ? 'online' : 'offline';

      const playersOnline = parseInt($(cells[2]).text().trim(), 10) || 0;
      const pvpType = $(cells[3]).text().replace(/\u00a0/g, ' ').trim() || null;

      worlds.push({ name, status, playersOnline, region: null, pvpType });
    });

    if (worlds.length === 0) {
      throw new CollectorParseError('No worlds found in worlds list HTML');
    }

    return worlds;
  }
}
