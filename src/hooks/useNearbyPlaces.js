import { useState, useEffect, useCallback } from 'react';
import { checkRateLimit } from '../utils/rateLimit';

const PLACE_TYPES = ['restaurant', 'bar', 'cafe'];
const SEARCH_RADIUS = 1000; // 1km radius

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

const useNearbyPlaces = (map, midpoint, timeFilter) => {
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbyPlaces = useCallback(async () => {
    if (!map || !midpoint) return;

    if (!checkRateLimit()) {
      setError('Rate limit exceeded. Please try again in an hour.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = new window.google.maps.places.PlacesService(map);
      
      const searchPromises = PLACE_TYPES.map(type => 
        new Promise((resolve, reject) => {
          if (!checkRateLimit()) {
            reject(new Error('Rate limit exceeded'));
            return;
          }

          const request = {
            location: new window.google.maps.LatLng(midpoint.lat, midpoint.lng),
            radius: SEARCH_RADIUS,
            type: type,
            openNow: timeFilter?.openNow || false
          };

          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results);
            } else {
              reject(new Error(`Places API error: ${status}`));
            }
          });
        })
      );

      const allResults = await Promise.all(searchPromises);
      const uniquePlaces = Array.from(
        new Map(allResults.flat().map(place => [place.place_id, place])).values()
      );

      const detailedPlaces = await Promise.all(
        uniquePlaces.map(place => 
          new Promise((resolve) => {
            if (!checkRateLimit()) {
              resolve(null);
              return;
            }

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
                const distance = calculateDistance(midpoint, details.geometry.location);
                resolve({
                  ...details,
                  distance,
                  primaryType: PLACE_TYPES.find(type => details.types?.includes(type)) || details.types?.[0],
                  dine_in: details.types?.includes('restaurant'),
                  takeout: details.types?.includes('meal_takeaway'),
                  delivery: details.types?.includes('meal_delivery')
                });
              } else {
                resolve(null);
              }
            });
          })
        )
      );

      let filteredPlaces = detailedPlaces.filter(place => place !== null);
      
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

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [map, midpoint, timeFilter]);

  useEffect(() => {
    if (midpoint) {
      fetchNearbyPlaces();
    }
  }, [midpoint, timeFilter, fetchNearbyPlaces]);

  return {
    places: venues,
    isLoading,
    error,
    refetch: fetchNearbyPlaces
  };
};

export default useNearbyPlaces;