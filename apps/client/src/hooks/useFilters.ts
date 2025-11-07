import { useState, useMemo, useCallback } from 'react';
import type { HookEvent, FilterOptions } from '@/types';

interface Filters {
  sourceApp: string;
  sessionId: string;
  eventType: string;
}

export function useFilters(events: HookEvent[]) {
  const [filters, setFilters] = useState<Filters>({
    sourceApp: '',
    sessionId: '',
    eventType: ''
  });

  // Extract filter options from events
  const filterOptions: FilterOptions = useMemo(() => {
    const sourceApps = new Set<string>();
    const sessionIds = new Set<string>();
    const eventTypes = new Set<string>();

    events.forEach(event => {
      if (event.source_app) sourceApps.add(event.source_app);
      if (event.session_id) sessionIds.add(event.session_id);
      if (event.hook_event_type) eventTypes.add(event.hook_event_type);
    });

    return {
      source_apps: Array.from(sourceApps).sort(),
      session_ids: Array.from(sessionIds).sort(),
      hook_event_types: Array.from(eventTypes).sort()
    };
  }, [events]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Source app filter
      if (filters.sourceApp && event.source_app !== filters.sourceApp) {
        return false;
      }

      // Session ID filter
      if (filters.sessionId && event.session_id !== filters.sessionId) {
        return false;
      }

      // Event type filter
      if (filters.eventType && event.hook_event_type !== filters.eventType) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  // Update individual filter
  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      sourceApp: '',
      sessionId: '',
      eventType: ''
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.sourceApp !== '' || 
           filters.sessionId !== '' || 
           filters.eventType !== '';
  }, [filters]);

  return {
    filters,
    filterOptions,
    filteredEvents,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
}