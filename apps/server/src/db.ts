import Database from 'better-sqlite3';
import type { HookEvent, FilterOptions, HumanInTheLoopResponse } from './types';

let db: Database.Database;

export function initDatabase(): void {
  db = new Database('../../data/events.db');
  
  // Enable WAL mode for better concurrent performance
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  
  // Create events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_app TEXT NOT NULL,
      session_id TEXT NOT NULL,
      hook_event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      chat TEXT,
      summary TEXT,
      timestamp INTEGER NOT NULL,
      humanInTheLoop TEXT,
      humanInTheLoopStatus TEXT
    )
  `);
  
  // Check if chat column exists, add it if not (for migration)
  try {
    const columns = db.prepare("PRAGMA table_info(events)").all() as any[];
    const hasChatColumn = columns.some((col: any) => col.name === 'chat');
    if (!hasChatColumn) {
      db.exec('ALTER TABLE events ADD COLUMN chat TEXT');
    }

    // Check if summary column exists, add it if not (for migration)
    const hasSummaryColumn = columns.some((col: any) => col.name === 'summary');
    if (!hasSummaryColumn) {
      db.exec('ALTER TABLE events ADD COLUMN summary TEXT');
    }

    // Check if humanInTheLoop column exists, add it if not (for migration)
    const hasHumanInTheLoopColumn = columns.some((col: any) => col.name === 'humanInTheLoop');
    if (!hasHumanInTheLoopColumn) {
      db.exec('ALTER TABLE events ADD COLUMN humanInTheLoop TEXT');
    }

    // Check if humanInTheLoopStatus column exists, add it if not (for migration)
    const hasHumanInTheLoopStatusColumn = columns.some((col: any) => col.name === 'humanInTheLoopStatus');
    if (!hasHumanInTheLoopStatusColumn) {
      db.exec('ALTER TABLE events ADD COLUMN humanInTheLoopStatus TEXT');
    }
  } catch (error) {
    console.error('Database migration error:', error);
  }
  
  // Create themes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      variables TEXT NOT NULL,
      is_public INTEGER DEFAULT 0,
      author_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  
  // Create theme shares table
  db.exec(`
    CREATE TABLE IF NOT EXISTS theme_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_id TEXT NOT NULL,
      shared_by TEXT NOT NULL,
      shared_with TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
    )
  `);
  
  // Create theme ratings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS theme_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at INTEGER NOT NULL,
      UNIQUE (theme_id, user_id),
      FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
    )
  `);
  
  console.log('Database initialized successfully');
}

export function insertEvent(event: Partial<HookEvent>): HookEvent {
  const timestamp = Date.now();
  
  // Prepare the insert statement
  const stmt = db.prepare(`
    INSERT INTO events (source_app, session_id, hook_event_type, payload, chat, summary, timestamp, humanInTheLoop, humanInTheLoopStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    event.source_app,
    event.session_id,
    event.hook_event_type,
    typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload),
    event.chat ? JSON.stringify(event.chat) : null,
    event.summary || null,
    timestamp,
    event.humanInTheLoop ? JSON.stringify(event.humanInTheLoop) : null,
    event.humanInTheLoopStatus || null
  );
  
  // Return the inserted event with ID
  return {
    id: result.lastInsertRowid as number,
    source_app: event.source_app!,
    session_id: event.session_id!,
    hook_event_type: event.hook_event_type!,
    payload: event.payload!,
    chat: event.chat,
    summary: event.summary,
    timestamp,
    humanInTheLoop: event.humanInTheLoop,
    humanInTheLoopStatus: event.humanInTheLoopStatus
  };
}

export function getFilterOptions(): FilterOptions {
  const sourceAppsResult = db.prepare('SELECT DISTINCT source_app FROM events ORDER BY source_app').all() as { source_app: string }[];
  const sessionIdsResult = db.prepare('SELECT DISTINCT session_id FROM events ORDER BY session_id').all() as { session_id: string }[];
  const eventTypesResult = db.prepare('SELECT DISTINCT hook_event_type FROM events ORDER BY hook_event_type').all() as { hook_event_type: string }[];
  
  return {
    sourceApps: sourceAppsResult.map(row => row.source_app),
    sessionIds: sessionIdsResult.map(row => row.session_id),
    eventTypes: eventTypesResult.map(row => row.hook_event_type)
  };
}

export function getRecentEvents(limit: number = 300): HookEvent[] {
  const stmt = db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?');
  const events = stmt.all(limit) as any[];
  
  return events.reverse().map((row: any) => ({
    id: row.id,
    source_app: row.source_app,
    session_id: row.session_id,
    hook_event_type: row.hook_event_type,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    chat: row.chat ? JSON.parse(row.chat) : undefined,
    summary: row.summary,
    timestamp: row.timestamp,
    humanInTheLoop: row.humanInTheLoop ? JSON.parse(row.humanInTheLoop) : undefined,
    humanInTheLoopStatus: row.humanInTheLoopStatus
  }));
}

export function updateEventHITLResponse(id: number, response: HumanInTheLoopResponse): HookEvent | null {
  const updateStmt = db.prepare(`
    UPDATE events 
    SET humanInTheLoop = ?, humanInTheLoopStatus = 'responded'
    WHERE id = ?
  `);
  
  const result = updateStmt.run(JSON.stringify(response), id);
  
  if (result.changes === 0) {
    return null;
  }
  
  // Get the updated event
  const selectStmt = db.prepare('SELECT * FROM events WHERE id = ?');
  const row = selectStmt.get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    source_app: row.source_app,
    session_id: row.session_id,
    hook_event_type: row.hook_event_type,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    chat: row.chat ? JSON.parse(row.chat) : undefined,
    summary: row.summary,
    timestamp: row.timestamp,
    humanInTheLoop: row.humanInTheLoop ? JSON.parse(row.humanInTheLoop) : undefined,
    humanInTheLoopStatus: row.humanInTheLoopStatus
  };
}