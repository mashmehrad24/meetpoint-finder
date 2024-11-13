import React from 'react';
import { Car, Train, Footprints } from 'lucide-react';

const TransportModeSelector = ({ person, mode, onChange }) => {
  const modes = [
    { id: 'DRIVING', icon: Car, label: 'Drive' },
    { id: 'TRANSIT', icon: Train, label: 'Transit' },
    { id: 'WALKING', icon: Footprints, label: 'Walk' }
  ];

  return (
    <div className="flex gap-1 items-center">
      <span className="text-xs text-gray-400">{person}:</span>
      <div className="flex gap-1">
        {modes.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              mode === id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
            }`}
            title={label}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransportModeSelector;