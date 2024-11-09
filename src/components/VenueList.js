import React from 'react';
import { MapPin } from 'lucide-react';

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
    <div className="flex items-center gap-1">
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

const ServiceInfo = ({ place }) => {
  const services = [];
  if (place.dine_in) services.push("Dine-in");
  if (place.takeout === false) services.push("No takeout");
  else if (place.takeout) services.push("Takeout");
  if (place.delivery === false) services.push("No delivery");
  else if (place.delivery) services.push("Delivery");
  
  return (
    <div className="flex flex-wrap gap-2 text-gray-400 text-sm mt-2">
      {services.map((service, index) => (
        <span key={service}>
          {index > 0 && <span className="mr-2">•</span>}
          {service}
        </span>
      ))}
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

  const getNextPeriod = () => {
    const periods = place.opening_hours?.periods;
    if (!periods?.length) return null;

    const sortedPeriods = [...periods].sort((a, b) => {
      if (a.open.day !== b.open.day) return a.open.day - b.open.day;
      return parseInt(a.open.time) - parseInt(b.open.time);
    });

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      const nextPeriod = sortedPeriods.find(period => {
        if (period.open.day !== checkDay) return false;
        if (dayOffset === 0) {
          return parseInt(period.open.time) > currentTime;
        }
        return true;
      });
      if (nextPeriod) return { ...nextPeriod, dayOffset };
    }
    return null;
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
  const nextPeriod = !currentPeriod ? getNextPeriod() : null;
  const isOpen = currentPeriod !== null;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex items-center gap-2">
      <span className={`font-medium ${isOpen ? 'text-green-500' : 'text-red-500'}`}>
        {isOpen ? 'Open' : 'Closed'}
      </span>
      {isOpen && currentPeriod?.close && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">
            Closes {formatTime(currentPeriod.close.time)}
          </span>
        </>
      )}
      {!isOpen && nextPeriod && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">
            Opens {nextPeriod.dayOffset === 0 ? 
              formatTime(nextPeriod.open.time) : 
              `${days[nextPeriod.open.day]} ${formatTime(nextPeriod.open.time)}`}
          </span>
        </>
      )}
    </div>
  );
};

const VenueList = ({ places, isLoading, error, timeFilter }) => {
  if (isLoading) {
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
        <div className="p-4 overflow-auto flex-1">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <div className="p-4 text-red-400">Error loading venues: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-gray-50">Nearby Venues</h2>
        <p className="text-sm text-gray-300">
          {places.length} places found • {timeFilter?.openNow ? 'Open now' : 'All times'}
        </p>
      </div>
      
      <div className="overflow-auto flex-1">
        <div className="divide-y divide-gray-700">
          {places.map((place) => (
            <div key={place.place_id} className="p-4 hover:bg-gray-700/30 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="text-gray-50 font-semibold flex items-center gap-2 text-lg">
                      {place.name}
                    </h3>
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors p-1"
                      aria-label={`Open ${place.name} in Google Maps`}
                    >
                      <MapPin className="w-5 h-5" />
                    </a>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating rating={place.rating} reviewCount={place.user_ratings_total} />
                    {place.price_level && (
                      <>
                        <span className="text-gray-400">•</span>
                        <PriceLevel level={place.price_level} />
                      </>
                    )}
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2 text-gray-400">
                    <span>{place.types?.[0]?.replace(/_/g, ' ')}</span>
                    {place.formatted_address && (
                      <>
                        <span>•</span>
                        <span>{place.formatted_address}</span>
                      </>
                    )}
                  </div>

                  {place.editorial_summary?.overview && (
                    <p className="mt-2 text-gray-300 text-sm">
                      {place.editorial_summary.overview}
                    </p>
                  )}
                  
                  {place.opening_hours && (
                    <div className="mt-2">
                      <OpeningHours place={place} />
                    </div>
                  )}
                  
                  <ServiceInfo place={place} />
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