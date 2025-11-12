import type { HookEvent } from '@/types';

export function useEventColors() {
  // Topic tile colors for Windows 8-style interface
  const topicColors = [
    'emerald', 'cyan', 'sky', 'violet', 'pink', 'rose',
    'amber', 'lime', 'teal', 'fuchsia', 'indigo', 'orange'
  ] as const;

  type TopicColor = typeof topicColors[number];

  const hashString = (str: string): number => {
    let hash = 7151;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash >>> 0);
  };

  // Event type detection based on event data
  const getEventType = (event: HookEvent): string => {
    // Add null check for safety
    if (!event.hook_event_type) {
      return 'system'; // Default if no event type
    }
    
    const eventType = event.hook_event_type.toLowerCase();
    
    if (eventType.includes('tool') || eventType.includes('bash') || eventType.includes('edit')) {
      return 'tool';
    }
    if (eventType.includes('session') || eventType.includes('start') || eventType.includes('stop')) {
      return 'session';
    }
    if (eventType.includes('prompt') || eventType.includes('user') || eventType.includes('chat')) {
      return 'prompt';
    }
    if (eventType.includes('notification') || eventType.includes('message')) {
      return 'notification';
    }
    if (eventType.includes('error') || eventType.includes('failed')) {
      return 'error';
    }
    return 'system'; // Default fallback
  };

  // Get event-type specific colors
  const getEventColors = (event: HookEvent) => {
    const eventType = getEventType(event);
    
    return {
      background: `bg-event-${eventType}-light`,
      border: `border-l-event-${eventType}`,
      borderFull: `border-event-${eventType}`,
      text: `text-event-${eventType}`,
      accent: `bg-event-${eventType}`,
      hover: `hover:border-event-${eventType}`,
    };
  };

  // Get topic tile colors for random assignment
  const getTopicColorForHash = (identifier: string): TopicColor => {
    const hash = hashString(identifier);
    const index = hash % topicColors.length;
    return topicColors[index];
  };

  const getTopicColors = (identifier: string) => {
    const color = getTopicColorForHash(identifier);
    
    return {
      background: `bg-topic-${color}`,
      backgroundLight: `bg-topic-${color}-light`,
      border: `border-topic-${color}`,
      text: `text-white`,
      hover: `hover:bg-topic-${color}`,
    };
  };

  // Legacy functions for backward compatibility with gray colors
  const getColorForSession = (sessionId: string): string => {
    const color = getTopicColorForHash(sessionId);
    return `bg-topic-${color}`;
  };

  const getColorForApp = (appName: string): string => {
    const color = getTopicColorForHash(appName);
    return `bg-topic-${color}`;
  };

  const getGradientForSession = (sessionId: string): string => {
    const color = getTopicColorForHash(sessionId);
    return `bg-gradient-to-r from-topic-${color} to-topic-${color}-light`;
  };

  const getGradientForApp = (appName: string): string => {
    const color = getTopicColorForHash(appName);
    return `bg-gradient-to-r from-topic-${color} to-topic-${color}-light`;
  };

  // Hex color mappings for the new event colors
  const eventColorToHex = (eventType: string): string => {
    const colorMap: Record<string, string> = {
      'tool': '#3b82f6',      // Blue
      'session': '#22c55e',   // Green
      'prompt': '#f97316',    // Orange
      'notification': '#a855f7', // Purple
      'error': '#ef4444',     // Red
      'system': '#6366f1',    // Indigo
    };
    return colorMap[eventType] || '#6366f1';
  };

  const topicColorToHex = (color: TopicColor): string => {
    const colorMap: Record<TopicColor, string> = {
      'emerald': '#10b981',
      'cyan': '#06b6d4',
      'sky': '#0ea5e9',
      'violet': '#8b5cf6',
      'pink': '#ec4899',
      'rose': '#f43f5e',
      'amber': '#f59e0b',
      'lime': '#84cc16',
      'teal': '#14b8a6',
      'fuchsia': '#d946ef',
      'indigo': '#6366f1',
      'orange': '#f97316',
    };
    return colorMap[color];
  };

  const getHexColorForEvent = (event: HookEvent): string => {
    const eventType = getEventType(event);
    return eventColorToHex(eventType);
  };

  const getHexColorForSession = (sessionId: string): string => {
    const color = getTopicColorForHash(sessionId);
    return topicColorToHex(color);
  };

  const getHexColorForApp = (appName: string): string => {
    const color = getTopicColorForHash(appName);
    return topicColorToHex(color);
  };

  // Legacy compatibility functions
  const getColorKeyForSession = (sessionId: string): string => {
    return getTopicColorForHash(sessionId);
  };

  const getColorKeyForApp = (appName: string): string => {
    return getTopicColorForHash(appName);
  };

  return {
    // New event-type specific functions
    getEventType,
    getEventColors,
    getHexColorForEvent,
    
    // Topic tile functions
    getTopicColors,
    getTopicColorForHash,
    
    // Legacy compatibility functions (updated with new colors)
    getColorForSession,
    getColorForApp,
    getColorKeyForSession,
    getColorKeyForApp,
    getGradientForSession,
    getGradientForApp,
    getHexColorForSession,
    getHexColorForApp,
  };
}