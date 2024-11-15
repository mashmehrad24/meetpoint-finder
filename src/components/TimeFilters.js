import React, { useState, useCallback } from 'react';
import { Clock, Calendar } from 'lucide-react';

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

  const resetSpecificTime = useCallback(() => {
    setSelectedDay('');
    setSelectedTime('');
  }, []);

  const handleModeChange = useCallback((mode) => {
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
  }, [filterMode, onFilterChange, resetSpecificTime]);

  const handleTimeChange = useCallback((e) => {
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
  }, [filterMode, selectedDay, onFilterChange]);

  const handleDayChange = useCallback((e) => {
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
  }, [filterMode, selectedTime, onFilterChange]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-2 space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('now')}
          className={`flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
            filterMode === 'now'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
              : 'border-gray-600 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Open Now
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('specific')}
          className={`flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
            filterMode === 'specific'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
              : 'border-gray-600 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Set Time
        </button>
      </div>

      {filterMode === 'specific' && (
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedDay}
            onChange={handleDayChange}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 appearance-none hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 appearance-none hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={!selectedDay}
          >
            <option value="">Select time</option>
            {timeOptions.map((time) => {
              const [hours, minutes] = time.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              const displayTime = `${hour12}:${minutes} ${ampm}`;
              
              return (
                <option key={time} value={time}>
                  {displayTime}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {filterMode === 'specific' && (!selectedDay || !selectedTime) && (
        <p className="text-xs text-gray-400 px-1">
          Select both day and time to filter venues
        </p>
      )}
    </div>
  );
};

export default TimeFilters;