const CACHE_PREFIX = 'konkt_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class Cache {
  static set(key, value, duration = CACHE_DURATION) {
    const item = {
      value,
      timestamp: Date.now(),
      expiry: Date.now() + duration
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  }

  static get(key) {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return parsed.value;
  }

  static getGeocode(address) {
    return this.get(`geocode_${address}`);
  }

  static setGeocode(address, coordinates) {
    this.set(`geocode_${address}`, coordinates);
  }

  static getPlaces(key, location) {
    return this.get(`places_${key}_${location.lat}_${location.lng}`);
  }

  static setPlaces(key, location, places) {
    this.set(`places_${key}_${location.lat}_${location.lng}`, places);
  }

  static getTravelTime(origin, destination, mode) {
    return this.get(`travel_${origin}_${destination}_${mode}`);
  }

  static setTravelTime(origin, destination, mode, duration) {
    this.set(`travel_${origin}_${destination}_${mode}`, duration);
  }

  static clearExpired() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      });
  }

  static getRateLimitData() {
    return this.get('rate_limit');
  }

  static setRateLimitData(data) {
    this.set('rate_limit', data, CACHE_DURATION);
  }

  static getSuggestions(input) {
    return this.get(`suggestions_${input.toLowerCase()}`);
  }

  static setSuggestions(input, suggestions) {
    // Cache suggestions for a shorter duration (1 hour)
    this.set(`suggestions_${input.toLowerCase()}`, suggestions, 60 * 60 * 1000);
  }
}

export default Cache;