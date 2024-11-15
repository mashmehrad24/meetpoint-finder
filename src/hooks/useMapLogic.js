import { useState, useCallback, useRef, useEffect } from 'react';
import Cache from '../utils/cache';
import { APIError, ERROR_CODES } from '../utils/errorHandling';
import { checkRateLimit, trackEndpointCall } from '../utils/rateLimit';

const GEOCODING_TIMEOUT = 10000;
const MIN_DEBOUNCE_TIME = 300;

const useMapLogic = (isMapMode = false) => {
  const [points, setPoints] = useState([]);
  const [midpoint, setMidpoint] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 43.6532,
    lng: -79.3832
  });
  const [mapZoom, setMapZoom] = useState(11);
  const [transportModes, setTransportModes] = useState({
    mode1: 'DRIVING',
    mode2: 'DRIVING'
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const mapRef = useRef(null);
  const geocoder = useRef(null);
  const lastGeocodingRequest = useRef(null);
  const debounceTimerRef = useRef(null);

  // Cleanup when leaving map mode
  useEffect(() => {
    if (!isMapMode) {
      if (mapRef.current) {
        // Cleanup map instance if needed
        mapRef.current = null;
      }
      setIsMapInitialized(false);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (lastGeocodingRequest.current) {
        clearTimeout(lastGeocodingRequest.current);
      }
    };
  }, [isMapMode]);

  const geocodeAddress = useCallback(async (address, skipCache = false) => {
    if (!address?.trim()) {
      throw new APIError('Address cannot be empty', ERROR_CODES.GEOCODING);
    }

    if (lastGeocodingRequest.current) {
      clearTimeout(lastGeocodingRequest.current);
    }

    if (!skipCache) {
      const cachedResult = Cache.getGeocode(address);
      if (cachedResult) {
        return cachedResult;
      }
    }

    if (!checkRateLimit()) {
      throw new APIError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT);
    }

    if (!geocoder.current && window.google) {
      geocoder.current = new window.google.maps.Geocoder();
    }

    if (!geocoder.current) {
      throw new APIError('Maps not initialized', ERROR_CODES.GOOGLE_API);
    }

    trackEndpointCall('geocoding');
    setIsGeocoding(true);

    try {
      const result = await new Promise((resolve, reject) => {
        lastGeocodingRequest.current = setTimeout(() => {
          reject(new APIError('Geocoding timeout', ERROR_CODES.TIMEOUT));
        }, GEOCODING_TIMEOUT);

        geocoder.current.geocode({ address }, (results, status) => {
          clearTimeout(lastGeocodingRequest.current);
          if (status === 'OK' && results[0]) {
            const { lat, lng } = results[0].geometry.location;
            resolve({ 
              lat: lat(), 
              lng: lng(),
              formattedAddress: results[0].formatted_address
            });
          } else {
            reject(new APIError(
              'Geocoding failed', 
              ERROR_CODES.GEOCODING,
              { address, status }
            ));
          }
        });
      });

      Cache.setGeocode(address, result);
      return result;

    } catch (error) {
      throw error;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const debouncedGeocodeAddress = useCallback((address, callback) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await geocodeAddress(address);
        callback(null, result);
      } catch (error) {
        callback(error);
      }
    }, MIN_DEBOUNCE_TIME);
  }, [geocodeAddress]);

  const calculateMidpoint = useCallback((point1, point2) => {
    if (!point1 || !point2) return null;

    return {
      lat: (point1.lat + point2.lat) / 2,
      lng: (point1.lng + point2.lng) / 2
    };
  }, []);

  const fitBoundsToPoints = useCallback((points) => {
    if (!mapRef.current || points.length < 2 || !isMapMode) return;

    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(point => {
      bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
    });
    mapRef.current.fitBounds(bounds);

    const listener = mapRef.current.addListener('bounds_changed', () => {
      window.google.maps.event.removeListener(listener);
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    });
  }, [isMapMode]);

  const handleMapClick = useCallback((e) => {
    if (!isMapInitialized || !isMapMode) return;
    
    const clickedLat = e.latLng.lat();
    const clickedLng = e.latLng.lng();
    const newPoint = { lat: clickedLat, lng: clickedLng };

    if (points.length < 2) {
      const newPoints = [...points, newPoint];
      setPoints(newPoints);

      if (newPoints.length === 2) {
        const mid = calculateMidpoint(newPoints[0], newPoints[1]);
        setMidpoint(mid);
        setMapCenter(mid);
        fitBoundsToPoints(newPoints);
      }
    }
  }, [points, calculateMidpoint, fitBoundsToPoints, isMapInitialized, isMapMode]);

  const updateTransportMode = useCallback((userType, mode) => {
    setTransportModes(prev => ({
      ...prev,
      [userType === 'you' ? 'mode1' : 'mode2']: mode
    }));
  }, []);

  const onMapLoad = useCallback((map) => {
    if (!isMapMode) return;
    mapRef.current = map;
    setIsMapInitialized(true);
  }, [isMapMode]);

  const resetMap = useCallback(() => {
    setPoints([]);
    setMidpoint(null);
    setMapCenter({
      lat: 43.6532,
      lng: -79.3832
    });
    setMapZoom(11);
    setTransportModes({
      mode1: 'DRIVING',
      mode2: 'DRIVING'
    });
    if (mapRef.current && isMapMode) {
      mapRef.current.setCenter(mapCenter);
      mapRef.current.setZoom(mapZoom);
    }
  }, [mapCenter, mapZoom, isMapMode]);

  return {
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
    onMapLoad,
    geocodeAddress,
    debouncedGeocodeAddress,
    transportModes,
    updateTransportMode,
    resetMap,
    isGeocoding,
    isMapInitialized,
    fitBoundsToPoints
  };
};

export default useMapLogic;