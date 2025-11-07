const eventTypeToEmoji: Record<string, string> = {
  'PreToolUse': '🔧',
  'PostToolUse': '✅',
  'Notification': '🔔',
  'Stop': '🛑',
  'SubagentStop': '👥',
  'PreCompact': '📦',
  'UserPromptSubmit': '💬',
  'SessionStart': '🚀',
  'SessionEnd': '🏁',
  'default': '❓'
};

export function useEventEmojis() {
  const getEmojiForEventType = (eventType: string): string => {
    return eventTypeToEmoji[eventType] || eventTypeToEmoji.default;
  };
  
  const formatEventTypeLabel = (eventTypes: Record<string, number>): string => {
    const entries = Object.entries(eventTypes)
      .sort((a, b) => b[1] - a[1]);
    
    if (entries.length === 0) return '';
    
    const topEntries = entries.slice(0, 3);
    
    return topEntries
      .map(([type, count]) => {
        const emoji = getEmojiForEventType(type);
        return count > 1 ? `${emoji}×${count}` : emoji;
      })
      .join('');
  };
  
  return {
    getEmojiForEventType,
    formatEventTypeLabel
  };
}