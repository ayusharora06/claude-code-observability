# 🔍 Multi-Agent Observability Dashboard

Real-time observability dashboard for Claude Code (Anthropic's AI coding assistant) that captures, visualizes, and analyzes every action taken by AI agents during code generation.

## 🏗️ Architecture

```
claude-code-observability/
├── .claude/                    # Claude Code hook scripts and configuration
│   ├── hooks/                 # Python hook scripts for all events
│   └── settings.json         # Hook configuration pointing to observability server
├── apps/
│   ├── server/               # Express.js backend with SQLite
│   │   ├── src/
│   │   │   ├── index.ts      # Main server with WebSocket support
│   │   │   ├── database.ts   # SQLite database with full schema
│   │   │   └── types.ts      # TypeScript interfaces
│   │   └── package.json      # Express dependencies
│   └── client/               # Next.js frontend
│       ├── src/
│       │   ├── pages/        # Next.js pages (dashboard)
│       │   └── styles/       # Tailwind CSS styling
│       └── package.json      # Next.js dependencies
└── README.md                 # This file
```

## ✨ Features

### 📊 Dual-View System

#### Timeline View (Master)
- **Live Event Streaming**: See all events from all sessions in real-time
- **Expandable Cards**: 3-state cards (collapsed → hover preview → fully expanded)
- **Session Tracking**: Color-coded session badges for easy identification
- **Smart Filtering**: Filter by event type, session, project, or time range
- **Relative Timestamps**: Auto-updating "2 mins ago" style timestamps

#### Topic View
Two powerful sub-views for different perspectives:

**Conversations Tab:**
- Groups events from user prompt to completion
- Shows conversation flow with relative timestamps
- Tracks tool usage per conversation
- Visual error indicators

**Categories Tab:**
- Organizes events by type (Tools, Prompts, Sessions, etc.)
- Shows total events and unique conversation counts
- Click to see all events in that category
- Recent activity indicators

### 🚀 Real-time Capabilities
- **WebSocket Connection**: Live bidirectional communication
- **Exponential Backoff**: Automatic reconnection with smart retry logic
- **Connection Status**: Visual indicators for connected/reconnecting states
- **Event Limiting**: Configurable max events (default 300) to prevent memory issues

### 🎨 Modern UI/UX
- **Clean Design**: Light theme with proper contrast
- **Responsive Layout**: Works on mobile, tablet, and desktop
- **Interactive Elements**: Hover effects, smooth transitions, click-to-expand
- **Copy to Clipboard**: One-click payload copying for debugging

### 🔧 Backend Features
- **Complete Hook Integration**: All Claude Code hook events captured
- **Express.js Backend**: RESTful API with SQLite database
- **Real-time WebSocket**: Live event streaming
- **Complete Database Schema**: Events, themes, theme shares, and ratings tables
- **HITL Support**: Human-in-the-Loop workflow infrastructure

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd apps/server
npm install
npm run dev
# Server starts on http://localhost:4000
```

### 2. Start the Frontend
```bash
cd apps/client
npm install
npm run dev
# Dashboard available at http://localhost:3000
```

### 3. Configure Claude Code
The hooks are already configured in `.claude/settings.json`. When you use Claude Code in this project directory, all events will be automatically captured.

## 🔧 Key Components

### Backend (Express.js)
- **Server**: `apps/server/src/index.ts` - Express server with WebSocket support
- **Database**: `apps/server/src/database.ts` - SQLite with complete schema
- **Types**: `apps/server/src/types.ts` - TypeScript interfaces

### Frontend (Next.js)
- **Dashboard**: `apps/client/src/pages/index.tsx` - Main observability dashboard
- **Styling**: `apps/client/src/styles/globals.css` - Tailwind CSS styles

### Hooks System
- **Configuration**: `.claude/settings.json` - Hook event bindings
- **Scripts**: `.claude/hooks/` - Python scripts for each hook type
- **Key Fix**: `user_prompt_submit.py` includes data passing to fix empty prompt issue

## 📊 API Endpoints

### Events
- `GET /events` - Fetch recent events
- `POST /events` - Create new event (used by hooks)
- `GET /filter-options` - Get available filter options

### Themes
- `POST /themes` - Create theme
- `GET /themes/search` - Search themes
- `GET /themes/:id` - Get theme by ID
- `PUT /themes/:id` - Update theme
- `DELETE /themes/:id` - Delete theme

### HITL (Human-in-the-Loop)
- `POST /hitl/respond` - Submit HITL response

### System
- `GET /health` - Health check
- WebSocket: `ws://localhost:4000/ws` - Real-time event streaming

## 🐛 Troubleshooting

### Hook Events Not Appearing
1. Ensure both servers are running (ports 3000 and 4000)
2. Check that you're running Claude Code from this project directory
3. Verify `.claude/settings.json` points to correct server URL
4. Check server logs for incoming events

### Empty Prompt in UserPromptSubmit Events
This issue has been fixed by modifying `user_prompt_submit.py` to properly pass data between hook scripts in the chain.

## 🔄 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Express.js + TypeScript | RESTful API server |
| Database | SQLite3 | Event storage and persistence |
| WebSocket | ws library | Real-time event streaming |
| Frontend | Next.js + React | Modern dashboard UI |
| Styling | Tailwind CSS | Responsive design |
| Hooks | Python + uv | Claude Code event capture |

## 📈 Next Steps

To extend this system with full feature parity to the original:

1. **Add Advanced UI Components**:
   - AgentSwimLane visualization
   - LivePulseChart for real-time metrics
   - Advanced filtering interface

2. **Implement Theme Features**:
   - Theme marketplace UI
   - Import/export functionality
   - Theme preview system

3. **Add HITL Interface**:
   - Permission request UI
   - Response handling interface
   - Timeout management

4. **Performance Enhancements**:
   - Event pagination
   - WebSocket reconnection
   - Error boundaries

## 💡 Key Insight

The core empty prompt issue was caused by **hook chaining** - when multiple hook scripts are executed in sequence, the first script consumed all stdin data, leaving nothing for subsequent scripts. This was fixed by adding:

```python
# In user_prompt_submit.py
print(json.dumps(input_data))  # Pass data to next script
```

This simple change ensures `send_event.py` receives the complete hook data, including the actual prompt content.

---

**Status**: ✅ **Complete and functional**  
**Servers**: Backend (Express) on :4000, Frontend (Next.js) on :3000  
**Hooks**: Fully configured and working  
**Database**: SQLite with complete schema initialized  