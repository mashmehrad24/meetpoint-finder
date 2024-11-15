import React, { useState, useCallback, useEffect } from 'react';
import { LocationSearch } from './LocationSearch';
import VenueList from './VenueList';
import TimeFilters from './TimeFilters';
import LocationBiasControls from './LocationBiasControls';
import { handleError } from '../utils/errorHandling';
import debounce from 'lodash/debounce';
import useNearbyPlaces from '../hooks/useNearbyPlaces';
import useMapLogic from '../hooks/useMapLogic';

const ListMode = ({ onSwitchToMap, savedState = null }) => {
  const [timeFilter, setTimeFilter] = useState({
    openNow: false,
    specificTime: null
  });
  const [address1, setAddress1] = useState(savedState?.address1 || '');
  const [address2, setAddress2] = useState(savedState?.address2 || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions1, setSuggestions1] = useState([]);
  const [suggestions2, setSuggestions2] = useState([]);
  const [locationBias, setLocationBias] = useState('middle');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  const {
    points,
    setPoints,
    midpoint,
    setMidpoint,
    geocodeAddress,
    transportModes,
    updateTransportMode,
    resetMap,
    isGeocoding,
  } = useMapLogic(false);

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
  } = useNearbyPlaces({ isMapMode: false });

  const getSuggestions = useCallback(
    debounce((input, setSuggestions) => {
      if (!input || input.length < 3) return;
      
      fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.predictions || []);
        })
        .catch(() => setSuggestions([]));
    }, 300),
    []
  );

  const validateAddresses = useCallback(() => {
    if (!address1.trim() || !address2.trim()) {
      setError('Both addresses are required');
      return false;
    }
    return true;
  }, [address1, address2]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!validateAddresses()) return;

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
      
      await fetchPlaces(newPoints, {
        transportModes,
        locationBias,
        timeFilter
      });

    } catch (error) {
      handleError(error, setError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetMap();
    setAddress1('');
    setAddress2('');
    setError('');
    setSuggestions1([]);
    setSuggestions2([]);
    setTimeFilter({ openNow: false, specificTime: null });
    setLocationBias('middle');
    setIsSearchEnabled(false);
    setActiveFilters([]);
  };

  useEffect(() => {
    setIsSearchEnabled(address1.trim().length > 0 && address2.trim().length > 0);
  }, [address1, address2]);

  // Return current state for saving when switching modes
  const getCurrentState = () => ({
    address1,
    address2,
    points,
    midpoint,
    timeFilter,
    locationBias,
    transportModes
  });

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-4">
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
        isLoading={isLoading || isGeocoding}
        error={error}
        getSuggestions={getSuggestions}
        transportModes={transportModes}
        onTransportModeChange={updateTransportMode}
        isSearchEnabled={isSearchEnabled}
      />

      {points.length === 2 && (
        <div className="space-y-4">
          <LocationBiasControls 
            bias={locationBias}
            onBiasChange={setLocationBias}
          />

          <TimeFilters 
            onFilterChange={(filterUpdate) => {
              setTimeFilter(prev => {
                if (filterUpdate.type === 'openNow') {
                  return { openNow: filterUpdate.value, specificTime: null };
                } else if (filterUpdate.type === 'specificTime') {
                  return { openNow: false, specificTime: filterUpdate.value };
                }
                return prev;
              });
            }}
          />
          
          <div className="bg-gray-800 rounded-lg">
            <VenueList 
              places={places}
              totalResults={totalResults}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              isLoading={isLoadingPlaces}
              error={placesError}
              remainingSearches={remainingSearches}
              timeFilter={timeFilter}
              resultsPerPage={RESULTS_PER_PAGE}
              setActiveFilters={setActiveFilters}
              transportModes={transportModes}
              points={points}
              onSwitchToMap={() => onSwitchToMap(getCurrentState())}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListMode;