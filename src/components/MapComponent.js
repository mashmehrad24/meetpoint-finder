import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { LocationSearch } from './LocationSearch';
import useMapLogic from '../hooks/useMapLogic';
import { darkMapTheme } from '../constants/MapTheme';
import useNearbyPlaces from '../hooks/useNearbyPlaces';
import VenueList from './VenueList';
import TimeFilters from './TimeFilters';

// Add geometry library
const libraries = ["places", "geometry"];

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
  const autocompleteService = useRef(null);

  const handleTimeFilterChange = (filterUpdate) => {
    console.log('Time filter update received:', filterUpdate);
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
  } = useNearbyPlaces(mapRef.current, midpoint, timeFilter);

  // Add this effect to monitor places updates
  useEffect(() => {
    console.log('Places updated:', places);
  }, [places]);

  // Add this effect to monitor timeFilter updates
  useEffect(() => {
    console.log('Time filter changed:', timeFilter);
  }, [timeFilter]);

  const getSuggestions = async (input, setSuggestions) => {
    if (!input || !autocompleteService.current) return;

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
      geocoder.geocode({ address }, (results, status) => {
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
    setIsLoading(true);

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
    setTimeFilter({ openNow: false, specificTime: null }); // Reset time filter
  };

  const onLoadScript = () => {
    console.log('Google Maps script loaded successfully');
    autocompleteService.current = new window.google.maps.places.AutocompleteService();
  };

  const onErrorScript = (error) => {
    console.error('Error loading Google Maps script:', error);
    setError('Failed to load Google Maps. Please try refreshing the page.');
  };

  return (
    <div className="h-[calc(100vh-45px)] flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Left Column - Search and Venues */}
        <div className="h-full flex flex-col gap-4 overflow-hidden">
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
          />

          {midpoint && (
            <TimeFilters 
              onFilterChange={handleTimeFilterChange}
              key="time-filters"
            />
          )}

          {midpoint && (
            <div className="flex-1 overflow-hidden bg-gray-800 rounded-lg border border-gray-700">
              <VenueList 
                places={places}
                isLoading={isLoadingPlaces}
                error={placesError}
                timeFilter={timeFilter}
              />
            </div>
          )}
        </div>

        {/* Map Section - Takes up 2/3 of the width on large screens */}
        <div className="h-full lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700">
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
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true
              }}
            >
              {points.map((point, index) => (
                <Marker
                  key={`point-${index}`}
                  position={point}
                  label={{
                    text: index === 0 ? "You" : "Them",
                    className: "text-gray-900 font-semibold"
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
                    text: "Perfect Spot",
                    className: "text-gray-900 font-semibold"
                  }}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  }}
                />
              )}

              {places.map((place) => (
                <Marker
                  key={`venue-${place.place_id}`}
                  position={place.geometry.location}
                  icon={{
                    url: `http://maps.google.com/mapfiles/ms/icons/${
                      place.primaryType === 'restaurant' ? 'yellow' :
                      place.primaryType === 'bar' ? 'blue' : 'green'
                    }-dot.png`
                  }}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>

      {/* Status messages in a fixed position at the bottom */}
      <div className="px-4 pb-4">
        {midpoint && !isLoadingPlaces && !placesError && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-xl font-semibold text-gray-100">Perfect Meetup Spot Found!</h2>
            <p className="text-gray-400">
              We've found the ideal location halfway between both points and {places.length} nearby venues!
            </p>
          </div>
        )}

        {isLoadingPlaces && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400">Loading nearby venues...</p>
          </div>
        )}
        
        {placesError && (
          <div className="bg-gray-800 rounded-lg border border-red-700 p-4">
            <p className="text-red-400">Error loading nearby venues: {placesError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;