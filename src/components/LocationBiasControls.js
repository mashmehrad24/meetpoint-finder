import React from 'react';

const LocationBiasControls = ({ bias, onBiasChange }) => {
  return (
    <div className="flex gap-1 mt-2">
      <button
        onClick={() => onBiasChange('you')}
        className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          bias === 'you'
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
        }`}
      >
        Closer to You
      </button>
      
      <button
        onClick={() => onBiasChange('middle')}
        className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          bias === 'middle'
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
        }`}
      >
        Meet in Middle
      </button>
      
      <button
        onClick={() => onBiasChange('them')}
        className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          bias === 'them'
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
        }`}
      >
        Closer to Them
      </button>
    </div>
  );
};

export default LocationBiasControls;