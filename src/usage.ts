/**
 * Usage logging: one row per tool call, so we can see which questions assistants bring
 * to the server, which tools they chain, and where answers come back empty.
 *
 * Stores no IP addresses — only the MCP session id, the client's self-reported name and
 * version, Cloudflare's country code, the tool arguments, and the optional `intent`
 * sentence the assistant supplies. Logging is best-effort: a failed write never breaks
 * a tool call, and when no sink is configured (stdio, public repo builds) it is a no-op.
 */

export interface UsageEvent {
  sessionId: string | null;
  clientName: string | null;
  clientVersion: string | null;
  tool: string;
  args: Record<string, unknown>;
  intent: string | null;
  isError: boolean;
  durationMs: number;
  country: string | null;
  userAgent: string | null;
}

export type UsageSink = (event: UsageEvent) => Promise<void>;

/** Writes events to the `tool_calls` table (see migrations/0001_tool_calls.sql). */
export const d1Sink =
  (db: D1Database): UsageSink =>
  async (e) => {
    await db
      .prepare(
        `INSERT INTO tool_calls
          (ts, session_id, client_name, client_version, tool, args, intent, is_error, duration_ms, country, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        new Date().toISOString(),
        e.sessionId,
        e.clientName,
        e.clientVersion,
        e.tool,
        JSON.stringify(e.args),
        e.intent,
        e.isError ? 1 : 0,
        e.durationMs,
        e.country,
        e.userAgent,
      )
      .run();
  };
