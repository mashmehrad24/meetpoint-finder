import React from 'react';
import { MapPin, Users, Navigation } from 'lucide-react';

const LocationBiasControls = ({ bias, onBiasChange }) => {
  const biasOptions = [
    {
      id: 'you',
      label: 'Closer to You',
      icon: MapPin,
      description: 'Prioritize locations closer to your starting point'
    },
    {
      id: 'middle',
      label: 'Meet in Middle',
      icon: Users,
      description: 'Find venues around the midpoint between both locations'
    },
    {
      id: 'them',
      label: 'Closer to Them',
      icon: Navigation,
      description: 'Prioritize locations closer to their starting point'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {biasOptions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onBiasChange(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              bias === id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
            }`}
            title={biasOptions.find(opt => opt.id === id)?.description}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="px-1">
        <p className="text-xs text-gray-400">
          {biasOptions.find(opt => opt.id === bias)?.description}
        </p>
      </div>
    </div>
  );
};

export default LocationBiasControls;