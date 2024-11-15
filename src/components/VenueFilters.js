import React from 'react';
import { 
  Coffee, 
  Pizza, 
  Beer, 
  Music, 
  Trees,
  Utensils,
  Glass,
  Library,
  Building2,
  ShoppingBag
} from 'lucide-react';

const VenueFilters = ({ filters, onFilterChange }) => {
  const filterOptions = [
    { 
      id: 'restaurant', 
      label: 'Eat', 
      icon: Pizza,
      description: 'Restaurants and eateries'
    },
    { 
      id: 'cafe', 
      label: 'Cafe', 
      icon: Coffee,
      description: 'Coffee shops and cafes'
    },
    { 
      id: 'bar', 
      label: 'Drink', 
      icon: Beer,
      description: 'Bars and pubs'
    },
    { 
      id: 'night_club', 
      label: 'Music', 
      icon: Music,
      description: 'Night clubs and music venues'
    },
    { 
      id: 'park', 
      label: 'Park', 
      icon: Trees,
      description: 'Parks and outdoor spaces'
    },
    { 
      id: 'shopping_mall', 
      label: 'Shop', 
      icon: ShoppingBag,
      description: 'Shopping centers and malls'
    },
    { 
      id: 'library', 
      label: 'Study', 
      icon: Library,
      description: 'Libraries and quiet spaces'
    },
    { 
      id: 'food', 
      label: 'Food', 
      icon: Utensils,
      description: 'All food establishments'
    },
    { 
      id: 'point_of_interest', 
      label: 'Attractions', 
      icon: Building2,
      description: 'Popular attractions and points of interest'
    }
  ];

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700 overflow-x-auto">
        <div className="flex gap-1 flex-nowrap">
          {filterOptions.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => onFilterChange(id, !filters[id])}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-200 ${
                filters[id]
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={description}
              aria-pressed={filters[id]}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="px-2">
          <button
            onClick={() => {
              const resetFilters = {};
              filterOptions.forEach(({ id }) => {
                resetFilters[id] = false;
              });
              Object.keys(resetFilters).forEach(id => onFilterChange(id, false));
            }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear filters ({activeFiltersCount})
          </button>
        </div>
      )}

      {activeFiltersCount === 0 && (
        <div className="px-2">
          <p className="text-xs text-gray-400">
            Select filters to narrow your search
          </p>
        </div>
      )}
    </div>
  );
};

export default VenueFilters;