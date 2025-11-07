import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { ObservabilityDatabase } from './database';
import type { HookEvent, HumanInTheLoopResponse, ThemeCreateRequest } from './types';

export class ObservabilityServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private database: ObservabilityDatabase;
  private wsClients = new Set<WebSocket>();

  constructor() {
    this.app = express();
    this.database = new ObservabilityDatabase();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }));

    this.app.use(morgan('combined'));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Events endpoints
    this.app.post('/events', async (req, res) => {
      try {
        const eventData: HookEvent = req.body;
        
        // Validate required fields
        if (!eventData.source_app || !eventData.session_id || !eventData.hook_event_type) {
          return res.status(400).json({ 
            error: 'Missing required fields: source_app, session_id, hook_event_type' 
          });
        }

        const savedEvent = await this.database.insertEvent(eventData);
        
        // Broadcast to all WebSocket clients
        this.broadcastToClients('new-event', savedEvent);

        res.json(savedEvent);
      } catch (error) {
        console.error('Error saving event:', error);
        res.status(500).json({ error: 'Failed to save event' });
      }
    });

    this.app.get('/events', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 100;
        const events = await this.database.getRecentEvents(limit);
        res.json(events);
      } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
      }
    });

    this.app.get('/filter-options', async (req, res) => {
      try {
        const options = await this.database.getFilterOptions();
        res.json(options);
      } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ error: 'Failed to fetch filter options' });
      }
    });

    // HITL endpoints
    this.app.post('/hitl/respond', async (req, res) => {
      try {
        const response: HumanInTheLoopResponse = req.body;
        
        // Update the event with the HITL response
        if (response.hookEvent.id) {
          await this.database.updateEventHITLResponse(response.hookEvent.id, {
            status: 'responded',
            respondedAt: response.respondedAt,
            response: response
          });
        }

        // Send response back to the agent via WebSocket
        if (response.hookEvent.humanInTheLoop?.responseWebSocketUrl) {
          await this.sendResponseToAgent(
            response.hookEvent.humanInTheLoop.responseWebSocketUrl,
            response
          );
        }

        res.json({ success: true });
      } catch (error) {
        console.error('Error processing HITL response:', error);
        res.status(500).json({ error: 'Failed to process HITL response' });
      }
    });

    // Theme endpoints
    this.app.post('/themes', async (req, res) => {
      try {
        const themeData: ThemeCreateRequest = req.body;
        
        // Generate theme ID
        const theme = {
          id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...themeData,
          isPublic: themeData.isPublic ?? false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          downloadCount: 0,
          rating: 0,
          ratingCount: 0,
          tags: themeData.tags || []
        };

        const savedTheme = await this.database.insertTheme(theme);
        res.json(savedTheme);
      } catch (error) {
        console.error('Error creating theme:', error);
        res.status(500).json({ error: 'Failed to create theme' });
      }
    });

    this.app.get('/themes/search', async (req, res) => {
      try {
        const query = {
          query: req.query.q as string,
          tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
          authorId: req.query.authorId as string,
          isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
          sortBy: (req.query.sortBy as any) || 'updatedAt',
          sortOrder: (req.query.sortOrder as any) || 'desc',
          limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
          offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const themes = await this.database.searchThemes(query);
        res.json(themes);
      } catch (error) {
        console.error('Error searching themes:', error);
        res.status(500).json({ error: 'Failed to search themes' });
      }
    });

    this.app.get('/themes/:id', async (req, res) => {
      try {
        const theme = await this.database.getThemeById(req.params.id);
        if (!theme) {
          return res.status(404).json({ error: 'Theme not found' });
        }
        res.json(theme);
      } catch (error) {
        console.error('Error fetching theme:', error);
        res.status(500).json({ error: 'Failed to fetch theme' });
      }
    });

    this.app.put('/themes/:id', async (req, res) => {
      try {
        const updates = req.body;
        const updatedTheme = await this.database.updateTheme(req.params.id, updates);
        
        if (!updatedTheme) {
          return res.status(404).json({ error: 'Theme not found' });
        }
        
        res.json(updatedTheme);
      } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ error: 'Failed to update theme' });
      }
    });

    this.app.delete('/themes/:id', async (req, res) => {
      try {
        const deleted = await this.database.deleteTheme(req.params.id);
        
        if (!deleted) {
          return res.status(404).json({ error: 'Theme not found' });
        }
        
        res.json({ success: true });
      } catch (error) {
        console.error('Error deleting theme:', error);
        res.status(500).json({ error: 'Failed to delete theme' });
      }
    });

    this.app.post('/themes/:id/download', async (req, res) => {
      try {
        const theme = await this.database.incrementThemeDownloadCount(req.params.id);
        
        if (!theme) {
          return res.status(404).json({ error: 'Theme not found' });
        }
        
        res.json({ success: true });
      } catch (error) {
        console.error('Error incrementing download count:', error);
        res.status(500).json({ error: 'Failed to increment download count' });
      }
    });
  }

  private setupWebSocket(): void {
    this.server = createServer(this.app);
    
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.wsClients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.wsClients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.wsClients.delete(ws);
      });

      // Send initial data
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to observability server'
      }));
    });
  }

  private broadcastToClients(type: string, data: any): void {
    const message = JSON.stringify({ type, data });
    
    this.wsClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        this.wsClients.delete(ws);
      }
    });
  }

  // Helper function to send response to agent via WebSocket
  private async sendResponseToAgent(wsUrl: string, response: HumanInTheLoopResponse): Promise<void> {
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

        ws.on('open', () => {
          if (isResolved) return;
          console.log('[HITL] WebSocket connection opened, sending response...');

          try {
            ws!.send(JSON.stringify(response));
            console.log('[HITL] Response sent successfully');
            isResolved = true;
            cleanup();
            resolve();
          } catch (error) {
            console.error('[HITL] Failed to send response:', error);
            cleanup();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          if (isResolved) return;
          console.error('[HITL] WebSocket connection error:', error);
          isResolved = true;
          cleanup();
          reject(error);
        });

        ws.on('close', () => {
          if (isResolved) return;
          console.log('[HITL] WebSocket connection closed');
          isResolved = true;
          cleanup();
          resolve();
        });

        // Set timeout
        setTimeout(() => {
          if (!isResolved) {
            console.log('[HITL] WebSocket connection timeout');
            isResolved = true;
            cleanup();
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        console.error('[HITL] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  public start(port: number = 4000): void {
    this.server.listen(port, () => {
      console.log(`🚀 Observability server started on port ${port}`);
      console.log(`📊 Dashboard: http://localhost:3000`);
      console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);
    });
  }

  public stop(): void {
    this.wss.close();
    this.server.close();
    this.database.close();
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new ObservabilityServer();
  server.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });
}

export default ObservabilityServer;