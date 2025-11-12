'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useEventColors } from '@/hooks/useEventColors';
import type { HookEvent } from '@/types';

interface ChatViewProps {
  events: HookEvent[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  events: HookEvent[];
  timestamp: number;
  tools?: ToolUse[];
  error?: boolean;
  sessionId: string;
}

interface ToolUse {
  name: string;
  icon: string;
  detail?: string;
  command?: string;
  output?: string;
  status: 'running' | 'success' | 'error';
  duration?: number;
}

export function ChatView({ events }: ChatViewProps) {
  const { getEventType, getEventColors } = useEventColors();
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const getToolIcon = (toolName: string): string => {
    const name = toolName.toLowerCase();
    if (name.includes('read')) return '📖';
    if (name.includes('write') || name.includes('edit')) return '✏️';
    if (name.includes('bash') || name.includes('command')) return '⚡';
    if (name.includes('search') || name.includes('grep')) return '🔍';
    if (name.includes('web') || name.includes('fetch')) return '🌐';
    if (name.includes('task') || name.includes('todo')) return '📋';
    return '🔧';
  };

  const getToolDetail = (event: HookEvent): string => {
    const input = event.payload?.tool_input;
    if (input?.file_path) return input.file_path.split('/').pop() || '';
    if (input?.pattern) return `Search: ${input.pattern}`;
    if (input?.prompt) return input.prompt.slice(0, 50) + (input.prompt.length > 50 ? '...' : '');
    if (input?.url) return new URL(input.url).hostname;
    return '';
  };

  // Group events into chat messages
  const chatMessages = useMemo(() => {
    const messages: ChatMessage[] = [];
    let currentAssistantMessage: ChatMessage | null = null;
    
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => 
      (a.timestamp || 0) - (b.timestamp || 0)
    );
    
    sortedEvents.forEach((event) => {
      // User prompts become user messages
      if (event.hook_event_type === 'UserPromptSubmit') {
        // Save any pending assistant message
        if (currentAssistantMessage) {
          messages.push(currentAssistantMessage);
          currentAssistantMessage = null;
        }
        
        messages.push({
          id: `user-${event.timestamp}`,
          type: 'user',
          content: event.payload?.prompt || 'User action',
          events: [event],
          timestamp: event.timestamp || Date.now(),
          sessionId: event.session_id
        });
      }
      // Session events become system messages
      else if (event.hook_event_type === 'SessionStart' || event.hook_event_type === 'SessionStop') {
        if (currentAssistantMessage) {
          messages.push(currentAssistantMessage);
          currentAssistantMessage = null;
        }
        
        messages.push({
          id: `system-${event.timestamp}`,
          type: 'system',
          content: event.hook_event_type === 'SessionStart' ? '🎯 Session Started' : '🛑 Session Ended',
          events: [event],
          timestamp: event.timestamp || Date.now(),
          sessionId: event.session_id
        });
      }
      // Other events are grouped into assistant messages
      else {
        if (!currentAssistantMessage) {
          currentAssistantMessage = {
            id: `assistant-${event.timestamp}`,
            type: 'assistant',
            content: '',
            events: [],
            timestamp: event.timestamp || Date.now(),
            tools: [],
            sessionId: event.session_id
          };
        }
        
        currentAssistantMessage.events.push(event);
        
        // Process tool uses
        if (event.payload?.tool_name) {
          const tool: ToolUse = {
            name: event.payload.tool_name,
            icon: getToolIcon(event.payload.tool_name),
            detail: getToolDetail(event),
            command: event.payload.tool_input?.command,
            status: event.hook_event_type.includes('error') ? 'error' : 'success'
          };
          currentAssistantMessage.tools?.push(tool);
        }
        
        // Check for errors
        if (getEventType(event) === 'error') {
          currentAssistantMessage.error = true;
        }
        
        // Update content for chat/notification events
        if (event.hook_event_type === 'Chat' && event.payload?.message) {
          currentAssistantMessage.content = event.payload.message;
        }
      }
    });
    
    // Add final assistant message if exists
    if (currentAssistantMessage) {
      messages.push(currentAssistantMessage);
    }
    
    return messages;
  }, [events, getEventType]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const toggleToolExpansion = (toolId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-gradient-to-b from-theme-bg-secondary to-theme-bg-primary rounded-lg">
      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'system' ? (
              // System Message (centered)
              <div className="w-full flex justify-center">
                <div className="bg-theme-bg-tertiary text-theme-text-tertiary px-4 py-2 rounded-full text-sm">
                  {message.content}
                  <span className="ml-2 text-xs opacity-70">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ) : (
              // User or Assistant Message
              <div className={`max-w-[70%] ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col space-y-1`}>
                {/* Avatar and Name */}
                <div className={`flex items-center space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                    ${message.type === 'user' ? 'bg-theme-primary' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                    {message.type === 'user' ? 'U' : 'C'}
                  </div>
                  <span className="text-xs text-theme-text-tertiary">
                    {message.type === 'user' ? 'You' : 'Claude'}
                  </span>
                  <span className="text-xs text-theme-text-quaternary">
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 shadow-card ${
                  message.type === 'user' 
                    ? 'bg-theme-primary text-white ml-10' 
                    : 'bg-white border border-theme-border-primary mr-10'
                }`}>
                  {/* Message Content */}
                  {message.content && (
                    <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-theme-text-primary'}`}>
                      {message.content}
                    </p>
                  )}

                  {/* Tool Uses (Assistant only) */}
                  {message.type === 'assistant' && message.tools && message.tools.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.tools.map((tool, index) => {
                        const toolId = `${message.id}-tool-${index}`;
                        const isExpanded = expandedTools.has(toolId);
                        
                        return (
                          <div 
                            key={toolId}
                            className="bg-theme-bg-secondary rounded-lg p-2 border border-theme-border-primary"
                          >
                            <div 
                              onClick={() => toggleToolExpansion(toolId)}
                              className="flex items-center justify-between cursor-pointer hover:bg-theme-bg-tertiary rounded p-1 -m-1"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{tool.icon}</span>
                                <span className="text-sm font-medium text-theme-text-primary">
                                  {tool.name}
                                </span>
                                {tool.detail && (
                                  <span className="text-xs text-theme-text-tertiary">
                                    {tool.detail}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {tool.status === 'success' && <span className="text-green-500">✓</span>}
                                {tool.status === 'error' && <span className="text-red-500">✗</span>}
                                {tool.status === 'running' && <span className="animate-spin">⏳</span>}
                                <span className="text-xs text-theme-text-quaternary">
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Expanded Tool Details */}
                            {isExpanded && tool.command && (
                              <div className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs font-mono overflow-x-auto">
                                <code>{tool.command}</code>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Error Indicator */}
                  {message.error && (
                    <div className="mt-2 text-xs text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span> Error occurred during execution
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />

        {/* Empty State */}
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-theme-text-secondary mb-2">
              No messages yet
            </h3>
            <p className="text-theme-text-tertiary">
              Start a conversation with Claude to see messages appear here
            </p>
          </div>
        )}
      </div>

      {/* Typing Indicator (shown when processing) */}
      {events.length > 0 && events[events.length - 1]?.hook_event_type === 'PreToolUse' && (
        <div className="px-4 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              C
            </div>
            <div className="bg-white border border-theme-border-primary rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}