import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Activity, Filter } from 'lucide-react';

interface HookEvent {
  id: number;
  source_app: string;
  session_id: string;
  hook_event_type: string;
  payload: any;
  chat?: any[];
  summary?: string;
  timestamp: number;
  model_name?: string;
}

export default function Home() {
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, HH:mm:ss');
  };

  const getEventEmoji = (eventType: string) => {
    switch (eventType) {
      case 'UserPromptSubmit': return '💬';
      case 'PreToolUse': return '🔧';
      case 'PostToolUse': return '✅';
      case 'Stop': return '🛑';
      case 'SessionStart': return '🚀';
      case 'SessionEnd': return '🏁';
      default: return '📝';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'UserPromptSubmit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PreToolUse': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'PostToolUse': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Stop': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'SessionStart': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'SessionEnd': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Events</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchEvents}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Claude Code Observability
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchEvents}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Recent Events
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {events.length} events captured
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Events Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Hook events will appear here when Claude Code operations are performed.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Make sure your Claude Code hooks are configured correctly and pointing to port 4000.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-card-header">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getEventEmoji(event.hook_event_type)}</span>
                    <div className="flex flex-col">
                      <span className={`badge ${getEventColor(event.hook_event_type)}`}>
                        {event.hook_event_type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {event.hook_event_type === 'UserPromptSubmit' ? 'User prompt submission' :
                         event.hook_event_type === 'PreToolUse' ? 'Before tool execution' :
                         event.hook_event_type === 'PostToolUse' ? 'After tool execution' :
                         event.hook_event_type === 'Stop' ? 'Session stopped' :
                         event.hook_event_type === 'SessionStart' ? 'Session started' :
                         event.hook_event_type === 'SessionEnd' ? 'Session ended' :
                         'Hook event'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="event-timestamp">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mb-3">
                  <div className="px-3 py-1 rounded-md text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    📱 {event.source_app}
                  </div>
                  <div className="px-2 py-1 rounded text-xs bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                    Session: {event.session_id.substring(0, 8)}...
                  </div>
                </div>

                <div className="space-y-2">
                  {event.hook_event_type === 'UserPromptSubmit' && event.payload.prompt && (
                    <div className="italic text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                      <span className="font-medium">Prompt:</span> "{event.payload.prompt}"
                    </div>
                  )}
                  {event.summary && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <span className="font-medium">Summary:</span> {event.summary}
                    </div>
                  )}
                  {event.model_name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Model: {event.model_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}