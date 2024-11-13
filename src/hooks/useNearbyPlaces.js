import { useState, useEffect, useCallback } from 'react';
import { checkRateLimit, getRemainingCalls } from '../utils/rateLimit';

const PLACE_TYPES = ['restaurant', 'bar', 'cafe'];
const SEARCH_RADIUS = 1000; // 1km radius
const API_TIMEOUT = 10000; // 10 seconds timeout

const calculateDistance = (point1, point2) => {
  if (window.google?.maps?.geometry?.spherical) {
    return window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(point1.lat, point1.lng),
      point2
    );
  }
  
  const R = 6371e3;
  const φ1 = point1.lat * Math.PI/180;
  const φ2 = point2.lat() * Math.PI/180;
  const Δφ = (point2.lat() - point1.lat) * Math.PI/180;
  const Δλ = (point2.lng() - point1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const promiseWithTimeout = (promise, timeoutMs) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Operation timed out'));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).then(result => {
    clearTimeout(timeoutHandle);
    return result;
  }).catch(error => {
    clearTimeout(timeoutHandle);
    throw error;
  });
};

const useNearbyPlaces = (map, points, bias = 'middle', timeFilter) => {
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remainingSearches, setRemainingSearches] = useState(getRemainingCalls());

  const batchNearbySearch = useCallback(async (service, location, radius, types, openNow) => {
    if (!checkRateLimit()) {
      throw new Error('FREE_LIMIT');
    }

    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: radius,
      type: types,
      openNow: openNow || false
    };

    return promiseWithTimeout(
      new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(results);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(status));
          }
        });
      }),
      API_TIMEOUT
    );
  }, []);

  const batchPlaceDetails = useCallback(async (service, places) => {
    if (!checkRateLimit()) {
      throw new Error('FREE_LIMIT');
    }

    const detailsPromises = places.map(place => 
      promiseWithTimeout(
        new Promise((resolve) => {
          service.getDetails({
            placeId: place.place_id,
            fields: [
              'name',
              'rating',
              'formatted_address',
              'opening_hours',
              'price_level',
              'website',
              'geometry',
              'types',
              'user_ratings_total',
              'place_id',
              'editorial_summary'
            ]
          }, (details, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(details);
            } else {
              resolve(null);
            }
          });
        }),
        API_TIMEOUT
      )
    );

    return Promise.all(detailsPromises);
  }, []);

  const fetchNearbyPlaces = useCallback(async () => {
    if (!map || points.length !== 2) return;

    setIsLoading(true);
    setError(null);

    try {
      const service = new window.google.maps.places.PlacesService(map);
      
      const results = await batchNearbySearch(
        service,
        points[0],
        SEARCH_RADIUS,
        PLACE_TYPES,
        timeFilter?.openNow
      );

      const uniquePlaces = Array.from(
        new Map(results.map(place => [place.place_id, place])).values()
      );

      const detailedPlaces = await batchPlaceDetails(service, uniquePlaces);
      
      let filteredPlaces = detailedPlaces
        .filter(place => place !== null)
        .map(details => {
          const distance = calculateDistance(points[0], details.geometry.location);
          return {
            ...details,
            distance,
            primaryType: PLACE_TYPES.find(type => details.types?.includes(type)) || details.types?.[0],
            dine_in: details.types?.includes('restaurant'),
            takeout: details.types?.includes('meal_takeaway'),
            delivery: details.types?.includes('meal_delivery')
          };
        });
      
      if (timeFilter?.specificTime) {
        const { day, time } = timeFilter.specificTime;
        filteredPlaces = filteredPlaces.filter(place => {
          const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            .indexOf(day.toLowerCase());
          
          if (!place.opening_hours?.periods) return true;
          
          return place.opening_hours.periods.some(period => {
            if (period.open?.day !== dayIndex) return false;
            
            const openTime = parseInt(period.open.time);
            const closeTime = parseInt(period.close?.time || '2359');
            const checkTime = parseInt(time.replace(':', ''));
            
            return checkTime >= openTime && checkTime <= closeTime;
          });
        });
      }

      const sortedPlaces = filteredPlaces.sort((a, b) => a.distance - b.distance);
      setVenues(sortedPlaces);
      setRemainingSearches(getRemainingCalls());

    } catch (err) {
      if (err.message === 'Operation timed out') {
        setError('Request timed out. Please try again.');
      } else if (err.message === 'FREE_LIMIT') {
        setError('You\'ve used all free searches for today. Try again tomorrow!');
      } else if (err.message === 'OVER_QUERY_LIMIT') {
        setError('You\'ve used all free searches for today. Try again tomorrow!');
      } else {
        setError('Unable to find places. Please try again.');
      }
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [map, points, timeFilter, batchNearbySearch, batchPlaceDetails]);

  useEffect(() => {
    if (points.length === 2) {
      fetchNearbyPlaces();
    }
  }, [points, bias, timeFilter, fetchNearbyPlaces]);

  return {
    places: venues,
    isLoading,
    error,
    remainingSearches,
    refetch: fetchNearbyPlaces
  };
};

export default useNearbyPlaces;