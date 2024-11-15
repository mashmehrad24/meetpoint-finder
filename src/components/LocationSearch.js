import React from 'react';
import { Combobox } from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';
import TransportModeSelector from './TransportModeSelector';

export const LocationSearch = ({
  address1,
  address2,
  setAddress1,
  setAddress2,
  suggestions1,
  suggestions2,
  setSuggestions1,
  setSuggestions2,
  handleAddressSubmit,
  handleReset,
  isLoading,
  error,
  getSuggestions,
  transportModes,
  onTransportModeChange,
  isSearchEnabled,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <form onSubmit={handleAddressSubmit} className="space-y-4">
        {/* First Location Input */}
        <div className="space-y-2">
          <label htmlFor="your-location" className="block text-sm font-medium text-gray-300 mb-1">
            📍 Where are you?
          </label>
          <Combobox value={address1} onChange={setAddress1}>
            <div className="relative">
              <div className="relative">
                <Combobox.Input
                  id="your-location"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 pr-8"
                  onChange={(e) => {
                    setAddress1(e.target.value);
                    if (e.target.value.length >= 3) {
                      getSuggestions(e.target.value, setSuggestions1);
                    } else {
                      setSuggestions1([]);
                    }
                  }}
                  placeholder="Enter your starting point"
                />
                {address1 && (
                  <button
                    type="button"
                    onClick={() => setAddress1('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Combobox.Options className="absolute z-10 w-full mt-1 overflow-auto bg-gray-700 rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none">
                {suggestions1.map((suggestion) => (
                  <Combobox.Option
                    key={suggestion.place_id}
                    value={suggestion.description}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-purple-500 text-white' : 'text-gray-200'
                      }`
                    }
                  >
                    {suggestion.description}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
          <TransportModeSelector
            person="You"
            mode={transportModes.mode1}
            onChange={(mode) => onTransportModeChange('you', mode)}
          />
        </div>

        {/* Second Location Input */}
        <div className="space-y-2">
          <label htmlFor="their-location" className="block text-sm font-medium text-gray-300 mb-1">
            📍 Where are they?
          </label>
          <Combobox value={address2} onChange={setAddress2}>
            <div className="relative">
              <div className="relative">
                <Combobox.Input
                  id="their-location"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 pr-8"
                  onChange={(e) => {
                    setAddress2(e.target.value);
                    if (e.target.value.length >= 3) {
                      getSuggestions(e.target.value, setSuggestions2);
                    } else {
                      setSuggestions2([]);
                    }
                  }}
                  placeholder="Enter their starting point"
                />
                {address2 && (
                  <button
                    type="button"
                    onClick={() => setAddress2('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Combobox.Options className="absolute z-10 w-full mt-1 overflow-auto bg-gray-700 rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none">
                {suggestions2.map((suggestion) => (
                  <Combobox.Option
                    key={suggestion.place_id}
                    value={suggestion.description}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-purple-500 text-white' : 'text-gray-200'
                      }`
                    }
                  >
                    {suggestion.description}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
          <TransportModeSelector
            person="They"
            mode={transportModes.mode2}
            onChange={(mode) => onTransportModeChange('them', mode)}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading || !isSearchEnabled}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🎯 Find Perfect Spot
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            ↺
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700/50 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LocationSearch;