import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import type { HookEvent, FilterOptions, Theme, ThemeSearchQuery, ThemeShare, ThemeRating, ThemeCreateRequest, ThemeUpdateRequest } from './types';

export class ObservabilityDatabase {
  private db: Database;

  constructor(dbPath: string = '../../data/events.db') {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        throw err;
      }
      console.log('📂 Connected to SQLite database:', dbPath);
      
      // Enable WAL mode for better concurrent performance
      this.db.run('PRAGMA journal_mode = WAL', (err) => {
        if (err) console.error('Error setting WAL mode:', err);
      });
      this.db.run('PRAGMA synchronous = NORMAL', (err) => {
        if (err) console.error('Error setting synchronous mode:', err);
      });
      
      this.initializeTables();
    });
  }

  private initializeTables(): void {
    console.log('🔧 Initializing database tables...');
    
    // Use serialize to ensure operations run in sequence
    this.db.serialize(() => {
      // Create events table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_app TEXT NOT NULL,
          session_id TEXT NOT NULL,
          hook_event_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          chat TEXT,
          summary TEXT,
          timestamp INTEGER NOT NULL,
          model_name TEXT,
          humanInTheLoop TEXT,
          humanInTheLoopStatus TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating events table:', err);
        } else {
          console.log('✅ Events table created/verified');
        }
      });

      // Create themes table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS themes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          displayName TEXT NOT NULL,
          description TEXT,
          colors TEXT NOT NULL,
          isPublic INTEGER NOT NULL DEFAULT 0,
          authorId TEXT,
          authorName TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          tags TEXT,
          downloadCount INTEGER DEFAULT 0,
          rating REAL DEFAULT 0,
          ratingCount INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('Error creating themes table:', err);
        } else {
          console.log('✅ Themes table created/verified');
        }
      });

      // Create theme shares table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS theme_shares (
          id TEXT PRIMARY KEY,
          themeId TEXT NOT NULL,
          shareToken TEXT NOT NULL UNIQUE,
          expiresAt INTEGER,
          isPublic INTEGER NOT NULL DEFAULT 0,
          allowedUsers TEXT,
          createdAt INTEGER NOT NULL,
          accessCount INTEGER DEFAULT 0,
          FOREIGN KEY (themeId) REFERENCES themes (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating theme_shares table:', err);
        } else {
          console.log('✅ Theme shares table created/verified');
        }
      });

      // Create theme ratings table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS theme_ratings (
          id TEXT PRIMARY KEY,
          themeId TEXT NOT NULL,
          userId TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          createdAt INTEGER NOT NULL,
          UNIQUE(themeId, userId),
          FOREIGN KEY (themeId) REFERENCES themes (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating theme_ratings table:', err);
        } else {
          console.log('✅ Theme ratings table created/verified');
        }
      });

      // Create indexes for better performance (after tables are created)
      this.db.run('CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_events_source_app ON events (source_app)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_events_session_id ON events (session_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_themes_name ON themes (name)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_themes_public ON themes (isPublic)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_theme_ratings_theme ON theme_ratings (themeId)', (err) => {
        if (!err) console.log('✅ Database tables initialized');
      });
    });
  }

  // Event operations
  insertEvent(event: HookEvent): Promise<HookEvent> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO events (source_app, session_id, hook_event_type, payload, chat, summary, timestamp, model_name, humanInTheLoop, humanInTheLoopStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const timestamp = event.timestamp || Date.now();
      
      stmt.run([
        event.source_app,
        event.session_id,
        event.hook_event_type,
        JSON.stringify(event.payload),
        event.chat ? JSON.stringify(event.chat) : null,
        event.summary || null,
        timestamp,
        event.model_name || null,
        event.humanInTheLoop ? JSON.stringify(event.humanInTheLoop) : null,
        event.humanInTheLoopStatus ? JSON.stringify(event.humanInTheLoopStatus) : null
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            ...event,
            id: this.lastID,
            timestamp
          });
        }
      });

      stmt.finalize();
    });
  }

  getRecentEvents(limit: number = 100): Promise<HookEvent[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM events ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const events = rows.map(row => ({
              ...row,
              payload: JSON.parse(row.payload),
              chat: row.chat ? JSON.parse(row.chat) : null,
              humanInTheLoop: row.humanInTheLoop ? JSON.parse(row.humanInTheLoop) : null,
              humanInTheLoopStatus: row.humanInTheLoopStatus ? JSON.parse(row.humanInTheLoopStatus) : null
            }));
            resolve(events);
          }
        }
      );
    });
  }

  getFilterOptions(): Promise<FilterOptions> {
    return new Promise((resolve, reject) => {
      const promises = [
        new Promise<string[]>((res, rej) => {
          this.db.all('SELECT DISTINCT source_app FROM events ORDER BY source_app', [], (err, rows: any[]) => {
            if (err) rej(err);
            else res(rows.map(row => row.source_app));
          });
        }),
        new Promise<string[]>((res, rej) => {
          this.db.all('SELECT DISTINCT session_id FROM events ORDER BY session_id', [], (err, rows: any[]) => {
            if (err) rej(err);
            else res(rows.map(row => row.session_id));
          });
        }),
        new Promise<string[]>((res, rej) => {
          this.db.all('SELECT DISTINCT hook_event_type FROM events ORDER BY hook_event_type', [], (err, rows: any[]) => {
            if (err) rej(err);
            else res(rows.map(row => row.hook_event_type));
          });
        })
      ];

      Promise.all(promises)
        .then(([source_apps, session_ids, hook_event_types]) => {
          resolve({ source_apps, session_ids, hook_event_types });
        })
        .catch(reject);
    });
  }

  updateEventHITLResponse(id: number, response: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE events SET humanInTheLoopStatus = ? WHERE id = ?',
        [JSON.stringify(response), id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Theme operations
  insertTheme(theme: Theme): Promise<Theme> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO themes (id, name, displayName, description, colors, isPublic, authorId, authorName, createdAt, updatedAt, tags, downloadCount, rating, ratingCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        theme.id,
        theme.name,
        theme.displayName,
        theme.description || null,
        JSON.stringify(theme.colors),
        theme.isPublic ? 1 : 0,
        theme.authorId || null,
        theme.authorName || null,
        theme.createdAt,
        theme.updatedAt,
        JSON.stringify(theme.tags),
        theme.downloadCount || 0,
        theme.rating || 0,
        theme.ratingCount || 0
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(theme);
        }
      });

      stmt.finalize();
    });
  }

  getThemeById(id: string): Promise<Theme | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM themes WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            colors: JSON.parse(row.colors),
            tags: JSON.parse(row.tags || '[]'),
            isPublic: row.isPublic === 1
          });
        }
      });
    });
  }

  searchThemes(query: ThemeSearchQuery): Promise<Theme[]> {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM themes WHERE 1=1';
      const params: any[] = [];

      if (query.query) {
        sql += ' AND (name LIKE ? OR displayName LIKE ? OR description LIKE ?)';
        const searchTerm = `%${query.query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (query.authorId) {
        sql += ' AND authorId = ?';
        params.push(query.authorId);
      }

      if (query.isPublic !== undefined) {
        sql += ' AND isPublic = ?';
        params.push(query.isPublic ? 1 : 0);
      }

      // Add sorting
      const sortBy = query.sortBy || 'updatedAt';
      const sortOrder = query.sortOrder || 'desc';
      sql += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      if (query.limit) {
        sql += ' LIMIT ?';
        params.push(query.limit);
        if (query.offset) {
          sql += ' OFFSET ?';
          params.push(query.offset);
        }
      }

      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const themes = rows.map(row => ({
            ...row,
            colors: JSON.parse(row.colors),
            tags: JSON.parse(row.tags || '[]'),
            isPublic: row.isPublic === 1
          }));
          resolve(themes);
        }
      });
    });
  }

  updateTheme(id: string, updates: ThemeUpdateRequest): Promise<Theme | null> {
    return new Promise((resolve, reject) => {
      const setClause: string[] = [];
      const params: any[] = [];

      if (updates.name) {
        setClause.push('name = ?');
        params.push(updates.name);
      }
      if (updates.displayName) {
        setClause.push('displayName = ?');
        params.push(updates.displayName);
      }
      if (updates.description !== undefined) {
        setClause.push('description = ?');
        params.push(updates.description);
      }
      if (updates.colors) {
        setClause.push('colors = ?');
        params.push(JSON.stringify(updates.colors));
      }
      if (updates.isPublic !== undefined) {
        setClause.push('isPublic = ?');
        params.push(updates.isPublic ? 1 : 0);
      }
      if (updates.tags) {
        setClause.push('tags = ?');
        params.push(JSON.stringify(updates.tags));
      }

      setClause.push('updatedAt = ?');
      params.push(Date.now());
      params.push(id);

      const sql = `UPDATE themes SET ${setClause.join(', ')} WHERE id = ?`;

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Return updated theme
          resolve(null); // For simplicity, could fetch updated theme here
        }
      });
    });
  }

  deleteTheme(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM themes WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  incrementThemeDownloadCount(id: string): Promise<Theme | null> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE themes SET downloadCount = downloadCount + 1 WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            resolve(null);
          } else {
            resolve(null); // For simplicity, could fetch updated theme here
          }
        }
      );
    });
  }

  close(): void {
    this.db.close();
  }
}