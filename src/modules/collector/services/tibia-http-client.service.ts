import https from 'https';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CollectorOutcome } from '../../../common/enums/collector-outcome.enum';

export interface FetchResult {
  outcome: CollectorOutcome;
  html?: string;
  statusCode?: number;
  error?: string;
  durationMs: number;
}

// Rotated per-request to avoid static fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

const CHALLENGE_PATTERNS = [
  'cf-browser-verification',
  'Checking your browser',
  'challenge-form',
  '_cf_chl_opt',
  'cdn-cgi/challenge-platform',
  'Just a moment',
];

// 3 retries after the first attempt, with delays of 1s, 3s, 9s between each
const RETRY_DELAYS_MS = [1000, 3000, 9000];
const MAX_ATTEMPTS = 4;

@Injectable()
export class TibiaHttpClientService {
  private readonly logger = new Logger(TibiaHttpClientService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const timeoutMs = this.configService.get<number>('app.httpTimeoutMs', 15000);

    // Explicit keep-alive agent reuses TCP/TLS connections across requests
    // — eliminates DNS + handshake overhead on every call (~50% latency reduction)
    const httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 20,
      maxFreeSockets: 10,
      timeout: timeoutMs,
    });

    this.client = axios.create({
      timeout: timeoutMs,
      httpsAgent,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        Referer: 'https://www.tibia.com/community/?subtopic=highscores',
      },
    });
  }

  async fetch(url: string): Promise<FetchResult> {
    let lastResult: FetchResult | null = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await this.sleep(RETRY_DELAYS_MS[attempt - 1]);
      }

      const result = await this.attemptFetch(url);
      lastResult = result;

      this.logger.log(
        `[${attempt + 1}/${MAX_ATTEMPTS}] ${url} → ${result.outcome} (${result.durationMs}ms)`,
      );

      if (result.outcome === CollectorOutcome.Success) return result;

      // Do not retry on challenge or block — wait for the next scheduled cycle
      if (
        result.outcome === CollectorOutcome.Challenge ||
        result.outcome === CollectorOutcome.Block
      ) {
        return result;
      }
    }

    return lastResult!;
  }

  private async attemptFetch(url: string): Promise<FetchResult> {
    const start = Date.now();
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    try {
      const response = await this.client.get<string>(url, {
        responseType: 'text',
        headers: { 'User-Agent': userAgent },
      });

      const durationMs = Date.now() - start;
      const html: string = response.data;
      const statusCode = response.status;

      if (this.containsChallengePattern(html)) {
        return { outcome: CollectorOutcome.Challenge, statusCode, durationMs };
      }

      if (!html || html.trim().length === 0) {
        return {
          outcome: CollectorOutcome.ParseError,
          statusCode,
          durationMs,
          error: 'Empty HTML response',
        };
      }

      return { outcome: CollectorOutcome.Success, html, statusCode, durationMs };
    } catch (err: unknown) {
      const durationMs = Date.now() - start;

      if (axios.isAxiosError(err)) {
        const statusCode = err.response?.status;

        if (
          err.code === 'ECONNABORTED' ||
          err.message.toLowerCase().includes('timeout')
        ) {
          return {
            outcome: CollectorOutcome.Timeout,
            durationMs,
            error: err.message,
          };
        }

        if (statusCode === 429) {
          return {
            outcome: CollectorOutcome.Block,
            statusCode,
            durationMs,
            error: 'Rate limited (429)',
          };
        }

        if (statusCode === 403 || statusCode === 503) {
          const responseHtml = err.response?.data as string | undefined;
          if (responseHtml && this.containsChallengePattern(responseHtml)) {
            return {
              outcome: CollectorOutcome.Challenge,
              statusCode,
              durationMs,
            };
          }
          return {
            outcome: CollectorOutcome.Block,
            statusCode,
            durationMs,
            error: `HTTP ${statusCode}`,
          };
        }

        if (!err.response) {
          return {
            outcome: CollectorOutcome.NetworkError,
            durationMs,
            error: err.message,
          };
        }

        return {
          outcome: CollectorOutcome.ParseError,
          statusCode,
          durationMs,
          error: err.message,
        };
      }

      return {
        outcome: CollectorOutcome.NetworkError,
        durationMs,
        error: String(err),
      };
    }
  }

  private containsChallengePattern(html: string): boolean {
    return CHALLENGE_PATTERNS.some((pattern) => html.includes(pattern));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
