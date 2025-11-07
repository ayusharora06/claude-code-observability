'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useFilters } from '@/hooks/useFilters';
import { EventCard } from '@/components/EventCard';
import { FilterPanel } from '@/components/FilterPanel';
import { WS_URL } from '@/config';

function LoadingState() {
  return (
    <div className="min-h-screen bg-theme-bg-secondary p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-primary mb-4"></div>
        <h2 className="text-xl font-semibold text-theme-text-primary">
          Loading Multi-Agent Observability...
        </h2>
      </div>
    </div>
  );
}

function MainContent() {
  const { events, isConnected, error, clearEvents } = useWebSocket(WS_URL);
  const { filters, filterOptions, filteredEvents, updateFilter, clearFilters, hasActiveFilters } = useFilters(events);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-theme-bg-secondary">
      {/* Enhanced Header with Primary Theme Colors */}
      <header className="bg-gradient-to-r from-theme-primary to-theme-primary-light shadow-lg border-b-2 border-theme-primary-dark">
        <div className="px-3 py-4 mobile:py-1.5 mobile:px-2 flex items-center justify-between mobile:gap-2">
          {/* Title Section - Hidden on mobile */}
          <div className="mobile:hidden">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Multi-Agent Observability
            </h1>
          </div>

          {/* Connection Status */}
          <div className="flex items-center mobile:space-x-1 space-x-1.5">
            {isConnected ? (
              <div className="flex items-center mobile:space-x-0.5 space-x-1.5">
                <span className="relative flex mobile:h-2 mobile:w-2 h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full mobile:h-2 mobile:w-2 h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-base mobile:text-xs text-white font-semibold drop-shadow-md mobile:hidden">Connected</span>
              </div>
            ) : (
              <div className="flex items-center mobile:space-x-0.5 space-x-1.5">
                <span className="relative flex mobile:h-2 mobile:w-2 h-3 w-3">
                  <span className="relative inline-flex rounded-full mobile:h-2 mobile:w-2 h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-base mobile:text-xs text-white font-semibold drop-shadow-md mobile:hidden">Disconnected</span>
              </div>
            )}
          </div>

          {/* Event Count and Action Buttons */}
          <div className="flex items-center mobile:space-x-1 space-x-2">
            <span className="text-base mobile:text-xs text-white font-semibold drop-shadow-md bg-theme-primary-dark mobile:px-2 mobile:py-0.5 px-3 py-1.5 rounded-full border border-white/30">
              {filteredEvents.length}
            </span>

            {/* Clear Button */}
            <button
              onClick={clearEvents}
              className="px-4 py-2 mobile:px-2 mobile:py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl text-white font-medium text-sm mobile:text-xs"
              title="Clear events"
            >
              Clear
            </button>

            {/* Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 mobile:px-2 mobile:py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl text-white font-medium text-sm mobile:text-xs"
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mx-3 mb-3 p-3 bg-red-500/20 border border-red-500 rounded text-red-100 text-sm">
            Error: {error}
          </div>
        )}
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <main className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-theme-text-primary mb-2">
            Real-time Events ({filteredEvents.length}{events.length !== filteredEvents.length ? ` of ${events.length}` : ''})
          </h2>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-theme-text-primary mb-2">
              {events.length === 0 ? 'No events yet' : 'No events match current filters'}
            </h3>
            <p className="text-theme-text-secondary">
              {events.length === 0 
                ? 'Waiting for Claude Code hook events...' 
                : 'Try adjusting your filters to see more events.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-theme-primary hover:bg-theme-primary-dark text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.slice().reverse().map((event, index) => (
              <EventCard key={event.id || index} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <LoadingState />;
  }

  return <MainContent />;
}