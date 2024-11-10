const RATE_LIMIT_KEY = 'maps_api_calls';
const MAX_CALLS_PER_HOUR = 100; // Adjust this number based on your needs

export const checkRateLimit = () => {
  const now = Date.now();
  const hour = Math.floor(now / 3600000);
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  const { calls = 0, lastHour = hour } = stored ? JSON.parse(stored) : {};
  
  if (lastHour !== hour) {
    // Reset for new hour
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ calls: 1, lastHour: hour }));
    return true;
  }
  
  if (calls >= MAX_CALLS_PER_HOUR) {
    return false;
  }
  
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ calls: calls + 1, lastHour }));
  return true;
};

export const getRemainingCalls = () => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  if (!stored) return MAX_CALLS_PER_HOUR;
  
  const { calls = 0 } = JSON.parse(stored);
  return Math.max(0, MAX_CALLS_PER_HOUR - calls);
};