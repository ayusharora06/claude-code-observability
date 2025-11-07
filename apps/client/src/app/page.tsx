'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { EventCard } from '@/components/EventCard';
import { WS_URL } from '@/config';

function LoadingState() {
  return (
    <div className="min-h-screen bg-theme-bg-secondary p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-primary mb-4"></div>
        <h2 className="text-xl font-semibold text-theme-text-primary">
          Loading Multi-Agent Observability...
        </h2>
      </div>
    </div>
  );
}

function MainContent() {
  const { events, isConnected, error, clearEvents } = useWebSocket(WS_URL);

  return (
    <div className="min-h-screen bg-theme-bg-secondary p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-theme-text-primary">
            Multi-Agent Observability
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-theme-accent-success' : 'bg-theme-accent-error'}`}></div>
              <span className="text-sm text-theme-text-secondary">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={clearEvents}
              className="px-3 py-1 bg-theme-bg-tertiary hover:bg-theme-bg-quaternary text-theme-text-primary text-sm rounded border border-theme-border-primary transition-colors"
            >
              Clear Events
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 p-3 bg-theme-accent-error/20 border border-theme-accent-error rounded text-theme-accent-error text-sm">
            Error: {error}
          </div>
        )}
      </header>

      <main>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-theme-text-primary mb-2">
            Real-time Events ({events.length})
          </h2>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-theme-text-primary mb-2">
              No events yet
            </h3>
            <p className="text-theme-text-secondary">
              Waiting for Claude Code hook events...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.slice().reverse().map((event, index) => (
              <EventCard key={event.id || index} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <LoadingState />;
  }

  return <MainContent />;
}