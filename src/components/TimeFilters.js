import React, { useState } from 'react';

const TimeFilters = ({ onFilterChange }) => {
  const [filterMode, setFilterMode] = useState('none'); // 'none', 'now', or 'specific'
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];

  // Generate time options in 30-minute intervals
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  });

  // Reset specific time selections when switching modes
  const resetSpecificTime = () => {
    setSelectedDay('');
    setSelectedTime('');
  };

  // Handle mode changes
  const handleModeChange = (mode) => {
    if (mode === filterMode) {
      // If clicking the active mode, turn it off
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

  // Handle specific time selections
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
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-purple-400">🕒</span>
        <span className="text-sm font-medium text-gray-300">Opening Hours</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('now')}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
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
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            filterMode === 'specific'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
              : 'border-gray-600 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Specific Time
        </button>
      </div>

      {filterMode === 'specific' && (
        <div className="flex gap-2">
          <select
            value={selectedDay}
            onChange={handleDayChange}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200"
          >
            <option value="">Select day</option>
            {days.map((day) => (
              <option key={day} value={day.toLowerCase()}>
                {day}
              </option>
            ))}
          </select>

          <select
            value={selectedTime}
            onChange={handleTimeChange}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200"
          >
            <option value="">Select time</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      )}

      {filterMode !== 'none' && (
        <button
          onClick={() => handleModeChange(filterMode)}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-300"
        >
          Clear Filter ×
        </button>
      )}
    </div>
  );
};

export default TimeFilters;