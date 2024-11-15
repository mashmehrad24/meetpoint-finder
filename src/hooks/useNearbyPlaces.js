import { useState, useCallback, useEffect, useRef } from 'react';
import { checkRateLimit, getRemainingCalls, trackEndpointCall } from '../utils/rateLimit';
import { APIError, ERROR_CODES } from '../utils/errorHandling';
import Cache from '../utils/cache';

const PLACE_TYPES = ['restaurant', 'bar', 'cafe', 'night_club', 'park'];
const SEARCH_RADIUS = 1000; // 1km radius
const API_TIMEOUT = 10000; // 10 seconds
const INITIAL_RESULTS = 5;
const MAX_TOTAL_RESULTS = 60;
const REQUEST_DELAY = 250; // Delay between requests

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const calculateStraightLineDistance = (point1, point2) => {
  const R = 6371e3;
  const φ1 = point1.lat * Math.PI/180;
  const φ2 = point2.lat * Math.PI/180;
  const Δφ = (point2.lat - point1.lat) * Math.PI/180;
  const Δλ = (point2.lng - point1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const useNearbyPlaces = ({ isMapMode = false, map = null }) => {
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [activeFilters, setActiveFilters] = useState([]);
  const detailedPlacesCache = useRef(new Map());
  const searchAbortController = useRef(null);
  const placesService = useRef(null);

  useEffect(() => {
    if (isMapMode && map && window.google) {
      placesService.current = new window.google.maps.places.PlacesService(map);
    } else {
      placesService.current = null;
    }
  }, [isMapMode, map]);

  const abortPreviousSearch = () => {
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    searchAbortController.current = new AbortController();
  };

  const searchPlaces = useCallback(async (location, searchParams) => {
    if (!checkRateLimit()) {
      throw new APIError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT);
    }

    const cacheKey = `${JSON.stringify(location)}_${JSON.stringify(searchParams)}`;
    const cachedResults = Cache.getPlaces(cacheKey, location);
    if (cachedResults) {
      return cachedResults;
    }

    trackEndpointCall('nearby_search');
    let results = [];

    if (isMapMode && placesService.current) {
      for (const type of PLACE_TYPES) {
        try {
          await delay(REQUEST_DELAY); // Add delay between requests
          const typeResults = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new APIError('Request timeout', ERROR_CODES.TIMEOUT));
            }, API_TIMEOUT);

            placesService.current.nearbySearch({
              location: new window.google.maps.LatLng(location.lat, location.lng),
              radius: SEARCH_RADIUS,
              type: type,
              ...searchParams,
            }, (results, status) => {
              clearTimeout(timeoutId);
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
              } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([]);
              } else {
                reject(new APIError(`Places API error: ${status}`, ERROR_CODES.PLACES));
              }
            });
          });
          
          results = [...results, ...typeResults];
        } catch (error) {
          console.error(`Error searching for ${type}:`, error);
        }
      }

      const uniqueResults = results.reduce((unique, place) => {
        if (!unique.find(p => p.place_id === place.place_id)) {
          unique.push(place);
        }
        return unique;
      }, []);

      const limitedResults = uniqueResults.slice(0, MAX_TOTAL_RESULTS);
      Cache.setPlaces(cacheKey, location, limitedResults);
      return limitedResults;
    } else {
      const response = await fetch(`/api/places/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          radius: SEARCH_RADIUS,
          types: PLACE_TYPES,
          ...searchParams
        })
      });

      if (!response.ok) {
        throw new APIError('Failed to fetch places', ERROR_CODES.PLACES);
      }

      const data = await response.json();
      Cache.setPlaces(cacheKey, location, data.results);
      return data.results;
    }
  }, [isMapMode]);

  const getPlaceDetails = useCallback(async (placeId) => {
    if (detailedPlacesCache.current.has(placeId)) {
      return detailedPlacesCache.current.get(placeId);
    }

    if (!checkRateLimit()) {
      throw new APIError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT);
    }

    await delay(REQUEST_DELAY); // Add delay between requests
    trackEndpointCall('place_details');

    if (isMapMode && placesService.current) {
      try {
        const details = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new APIError('Request timeout', ERROR_CODES.TIMEOUT));
          }, API_TIMEOUT);

          placesService.current.getDetails({
            placeId: placeId,
            fields: [
              'name',
              'formatted_address',
              'geometry',
              'rating',
              'user_ratings_total',
              'opening_hours',
              'website',
              'price_level',
              'photos',
              'types',
              'international_phone_number'
            ]
          }, (result, status) => {
            clearTimeout(timeoutId);
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(result);
            } else {
              reject(new APIError(`Place details error: ${status}`, ERROR_CODES.PLACES));
            }
          });
        });

        detailedPlacesCache.current.set(placeId, details);
        return details;
      } catch (error) {
        throw error;
      }
    } else {
      const response = await fetch(`/api/places/details/${placeId}`);
      if (!response.ok) {
        throw new APIError('Failed to fetch place details', ERROR_CODES.PLACES);
      }

      const details = await response.json();
      detailedPlacesCache.current.set(placeId, details);
      return details;
    }
  }, [isMapMode]);

  const fetchPlaces = useCallback(async (points, params = {}) => {
    abortPreviousSearch();
    setIsLoading(true);
    setError(null);

    try {
      if (points.length !== 2) {
        setVenues([]);
        setTotalResults(0);
        return;
      }

      const midpoint = {
        lat: (points[0].lat + points[1].lat) / 2,
        lng: (points[0].lng + points[1].lng) / 2
      };

      const places = await searchPlaces(midpoint, params);
      
      // Fetch details in batches
      const firstPageDetails = [];
      for (const place of places.slice(0, INITIAL_RESULTS)) {
        try {
          const details = await getPlaceDetails(place.place_id);
          firstPageDetails.push(details);
        } catch (error) {
          console.error('Error fetching place details:', error);
        }
      }
      
      const placesWithDetails = firstPageDetails.map(place => ({
        ...place,
        straightLineDistance: calculateStraightLineDistance(midpoint, place.geometry.location)
      }));

      const sortedPlaces = placesWithDetails.sort((a, b) => 
        a.straightLineDistance - b.straightLineDistance
      );

      setTotalResults(places.length);
      setVenues(sortedPlaces);
      setCurrentPage(1);

    } catch (error) {
      setError(error);
      setVenues([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchPlaces, getPlaceDetails]);

  const loadMoreDetails = useCallback(async () => {
    if (!venues.length || isLoading) return;

    const startIndex = venues.length;
    const endIndex = startIndex + INITIAL_RESULTS;
    
    if (startIndex >= totalResults) return;

    setIsLoading(true);
    try {
      const nextPageDetails = [];
      for (const place of venues.slice(startIndex, endIndex)) {
        try {
          const details = await getPlaceDetails(place.place_id);
          nextPageDetails.push(details);
        } catch (error) {
          console.error('Error fetching additional place details:', error);
        }
      }
      
      setVenues(prev => [...prev, ...nextPageDetails]);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [venues, isLoading, totalResults, getPlaceDetails]);

  const getPageResults = useCallback(() => {
    const startIndex = (currentPage - 1) * INITIAL_RESULTS;
    const pageVenues = venues.slice(startIndex, startIndex + INITIAL_RESULTS);
    
    if (pageVenues.length < INITIAL_RESULTS && startIndex + pageVenues.length < totalResults) {
      loadMoreDetails();
    }
    
    return pageVenues;
  }, [venues, currentPage, totalResults, loadMoreDetails]);

  useEffect(() => {
    return () => {
      abortPreviousSearch();
    };
  }, []);

  return {
    places: getPageResults(),
    totalResults,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    remainingSearches: getRemainingCalls(),
    fetchPlaces,
    setActiveFilters,
    RESULTS_PER_PAGE: INITIAL_RESULTS
  };
};

export default useNearbyPlaces;