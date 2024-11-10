import React, { useState } from 'react';

const TimeFilters = ({ onFilterChange }) => {
  const [filterMode, setFilterMode] = useState('none');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  });

  const resetSpecificTime = () => {
    setSelectedDay('');
    setSelectedTime('');
  };

  const handleModeChange = (mode) => {
    if (mode === filterMode) {
      setFilterMode('none');
      onFilterChange({ type: 'openNow', value: false });
      resetSpecificTime();
    } else {
      setFilterMode(mode);
      if (mode === 'now') {
        resetSpecificTime();
        onFilterChange({ type: 'openNow', value: true });
      } else if (mode === 'specific') {
        onFilterChange({ type: 'openNow', value: false });
      }
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    
    if (filterMode === 'specific' && selectedDay && newTime) {
      onFilterChange({
        type: 'specificTime',
        value: {
          day: selectedDay,
          time: newTime
        }
      });
    }
  };

  const handleDayChange = (e) => {
    const newDay = e.target.value;
    setSelectedDay(newDay);
    
    if (filterMode === 'specific' && newDay && selectedTime) {
      onFilterChange({
        type: 'specificTime',
        value: {
          day: newDay,
          time: selectedTime
        }
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('now')}
          className={`flex-1 px-3 py-1 rounded-lg border text-xs transition-colors ${
            filterMode === 'now'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
              : 'border-gray-600 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Open Now
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('specific')}
          className={`flex-1 px-3 py-1 rounded-lg border text-xs transition-colors ${
            filterMode === 'specific'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
              : 'border-gray-600 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Set Time
        </button>
      </div>

      {filterMode === 'specific' && (
        <div className="flex gap-2 mt-2">
          <select
            value={selectedDay}
            onChange={handleDayChange}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-200"
          >
            <option value="">Day</option>
            {days.map((day) => (
              <option key={day} value={day.toLowerCase()}>
                {day.slice(0, 3)}
              </option>
            ))}
          </select>

          <select
            value={selectedTime}
            onChange={handleTimeChange}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-200"
          >
            <option value="">Time</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default TimeFilters;