import Cache from './cache';
import { APIError, ERROR_CODES } from './errorHandling';

const MAX_CALLS_PER_DAY = 100;
const CALLS_RESET_HOURS = 24;
const RATE_LIMIT_CACHE_KEY = 'rate_limit';

export const checkRateLimit = () => {
  const now = Date.now();
  const storedData = Cache.getRateLimitData();
  let rateLimit;

  if (storedData) {
    rateLimit = storedData;
    if (now - rateLimit.timestamp > CALLS_RESET_HOURS * 60 * 60 * 1000) {
      rateLimit = {
        timestamp: now,
        calls: 0,
        lastCall: null,
        callsByEndpoint: {}
      };
    }
  } else {
    rateLimit = {
      timestamp: now,
      calls: 0,
      lastCall: null,
      callsByEndpoint: {}
    };
  }

  if (rateLimit.calls >= MAX_CALLS_PER_DAY) {
    throw new APIError(
      'Daily rate limit exceeded',
      ERROR_CODES.RATE_LIMIT,
      {
        resetTime: new Date(rateLimit.timestamp + CALLS_RESET_HOURS * 60 * 60 * 1000),
        currentCalls: rateLimit.calls,
        maxCalls: MAX_CALLS_PER_DAY
      }
    );
  }

  // Enforce minimum time between calls (200ms)
  if (rateLimit.lastCall && now - rateLimit.lastCall < 200) {
    throw new APIError(
      'Too many requests',
      ERROR_CODES.RATE_LIMIT,
      { retryAfter: 200 - (now - rateLimit.lastCall) }
    );
  }

  rateLimit.calls++;
  rateLimit.lastCall = now;
  Cache.setRateLimitData(rateLimit);
  return true;
};

export const getRemainingCalls = () => {
  const rateLimit = Cache.getRateLimitData();
  if (!rateLimit) return MAX_CALLS_PER_DAY;

  const now = Date.now();
  if (now - rateLimit.timestamp > CALLS_RESET_HOURS * 60 * 60 * 1000) {
    return MAX_CALLS_PER_DAY;
  }

  return Math.max(0, MAX_CALLS_PER_DAY - rateLimit.calls);
};

export const getResetTime = () => {
  const rateLimit = Cache.getRateLimitData();
  if (!rateLimit) return null;

  return new Date(rateLimit.timestamp + CALLS_RESET_HOURS * 60 * 60 * 1000);
};

export const trackEndpointCall = (endpoint) => {
  const rateLimit = Cache.getRateLimitData() || {
    timestamp: Date.now(),
    calls: 0,
    lastCall: null,
    callsByEndpoint: {}
  };

  rateLimit.callsByEndpoint[endpoint] = (rateLimit.callsByEndpoint[endpoint] || 0) + 1;
  Cache.setRateLimitData(rateLimit);
};

export const getEndpointCalls = (endpoint) => {
  const rateLimit = Cache.getRateLimitData();
  if (!rateLimit || !rateLimit.callsByEndpoint) return 0;
  return rateLimit.callsByEndpoint[endpoint] || 0;
};