import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const duration = Date.now() - start;
        this.logger.log(`${method} ${url} ${res.statusCode} +${duration}ms`);
      }),
      catchError((err: unknown) => {
        const status = (err as { status?: number })?.status ?? 500;
        const duration = Date.now() - start;
        this.logger.log(`${method} ${url} ${status} +${duration}ms`);
        return throwError(() => err);
      }),
    );
  }
}
