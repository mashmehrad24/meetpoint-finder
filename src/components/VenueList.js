import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import VenueFilters from './VenueFilters';

const PriceLevel = ({ level }) => {
  return (
    <span className="text-gray-300">
      {'$'.repeat(level)}
      <span className="opacity-40">{'$'.repeat(4 - level)}</span>
    </span>
  );
};

const StarRating = ({ rating, reviewCount }) => {
  const fullStars = Math.floor(rating);
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="font-medium text-gray-50">{rating}</span>
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < fullStars ? "text-yellow-400" : "text-gray-600"}>
            ★
          </span>
        ))}
      </div>
      <span className="text-gray-400">({reviewCount})</span>
    </div>
  );
};

const OpeningHours = ({ place }) => {
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const currentDay = now.getDay();
  
  const getCurrentPeriod = () => {
    const periods = place.opening_hours?.periods;
    if (!periods?.length) return null;
    
    return periods.find(period => {
      if (!period?.open?.day === undefined || !period?.open?.time) return false;
      if (period.open.day !== currentDay) return false;
      
      const openTime = parseInt(period.open.time);
      const closeTime = period.close?.time ? parseInt(period.close.time) : 2359;
      
      return currentTime >= openTime && currentTime <= closeTime;
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const hours = parseInt(time.slice(0, 2));
    const minutes = time.slice(2);
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const hours12 = hours % 12 || 12;
    return `${hours12}${minutes === '00' ? '' : `:${minutes}`} ${ampm}`;
  };

  const currentPeriod = getCurrentPeriod();
  const isOpen = currentPeriod !== null;

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className={`font-medium ${isOpen ? 'text-green-500' : 'text-red-500'}`}>
        {isOpen ? 'Open' : 'Closed'}
      </span>
      {isOpen && currentPeriod?.close && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">
            until {formatTime(currentPeriod.close.time)}
          </span>
        </>
      )}
    </div>
  );
};

const VenueList = ({ places, isLoading, error, timeFilter }) => {
  const [filters, setFilters] = useState({
    restaurant: false,
    bar: false,
    cafe: false,
    night_club: false,
    park: false
  });

  const handleFilterChange = (filterId, value) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  const filteredPlaces = places.filter(place => {
    const activeFilters = Object.entries(filters).filter(([_, value]) => value);
    if (activeFilters.length === 0) return true;
    return activeFilters.some(([filterType]) => 
      place.types?.includes(filterType)
    );
  });

  if (isLoading) {
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <VenueFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        <div className="p-2">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <VenueFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        <div className="p-2 text-red-400 text-sm">Error loading venues: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <VenueFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      <div className="px-2 py-1 border-b border-gray-700">
        <p className="text-xs text-gray-400">
          {filteredPlaces.length} places found • {timeFilter?.openNow ? 'Open now' : 'All times'}
        </p>
      </div>
      
      <div className="overflow-auto">
        <div className="divide-y divide-gray-700">
          {filteredPlaces.map((place) => (
            <div key={place.place_id} className="p-2 hover:bg-gray-700/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-gray-50 font-medium text-sm truncate pr-2">
                      {place.name}
                    </h3>
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StarRating rating={place.rating} reviewCount={place.user_ratings_total} />
                    {place.price_level && (
                      <>
                        <span className="text-gray-400 text-xs">•</span>
                        <PriceLevel level={place.price_level} />
                      </>
                    )}
                  </div>
                  
                  <div className="text-gray-400 text-xs truncate">
                    {place.formatted_address}
                  </div>
                  
                  {place.opening_hours && (
                    <OpeningHours place={place} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VenueList;