import React from 'react';
import { Coffee, Pizza, Beer, Music, Palmtree } from 'lucide-react';


const VenueFilters = ({ filters, onFilterChange }) => {
  const filterOptions = [
    { id: 'restaurant', label: 'Eat', icon: Pizza },
    { id: 'bar', label: 'Drink', icon: Beer },
    { id: 'cafe', label: 'Cafe', icon: Coffee },
    { id: 'night_club', label: 'Music', icon: Music },
    { id: 'park', label: 'Park', icon: Palmtree }
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
      {filterOptions.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onFilterChange(id, !filters[id])}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
            filters[id]
              ? 'bg-purple-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default VenueFilters;