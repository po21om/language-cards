interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'ai:generate': { maxRequests: 10, windowMs: 3600000 },
  'ai:refine': { maxRequests: 20, windowMs: 3600000 },
  'ai:accept': { maxRequests: 30, windowMs: 3600000 },
  'ai:history': { maxRequests: 100, windowMs: 3600000 },
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60000);

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const config = RATE_LIMITS[endpoint];
  
  if (!config) {
    return { allowed: true };
  }

  const key = `${endpoint}:${userId}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}

export function resetRateLimit(userId: string, endpoint: string): void {
  const key = `${endpoint}:${userId}`;
  rateLimitStore.delete(key);
}

export function getRateLimitInfo(userId: string, endpoint: string): {
  remaining: number;
  resetAt: number;
} | null {
  const config = RATE_LIMITS[endpoint];
  
  if (!config) {
    return null;
  }

  const key = `${endpoint}:${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}
