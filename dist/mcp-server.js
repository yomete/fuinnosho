#!/usr/bin/env node
// All logging goes to stderr. Nothing may ever write to stdout except the
// transport — stdout carries the JSON-RPC stream.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { createMcpSupabaseClient } from "./src/lib/mcp/supabase.js";
import { createToolHandlers, MCP_SERVER_VERSION, runTool, TOOL_DEFINITIONS, } from "./src/lib/mcp/tools.js";
// Tools that mutate data. These need a resolved user_id; reads do not.
const WRITE_TOOLS = new Set([
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
    constructor() {
        this.supabase = null;
        this.handlers = null;
        this.userId = "";
        this.server = new Server({
            name: "fuinnosho-film-inventory",
            version: MCP_SERVER_VERSION,
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
    }
    init() {
        let supabase = null;
        let userId = "";
        try {
            const client = createMcpSupabaseClient();
            supabase = client.supabase;
            userId = client.userId;
            console.error("🔑 Supabase client initialized");
        }
        catch {
            console.warn("⚠️  Missing Supabase environment variables - running in TEST MODE");
        }
        this.supabase = supabase;
        this.userId = userId;
        this.handlers = createToolHandlers(supabase, userId);
    }
    async fetchDefaultUserId(supabase) {
        const { data, error } = await supabase
            .from("trips")
            .select("user_id")
            .limit(1)
            .single();
        if (error) {
            throw new Error(`Could not fetch default user_id: ${error.message}`);
        }
        if (!data?.user_id) {
            throw new Error("Could not fetch default user_id: no trips found");
        }
        return data.user_id;
    }
    // Without a user_id every read runs unscoped and every write is refused, so
    // resolve it before the first database tool call.
    async ensureUserId() {
        if (this.userId || !this.supabase) {
            return;
        }
        this.userId = await this.fetchDefaultUserId(this.supabase);
        this.handlers = createToolHandlers(this.supabase, this.userId);
        console.error("🔑 Resolved user_id on first tool call");
    }
    setupToolHandlers() {
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
                if (name !== "ping") {
                    await this.ensureUserId();
                }
                if (WRITE_TOOLS.has(name) && !this.userId) {
                    throw new Error(`Cannot run "${name}": no user_id is configured, so the write would ` +
                        `be rejected or written to the wrong account. Set MCP_USER_ID.`);
                }
                return await runTool(this.handlers, name, args);
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    isToolName(name) {
        return TOOL_DEFINITIONS.some((tool) => tool.name === name);
    }
    async run() {
        this.init();
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Film Inventory MCP server running on stdio");
    }
}
const server = new FilmInventoryMCPServer();
server.run().catch(console.error);
