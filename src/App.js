import React from 'react';
import './App.css';
import MapComponent from './components/MapComponent';
import CaptchaWrapper from './components/CaptchaWrapper';

function App() {
  return (
    <CaptchaWrapper>
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-4 py-2 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-baseline justify-between">
            <h1 className="text-xl font-bold text-white">Konkt</h1>
            <p className="text-sm text-gray-400">Find your perfect meetup spot</p>
          </div>
        </header>

        <main className="container mx-auto max-w-7xl px-4 py-8">
          <MapComponent />
        </main>
      </div>
    </CaptchaWrapper>
  );
}

export default App;