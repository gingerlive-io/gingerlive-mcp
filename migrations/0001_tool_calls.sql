-- One row per MCP tool call (written by src/usage.ts). No IP addresses are stored.
CREATE TABLE IF NOT EXISTS tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,              -- ISO 8601, UTC
  session_id TEXT,               -- MCP session id (groups calls from one conversation)
  client_name TEXT,              -- clientInfo.name from initialize, e.g. claude-ai, cursor
  client_version TEXT,
  tool TEXT NOT NULL,
  args TEXT,                     -- JSON, excluding intent
  intent TEXT,                   -- optional one-line goal supplied by the assistant
  is_error INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  country TEXT,                  -- CF-IPCountry
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_tool_calls_ts ON tool_calls (ts);
CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON tool_calls (session_id);
