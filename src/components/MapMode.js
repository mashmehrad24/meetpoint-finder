import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { darkMapTheme } from '../constants/MapTheme';
import { Loader2, List } from 'lucide-react';
import useMapLogic from '../hooks/useMapLogic';
import useNearbyPlaces from '../hooks/useNearbyPlaces';
import VenueList from './VenueList';

const libraries = ["places", "geometry"];
const mapDivId = "google-map-div";

const MapMode = ({ onSwitchToList, savedState }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapElementRef = React.useRef(null);

  const {
    points,
    setPoints,
    midpoint,
    setMidpoint,
    mapCenter,
    mapZoom,
    mapRef,
    handleMapClick,
    onMapLoad,
    transportModes,
    fitBoundsToPoints
  } = useMapLogic(true);

  const {
    places,
    totalResults,
    currentPage,
    setCurrentPage,
    isLoading: isLoadingPlaces,
    error: placesError,
    remainingSearches,
    fetchPlaces,
    setActiveFilters,
    RESULTS_PER_PAGE
  } = useNearbyPlaces({ isMapMode: true, map: mapRef.current });

  const handleMapLoaded = useCallback((map) => {
    setIsMapLoaded(true);
    mapRef.current = map;
    mapElementRef.current = map.getDiv();
    onMapLoad(map);

    // Restore saved state if exists
    if (savedState) {
      setPoints(savedState.points);
      setMidpoint(savedState.midpoint);
      setTimeout(() => {
        fitBoundsToPoints(savedState.points);
        fetchPlaces(savedState.points, {
          transportModes: savedState.transportModes,
          locationBias: savedState.locationBias,
          timeFilter: savedState.timeFilter
        });
      }, 100);
    }
  }, [savedState, setPoints, setMidpoint, fitBoundsToPoints, fetchPlaces, onMapLoad]);

  const handleLoadError = (error) => {
    console.error('Google Maps loading error:', error);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="w-96 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Venues</h2>
          <button
            onClick={() => onSwitchToList(savedState)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg text-gray-200 text-sm"
          >
            <List className="w-4 h-4" />
            List View
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <VenueList
            places={places}
            totalResults={totalResults}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isLoading={isLoadingPlaces}
            error={placesError}
            remainingSearches={remainingSearches}
            timeFilter={savedState?.timeFilter}
            resultsPerPage={RESULTS_PER_PAGE}
            setActiveFilters={setActiveFilters}
            transportModes={transportModes}
            points={points}
            compact={true}
          />
        </div>
      </div>

      <div className="flex-1 bg-gray-800">
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={libraries}
          onError={handleLoadError}
        >
          {!isMapLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  <span className="text-white font-medium">Loading map...</span>
                </div>
              </div>
            </div>
          ) : (
            <GoogleMap
              id={mapDivId}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              zoom={mapZoom}
              center={mapCenter}
              onClick={handleMapClick}
              onLoad={handleMapLoaded}
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

              {places.map((place, index) => (
                <Marker
                  key={`place-${place.place_id}`}
                  position={place.geometry.location}
                  label={{
                    text: (index + 1).toString(),
                    className: "text-xs"
                  }}
                />
              ))}
            </GoogleMap>
          )}
        </LoadScript>
      </div>
    </div>
  );
};

export default MapMode;