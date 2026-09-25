/**
 * Local stdio entry point: the same tools, resources and prompts as the hosted
 * Worker, for MCP clients that launch servers as a local process.
 *
 *   npx tsx src/stdio.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGingerLive, SERVER_VERSION } from "./server";

const server = new McpServer({ name: "GingerLive", version: SERVER_VERSION });
registerGingerLive(server);
await server.connect(new StdioServerTransport());
