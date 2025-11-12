'use client';

import { useState, useCallback } from 'react';
import { useEventColors } from '@/hooks/useEventColors';
import { useEventEmojis } from '@/hooks/useEventEmojis';
import type { HookEvent } from '@/types';

interface CompactEventCardProps {
  event: HookEvent;
  isFirst?: boolean;
  isLast?: boolean;
}

export function CompactEventCard({ event, isFirst = false, isLast = false }: CompactEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  
  const { getEventColors, getTopicColors, getEventType } = useEventColors();
  const { getEmojiForEventType } = useEventEmojis();

  // Get colors and info
  const eventColors = getEventColors(event);
  const sessionColors = getTopicColors(event.session_id);
  const eventType = getEventType(event);
  const eventEmoji = getEmojiForEventType(event.hook_event_type);
  const sessionShort = event.session_id.slice(-6);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventSummary = (): string => {
    const payload = event.payload;
    
    // User prompts
    if (event.hook_event_type === 'UserPromptSubmit' && payload?.prompt) {
      return payload.prompt.slice(0, 80) + (payload.prompt.length > 80 ? '...' : '');
    }
    
    // Tool uses
    if (payload?.tool_name) {
      let detail = payload.tool_name;
      if (payload.tool_input?.command) {
        detail += `: ${payload.tool_input.command.slice(0, 50)}`;
      } else if (payload.tool_input?.file_path) {
        detail += `: ${payload.tool_input.file_path.split('/').pop()}`;
      } else if (payload.tool_input?.pattern) {
        detail += `: ${payload.tool_input.pattern}`;
      }
      return detail;
    }
    
    // Default
    return event.summary || event.hook_event_type;
  };

  const copyPayload = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event.payload, null, 2));
      setCopyButtonText('✓ Copied');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    } catch (err) {
      setCopyButtonText('✗ Failed');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    }
  }, [event.payload]);

  // Determine event importance for styling
  const isImportant = eventType === 'prompt' || eventType === 'error';
  const isSubtle = eventType === 'system';

  return (
    <div className="relative flex">
      {/* Timeline Line and Dot */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-theme-border-primary">
        {/* Hide line for first item's top portion */}
        {isFirst && <div className="absolute top-0 w-0.5 h-6 bg-theme-bg-primary" />}
        {/* Hide line for last item's bottom portion */}
        {isLast && <div className="absolute bottom-0 w-0.5 h-full bg-theme-bg-primary" style={{ top: '24px' }} />}
      </div>
      
      {/* Timeline Dot */}
      <div 
        className={`absolute left-4 top-6 w-5 h-5 rounded-full border-2 border-white z-10 ${sessionColors.background}`}
      >
        {eventType === 'error' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Event Card */}
      <div 
        className={`ml-14 mb-2 flex-1 transition-all duration-200 ${
          isExpanded ? 'mb-4' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapsed/Hover State */}
        <div
          onClick={toggleExpanded}
          className={`
            bg-white border rounded-lg cursor-pointer transition-all duration-200
            ${isExpanded ? 'border-theme-primary shadow-lg' : 'border-theme-border-primary shadow-sm hover:shadow-md'}
            ${isHovered && !isExpanded ? 'border-theme-border-secondary' : ''}
            ${isImportant && !isExpanded ? 'border-l-4' : ''}
            ${eventColors.border}
          `}
        >
          {/* Main Content Row */}
          <div className={`flex items-center px-3 ${isExpanded ? 'py-3' : 'py-2'} gap-3`}>
            {/* Expand Indicator */}
            <span className="text-xs text-theme-text-quaternary">
              {isExpanded ? '▼' : '▶'}
            </span>

            {/* Session Badge */}
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium text-white
              ${sessionColors.background}
            `}>
              {sessionShort}
            </span>

            {/* Event Icon and Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-base">{eventEmoji}</span>
              <span className={`text-sm font-medium ${
                isImportant ? 'text-theme-text-primary' : 
                isSubtle ? 'text-theme-text-tertiary' : 
                'text-theme-text-secondary'
              }`}>
                {event.hook_event_type}
              </span>
            </div>

            {/* Summary */}
            <span className={`flex-1 text-sm truncate ${
              isImportant ? 'text-theme-text-primary font-medium' : 'text-theme-text-secondary'
            }`}>
              {getEventSummary()}
            </span>

            {/* Timestamp */}
            <span className="text-xs text-theme-text-quaternary">
              {formatTime(event.timestamp)}
            </span>
          </div>

          {/* Hover Preview (when not expanded) */}
          {isHovered && !isExpanded && event.payload?.tool_input?.command && (
            <div className="px-3 pb-2 -mt-1">
              <code className="text-xs text-theme-text-tertiary block truncate">
                $ {event.payload.tool_input.command}
              </code>
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="border-t border-theme-border-primary px-3 py-3 space-y-3">
              {/* Payload Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-theme-text-primary">
                    Event Details
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPayload();
                    }}
                    className="px-2 py-1 text-xs bg-theme-bg-secondary hover:bg-theme-bg-tertiary rounded transition-colors"
                  >
                    {copyButtonText}
                  </button>
                </div>

                {/* Show different content based on event type */}
                {event.hook_event_type === 'UserPromptSubmit' && event.payload?.prompt && (
                  <div className="bg-theme-bg-secondary rounded-lg p-3">
                    <p className="text-sm text-theme-text-primary whitespace-pre-wrap">
                      {event.payload.prompt}
                    </p>
                  </div>
                )}

                {event.payload?.tool_name && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Tool:</span>
                      <span className="text-sm text-theme-text-secondary">{event.payload.tool_name}</span>
                    </div>
                    
                    {event.payload.tool_input?.command && (
                      <div className="bg-gray-900 text-gray-100 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                        <code>{event.payload.tool_input.command}</code>
                      </div>
                    )}

                    {event.payload.tool_input?.file_path && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">File:</span>
                        <code className="text-sm text-theme-text-secondary bg-theme-bg-secondary px-2 py-0.5 rounded">
                          {event.payload.tool_input.file_path}
                        </code>
                      </div>
                    )}

                    {event.payload.tool_output && (
                      <div>
                        <div className="text-sm font-medium mb-1">Output:</div>
                        <pre className="bg-theme-bg-secondary rounded-lg p-3 text-xs overflow-x-auto">
                          {typeof event.payload.tool_output === 'string' 
                            ? event.payload.tool_output.slice(0, 500)
                            : JSON.stringify(event.payload.tool_output, null, 2).slice(0, 500)
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-theme-border-primary text-xs text-theme-text-tertiary">
                  <div>
                    <span className="font-medium">Session:</span> {event.session_id}
                  </div>
                  <div>
                    <span className="font-medium">App:</span> {event.source_app}
                  </div>
                  {event.model_name && (
                    <div>
                      <span className="font-medium">Model:</span> {event.model_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}