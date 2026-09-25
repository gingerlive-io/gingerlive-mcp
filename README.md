# GingerLive MCP Server

**The official [Model Context Protocol](https://modelcontextprotocol.io) server for [GingerLive](https://gingerlive.io)**, the livestream advertising platform that connects brands with 1,000+ streamers on Twitch, Kick, YouTube Live and TikTok Live.

Connect it to Claude, ChatGPT, Cursor or any MCP client and your assistant can answer questions about livestream advertising using GingerLive's own up-to-date data: ad formats, network reach, campaign case studies and the streamer monetization program.

- **Endpoint (Streamable HTTP):** `https://mcp.gingerlive.io/mcp`
- **Auth:** none (public, read-only data)
- **Registry:** `io.gingerlive/mcp` in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.gingerlive/mcp)
- **Docs:** [gingerlive.io/developers](https://gingerlive.io/developers/)

## What it can do

### Tools

| Tool | Returns |
|---|---|
| `get_company_overview` | What GingerLive is: positioning, streaming platforms, network stats, third-party measurement partners, contact links |
| `get_network_stats` | Network reach and performance: streamer count, annual unique reach, monthly hours watched, ad view-through rate |
| `list_ad_formats` | The livestream ad formats offered to brands, with descriptions and format badges (e.g. unskippable, adblock-safe) |
| `list_case_studies` | Campaign case studies, each with a short excerpt and link |
| `get_case_study` | The full write-up of one case study, by slug |
| `get_streamer_program_info` | How streamers join and earn: cost, how it works, supported platforms, sign-up link |

### Resources

- `gingerlive://company`: company facts (JSON)
- `gingerlive://guides`: resource guides on livestream advertising (JSON)
- `https://gingerlive.io/llms.txt`: the canonical llms.txt, fetched live

### Prompts

- `plan_livestream_campaign`: scope a livestream ad campaign for a brand (optional `goal`, `budget`)
- `get_started_as_streamer`: help a streamer evaluate and join the program (optional `platform`)

## Connect

**Claude (claude.ai / Desktop):** Settings → Connectors → *Add custom connector* → `https://mcp.gingerlive.io/mcp`

**Claude Code:**

```bash
claude mcp add --transport http gingerlive https://mcp.gingerlive.io/mcp
```

**Cursor, VS Code and other clients** (`mcp.json`):

```json
{
  "mcpServers": {
    "gingerlive": { "url": "https://mcp.gingerlive.io/mcp" }
  }
}
```

**Run it locally over stdio** (same tools, no network needed except the live llms.txt resource):

```bash
git clone https://github.com/gingerlive-io/gingerlive-mcp && cd gingerlive-mcp && npm install
```

```json
{
  "mcpServers": {
    "gingerlive": { "command": "npx", "args": ["tsx", "/path/to/gingerlive-mcp/src/stdio.ts"] }
  }
}
```

Or with Docker: `docker build -t gingerlive-mcp . && docker run -i --rm gingerlive-mcp`

Then ask things like *"What livestream ad formats does GingerLive offer?"*, *"Show me GingerLive's campaign case studies"* or *"How can I monetize my Kick stream?"*

## How it works

Tools, resources and prompts are registered once in `src/server.ts` and served two ways: `src/index.ts` (the hosted Cloudflare Worker) and `src/stdio.ts` (a local stdio process). The Worker is built with the [Agents SDK](https://developers.cloudflare.com/agents/) (`McpAgent`) and the official MCP TypeScript SDK. Every answer comes from `src/data/agent-data.json`, a static snapshot generated from the same source as [gingerlive.io/llms.txt](https://gingerlive.io/llms.txt), so the server only ever returns information that is already public on gingerlive.io.

| Path | Purpose |
|---|---|
| `/mcp` | MCP Streamable HTTP endpoint |
| `/health` | Health check |
| `/.well-known/mcp` | SEP-1960 manifest |
| `/.well-known/mcp.json` | Registry server card |

## Run it yourself

```bash
npm install
npm run stdio    # local stdio server
npm run dev      # local Worker at http://localhost:8787/mcp
npm run deploy   # to your own Cloudflare account (change the route in wrangler.jsonc first)
```

Inspect it with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector
```

## About GingerLive

[GingerLive](https://gingerlive.io) is a livestream advertising platform. Its Streamsense AI places non-intrusive, unskippable ads at the right live moment, so streamers earn from their content and brands reach Gen Z at scale.

- Brands: [gingerlive.io/brands](https://gingerlive.io/brands/)
- Streamers: [gingerlive.io/streamers](https://gingerlive.io/streamers/)
- Case studies: [gingerlive.io/casestudies](https://gingerlive.io/casestudies/)
- Contact: [info@gingerlive.io](mailto:info@gingerlive.io)

## License

[MIT](LICENSE) © Gingerlive Bilişim Teknolojileri A.Ş.
