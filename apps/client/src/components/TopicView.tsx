'use client';

import { useState, useMemo } from 'react';
import { useEventColors } from '@/hooks/useEventColors';
import type { HookEvent } from '@/types';

interface TopicViewProps {
  events: HookEvent[];
  selectedProject?: string;
  onProjectChange: (project: string | undefined) => void;
}

interface ConversationGroup {
  id: string;
  prompt: string;
  events: HookEvent[];
  startTime: number;
  endTime: number;
  toolCount: number;
  hasError: boolean;
  project: string;
  sessionId: string;
  color: string;
}

interface TopicGroup {
  type: string;
  events: HookEvent[];
  count: number;
  recentCount: number; // Events in last hour
  color: string;
  icon: string;
  title: string;
}

export function TopicView({ events, selectedProject, onProjectChange }: TopicViewProps) {
  const { getEventType, getEventColors, getTopicColors } = useEventColors();
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [viewMode, setViewMode] = useState<'conversations' | 'categories'>('conversations');
  
  // Get unique projects from events
  const projects = useMemo(() => {
    const projectSet = new Set(events.map(event => event.source_app));
    return Array.from(projectSet).sort();
  }, [events]);

  // Filter events by selected project
  const filteredEvents = useMemo(() => {
    if (!selectedProject) return events;
    return events.filter(event => event.source_app === selectedProject);
  }, [events, selectedProject]);

  // Group events into conversations (from UserPromptSubmit to next prompt or end)
  const conversations = useMemo(() => {
    const convos: ConversationGroup[] = [];
    let currentConvo: ConversationGroup | null = null;
    
    // Sort events by timestamp
    const sortedEvents = [...filteredEvents].sort((a, b) => 
      (a.timestamp || 0) - (b.timestamp || 0)
    );
    
    sortedEvents.forEach((event, index) => {
      // Check if this is a UserPromptSubmit event (starts a new conversation)
      if (event.hook_event_type === 'UserPromptSubmit') {
        // Save previous conversation if exists
        if (currentConvo) {
          convos.push(currentConvo);
        }
        
        // Start new conversation
        const prompt = event.payload?.prompt || 'Untitled Conversation';
        currentConvo = {
          id: `conv-${event.session_id}-${event.timestamp}`,
          prompt: prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt,
          events: [event],
          startTime: event.timestamp || Date.now(),
          endTime: event.timestamp || Date.now(),
          toolCount: 0,
          hasError: false,
          project: event.source_app,
          sessionId: event.session_id,
          color: getTopicColors(event.session_id).background
        };
      } else if (currentConvo) {
        // Add event to current conversation
        currentConvo.events.push(event);
        currentConvo.endTime = event.timestamp || currentConvo.endTime;
        
        // Count tools and errors
        const eventType = getEventType(event);
        if (eventType === 'tool') {
          currentConvo.toolCount++;
        }
        if (eventType === 'error' || event.hook_event_type.includes('error')) {
          currentConvo.hasError = true;
        }
      }
    });
    
    // Add last conversation if exists
    if (currentConvo) {
      convos.push(currentConvo);
    }
    
    return convos.reverse(); // Show newest first
  }, [filteredEvents, getEventType, getTopicColors]);

  // Helper functions for topic groups
  const getTopicIcon = (eventType: string): string => {
    const iconMap: Record<string, string> = {
      'tool': '🔧',
      'session': '🎯',
      'prompt': '💬',
      'notification': '🔔',
      'error': '❌',
      'system': '⚙️'
    };
    return iconMap[eventType] || '📋';
  };

  const getTopicTitle = (eventType: string): string => {
    const titleMap: Record<string, string> = {
      'tool': 'Tool Actions',
      'session': 'Sessions',
      'prompt': 'User Prompts',
      'notification': 'Notifications',
      'error': 'Errors',
      'system': 'System Events'
    };
    return titleMap[eventType] || 'Other Events';
  };

  // Group events by topic/type
  const topicGroups = useMemo(() => {
    const groups = new Map<string, TopicGroup>();
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    filteredEvents.forEach(event => {
      const eventType = getEventType(event);
      const eventColors = getEventColors(event);
      
      if (!groups.has(eventType)) {
        groups.set(eventType, {
          type: eventType,
          events: [],
          count: 0,
          recentCount: 0,
          color: eventColors.accent.replace('bg-event-', 'topic-'),
          icon: getTopicIcon(eventType),
          title: getTopicTitle(eventType)
        });
      }

      const group = groups.get(eventType)!;
      group.events.push(event);
      group.count++;
      
      if (event.timestamp && event.timestamp > oneHourAgo) {
        group.recentCount++;
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [filteredEvents, getEventType, getEventColors]);

  const getTileSize = (index: number, count: number): string => {
    // Windows 8-style varied tile sizes
    if (count === 0) return 'col-span-2 row-span-2 h-32';
    
    const patterns = [
      'col-span-2 row-span-2 h-32', // Large tile
      'col-span-1 row-span-2 h-32', // Tall tile
      'col-span-2 row-span-1 h-16', // Wide tile
      'col-span-1 row-span-1 h-16', // Small tile
    ];
    
    return patterns[index % patterns.length];
  };

  // Format duration  
  const formatDuration = (start: number, end: number): string => {
    const duration = end - start;
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="p-6 bg-theme-bg-primary min-h-screen">
      {/* Project Filter and View Mode Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-theme-text-primary">📊 Topic View</h2>
          
          {/* View Mode Toggle */}
          <div className="flex bg-theme-bg-tertiary rounded-lg p-1 shadow-card">
            <button
              onClick={() => setViewMode('conversations')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium
                ${viewMode === 'conversations' 
                  ? 'bg-white text-theme-text-primary shadow-sm' 
                  : 'text-theme-text-secondary hover:text-theme-text-primary'}`}
            >
              💬 Conversations
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium
                ${viewMode === 'categories' 
                  ? 'bg-white text-theme-text-primary shadow-sm' 
                  : 'text-theme-text-secondary hover:text-theme-text-primary'}`}
            >
              📁 Categories
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-theme-text-secondary">
            Filter by Project:
          </label>
          <select
            value={selectedProject || ''}
            onChange={(e) => onProjectChange(e.target.value || undefined)}
            className="px-3 py-2 bg-white border border-theme-border-primary rounded-lg shadow-sm focus:ring-2 focus:ring-theme-primary focus:border-theme-primary text-theme-text-primary"
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map(project => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conversation Tiles (New View) */}
      {viewMode === 'conversations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => setSelectedConversation(convo)}
              className={`
                ${convo.color} 
                rounded-lg shadow-tile hover:shadow-tile-hover 
                transition-all cursor-pointer p-4 
                text-white hover:scale-105
                min-h-[150px] flex flex-col justify-between
              `}
            >
              {/* Conversation Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">💬</span>
                  <div className="text-right">
                    <span className="text-xs opacity-90">{formatTime(convo.startTime)}</span>
                    {convo.hasError && <span className="ml-2 text-sm">⚠️</span>}
                  </div>
                </div>
                
                {/* Prompt Preview */}
                <p className="text-sm font-medium line-clamp-2 mb-2">
                  {convo.prompt}
                </p>
              </div>

              {/* Conversation Stats */}
              <div className="mt-auto">
                <div className="flex justify-between items-end">
                  <div className="text-xs opacity-90">
                    <div>{convo.events.length} events</div>
                    {convo.toolCount > 0 && <div>🔧 {convo.toolCount} tools</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatDuration(convo.startTime, convo.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State for Conversations */}
          {conversations.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-theme-text-secondary mb-2">
                No Conversations Found
              </h3>
              <p className="text-theme-text-tertiary">
                Start a conversation with Claude to see it appear here
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category Tiles Grid (Original View) */}
      {viewMode === 'categories' && (
        <div className="grid grid-cols-4 gap-4 auto-rows-min">
          {topicGroups.map((group, index) => (
          <div
            key={group.type}
            className={`
              ${getTileSize(index, group.count)}
              bg-${group.color} 
              hover:bg-${group.color.replace('-light', '')} 
              rounded-lg shadow-tile hover:shadow-tile-hover 
              transition-tile cursor-pointer 
              flex flex-col justify-between p-4 
              text-white hover:scale-105
            `}
          >
            {/* Tile Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{group.icon}</span>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{group.title}</h3>
                  {group.recentCount > 0 && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {group.recentCount} recent
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tile Content */}
            <div className="mt-auto">
              <div className="text-right">
                <div className="text-3xl font-bold">{group.count}</div>
                <div className="text-sm opacity-90">
                  {group.count === 1 ? 'event' : 'events'}
                </div>
              </div>
            </div>

            {/* Live Activity Indicator */}
            {group.recentCount > 0 && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        ))}

        {/* Empty State */}
        {topicGroups.length === 0 && (
          <div className="col-span-4 text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-theme-text-secondary mb-2">
              No Events Found
            </h3>
            <p className="text-theme-text-tertiary">
              {selectedProject 
                ? `No events found for project "${selectedProject}"` 
                : 'No events available to display'
              }
            </p>
          </div>
        )}
      </div>
      )}

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-theme-primary to-theme-primary-light text-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">💬 Conversation Details</h3>
                  <p className="text-sm opacity-90">{selectedConversation.prompt}</p>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-3">
                {selectedConversation.events.map((event, index) => (
                  <div key={`${event.id}-${index}`} className="border-l-4 pl-4" 
                       style={{ borderColor: getEventColors(event).accent.replace('bg-event-', '#') === 'tool' ? '#3b82f6' : 
                                              getEventColors(event).accent.replace('bg-event-', '#') === 'prompt' ? '#f97316' :
                                              getEventColors(event).accent.replace('bg-event-', '#') === 'session' ? '#22c55e' :
                                              getEventColors(event).accent.replace('bg-event-', '#') === 'error' ? '#ef4444' : '#6366f1' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-theme-text-primary">
                        {event.hook_event_type}
                      </span>
                      <span className="text-xs text-theme-text-tertiary">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    
                    {/* Event Details */}
                    <div className="text-sm text-theme-text-secondary">
                      {event.payload?.prompt && (
                        <p className="italic">{event.payload.prompt}</p>
                      )}
                      {event.payload?.tool_name && (
                        <p>🔧 Tool: {event.payload.tool_name}</p>
                      )}
                      {event.summary && (
                        <p>📝 {event.summary}</p>
                      )}
                      {event.payload?.tool_input?.command && (
                        <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                          {event.payload.tool_input.command}
                        </code>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex justify-between text-sm text-theme-text-secondary">
                <div>
                  <span className="font-medium">Duration:</span> {formatDuration(selectedConversation.startTime, selectedConversation.endTime)}
                </div>
                <div>
                  <span className="font-medium">Events:</span> {selectedConversation.events.length}
                </div>
                <div>
                  <span className="font-medium">Tools Used:</span> {selectedConversation.toolCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4 border border-theme-border-primary">
          <div className="text-2xl font-bold text-theme-text-primary">{filteredEvents.length}</div>
          <div className="text-sm text-theme-text-secondary">Total Events</div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4 border border-theme-border-primary">
          <div className="text-2xl font-bold text-theme-text-primary">{topicGroups.length}</div>
          <div className="text-sm text-theme-text-secondary">Event Types</div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4 border border-theme-border-primary">
          <div className="text-2xl font-bold text-theme-text-primary">{projects.length}</div>
          <div className="text-sm text-theme-text-secondary">Projects</div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4 border border-theme-border-primary">
          <div className="text-2xl font-bold text-theme-text-primary">
            {topicGroups.reduce((sum, group) => sum + group.recentCount, 0)}
          </div>
          <div className="text-sm text-theme-text-secondary">Recent Activity</div>
        </div>
      </div>
    </div>
  );
}