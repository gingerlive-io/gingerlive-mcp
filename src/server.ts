/**
 * Tool, resource and prompt registration shared by both entry points:
 * the Cloudflare Worker (src/index.ts) and the local stdio server (src/stdio.ts).
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import data from "./data/agent-data.json";

export const SERVER_VERSION = "0.2.2";

/** Wrap a JSON-serializable value in the MCP text-result envelope. */
const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

export function registerGingerLive(server: McpServer) {
  const company = data.company;

  server.registerTool(
    "get_company_overview",
    {
      title: "Company overview",
      description:
        "Returns GingerLive's company profile: what the livestream advertising platform does, supported streaming platforms (Twitch, Kick, YouTube Live, TikTok LIVE), headline network stats, third-party measurement partners and contact links. Use first for general \"what is GingerLive\" questions; use get_network_stats for just the reach numbers, list_ad_formats for formats, get_streamer_program_info for the creator side. Read-only; data is a static snapshot of gingerlive.io's public facts.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {},
    },
    async () =>
      json({
        name: company.name,
        summary: company.summary,
        platforms: company.platforms,
        networkStats: data.networkStats,
        measurement: data.measurement,
        contactEmail: company.contactEmail,
        links: company.links,
      }),
  );

  server.registerTool(
    "get_network_stats",
    {
      title: "Network stats",
      description:
        "Returns GingerLive's network reach and performance figures: streamer count, annual unique reach, monthly hours of livestreams watched and ad view-through rate. Use when a user asks about scale or performance benchmarks; use list_case_studies for campaign-specific results. Read-only; figures are GingerLive's published network numbers.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {},
    },
    async () => json(data.networkStats),
  );

  server.registerTool(
    "list_ad_formats",
    {
      title: "Ad formats",
      description:
        "Lists the livestream ad formats GingerLive sells to brands (e.g. picture-in-picture, banners, rich media, pinned chat drops, streamer announcements), each with a short description, plus format badges such as unskippable and adblock-safe. Use when planning or comparing ad formats; use get_company_overview for the company itself. Read-only.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {},
    },
    async () => json({ formats: data.adFormats, badges: data.adFormatBadges }),
  );

  server.registerTool(
    "list_case_studies",
    {
      title: "List case studies",
      description:
        "Lists GingerLive campaign case studies with slug, title, short excerpt and URL. Use to find proof points or results for a brand, category or format, then call get_case_study with a slug for the full write-up. Read-only.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {},
    },
    async () =>
      json(
        data.caseStudies.map((s) => ({
          slug: s.slug,
          title: s.title,
          url: s.url,
          date: s.date,
          excerpt: s.excerpt,
        })),
      ),
  );

  server.registerTool(
    "get_case_study",
    {
      title: "Get a case study",
      description:
        "Returns one GingerLive campaign case study: title, date, URL and the full markdown write-up (brand, approach and results). Requires a slug from list_case_studies; an unknown slug returns the list of valid slugs. Read-only.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        slug: z
          .string()
          .describe("Case-study slug, e.g. 'turknet-x-gingerlive-case-study-gen-z-livestream-advertising-campaign'"),
      },
    },
    async ({ slug }) => {
      const study = data.caseStudies.find((s) => s.slug === slug);
      if (!study) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No case study with slug "${slug}". Available slugs: ${data.caseStudies
                .map((s) => s.slug)
                .join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return json({
        slug: study.slug,
        title: study.title,
        url: study.url,
        date: study.date,
        body: study.bodyMarkdown,
      });
    },
  );

  server.registerTool(
    "get_streamer_program_info",
    {
      title: "Streamer program",
      description:
        "Returns how livestreamers join and earn with GingerLive: cost (free for streamers), how the in-stream ad program works, supported platforms and the sign-up link. Use for creator or streamer monetization questions; for brand-side questions use get_company_overview or list_ad_formats instead. Read-only; public program information.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {},
    },
    async () => json(data.streamerProgram),
  );

  // --- Resources (grounding) ---
  server.resource("company", "gingerlive://company", (uri) => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data.company, null, 2) }],
  }));

  server.resource("guides", "gingerlive://guides", (uri) => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data.resourceGuides, null, 2) }],
  }));

  // The canonical llms.txt is served by the origin; expose it live so agents can
  // ground on the single source of truth. Falls back gracefully if unreachable.
  server.resource("llms-txt", "https://gingerlive.io/llms.txt", async (uri) => {
    try {
      const res = await fetch("https://gingerlive.io/llms.txt");
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text: await res.text() }] };
    } catch {
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text: "llms.txt is temporarily unavailable." }] };
    }
  });

  // --- Prompts (starting-point templates for clients) ---
  server.registerPrompt(
    "plan_livestream_campaign",
    {
      title: "Plan a livestream ad campaign",
      description:
        "Guide the assistant to scope a GingerLive livestream advertising campaign for a brand, using this server's tools.",
      argsSchema: {
        goal: z.string().optional().describe("Campaign goal, e.g. 'reach Gen Z gamers in Turkey'"),
        budget: z.string().optional().describe("Approximate budget or range (optional)"),
      },
    },
    async ({ goal, budget }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              "Help me plan a livestream advertising campaign with GingerLive." +
              (goal ? ` Goal: ${goal}.` : "") +
              (budget ? ` Budget: ${budget}.` : "") +
              " Use the GingerLive tools: get_company_overview and get_network_stats for reach and" +
              " measurement context, list_ad_formats for the format options, and list_case_studies" +
              " (then get_case_study) for comparable results. Then recommend a format mix and next" +
              " steps, and note that a brief can be started at https://gingerlive.io/brands/#contact.",
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "get_started_as_streamer",
    {
      title: "Get started as a GingerLive streamer",
      description:
        "Guide the assistant to help a livestreamer evaluate and join GingerLive's monetization program.",
      argsSchema: {
        platform: z.string().optional().describe("Streaming platform, e.g. Twitch, Kick, YouTube, TikTok"),
      },
    },
    async ({ platform }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              "Help me understand how to monetize my livestreams with GingerLive" +
              (platform ? ` on ${platform}` : "") +
              ". Call get_streamer_program_info for how it works, eligibility and cost, then" +
              " summarize the steps and share the sign-up link.",
          },
        },
      ],
    }),
  );
}
