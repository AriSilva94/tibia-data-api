import { Injectable, Logger } from '@nestjs/common';

type ConcurrentFn = <T>(fn: () => Promise<T>) => Promise<T>;

type RateLimitState = 'normal' | 'backoff' | 'blocked';

const DEFAULT_CONCURRENCY = 3;
const MAX_CONCURRENCY = 5;
const MIN_CONCURRENCY = 1;
const DEFAULT_DELAY_MS = 500;
const BACKOFF_DELAY_MS = 3000;
// Both constants must match: blockedUntil timestamp and the recovery timer must expire at the same time
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(private max: number) {}

  setMax(max: number): void {
    this.max = Math.max(1, max);
    this.drain();
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => this.queue.push(resolve));
  }

  private release(): void {
    this.running--;
    this.drain();
  }

  private drain(): void {
    while (this.running < this.max && this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.running++;
      next();
    }
  }
}

export interface RateLimitStatus {
  state: RateLimitState;
  concurrency: number;
  delayMs: number;
  blockedUntil: string | null;
}

@Injectable()
export class TibiaRateLimitService {
  private readonly logger = new Logger(TibiaRateLimitService.name);

  private state: RateLimitState = 'normal';
  private currentConcurrency = DEFAULT_CONCURRENCY;
  private currentDelayMs = DEFAULT_DELAY_MS;
  private blockedUntil: Date | null = null;
  private recoveryTimer: NodeJS.Timeout | null = null;

  private readonly semaphore = new Semaphore(DEFAULT_CONCURRENCY);

  getConcurrencyLimit(): ConcurrentFn {
    return <T>(fn: () => Promise<T>) => this.semaphore.run(fn);
  }

  reportSuccess(): void {
    if (this.state === 'backoff') {
      this.currentDelayMs = DEFAULT_DELAY_MS;
      this.currentConcurrency = DEFAULT_CONCURRENCY;
      this.semaphore.setMax(this.currentConcurrency);
      this.state = 'normal';
      this.logger.log('State: backoff → normal');
      return;
    }

    if (this.state === 'normal' && this.currentConcurrency < MAX_CONCURRENCY) {
      this.currentConcurrency = Math.min(
        this.currentConcurrency + 1,
        MAX_CONCURRENCY,
      );
      this.semaphore.setMax(this.currentConcurrency);
      this.logger.debug(`Concurrency increased to ${this.currentConcurrency}`);
    }
  }

  reportChallenge(): void {
    if (this.state === 'blocked') return;

    this.currentConcurrency = MIN_CONCURRENCY;
    this.semaphore.setMax(this.currentConcurrency);
    this.currentDelayMs = BACKOFF_DELAY_MS;
    this.state = 'backoff';

    this.logger.warn(
      `State: → backoff (concurrency=1, delay=${BACKOFF_DELAY_MS}ms)`,
    );
  }

  reportBlock(): void {
    if (this.state === 'blocked') return;

    this.currentConcurrency = MIN_CONCURRENCY;
    this.semaphore.setMax(this.currentConcurrency);
    this.currentDelayMs = BACKOFF_DELAY_MS;
    this.state = 'blocked';
    this.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);

    this.logger.warn(
      `State: → blocked until ${this.blockedUntil.toISOString()}`,
    );

    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);
    this.recoveryTimer = setTimeout(() => this.recover(), BLOCK_DURATION_MS);
  }

  isBlocked(): boolean {
    if (this.state !== 'blocked') return false;

    if (this.blockedUntil && Date.now() >= this.blockedUntil.getTime()) {
      this.recover();
      return false;
    }

    return true;
  }

  getDelayMs(): number {
    return this.currentDelayMs;
  }

  getStatus(): RateLimitStatus {
    return {
      state: this.state,
      concurrency: this.currentConcurrency,
      delayMs: this.currentDelayMs,
      blockedUntil: this.blockedUntil?.toISOString() ?? null,
    };
  }

  private recover(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }

    this.state = 'normal';
    this.currentConcurrency = DEFAULT_CONCURRENCY;
    this.semaphore.setMax(this.currentConcurrency);
    this.currentDelayMs = DEFAULT_DELAY_MS;
    this.blockedUntil = null;

    this.logger.log('State: blocked → normal (recovery complete)');
  }
}
