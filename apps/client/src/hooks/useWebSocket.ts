import { useState, useEffect, useRef, useCallback } from 'react';
import type { HookEvent, WebSocketMessage } from '@/types';

export function useWebSocket(url: string) {
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get max events from environment variable or use default
  const maxEvents = parseInt(process.env.NEXT_PUBLIC_MAX_EVENTS_TO_DISPLAY || '300');
  
  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'initial') {
            const initialEvents = Array.isArray(message.data) ? message.data : [];
            // Only keep the most recent events up to maxEvents
            setEvents(initialEvents.slice(-maxEvents));
          } else if (message.type === 'event') {
            const newEvent = message.data as HookEvent;
            setEvents(prevEvents => {
              const updated = [...prevEvents, newEvent];
              // Limit events array to maxEvents, removing the oldest when exceeded
              if (updated.length > maxEvents) {
                return updated.slice(updated.length - maxEvents + 10);
              }
              return updated;
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to connect to server');
    }
  }, [url, maxEvents]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isConnected,
    error,
    clearEvents
  };
}