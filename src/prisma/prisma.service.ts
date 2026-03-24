import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const rawUrl = config.get<string>('database.url') ?? 'file:./prisma/dev.db';
    const dbPath = rawUrl.replace(/^file:/, '');
    const resolvedUrl = path.isAbsolute(dbPath)
      ? dbPath
      : path.resolve(process.cwd(), dbPath);
    const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
