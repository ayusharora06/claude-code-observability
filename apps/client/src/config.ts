// Centralized configuration for API and WebSocket URLs
// Uses environment variables to support dynamic port configuration for worktrees

const SERVER_PORT = process.env.NEXT_PUBLIC_API_PORT || '4000';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${SERVER_PORT}`;
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:${SERVER_PORT}/stream`;