// components/LocationSearch.js
import React from 'react';
import { Combobox } from '@headlessui/react';

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
  getSuggestions
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <form onSubmit={handleAddressSubmit} className="space-y-4">
        {/* Your Location Input */}
        <div>
          <label htmlFor="your-location" className="block text-sm font-medium text-gray-300 mb-1">
            📍 Where are you?
          </label>
          <Combobox value={address1} onChange={setAddress1}>
            <div className="relative">
              <Combobox.Input
                id="your-location"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400"
                onChange={(e) => {
                  setAddress1(e.target.value);
                  getSuggestions(e.target.value, setSuggestions1);
                }}
                placeholder="Enter your starting point"
              />
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
        </div>

        {/* Their Location Input */}
        <div>
          <label htmlFor="their-location" className="block text-sm font-medium text-gray-300 mb-1">
            📍 Where are they?
          </label>
          <Combobox value={address2} onChange={setAddress2}>
            <div className="relative">
              <Combobox.Input
                id="their-location"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400"
                onChange={(e) => {
                  setAddress2(e.target.value);
                  getSuggestions(e.target.value, setSuggestions2);
                }}
                placeholder="Enter their starting point"
              />
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
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading || !address1 || !address2}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '🔍 Searching...' : '🎯 Find Perfect Spot'}
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
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};