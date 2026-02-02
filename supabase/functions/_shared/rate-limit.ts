/**
 * Shared Rate Limiting Module for Edge Functions
 * 
 * Provides in-memory rate limiting with configurable windows and limits.
 * For production at scale, consider using Redis or database-backed limits.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyPrefix?: string;    // Optional prefix for the key
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

// In-memory storage for rate limits
// Note: This resets when the function cold starts
// For persistent limits, use the database check_rate_limit function
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check and update rate limit for a given key
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
  const entry = rateLimitStore.get(fullKey);
  
  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(fullKey, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
      retryAfterMs: 0,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }
  
  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfterMs: 0,
  };
}

/**
 * Create a rate limit response with proper headers
 */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded. Please try again later.",
      retry_after_seconds: Math.ceil(result.retryAfterMs / 1000),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
      },
    }
  );
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult
): Record<string, string> {
  return {
    ...headers,
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // AI-related operations - expensive, limit strictly
  AI_GENERATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: "ai",
  },
  
  // Email sending - prevent spam
  EMAIL_SEND: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyPrefix: "email",
  },
  
  // Verification codes - prevent brute force
  VERIFICATION: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 3,
    keyPrefix: "verify",
  },
  
  // General API calls
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: "api",
  },
  
  // Invite/signup operations
  INVITE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyPrefix: "invite",
  },
  
  // Broadcast messages
  BROADCAST: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
    keyPrefix: "broadcast",
  },
  
  // Account operations (delete, export)
  ACCOUNT_OPS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyPrefix: "account",
  },
} as const;

/**
 * Input sanitization utilities
 */

// Maximum lengths for common inputs
export const INPUT_LIMITS = {
  EMAIL: 255,
  MESSAGE: 2000,
  TITLE: 200,
  DESCRIPTION: 5000,
  CODE: 20,
  UUID: 36,
  URL: 2048,
} as const;

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  
  const cleaned = email.trim().toLowerCase().slice(0, INPUT_LIMITS.EMAIL);
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) return null;
  
  return cleaned;
}

/**
 * Sanitize string input with max length
 */
export function sanitizeString(
  input: unknown,
  maxLength: number,
  options: { trim?: boolean; lowercase?: boolean } = {}
): string | null {
  if (typeof input !== "string") return null;
  
  let cleaned = input.slice(0, maxLength);
  if (options.trim !== false) cleaned = cleaned.trim();
  if (options.lowercase) cleaned = cleaned.toLowerCase();
  
  return cleaned || null;
}

/**
 * Validate UUID format
 */
export function isValidUUID(input: unknown): input is string {
  if (typeof input !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input);
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(
  input: unknown,
  maxItems: number,
  maxItemLength: number
): string[] {
  if (!Array.isArray(input)) return [];
  
  return input
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.slice(0, maxItemLength).trim())
    .filter((item) => item.length > 0);
}
