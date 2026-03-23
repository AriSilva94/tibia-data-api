import { NestFactory, NestApplication } from '@nestjs/core';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const LOG_LEVEL_MAP: Record<string, LogLevel[]> = {
  debug: ['verbose', 'debug', 'log', 'warn', 'error'],
  log:   ['log', 'warn', 'error'],
  warn:  ['warn', 'error'],
  error: ['error'],
};

async function bootstrap() {
  const logLevel = process.env.LOG_LEVEL ?? 'log';
  const logger: LogLevel[] = LOG_LEVEL_MAP[logLevel] ?? LOG_LEVEL_MAP['log'];

  const app = await NestFactory.create<NestApplication>(AppModule, { logger });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const prefix = config.get<string>('app.apiPrefix') ?? 'api/v1';
  const allowedOrigins = config.get<string>('app.allowedOrigins') ?? '*';

  app.use(helmet());

  app.enableCors({
    origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix(prefix);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
}
bootstrap();
