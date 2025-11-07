import { useState, useCallback } from 'react';
import type { HookEvent } from '@/types';

export function useEventSearch() {
  const [searchPattern, setSearchPattern] = useState<string>('');
  const [searchError, setSearchError] = useState<string>('');

  const validateRegex = useCallback((pattern: string): { valid: boolean; error?: string } => {
    if (!pattern || pattern.trim() === '') {
      return { valid: true };
    }

    try {
      new RegExp(pattern);
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid regex pattern';
      return { valid: false, error: errorMessage };
    }
  }, []);

  const getSearchableText = useCallback((event: HookEvent): string => {
    const parts: string[] = [];

    if (event.hook_event_type) {
      parts.push(event.hook_event_type);
    }

    if (event.source_app) {
      parts.push(event.source_app);
    }
    if (event.session_id) {
      parts.push(event.session_id);
    }

    if (event.model_name) {
      parts.push(event.model_name);
    }

    if (event.summary) {
      parts.push(event.summary);
    }

    if (event.humanInTheLoop?.question) {
      parts.push(event.humanInTheLoop.question);
    }

    return parts.join(' ').toLowerCase();
  }, []);

  const matchesPattern = useCallback((event: HookEvent, pattern: string): boolean => {
    if (!pattern || pattern.trim() === '') {
      return true;
    }

    const validation = validateRegex(pattern);
    if (!validation.valid) {
      return false;
    }

    try {
      const regex = new RegExp(pattern, 'i');
      const searchableText = getSearchableText(event);
      return regex.test(searchableText);
    } catch {
      return false;
    }
  }, [validateRegex, getSearchableText]);

  const searchEvents = useCallback((events: HookEvent[], pattern: string): HookEvent[] => {
    if (!pattern || pattern.trim() === '') {
      return events;
    }

    return events.filter(event => matchesPattern(event, pattern));
  }, [matchesPattern]);

  const updateSearchPattern = useCallback((pattern: string) => {
    setSearchPattern(pattern);

    if (!pattern || pattern.trim() === '') {
      setSearchError('');
      return;
    }

    const validation = validateRegex(pattern);
    if (!validation.valid) {
      setSearchError(validation.error || 'Invalid regex pattern');
    } else {
      setSearchError('');
    }
  }, [validateRegex]);

  const clearSearch = useCallback(() => {
    setSearchPattern('');
    setSearchError('');
  }, []);

  return {
    searchPattern,
    searchError,
    hasError: searchError.length > 0,
    validateRegex,
    matchesPattern,
    searchEvents,
    updateSearchPattern,
    clearSearch,
    getSearchableText
  };
}