import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { initDatabase, insertEvent, getFilterOptions, getRecentEvents, updateEventHITLResponse } from './db';
import type { HookEvent, HumanInTheLoopResponse } from './types';
import { 
  createTheme, 
  updateThemeById, 
  getThemeById, 
  searchThemes, 
  deleteThemeById, 
  exportThemeById, 
  importTheme,
  getThemeStats 
} from './theme';

// Initialize database
initDatabase();

// Store WebSocket clients and track sent event IDs to prevent duplicates
const wsClients = new Set<WebSocket>();
const recentEventIds = new Map<number, number>(); // eventId -> timestamp
const MAX_RECENT_EVENTS = 1000;
const RECENT_EVENT_TIMEOUT = 5000; // 5 seconds

// Clean up old event IDs periodically
setInterval(() => {
  const now = Date.now();
  for (const [eventId, timestamp] of recentEventIds.entries()) {
    if (now - timestamp > RECENT_EVENT_TIMEOUT) {
      recentEventIds.delete(eventId);
    }
  }
}, 10000); // Clean every 10 seconds

// Helper function to send response to agent via WebSocket
async function sendResponseToAgent(
  wsUrl: string,
  response: HumanInTheLoopResponse
): Promise<void> {
  console.log(`[HITL] Connecting to agent WebSocket: ${wsUrl}`);

  return new Promise((resolve, reject) => {
    let ws: WebSocket | null = null;
    let isResolved = false;

    const cleanup = () => {
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    };

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isResolved) return;
        console.log('[HITL] WebSocket connection opened, sending response...');

        try {
          ws!.send(JSON.stringify(response));
          console.log('[HITL] Response sent successfully');

          // Wait longer to ensure message fully transmits before closing
          setTimeout(() => {
            cleanup();
            if (!isResolved) {
              isResolved = true;
              resolve();
            }
          }, 500);
        } catch (error) {
          console.error('[HITL] Error sending message:', error);
          cleanup();
          if (!isResolved) {
            isResolved = true;
            reject(error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('[HITL] WebSocket error:', error);
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      };

      ws.onclose = () => {
        console.log('[HITL] WebSocket connection closed');
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!isResolved) {
          console.error('[HITL] Timeout sending response to agent');
          cleanup();
          isResolved = true;
          reject(new Error('Timeout sending response to agent'));
        }
      }, 5000);

    } catch (error) {
      console.error('[HITL] Error creating WebSocket:', error);
      cleanup();
      if (!isResolved) {
        isResolved = true;
        reject(error);
      }
    }
  });
}

const app = express();
const server = createServer(app);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type'
}));

app.use(express.json({ limit: '50mb' }));

// POST /events - Receive new events (matching Bun server exactly)
app.post('/events', async (req, res) => {
  try {
    const event: HookEvent = req.body;
    
    // Validate required fields
    if (!event.source_app || !event.session_id || !event.hook_event_type || !event.payload) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert event into database
    const savedEvent = insertEvent(event);
    
    // Check if we've recently broadcast this event to prevent duplicates
    if (!recentEventIds.has(savedEvent.id)) {
      // Mark event as sent
      recentEventIds.set(savedEvent.id, Date.now());
      
      // Keep map size under control
      if (recentEventIds.size > MAX_RECENT_EVENTS) {
        const oldestId = recentEventIds.keys().next().value;
        recentEventIds.delete(oldestId);
      }
      
      // Broadcast to all WebSocket clients (matching Bun format)
      const message = JSON.stringify({ type: 'event', data: savedEvent });
      wsClients.forEach(client => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        } catch (err) {
          // Client disconnected, remove from set
          wsClients.delete(client);
        }
      });
    }
    
    res.json(savedEvent);
  } catch (error) {
    console.error('Error processing event:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// GET /events/filter-options - Get available filter options
app.get('/events/filter-options', (req, res) => {
  const options = getFilterOptions();
  res.json(options);
});

// GET /events/recent - Get recent events
app.get('/events/recent', (req, res) => {
  const limit = parseInt(req.query.limit as string || '300');
  const events = getRecentEvents(limit);
  res.json(events);
});

// POST /events/:id/respond - Respond to HITL request
app.post('/events/:id/respond', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const response: HumanInTheLoopResponse = req.body;
    response.respondedAt = Date.now();

    // Update event in database
    const updatedEvent = updateEventHITLResponse(id, response);

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Send response to agent via WebSocket
    if (updatedEvent.humanInTheLoop?.responseWebSocketUrl) {
      try {
        await sendResponseToAgent(
          updatedEvent.humanInTheLoop.responseWebSocketUrl,
          response
        );
      } catch (error) {
        console.error('Failed to send response to agent:', error);
        // Don't fail the request if we can't reach the agent
      }
    }

    // Check if we've recently broadcast this event to prevent duplicates
    if (!recentEventIds.has(updatedEvent.id)) {
      // Mark event as sent
      recentEventIds.set(updatedEvent.id, Date.now());
      
      // Keep map size under control
      if (recentEventIds.size > MAX_RECENT_EVENTS) {
        const oldestId = recentEventIds.keys().next().value;
        recentEventIds.delete(oldestId);
      }
      
      // Broadcast updated event to all connected clients
      const message = JSON.stringify({ type: 'event', data: updatedEvent });
      wsClients.forEach(client => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        } catch (err) {
          wsClients.delete(client);
        }
      });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error processing HITL response:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Theme API endpoints (matching Bun server exactly)

// POST /api/themes - Create a new theme
app.post('/api/themes', async (req, res) => {
  try {
    const themeData = req.body;
    const result = await createTheme(themeData);
    
    const status = result.success ? 201 : 400;
    res.status(status).json(result);
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(400).json({ 
      success: false, 
      error: 'Invalid request body' 
    });
  }
});

// GET /api/themes - Search themes
app.get('/api/themes', async (req, res) => {
  const query = {
    query: req.query.query as string || undefined,
    isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
    authorId: req.query.authorId as string || undefined,
    sortBy: req.query.sortBy as any || undefined,
    sortOrder: req.query.sortOrder as any || undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
  };
  
  const result = await searchThemes(query);
  res.json(result);
});

// GET /api/themes/:id - Get a specific theme
app.get('/api/themes/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Theme ID is required' 
    });
  }
  
  const result = await getThemeById(id);
  const status = result.success ? 200 : 404;
  res.status(status).json(result);
});

