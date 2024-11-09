// src/hooks/useMapLogic.js
import { useState, useCallback, useRef } from 'react';

const useMapLogic = () => {
  const [points, setPoints] = useState([]);
  const [midpoint, setMidpoint] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 43.6532,
    lng: -79.3832
  });
  const [mapZoom, setMapZoom] = useState(11);
  const mapRef = useRef(null);

  const handleMapClick = useCallback((e) => {
    const clickedLat = e.latLng.lat();
    const clickedLng = e.latLng.lng();
    const newPoint = { lat: clickedLat, lng: clickedLng };

    if (points.length < 2) {
      const newPoints = [...points, newPoint];
      setPoints(newPoints);

      if (newPoints.length === 2) {
        const mid = {
          lat: (newPoints[0].lat + newPoints[1].lat) / 2,
          lng: (newPoints[0].lng + newPoints[1].lng) / 2
        };
        setMidpoint(mid);
        setMapCenter(mid);

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new window.google.maps.LatLng(newPoints[0].lat, newPoints[0].lng));
        bounds.extend(new window.google.maps.LatLng(newPoints[1].lat, newPoints[1].lng));
        if (mapRef.current) {
          mapRef.current.fitBounds(bounds);
        }
      }
    }
  }, [points]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

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
    onMapLoad
  };
};

export default useMapLogic;