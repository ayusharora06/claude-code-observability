'use client';

import { useState, useCallback } from 'react';
import { useEventColors } from '@/hooks/useEventColors';
import { useEventEmojis } from '@/hooks/useEventEmojis';
import type { HookEvent } from '@/types';

interface EventCardProps {
  event: HookEvent;
}

// Updated class variants for light theme with event-specific colors
const cardVariants = {
  base: "group relative p-4 rounded-lg shadow-card hover:shadow-card-hover transition-card duration-300 cursor-pointer bg-white border-l-4",
  collapsed: "border-theme-border-primary",
  expanded: "ring-2 ring-theme-primary shadow-2xl"
};

export function EventCard({ event }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('📋 Copy');

  const { getEventColors, getHexColorForEvent, getTopicColors } = useEventColors();
  const { getEmojiForEventType } = useEventEmojis();

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatModelName = (name?: string): string => {
    if (!name) return '';
    const parts = name.split('-');
    if (parts.length >= 4) {
      return `${parts[1]}-${parts[2]}-${parts[3]}`;
    }
    return name;
  };

  const copyPayload = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event.payload, null, 2));
      setCopyButtonText('✅ Copied!');
      setTimeout(() => setCopyButtonText('📋 Copy'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyButtonText('❌ Failed');
      setTimeout(() => setCopyButtonText('📋 Copy'), 2000);
    }
  }, [event.payload]);

  const getToolInfo = () => {
    const payload = event.payload;
    
    if (event.hook_event_type === 'UserPromptSubmit' && payload.prompt) {
      return {
        icon: '💬',
        tool: 'Prompt:',
        detail: `"${payload.prompt.slice(0, 100)}${payload.prompt.length > 100 ? '...' : ''}"`
      };
    }
    
    if (event.hook_event_type === 'PreCompact') {
      const trigger = payload.trigger || 'unknown';
      return {
        icon: '📦',
        tool: 'Compaction:',
        detail: trigger === 'manual' ? 'Manual compaction' : 'Auto-compaction (full context)'
      };
    }
    
    if (event.hook_event_type === 'SessionStart') {
      const source = payload.source || 'unknown';
      const sourceLabels: Record<string, string> = {
        'startup': 'New session',
        'resume': 'Resuming session',
        'clear': 'Fresh session'
      };
      return {
        icon: '🎯',
        tool: 'Session:',
        detail: sourceLabels[source] || source
      };
    }
    
    if (payload.tool_name) {
      let icon = '🔧'; // Default tool icon
      
      // Assign specific icons based on tool name
      if (payload.tool_name.toLowerCase().includes('read')) {
        icon = '📖';
      } else if (payload.tool_name.toLowerCase().includes('write') || payload.tool_name.toLowerCase().includes('edit')) {
        icon = '✏️';
      } else if (payload.tool_name.toLowerCase().includes('bash') || payload.tool_name.toLowerCase().includes('command')) {
        icon = '⚡';
      } else if (payload.tool_name.toLowerCase().includes('search') || payload.tool_name.toLowerCase().includes('grep')) {
        icon = '🔍';
      } else if (payload.tool_name.toLowerCase().includes('web') || payload.tool_name.toLowerCase().includes('fetch')) {
        icon = '🌐';
      }
      
      const info: { icon: string; tool: string; detail?: string } = { 
        icon, 
        tool: payload.tool_name 
      };
      
      if (payload.tool_input) {
        if (payload.tool_input.command) {
          info.detail = payload.tool_input.command.slice(0, 50) + (payload.tool_input.command.length > 50 ? '...' : '');
        } else if (payload.tool_input.file_path) {
          info.detail = payload.tool_input.file_path.split('/').pop();
        } else if (payload.tool_input.pattern) {
          info.detail = payload.tool_input.pattern;
        }
      }
      
      return info;
    }
    
    return {
      icon: '📄',
      tool: 'Event:',
      detail: event.hook_event_type
    };
  };

  const sessionIdShort = event.session_id.slice(0, 8);
  const hookEmoji = getEmojiForEventType(event.hook_event_type);
  const toolInfo = getToolInfo();

  // Get event-specific colors for the new light theme
  const eventColors = getEventColors(event);
  const sessionColors = getTopicColors(event.session_id);
  const appColors = getTopicColors(event.source_app);
  const eventHexColor = getHexColorForEvent(event);

  // Build card classes with event-specific border color
  const cardClasses = `${cardVariants.base} ${eventColors.border} ${isExpanded ? cardVariants.expanded : cardVariants.collapsed}`;

  return (
    <div>
      {/* Human in the Loop Section */}
      {event.humanInTheLoop && (
        <div className="mb-4 p-4 rounded-lg border-2 shadow-lg border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {event.humanInTheLoop.type === 'question' ? '❓' : 
                   event.humanInTheLoop.type === 'permission' ? '🔐' : '🎯'}
                </span>
                <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                  {event.humanInTheLoop.type === 'question' ? 'Agent Question' :
                   event.humanInTheLoop.type === 'permission' ? 'Permission Request' : 'Choice Required'}
                </h3>
              </div>
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                ⏱️ Waiting for response...
              </span>
            </div>
            <div className="flex items-center space-x-2 ml-9">
              <span
                className={`text-xs font-semibold text-white px-1.5 py-0.5 rounded-full ${appColors.background} shadow-sm`}
              >
                {event.source_app}
              </span>
              <span className={`text-xs text-white px-1.5 py-0.5 rounded-full ${sessionColors.background} shadow-sm`}>
                {sessionIdShort}
              </span>
              <span className="text-xs text-theme-text-tertiary font-medium">
                {formatTime(event.timestamp)}
              </span>
            </div>
          </div>

          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-300">
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
              {event.humanInTheLoop.question}
            </p>
          </div>
        </div>
      )}

      {/* Regular Event Card */}
      {!event.humanInTheLoop && (
        <div
          className={cardClasses}
          onClick={toggleExpanded}
        >
          <div className="w-full">
            {/* New Header Layout: Topic | Hook Name | Session ──── App Name */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-4">
                {/* Topic with Icon (Top Left) */}
                {toolInfo && (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{toolInfo.icon}</span>
                    <span className="font-medium text-theme-text-primary">
                      {toolInfo.tool}
                    </span>
                    {toolInfo.detail && (
                      <span className={`text-sm text-theme-text-tertiary ${event.hook_event_type === 'UserPromptSubmit' ? 'italic' : ''}`}>
                        {toolInfo.detail}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Hook Name */}
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-bold text-white shadow-lg ${eventColors.accent}`}>
                  <span className="mr-1.5 text-base">{hookEmoji}</span>
                  {event.hook_event_type}
                </span>
                
                {/* Session ID */}
                <span className={`text-sm text-white px-2 py-0.5 rounded-full shadow-md ${sessionColors.background}`}>
                  {sessionIdShort}
                </span>
              </div>
              
              {/* Right Side: App Name + Time */}
              <div className="flex flex-col items-end">
                <span className={`text-base font-bold text-white px-2 py-0.5 rounded-full shadow-lg ${appColors.background}`}>
                  {event.source_app}
                </span>
                <span className="text-sm text-theme-text-tertiary font-semibold mt-1">
                  {formatTime(event.timestamp)}
                </span>
              </div>
            </div>
            
            {/* Model Info Row (if available) */}
            {event.model_name && (
              <div className="flex items-center mb-2">
                <span className="text-sm text-theme-text-secondary px-2 py-0.5 rounded-full border border-theme-border-secondary bg-theme-bg-secondary shadow-md" title={`Model: ${event.model_name}`}>
                  <span className="mr-1">🧠</span>{formatModelName(event.model_name)}
                </span>
              </div>
            )}
            
            {/* Summary */}
            {event.summary && (
              <div className="flex justify-center mb-2">
                <div className={`px-3 py-1.5 ${eventColors.background} border ${eventColors.borderFull} rounded-lg shadow-md`}>
                  <span className="text-sm text-theme-text-primary font-semibold">
                    <span className="mr-1">📝</span>
                    {event.summary}
                  </span>
                </div>
              </div>
            )}
            
            {/* Expanded content */}
            {isExpanded && (
              <div className={`mt-2 pt-2 border-t-2 ${eventColors.borderFull} bg-theme-bg-secondary rounded-b-lg p-3 space-y-3`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-theme-primary drop-shadow-sm flex items-center">
                      <span className="mr-1.5 text-xl">📦</span>
                      Payload
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPayload();
                      }}
                      className="px-3 py-1 text-sm font-bold rounded-lg bg-theme-primary hover:bg-theme-primary-dark text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center space-x-1"
                      suppressHydrationWarning={true}
                    >
                      <span>{copyButtonText}</span>
                    </button>
                  </div>
                  <pre className="text-sm text-theme-text-primary bg-theme-bg-tertiary p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto font-mono border border-theme-primary/30 shadow-md hover:shadow-lg transition-shadow duration-200">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}