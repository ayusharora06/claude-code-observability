'use client';

import type { FilterOptions } from '@/types';

interface FilterPanelProps {
  filters: {
    sourceApp: string;
    sessionId: string;
    eventType: string;
  };
  filterOptions: FilterOptions;
  onFilterChange: (key: 'sourceApp' | 'sessionId' | 'eventType', value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterPanel({ 
  filters, 
  filterOptions, 
  onFilterChange, 
  onClearFilters, 
  hasActiveFilters 
}: FilterPanelProps) {
  return (
    <div className="bg-gradient-to-r from-theme-bg-primary to-theme-bg-secondary border-b-2 border-theme-primary px-3 py-4 shadow-lg">
      <div className="flex flex-wrap gap-3 items-center mobile:flex-col mobile:items-stretch">
        {/* Source App Filter */}
        <div className="flex-1 min-w-0 mobile:w-full">
          <label className="block text-base mobile:text-sm font-bold text-theme-primary mb-1.5 drop-shadow-sm">
            Source App
          </label>
          <select
            value={filters.sourceApp}
            onChange={(e) => onFilterChange('sourceApp', e.target.value)}
            className="w-full px-4 py-2 mobile:px-2 mobile:py-1.5 text-base mobile:text-sm border border-theme-primary rounded-lg focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary-dark bg-theme-bg-primary text-theme-text-primary shadow-md hover:shadow-lg transition-all duration-200"
          >
            <option value="">All Sources</option>
            {filterOptions.source_apps.map(app => (
              <option key={app} value={app}>
                {app}
              </option>
            ))}
          </select>
        </div>
        
        {/* Session ID Filter */}
        <div className="flex-1 min-w-0 mobile:w-full">
          <label className="block text-base mobile:text-sm font-bold text-theme-primary mb-1.5 drop-shadow-sm">
            Session ID
          </label>
          <select
            value={filters.sessionId}
            onChange={(e) => onFilterChange('sessionId', e.target.value)}
            className="w-full px-4 py-2 mobile:px-2 mobile:py-1.5 text-base mobile:text-sm border border-theme-primary rounded-lg focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary-dark bg-theme-bg-primary text-theme-text-primary shadow-md hover:shadow-lg transition-all duration-200"
          >
            <option value="">All Sessions</option>
            {filterOptions.session_ids.map(session => (
              <option key={session} value={session}>
                {session.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>
        
        {/* Event Type Filter */}
        <div className="flex-1 min-w-0 mobile:w-full">
          <label className="block text-base mobile:text-sm font-bold text-theme-primary mb-1.5 drop-shadow-sm">
            Event Type
          </label>
          <select
            value={filters.eventType}
            onChange={(e) => onFilterChange('eventType', e.target.value)}
            className="w-full px-4 py-2 mobile:px-2 mobile:py-1.5 text-base mobile:text-sm border border-theme-primary rounded-lg focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary-dark bg-theme-bg-primary text-theme-text-primary shadow-md hover:shadow-lg transition-all duration-200"
          >
            <option value="">All Types</option>
            {filterOptions.hook_event_types.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end mobile:w-full mobile:mt-2">
            <button
              onClick={onClearFilters}
              className="px-4 py-2 mobile:px-2 mobile:py-1.5 mobile:w-full text-base mobile:text-sm font-bold bg-theme-accent-warning hover:bg-theme-accent-warning/80 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-theme-primary/30">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold text-theme-text-secondary">
              Active filters:
            </span>
            {filters.sourceApp && (
              <span className="px-2 py-1 bg-theme-primary/20 border border-theme-primary/50 rounded text-xs font-medium text-theme-primary">
                Source: {filters.sourceApp}
              </span>
            )}
            {filters.sessionId && (
              <span className="px-2 py-1 bg-theme-primary/20 border border-theme-primary/50 rounded text-xs font-medium text-theme-primary">
                Session: {filters.sessionId.slice(0, 8)}...
              </span>
            )}
            {filters.eventType && (
              <span className="px-2 py-1 bg-theme-primary/20 border border-theme-primary/50 rounded text-xs font-medium text-theme-primary">
                Type: {filters.eventType}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}