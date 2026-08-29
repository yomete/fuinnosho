#!/usr/bin/env node

// All logging goes to stderr. Nothing may ever write to stdout except the
// transport — stdout carries the JSON-RPC stream.

import type { SupabaseClient } from "@supabase/supabase-js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { createMcpSupabaseClient } from "./src/lib/mcp/supabase.js";
import {
  createToolHandlers,
  TOOL_DEFINITIONS,
} from "./src/lib/mcp/tools.js";
import type { ToolName } from "./src/lib/mcp/tool-types.js";

// Tools that mutate data. These need a resolved user_id; reads do not.
const WRITE_TOOLS = new Set<ToolName>([
  "update_film_quantity",
  "spool_bulk_film",
  "create_film",
  "edit_film",
  "delete_film",
  "create_trip",
  "edit_trip",
  "delete_trip",
  "reserve_film_for_trip",
  "remove_film_reservation",
  "update_film_reservation_quantity",
  "create_gear",
  "edit_gear",
  "delete_gear",
  "reserve_gear_for_trip",
  "remove_gear_reservation",
  "load_film",
  "unload_film",
]);

class FilmInventoryMCPServer {
  private server: Server;
  private handlers: ReturnType<typeof createToolHandlers> | null = null;
  private userId = "";

  constructor() {
    this.server = new Server(
      {
        name: "fuinnosho-film-inventory",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  // Runs to completion before the transport connects, so handlers are always
  // built with a fully resolved user_id — no request can arrive mid-resolution.
  private async init() {
    let supabase: SupabaseClient | null = null;
    let userId = "";

    try {
      const client = createMcpSupabaseClient();
      supabase = client.supabase;
      userId = client.userId;
      console.error("🔑 Supabase client initialized");
    } catch {
      console.warn(
        "⚠️  Missing Supabase environment variables - running in TEST MODE"
      );
    }

    if (supabase && !userId) {
      userId = (await this.fetchDefaultUserId(supabase)) || "";
    }

    if (supabase && !userId) {
      console.warn(
        "⚠️  No user_id resolved - write tools will be rejected. Set MCP_USER_ID."
      );
    }

    this.userId = userId;
    this.handlers = createToolHandlers(supabase as SupabaseClient, userId);
  }

  private async fetchDefaultUserId(
    supabase: SupabaseClient
  ): Promise<string | null> {
    try {
      const { data } = await supabase
        .from("trips")
        .select("user_id")
        .limit(1)
        .single();

      if (data?.user_id) {
        return data.user_id;
      }
    } catch (error) {
      console.error("Could not fetch default user_id:", error);
    }
    return null;
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!this.isToolName(name)) {
          throw new Error(`Unknown tool: ${name}`);
        }

        if (!this.handlers) {
          throw new Error("Server is not initialized yet");
        }

        if (WRITE_TOOLS.has(name) && !this.userId) {
          throw new Error(
            `Cannot run "${name}": no user_id is configured, so the write would ` +
              `be rejected or written to the wrong account. Set MCP_USER_ID.`
          );
        }

        const handler = this.handlers[name];
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        return await handler(args || {});
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    });
  }

  private isToolName(name: string): name is ToolName {
    return TOOL_DEFINITIONS.some((tool) => tool.name === name);
  }

  async run() {
    await this.init();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Film Inventory MCP server running on stdio");
  }
}

const server = new FilmInventoryMCPServer();
server.run().catch(console.error);
