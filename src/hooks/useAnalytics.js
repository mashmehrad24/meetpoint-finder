// src/hooks/useAnalytics.js
const useAnalytics = () => {
    const trackEvent = (eventName, params = {}) => {
      if (window.gtag) {
        window.gtag('event', eventName, params);
      }
    };
  
    return {
      trackSearch: (address1, address2) => {
        trackEvent('search_locations', {
          address1,
          address2
        });
      },
      
      trackVenueSelect: (venueName, venueType, distance) => {
        trackEvent('select_venue', {
          venue_name: venueName,
          venue_type: venueType,
          distance: distance
        });
      },
  
      trackTimeFilter: (filterType, value) => {
        trackEvent('time_filter_change', {
          filter_type: filterType,
          value: value
        });
      },
  
      trackError: (errorMessage) => {
        trackEvent('error_occurred', {
          error_message: errorMessage
        });
      }
    };
  };
  
  export default useAnalytics;