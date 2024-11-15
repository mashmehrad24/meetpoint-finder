import React from 'react';
import { Car, Train, Footprints, Bike, Clock } from 'lucide-react';

const TransportModeSelector = ({ person, mode, onChange }) => {
  const modes = [
    { 
      id: 'DRIVING', 
      icon: Car, 
      label: 'Drive',
      description: 'Travel by car'
    },
    { 
      id: 'TRANSIT', 
      icon: Train, 
      label: 'Transit',
      description: 'Public transportation'
    },
    { 
      id: 'BICYCLING', 
      icon: Bike, 
      label: 'Bike',
      description: 'Travel by bicycle'
    },
    { 
      id: 'WALKING', 
      icon: Footprints, 
      label: 'Walk',
      description: 'Travel on foot'
    }
  ];

  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs text-gray-400 min-w-[2.5rem]">{person}:</span>
      <div className="flex gap-1 flex-wrap">
        {modes.map(({ id, icon: Icon, label, description }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              mode === id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
            }`}
            title={description}
            aria-label={`${label} - ${description}`}
            aria-pressed={mode === id}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {mode === 'TRANSIT' && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Uses current time</span>
        </div>
      )}
    </div>
  );
};

export default TransportModeSelector;