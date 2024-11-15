import React, { useState } from 'react';
import ListMode from './ListMode';
import MapMode from './MapMode';

const MapComponent = () => {
  const [currentMode, setCurrentMode] = useState('list');
  const [savedState, setSavedState] = useState(null);

  const handleSwitchToMap = (state) => {
    setSavedState(state);
    setCurrentMode('map');
  };

  const handleSwitchToList = () => {
    setCurrentMode('list');
  };

  return currentMode === 'list' ? (
    <ListMode 
      onSwitchToMap={handleSwitchToMap}
      savedState={savedState}
    />
  ) : (
    <MapMode 
      onSwitchToList={handleSwitchToList}
      savedState={savedState}
    />
  );
};

export default MapComponent;