export class APIError extends Error {
    constructor(message, code, details = {}) {
      super(message);
      this.name = 'APIError';
      this.code = code;
      this.details = details;
    }
  }
  
  export const ERROR_CODES = {
    RATE_LIMIT: 'RATE_LIMIT',
    TIMEOUT: 'TIMEOUT',
    GEOCODING: 'GEOCODING',
    PLACES: 'PLACES',
    NETWORK: 'NETWORK',
    VALIDATION: 'VALIDATION',
    GOOGLE_API: 'GOOGLE_API',
    CACHE: 'CACHE'
  };
  
  export const getErrorMessage = (error) => {
    if (error instanceof APIError) {
      switch (error.code) {
        case ERROR_CODES.RATE_LIMIT:
          return "You've reached the daily search limit. Please try again tomorrow.";
        case ERROR_CODES.TIMEOUT:
          return "The request took too long. Please try again.";
        case ERROR_CODES.GEOCODING:
          return error.details.address 
            ? `Couldn't find "${error.details.address}". Please check the address.`
            : "Couldn't find this location. Please check the address.";
        case ERROR_CODES.PLACES:
          return "Couldn't find places nearby. Please try a different location or expand your search.";
        case ERROR_CODES.NETWORK:
          return "Network error. Please check your connection and try again.";
        case ERROR_CODES.VALIDATION:
          return error.message || "Please check your input and try again.";
        case ERROR_CODES.GOOGLE_API:
          return "Service temporarily unavailable. Please try again in a few minutes.";
        case ERROR_CODES.CACHE:
          return "There was a problem with saved data. Please try your search again.";
        default:
          return error.message;
      }
    }
    return error.message || "An unexpected error occurred. Please try again.";
  };
  
  export const handleError = (error, setError) => {
    const message = getErrorMessage(error);
    setError(message);
    console.error('[Error]:', {
      name: error.name,
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack
    });
  };
  
  export const validateAddress = (address, label = 'Address') => {
    if (!address || typeof address !== 'string') {
      throw new APIError(
        `${label} is required`,
        ERROR_CODES.VALIDATION,
        { field: 'address' }
      );
    }
  
    if (address.trim().length < 3) {
      throw new APIError(
        `${label} must be at least 3 characters`,
        ERROR_CODES.VALIDATION,
        { field: 'address' }
      );
    }
  
    return true;
  };