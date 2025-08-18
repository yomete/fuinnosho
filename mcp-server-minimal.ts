#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

class MinimalMCPServer {
  private server: Server;
  private supabase: any;

  constructor() {
    console.error("Starting minimal MCP server...");
    
    this.server = new Server(
      {
        name: "fuinnosho-minimal",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.error("Supabase client created");

    this.setupHandlers();
  }

  private setupHandlers() {
    // Simple tools list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("Handling ListTools request");
      return {
        tools: [
          {
            name: "test_connection",
            description: "Test MCP server connection",
            inputSchema: {
              type: "object",
              properties: {}
            },
          },
          {
            name: "get_film_count",
            description: "Get basic film count",
            inputSchema: {
              type: "object",
              properties: {}
            },
          }
        ]
      };
    });

    // Simple tool handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error(`Handling tool request: ${request.params.name}`);
      
      const { name } = request.params;

      try {
        switch (name) {
          case "test_connection":
            return {
              content: [
                {
                  type: "text",
                  text: "✅ MCP server connection successful!"
                }
              ]
            };

          case "get_film_count":
            const { data: films, error } = await this.supabase
              .from("films")
              .select("count(*)")
              .single();

            if (error) {
              throw new Error(`Database error: ${error.message}`);
            }

            return {
              content: [
                {
                  type: "text",
                  text: `Film count: ${films?.count || 0}`
                }
              ]
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Tool error: ${error}`);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  async run() {
    console.error("Starting server transport...");
    const transport = new StdioServerTransport();
    console.error("Connecting server...");
    await this.server.connect(transport);
    console.error("Minimal MCP server ready!");
  }
}

const server = new MinimalMCPServer();
server.run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});