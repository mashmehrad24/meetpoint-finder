import React, { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Loader2, Map } from 'lucide-react';
import VenueFilters from './VenueFilters';

const INITIAL_RESULTS = 5;

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
  const decimal = rating - fullStars;
  const partialStar = decimal >= 0.5;

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="font-medium text-gray-50">{rating}</span>
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={
              i < fullStars
                ? "text-yellow-400"
                : i === fullStars && partialStar
                ? "text-yellow-400 opacity-50"
                : "text-gray-600"
            }
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-gray-400">({reviewCount.toLocaleString()})</span>
    </div>
  );
};

const OpeningHours = ({ place, timeFilter }) => {
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const currentDay = now.getDay();
  
  const getCurrentPeriod = () => {
    const periods = place.opening_hours?.periods;
    if (!periods?.length) return null;

    if (timeFilter?.specificTime) {
      const { day, time } = timeFilter.specificTime;
      const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(day.toLowerCase());
      const checkTime = parseInt(time.replace(':', ''));

      return periods.find(period => {
        if (!period?.open?.day === undefined || !period?.open?.time) return false;
        if (period.open.day !== dayIndex) return false;
        
        const openTime = parseInt(period.open.time);
        const closeTime = period.close?.time ? parseInt(period.close.time) : 2359;
        
        return checkTime >= openTime && checkTime <= closeTime;
      });
    }
    
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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-between px-2 py-1 border-t border-gray-700">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5 text-gray-400" />
      </button>
      <span className="text-sm text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
};

const VenueList = ({
  places,
  totalResults,
  currentPage,
  setCurrentPage,
  isLoading,
  error,
  remainingSearches,
  timeFilter,
  resultsPerPage,
  setActiveFilters,
  transportModes,
  points,
  onSwitchToMap
}) => {
  const [filters, setFilters] = useState({
    restaurant: false,
    bar: false,
    cafe: false,
    night_club: false,
    park: false
  });

  const [showMore, setShowMore] = useState(false);
  const displayedPlaces = showMore ? places : places.slice(0, INITIAL_RESULTS);

  const handleFilterChange = (filterId, value) => {
    const newFilters = {
      ...filters,
      [filterId]: value
    };
    setFilters(newFilters);

    const activeFilters = Object.entries(newFilters)
      .filter(([_, isActive]) => isActive)
      .map(([type]) => type);
    setActiveFilters(activeFilters);
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);

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
        <div className="p-2">
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
            <p className="text-red-200 text-sm">{error.message || error.toString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <VenueFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        <button
          onClick={onSwitchToMap}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg text-white text-sm"
        >
          <Map className="w-4 h-4" />
          View Map
        </button>
      </div>
      
      <div className="px-2 py-1 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">
            {totalResults} places found • {timeFilter?.openNow ? 'Open now' : 'All times'}
          </p>
          {remainingSearches < 20 && (
            <span className="text-xs text-purple-400">
              {remainingSearches} searches left today
            </span>
          )}
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        <div className="divide-y divide-gray-700">
          {displayedPlaces.map((place, index) => (
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
                      className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
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
                    <OpeningHours place={place} timeFilter={timeFilter} />
                  )}

                  {place.straightLineDistance && (
                    <div className="text-xs text-gray-400">
                      {(place.straightLineDistance / 1000).toFixed(1)}km from midpoint
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {places.length > INITIAL_RESULTS && !showMore && (
          <button
            onClick={() => setShowMore(true)}
            className="w-full py-2 px-4 text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1"
          >
            Show more venues
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {showMore && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default VenueList;