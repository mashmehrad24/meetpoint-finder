import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { LocationSearch } from './LocationSearch';
import useMapLogic from '../hooks/useMapLogic';
import { darkMapTheme } from '../constants/MapTheme';
import useNearbyPlaces from '../hooks/useNearbyPlaces';
import VenueList from './VenueList';
import TimeFilters from './TimeFilters';
import LocationBiasControls from './LocationBiasControls';
import { checkRateLimit } from '../utils/rateLimit';
import TransportModeSelector from './TransportModeSelector';

const libraries = ["places", "geometry"];
const GEOCODING_TIMEOUT = 10000; // 10 seconds

const MapComponent = () => {
  const [timeFilter, setTimeFilter] = useState({
    openNow: false,
    specificTime: null
  });

  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions1, setSuggestions1] = useState([]);
  const [suggestions2, setSuggestions2] = useState([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [locationBias, setLocationBias] = useState('middle');
  const [transportMode1, setTransportMode1] = useState('DRIVING');
  const [transportMode2, setTransportMode2] = useState('DRIVING');
  const autocompleteService = useRef(null);
  const loadingTimeoutRef = useRef(null);

  const handleTimeFilterChange = (filterUpdate) => {
    if (filterUpdate.type === 'openNow') {
      setTimeFilter({
        openNow: filterUpdate.value,
        specificTime: null
      });
    } else if (filterUpdate.type === 'specificTime') {
      setTimeFilter({
        openNow: false,
        specificTime: filterUpdate.value
      });
    }
  };

  const {
    points,
    setPoints,
    midpoint,
    setMidpoint,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    mapRef,
    handleMapClick,
    onMapLoad
  } = useMapLogic();

  const {
    places,
    isLoading: isLoadingPlaces,
    error: placesError,
    remainingSearches
  } = useNearbyPlaces(mapRef.current, points, locationBias, timeFilter, {
    transportMode1,
    transportMode2
  });

  const getSuggestions = async (input, setSuggestions) => {
    if (!input || !autocompleteService.current) return;

    if (!checkRateLimit()) {
      setIsRateLimited(true);
      setError('You\'ve used all free searches for today. Try again tomorrow!');
      return;
    }

    try {
      const request = { input };
      const response = await new Promise((resolve, reject) => {
        autocompleteService.current.getPlacePredictions(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });

      setSuggestions(response);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const geocodeAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Geocoding timed out'));
      }, GEOCODING_TIMEOUT);

      geocoder.geocode({ address }, (results, status) => {
        clearTimeout(timeoutId);
        if (status === 'OK') {
          const { lat, lng } = results[0].geometry.location;
          resolve({ lat: lat(), lng: lng() });
        } else {
          reject(`Geocoding failed for address: ${address}`);
        }
      });
    });
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!checkRateLimit()) {
      setIsRateLimited(true);
      setError('You\'ve used all free searches for today. Try again tomorrow!');
      return;
    }

    setIsLoading(true);
    
    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Set a new loading timeout
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError('Search took too long. Please try again.');
    }, GEOCODING_TIMEOUT);

    try {
      const point1 = await geocodeAddress(address1);
      const point2 = await geocodeAddress(address2);
      
      const newPoints = [point1, point2];
      setPoints(newPoints);
      
      const mid = {
        lat: (point1.lat + point2.lat) / 2,
        lng: (point1.lng + point2.lng) / 2
      };
      setMidpoint(mid);
      setMapCenter(mid);

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(point1.lat, point1.lng));
      bounds.extend(new window.google.maps.LatLng(point2.lat, point2.lng));
      
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
      // Clear the loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };

  const handleReset = () => {
    setPoints([]);
    setMidpoint(null);
    setAddress1('');
    setAddress2('');
    setError('');
    setSuggestions1([]);
    setSuggestions2([]);
    setMapCenter({ lat: 43.6532, lng: -79.3832 });
    setMapZoom(11);
    setTimeFilter({ openNow: false, specificTime: null });
    setIsRateLimited(false);
    setLocationBias('middle');
    setTransportMode1('DRIVING');
    setTransportMode2('DRIVING');
    setIsLoading(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const onLoadScript = () => {
    autocompleteService.current = new window.google.maps.places.AutocompleteService();
  };

  const onErrorScript = (error) => {
    setError('Failed to load Google Maps. Please try refreshing the page.');
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  if (isRateLimited) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl text-white font-bold mb-4">Free Limit Reached</h2>
          <p className="text-gray-300">
            You've used all free searches for today. Please try again tomorrow!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-45px)] flex">
      <div className="flex-1 min-w-[500px] flex flex-col bg-gray-900 border-r border-gray-700">
        <div className="p-3 space-y-2 overflow-y-auto">
          <LocationSearch
            address1={address1}
            address2={address2}
            setAddress1={setAddress1}
            setAddress2={setAddress2}
            suggestions1={suggestions1}
            suggestions2={suggestions2}
            setSuggestions1={setSuggestions1}
            setSuggestions2={setSuggestions2}
            handleAddressSubmit={handleAddressSubmit}
            handleReset={handleReset}
            isLoading={isLoading}
            error={error}
            getSuggestions={getSuggestions}
            transportMode1={transportMode1}
            transportMode2={transportMode2}
            onTransportMode1Change={setTransportMode1}
            onTransportMode2Change={setTransportMode2}
          />

          {points.length === 2 && (
            <LocationBiasControls 
              bias={locationBias}
              onBiasChange={setLocationBias}
            />
          )}

          {midpoint && (
            <div className="space-y-2">
              <TimeFilters 
                onFilterChange={handleTimeFilterChange}
                compact={true}
              />
              
              <div className="flex-1 bg-gray-800 rounded-lg">
                <VenueList 
                  places={places}
                  isLoading={isLoadingPlaces}
                  error={placesError}
                  remainingSearches={remainingSearches}
                  timeFilter={timeFilter}
                  compact={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 bg-gray-800">
        <LoadScript 
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={libraries}
          onLoad={onLoadScript}
          onError={onErrorScript}
        >
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={mapZoom}
            center={mapCenter}
            onClick={handleMapClick}
            onLoad={onMapLoad}
            options={{
              styles: darkMapTheme,
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false
            }}
          >
            {points.map((point, index) => (
              <Marker
                key={`point-${index}`}
                position={point}
                label={{
                  text: index === 0 ? "A" : "B",
                  className: "font-semibold"
                }}
                icon={{
                  url: index === 0 
                    ? "http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
                    : "http://maps.google.com/mapfiles/ms/icons/pink-dot.png"
                }}
              />
            ))}
            
            {midpoint && (
              <Marker
                key="midpoint"
                position={midpoint}
                label={{
                  text: "M",
                  className: "font-semibold"
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default MapComponent;