// PUT /api/themes/:id - Update a theme
app.put('/api/themes/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Theme ID is required' 
    });
  }
  
  try {
    const updates = req.body;
    const result = await updateThemeById(id, updates);
    
    const status = result.success ? 200 : 400;
    res.status(status).json(result);
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(400).json({ 
      success: false, 
      error: 'Invalid request body' 
    });
  }
});

// DELETE /api/themes/:id - Delete a theme
app.delete('/api/themes/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Theme ID is required' 
    });
  }
  
  const authorId = req.query.authorId as string;
  const result = await deleteThemeById(id, authorId || undefined);
  
  const status = result.success ? 200 : (result.error?.includes('not found') ? 404 : 403);
  res.status(status).json(result);
});

// GET /api/themes/:id/export - Export a theme
app.get('/api/themes/:id/export', async (req, res) => {
  const id = req.params.id;
  
  const result = await exportThemeById(id);
  if (!result.success) {
    const status = result.error?.includes('not found') ? 404 : 400;
    return res.status(status).json(result);
  }
  
  res.setHeader('Content-Disposition', `attachment; filename="${result.data.theme.name}.json"`);
  res.json(result.data);
});

// POST /api/themes/import - Import a theme
app.post('/api/themes/import', async (req, res) => {
  try {
    const importData = req.body;
    const authorId = req.query.authorId as string;
    
    const result = await importTheme(importData, authorId || undefined);
    
    const status = result.success ? 201 : 400;
    res.status(status).json(result);
  } catch (error) {
    console.error('Error importing theme:', error);
    res.status(400).json({ 
      success: false, 
      error: 'Invalid import data' 
    });
  }
});

// GET /api/themes/stats - Get theme statistics
app.get('/api/themes/stats', async (req, res) => {
  const result = await getThemeStats();
  res.json(result);
});

// Default response
app.get('/', (req, res) => {
  res.send('Multi-Agent Observability Server');
});

// WebSocket server setup
const wss = new WebSocketServer({ 
  server,
  path: '/stream'
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Remove any existing connection from the same client
  wsClients.forEach(client => {
    if (client === ws) {
      wsClients.delete(client);
    }
  });
  
  wsClients.add(ws);
  
  // Send recent events on connection (matching Bun format exactly)
  const events = getRecentEvents(300);
  ws.send(JSON.stringify({ type: 'initial', data: events }));

  ws.on('message', (message) => {
    // Handle any client messages if needed
    console.log('Received message:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
  
  // Ping client periodically to detect stale connections
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
      wsClients.delete(ws);
    }
  }, 30000); // Ping every 30 seconds
  
  ws.on('pong', () => {
    // Client is still alive
  });
});

const PORT = parseInt(process.env.SERVER_PORT || '4000');
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 WebSocket endpoint: ws://localhost:${PORT}/stream`);
  console.log(`📮 POST events to: http://localhost:${PORT}/events`);
});