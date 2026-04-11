#!/usr/bin/env node

// Import MCP Monitoring SDK
import * as MCPMonitoring from "@mcp-monitoring/sdk";

// Initialize MCP Monitoring
console.error(`🔧 MCP Monitoring Config:
  API Key: ${process.env.MCP_MONITORING_API_KEY ? "SET" : "NOT SET"}
  Endpoint: ${
    process.env.MCP_MONITORING_ENDPOINT || "http://localhost:8080/api/v1"
  }
  Server ID: fuinnosho-film-inventory-server`);

MCPMonitoring.init({
  apiKey: process.env.MCP_MONITORING_API_KEY || "",
  endpoint:
    process.env.MCP_MONITORING_ENDPOINT || "http://localhost:8080/api/v1",
  serverId: "fuinnosho-film-inventory-server",
  enableTracing: true,
  enableMetrics: true,
  enableAutoInstrumentation: true,
  metricsInterval: 10000,
});

function logMCPEvent(type: string, details: any) {
  console.error(
    `🔍 MCP Monitoring ${type}:`,
    JSON.stringify(details, null, 2)
  );
}

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

class FilmInventoryMCPServer {
  private server: Server;
  private handlers: ReturnType<typeof createToolHandlers>;

  constructor() {
    MCPMonitoring.info("MCP Server starting up", {
      server_name: "fuinnosho-film-inventory",
      version: "1.0.0",
    });

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

    let supabase: any = null;
    let userId = "";

    try {
      const client = createMcpSupabaseClient();
      supabase = client.supabase;
      userId = client.userId;
      console.error(
        supabase
          ? "🔑 Supabase client initialized"
          : "⚠️  Running in test mode"
      );
    } catch (error) {
      console.warn(
        "⚠️  Missing Supabase environment variables - running in TEST MODE"
      );
      MCPMonitoring.warning("MCP Server starting in test mode", {
        reason: "Missing Supabase credentials",
        mode: "test",
      });
    }

    // If no user ID was configured, try to fetch from DB
    if (supabase && !userId) {
      this.fetchDefaultUserId(supabase).then((id) => {
        if (id) {
          userId = id;
          // Rebuild handlers with the resolved user ID
          this.handlers = createToolHandlers(supabase, userId);
        }
      });
    }

    this.handlers = createToolHandlers(supabase, userId);
    this.setupToolHandlers();
  }

  private async fetchDefaultUserId(supabase: any): Promise<string | null> {
    try {
      const { data } = await supabase
        .from("trips")
        .select("user_id")
        .limit(1)
        .single();

      if (data?.user_id) {
        console.error(`📋 Found default user_id from trips: ${data.user_id}`);
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
        console.error(`🛠️  Executing tool: ${name} with monitoring`);

        logMCPEvent("Tool Start", { tool_name: name, arguments: args });
        MCPMonitoring.info(`Tool execution started: ${name}`, {
          tool_name: name,
          arguments: args,
        });

        if (!this.isToolName(name)) {
          throw new Error(`Unknown tool: ${name}`);
        }

        const handler = this.handlers[name];
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        const result = await MCPMonitoring.wrapToolExecution(
          name,
          async () => handler(args || {}),
          args
        );

        logMCPEvent("Tool Complete", { tool_name: name, success: true });
        MCPMonitoring.info(`Tool execution completed: ${name}`, {
          tool_name: name,
          success: true,
        });

        return result;
      } catch (error) {
        logMCPEvent("Error", {
          message: `Tool execution failed: ${name}`,
          tool: name,
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        MCPMonitoring.error(`Tool execution failed: ${name}`, {
          tool_name: name,
          error_message:
            error instanceof Error ? error.message : String(error),
          error_stack: error instanceof Error ? error.stack : undefined,
          arguments: args,
        });

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
    console.error("Starting MCP server...");
    const transport = new StdioServerTransport();
    console.error("Transport created, connecting...");
    await this.server.connect(transport);
    console.error("Film Inventory MCP server running on stdio");
    console.error("Server ready to accept requests");
  }
}

const server = new FilmInventoryMCPServer();
server.run().catch(console.error);
