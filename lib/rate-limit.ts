import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL ?? "";
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

// When Upstash credentials are missing or are placeholder values, rate limiting
// is skipped (fail-open). Production deployments must set real credentials.
const isConfigured =
  url.startsWith("https://") && token.length > 10;

const redis = isConfigured
  ? new Redis({ url, token })
  : null;

function makeLimiter(limiter: ReturnType<typeof Ratelimit.slidingWindow>, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter, prefix });
}

export const authLimiter = makeLimiter(Ratelimit.slidingWindow(10, "1 h"), "rl:auth");
export const apiLimiter = makeLimiter(Ratelimit.slidingWindow(60, "1 m"), "rl:api");
export const checkoutLimiter = makeLimiter(Ratelimit.slidingWindow(5, "1 h"), "rl:checkout");
export const leadFormLimiter = makeLimiter(Ratelimit.slidingWindow(3, "1 h"), "rl:lead");

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const RATE_LIMIT_TIMEOUT_MS = 200;
const ALLOW_ALL: RateLimitResult = { success: true, limit: 0, remaining: 0, reset: 0 };

export async function applyRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) return ALLOW_ALL;

  try {
    // Race the Upstash call against a 200 ms timeout so a slow Redis response
    // never blocks the request. On timeout we fail open (allow through).
    const timeout = new Promise<RateLimitResult>((resolve) =>
      setTimeout(() => resolve(ALLOW_ALL), RATE_LIMIT_TIMEOUT_MS)
    );
    const check = limiter
      .limit(identifier)
      .then(({ success, limit, remaining, reset }) => ({ success, limit, remaining, reset }));
    return await Promise.race([check, timeout]);
  } catch {
    return ALLOW_ALL;
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}
