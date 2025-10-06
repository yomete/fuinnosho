#!/usr/bin/env node
// Import MCP Monitoring SDK
import * as MCPMonitoring from "@mcp-monitoring/sdk";
// Initialize MCP Monitoring
console.error(`🔧 MCP Monitoring Config:
  API Key: ${process.env.MCP_MONITORING_API_KEY ? "SET" : "NOT SET"}
  Endpoint: ${process.env.MCP_MONITORING_ENDPOINT || "http://localhost:8080/api/v1"}
  Server ID: fuinnosho-film-inventory-server`);
MCPMonitoring.init({
    apiKey: process.env.MCP_MONITORING_API_KEY ||
        "mcp_72a8f9177ddf0bab9d3001e49e20294ea05b1959b076edff4455fc8d34db50c3",
    endpoint: process.env.MCP_MONITORING_ENDPOINT || "http://localhost:8080/api/v1",
    serverId: "fuinnosho-film-inventory-server",
    // Enhanced observability features
    enableTracing: true,
    enableMetrics: true,
    enableAutoInstrumentation: true,
    metricsInterval: 10000, // Collect system metrics every 10 seconds
});
// Helper function to log monitoring events
function logMCPEvent(type, details) {
    console.error(`🔍 MCP Monitoring ${type}:`, JSON.stringify(details, null, 2));
}
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
class FilmInventoryMCPServer {
    constructor() {
        // Log server startup
        MCPMonitoring.info("MCP Server starting up", {
            server_name: "fuinnosho-film-inventory",
            version: "1.0.0",
        });
        const server = new Server({
            name: "fuinnosho-film-inventory",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        // Use server directly (monitoring will be added at tool level)
        this.server = server;
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            console.warn("⚠️  Missing Supabase environment variables - running in TEST MODE");
            MCPMonitoring.warning("MCP Server starting in test mode", {
                reason: "Missing Supabase credentials",
                mode: "test",
            });
            this.supabase = null; // Test mode
        }
        else {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        }
        // Set user ID for filtering (for now using the known user ID)
        this.userId = "335461ec-7719-4c39-b023-c600e11d308c";
        this.setupToolHandlers();
    }
    async authenticateSession() {
        console.error("Starting authentication process...");
        MCPMonitoring.info("Authentication process starting");
        try {
            // Option 1: Use service role key if available (bypasses RLS)
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
                console.error("Using service role authentication");
                // Create service role client without making any network calls yet
                this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                        detectSessionInUrl: false,
                    },
                });
                console.error("Service role client created successfully");
                return;
            }
            // Option 2: Use user credentials if available
            const userEmail = process.env.MCP_USER_EMAIL;
            const userPassword = process.env.MCP_USER_PASSWORD;
            if (userEmail && userPassword) {
                console.error("Authenticating with user credentials");
                // Only try to authenticate if we absolutely need to
                setTimeout(async () => {
                    try {
                        const { error } = await this.supabase.auth.signInWithPassword({
                            email: userEmail,
                            password: userPassword,
                        });
                        if (error) {
                            console.error("Authentication failed:", error.message);
                        }
                        else {
                            console.error("Successfully authenticated user session");
                        }
                    }
                    catch (authError) {
                        console.error("Authentication error during deferred login:", authError);
                    }
                }, 1000); // Defer authentication by 1 second
                return;
            }
            console.error("No authentication credentials provided - using anonymous access");
        }
        catch (error) {
            console.error("Authentication error:", error);
            logMCPEvent("Error", {
                message: "Authentication failed",
                error: error instanceof Error ? error.message : String(error),
            });
            MCPMonitoring.error("Authentication failed", {
                error_message: error instanceof Error ? error.message : String(error),
                error_stack: error instanceof Error ? error.stack : undefined,
            });
        }
        console.error("Authentication process completed");
        MCPMonitoring.info("Authentication process completed successfully");
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "get_film_inventory",
                    description: "Get complete film inventory with current stock levels",
                    inputSchema: {
                        type: "object",
                        properties: {
                            include_availability: {
                                type: "boolean",
                                description: "Include availability data for trip planning",
                                default: false,
                            },
                        },
                    },
                },
                {
                    name: "filter_films",
                    description: "Filter films by type, ISO range, format, or other criteria",
                    inputSchema: {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                description: "Film type (color, bw, cinema)",
                            },
                            iso_min: {
                                type: "number",
                                description: "Minimum ISO value",
                            },
                            iso_max: {
                                type: "number",
                                description: "Maximum ISO value",
                            },
                            format: {
                                type: "string",
                                description: "Film format (35mm, 120, 4x5)",
                            },
                            brand: {
                                type: "string",
                                description: "Film brand",
                            },
                            in_stock_only: {
                                type: "boolean",
                                description: "Only show films with count > 0",
                                default: false,
                            },
                        },
                    },
                },
                {
                    name: "update_film_quantity",
                    description: "Update film quantity when using rolls (reduces count and logs usage)",
                    inputSchema: {
                        type: "object",
                        properties: {
                            film_id: {
                                type: "string",
                                description: "Film ID to update",
                            },
                            quantity: {
                                type: "number",
                                description: "Number of rolls used (positive number)",
                            },
                            usage_note: {
                                type: "string",
                                description: "Note about film usage",
                            },
                        },
                    },
                },
                {
                    name: "spool_bulk_film",
                    description: "Spool bulk film into cassettes (for bulk films only)",
                    inputSchema: {
                        type: "object",
                        properties: {
                            film_id: {
                                type: "string",
                                description: "Bulk film ID to spool from",
                            },
                            exposures_to_spool: {
                                type: "number",
                                description: "Number of exposures from bulk film to use for spooling",
                            },
                            cassettes_created: {
                                type: "number",
                                description: "Number of cassettes created from the bulk film",
                            },
                            spool_note: {
                                type: "string",
                                description: "Note about the spooling process",
                            },
                        },
                        required: [
                            "film_id",
                            "exposures_to_spool",
                            "cassettes_created",
                            "spool_note",
                        ],
                    },
                },
                {
                    name: "check_low_stock",
                    description: "Check for films with low stock (configurable threshold)",
                    inputSchema: {
                        type: "object",
                        properties: {
                            threshold: {
                                type: "number",
                                description: "Stock level considered low",
                                default: 3,
                            },
                            include_out_of_stock: {
                                type: "boolean",
                                description: "Include films with 0 count",
                                default: true,
                            },
                        },
                    },
                },
                {
                    name: "get_film_usage_history",
                    description: "Get usage history for a specific film",
                    inputSchema: {
                        type: "object",
                        properties: {
                            film_id: {
                                type: "string",
                                description: "Film ID to get usage history for",
                            },
                        },
                        required: ["film_id"],
                    },
                },
                {
                    name: "get_film_stats",
                    description: "Get aggregate statistics about film inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            group_by: {
                                type: "string",
                                enum: ["type", "brand", "format", "iso"],
                                description: "How to group the statistics",
                                default: "type",
                            },
                        },
                    },
                },
                {
                    name: "create_film",
                    description: "Add a new film to the inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Film name",
                            },
                            brand: {
                                type: "string",
                                description: "Film brand",
                            },
                            iso: {
                                type: "number",
                                description: "ISO speed",
                            },
                            format: {
                                type: "string",
                                description: "Film format (35mm, 120, 4x5, etc.)",
                            },
                            type: {
                                type: "string",
                                description: "Film type (Color Negative, Black & White, etc.)",
                            },
                            expiration_date: {
                                type: "string",
                                description: "Expiration date (YYYY-MM-DD format)",
                            },
                            count: {
                                type: "number",
                                description: "Number of rolls",
                                default: 1,
                            },
                            price: {
                                type: "number",
                                description: "Price per roll",
                            },
                            notes: {
                                type: "string",
                                description: "Additional notes",
                                default: "",
                            },
                            editing_notes: {
                                type: "string",
                                description: "Editing tips and notes for this film stock",
                                default: "",
                            },
                            is_ecn: {
                                type: "boolean",
                                description: "Whether this is an ECN (Eastman Color Negative) motion picture film",
                                default: false,
                            },
                            is_bulk_film: {
                                type: "boolean",
                                description: "Whether this is bulk film",
                                default: false,
                            },
                            bulk_length_meters: {
                                type: "number",
                                description: "Length in meters for bulk film",
                            },
                        },
                        required: [
                            "name",
                            "brand",
                            "iso",
                            "format",
                            "type",
                            "expiration_date",
                        ],
                    },
                },
                {
                    name: "edit_film",
                    description: "Edit an existing film's details",
                    inputSchema: {
                        type: "object",
                        properties: {
                            film_id: {
                                type: "string",
                                description: "Film ID to edit",
                            },
                            name: {
                                type: "string",
                                description: "Film name",
                            },
                            brand: {
                                type: "string",
                                description: "Film brand",
                            },
                            iso: {
                                type: "number",
                                description: "ISO speed",
                            },
                            format: {
                                type: "string",
                                description: "Film format (35mm, 120, 4x5, etc.)",
                            },
                            type: {
                                type: "string",
                                description: "Film type (Color Negative, Black & White, etc.)",
                            },
                            expiration_date: {
                                type: "string",
                                description: "Expiration date (YYYY-MM-DD format)",
                            },
                            count: {
                                type: "number",
                                description: "Number of rolls",
                            },
                            price: {
                                type: "number",
                                description: "Price per roll",
                            },
                            notes: {
                                type: "string",
                                description: "Additional notes",
                            },
                            editing_notes: {
                                type: "string",
                                description: "Editing tips and notes for this film stock",
                            },
                            is_ecn: {
                                type: "boolean",
                                description: "Whether this is an ECN (Eastman Color Negative) motion picture film",
                            },
                            is_bulk_film: {
                                type: "boolean",
                                description: "Whether this is bulk film",
                            },
                            bulk_length_meters: {
                                type: "number",
                                description: "Length in meters for bulk film",
                            },
                        },
                        required: ["film_id"],
                    },
                },
                {
                    name: "delete_film",
                    description: "Delete a film from the inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            film_id: {
                                type: "string",
                                description: "Film ID to delete",
                            },
                        },
                        required: ["film_id"],
                    },
                },
                {
                    name: "create_trip",
                    description: "Create a new photo trip with duration support",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "Trip title",
                            },
                            description: {
                                type: "string",
                                description: "Trip description",
                                default: "",
                            },
                            start_date: {
                                type: "string",
                                description: "Trip start date (YYYY-MM-DD format)",
                            },
                            end_date: {
                                type: "string",
                                description: "Trip end date (YYYY-MM-DD format)",
                            },
                        },
                        required: ["title", "start_date", "end_date"],
                    },
                },
                {
                    name: "list_trips",
                    description: "List all trips with optional filtering",
                    inputSchema: {
                        type: "object",
                        properties: {
                            include_past: {
                                type: "boolean",
                                description: "Include past trips",
                                default: true,
                            },
                            include_films: {
                                type: "boolean",
                                description: "Include reserved films for each trip",
                                default: false,
                            },
                        },
                    },
                },
                {
                    name: "get_trip_details",
                    description: "Get detailed information about a specific trip",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID",
                            },
                        },
                        required: ["trip_id"],
                    },
                },
                {
                    name: "edit_trip",
                    description: "Edit an existing trip's details with duration support",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID to edit",
                            },
                            title: {
                                type: "string",
                                description: "Trip title",
                            },
                            description: {
                                type: "string",
                                description: "Trip description",
                            },
                            start_date: {
                                type: "string",
                                description: "Trip start date (YYYY-MM-DD format)",
                            },
                            end_date: {
                                type: "string",
                                description: "Trip end date (YYYY-MM-DD format)",
                            },
                            status: {
                                type: "string",
                                description: "Trip status (upcoming, ongoing, past, completed)",
                                enum: ["upcoming", "ongoing", "past", "completed"],
                            },
                        },
                        required: ["trip_id"],
                    },
                },
                {
                    name: "delete_trip",
                    description: "Delete a trip and all its film reservations",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID to delete",
                            },
                        },
                        required: ["trip_id"],
                    },
                },
                {
                    name: "reserve_film_for_trip",
                    description: "Reserve films for a specific trip",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID",
                            },
                            film_id: {
                                type: "string",
                                description: "Film ID to reserve",
                            },
                            quantity: {
                                type: "number",
                                description: "Number of rolls to reserve",
                            },
                        },
                        required: ["trip_id", "film_id", "quantity"],
                    },
                },
                {
                    name: "remove_film_reservation",
                    description: "Remove film reservation from a trip",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID",
                            },
                            film_id: {
                                type: "string",
                                description: "Film ID to unreserve",
                            },
                        },
                        required: ["trip_id", "film_id"],
                    },
                },
                {
                    name: "update_film_reservation_quantity",
                    description: "Update the quantity of a film reservation for a trip",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID",
                            },
                            film_id: {
                                type: "string",
                                description: "Film ID",
                            },
                            quantity: {
                                type: "number",
                                description: "New quantity of rolls to reserve (must be >= 1)",
                            },
                        },
                        required: ["trip_id", "film_id", "quantity"],
                    },
                },
                {
                    name: "get_films_with_availability",
                    description: "Get films with availability data for trip planning",
                    inputSchema: {
                        type: "object",
                        properties: {
                            available_only: {
                                type: "boolean",
                                description: "Only show films with available stock",
                                default: false,
                            },
                            min_available: {
                                type: "number",
                                description: "Minimum available quantity required",
                                default: 1,
                            },
                        },
                    },
                },
                {
                    name: "create_gear",
                    description: "Add new gear/equipment to inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Gear name/title",
                            },
                            brand: {
                                type: "string",
                                description: "Gear brand/manufacturer",
                            },
                            type: {
                                type: "string",
                                description: "Gear type (camera, lens, flash, accessory, tripod, filter, bag)",
                                enum: [
                                    "camera",
                                    "lens",
                                    "flash",
                                    "accessory",
                                    "tripod",
                                    "filter",
                                    "bag",
                                ],
                            },
                            model: {
                                type: "string",
                                description: "Model number or name",
                            },
                            serial_number: {
                                type: "string",
                                description: "Serial number",
                            },
                            purchase_date: {
                                type: "string",
                                description: "Purchase date (YYYY-MM-DD format)",
                            },
                            purchase_price: {
                                type: "number",
                                description: "Purchase price",
                            },
                            condition: {
                                type: "string",
                                description: "Current condition",
                                enum: ["excellent", "good", "fair", "poor"],
                                default: "good",
                            },
                            notes: {
                                type: "string",
                                description: "Additional notes",
                                default: "",
                            },
                        },
                        required: ["name", "brand", "type", "condition"],
                    },
                },
                {
                    name: "list_gear",
                    description: "Get all gear/equipment with optional filtering",
                    inputSchema: {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                description: "Filter by gear type",
                                enum: [
                                    "camera",
                                    "lens",
                                    "flash",
                                    "accessory",
                                    "tripod",
                                    "filter",
                                    "bag",
                                ],
                            },
                            brand: {
                                type: "string",
                                description: "Filter by brand",
                            },
                            condition: {
                                type: "string",
                                description: "Filter by condition",
                                enum: ["excellent", "good", "fair", "poor"],
                            },
                            include_trip_reservations: {
                                type: "boolean",
                                description: "Include gear reserved for upcoming trips",
                                default: false,
                            },
                        },
                    },
                },
                {
                    name: "edit_gear",
                    description: "Edit existing gear details",
                    inputSchema: {
                        type: "object",
                        properties: {
                            gear_id: {
                                type: "string",
                                description: "Gear ID to edit",
                            },
                            name: {
                                type: "string",
                                description: "Gear name/title",
                            },
                            brand: {
                                type: "string",
                                description: "Gear brand/manufacturer",
                            },
                            type: {
                                type: "string",
                                description: "Gear type",
                                enum: [
                                    "camera",
                                    "lens",
                                    "flash",
                                    "accessory",
                                    "tripod",
                                    "filter",
                                    "bag",
                                ],
                            },
                            model: {
                                type: "string",
                                description: "Model number or name",
                            },
                            serial_number: {
                                type: "string",
                                description: "Serial number",
                            },
                            purchase_date: {
                                type: "string",
                                description: "Purchase date (YYYY-MM-DD format)",
                            },
                            purchase_price: {
                                type: "number",
                                description: "Purchase price",
                            },
                            condition: {
                                type: "string",
                                description: "Current condition",
                                enum: ["excellent", "good", "fair", "poor"],
                            },
                            notes: {
                                type: "string",
                                description: "Additional notes",
                            },
                        },
                        required: ["gear_id"],
                    },
                },
                {
                    name: "delete_gear",
                    description: "Delete gear from inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            gear_id: {
                                type: "string",
                                description: "Gear ID to delete",
                            },
                        },
                        required: ["gear_id"],
                    },
                },
                {
                    name: "get_gear_stats",
                    description: "Get gear statistics and summary",
                    inputSchema: {
                        type: "object",
                        properties: {
                            group_by: {
                                type: "string",
                                enum: ["type", "brand", "condition"],
                                description: "How to group the statistics",
                                default: "type",
                            },
                        },
                    },
                },
                {
                    name: "reserve_gear_for_trip",
                    description: "Reserve gear for a specific trip",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID",
                            },
                            gear_id: {
                                type: "string",
                                description: "Gear ID to reserve",
                            },
                        },
                        required: ["trip_id", "gear_id"],
                    },
                },
                {
                    name: "remove_gear_reservation",
                    description: "Remove gear reservation from a trip",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trip_id: {
                                type: "string",
                                description: "Trip ID",
                            },
                            gear_id: {
                                type: "string",
                                description: "Gear ID to unreserve",
                            },
                        },
                        required: ["trip_id", "gear_id"],
                    },
                },
                {
                    name: "get_usage_analytics",
                    description: "Get comprehensive film usage analytics including costs and patterns",
                    inputSchema: {
                        type: "object",
                        properties: {
                            period: {
                                type: "string",
                                description: "Time period for analysis (weekly, monthly, all)",
                                default: "monthly",
                            },
                            include_costs: {
                                type: "boolean",
                                description: "Include cost breakdown analysis",
                                default: true,
                            },
                        },
                    },
                },
                {
                    name: "get_film_usage_by_type",
                    description: "Get film usage statistics broken down by development type (C41, B&W, ECN)",
                    inputSchema: {
                        type: "object",
                        properties: {
                            start_date: {
                                type: "string",
                                description: "Start date for analysis (YYYY-MM-DD format)",
                            },
                            end_date: {
                                type: "string",
                                description: "End date for analysis (YYYY-MM-DD format)",
                            },
                        },
                    },
                },
                {
                    name: "calculate_monthly_costs",
                    description: "Calculate monthly film and development costs with detailed breakdown",
                    inputSchema: {
                        type: "object",
                        properties: {
                            month: {
                                type: "string",
                                description: "Month to analyze (YYYY-MM format), defaults to current month",
                            },
                        },
                    },
                },
                {
                    name: "get_shooting_patterns",
                    description: "Analyze shooting patterns including day of week preferences and frequency",
                    inputSchema: {
                        type: "object",
                        properties: {
                            weeks_back: {
                                type: "number",
                                description: "Number of weeks to analyze (default: 12)",
                                default: 12,
                            },
                        },
                    },
                },
                {
                    name: "get_challenges",
                    description: "Get all challenges for the user",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "get_challenge",
                    description: "Get a specific challenge by ID",
                    inputSchema: {
                        type: "object",
                        properties: {
                            challenge_id: {
                                type: "string",
                                description: "Challenge ID",
                            },
                        },
                        required: ["challenge_id"],
                    },
                },
                {
                    name: "create_challenge",
                    description: "Create a new photography challenge",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Challenge name",
                            },
                            description: {
                                type: "string",
                                description: "Challenge description",
                            },
                            start_date: {
                                type: "string",
                                description: "Start date (YYYY-MM-DD)",
                            },
                            end_date: {
                                type: "string",
                                description: "End date (YYYY-MM-DD)",
                            },
                            total_days: {
                                type: "number",
                                description: "Total number of days in the challenge",
                            },
                        },
                        required: ["name", "start_date", "end_date", "total_days"],
                    },
                },
                {
                    name: "get_challenge_prompts",
                    description: "Get daily prompts for a challenge",
                    inputSchema: {
                        type: "object",
                        properties: {
                            challenge_id: {
                                type: "string",
                                description: "Challenge ID",
                            },
                        },
                        required: ["challenge_id"],
                    },
                },
                {
                    name: "get_challenge_progress",
                    description: "Get progress for a specific challenge",
                    inputSchema: {
                        type: "object",
                        properties: {
                            challenge_id: {
                                type: "string",
                                description: "Challenge ID",
                            },
                        },
                        required: ["challenge_id"],
                    },
                },
                {
                    name: "update_challenge_progress",
                    description: "Update progress for a challenge prompt",
                    inputSchema: {
                        type: "object",
                        properties: {
                            prompt_id: {
                                type: "string",
                                description: "Challenge prompt ID",
                            },
                            completed: {
                                type: "boolean",
                                description: "Whether the prompt is completed",
                            },
                            notes: {
                                type: "string",
                                description: "Progress notes",
                            },
                            photos_taken: {
                                type: "number",
                                description: "Number of photos taken",
                            },
                            film_used_id: {
                                type: "string",
                                description: "ID of film used",
                            },
                            frames_used: {
                                type: "number",
                                description: "Number of frames used",
                            },
                            reflection: {
                                type: "string",
                                description: "Reflection on the prompt",
                            },
                        },
                        required: ["prompt_id"],
                    },
                },
                {
                    name: "get_challenge_film_rolls",
                    description: "Get film rolls associated with a challenge",
                    inputSchema: {
                        type: "object",
                        properties: {
                            challenge_id: {
                                type: "string",
                                description: "Challenge ID",
                            },
                        },
                        required: ["challenge_id"],
                    },
                },
                {
                    name: "get_todays_prompt",
                    description: "Get today's prompt for a challenge",
                    inputSchema: {
                        type: "object",
                        properties: {
                            challenge_id: {
                                type: "string",
                                description: "Challenge ID",
                            },
                        },
                        required: ["challenge_id"],
                    },
                },
                {
                    name: "get_challenge_prompt",
                    description: "Get a specific challenge prompt by ID",
                    inputSchema: {
                        type: "object",
                        properties: {
                            prompt_id: {
                                type: "string",
                                description: "Challenge prompt ID",
                            },
                        },
                        required: ["prompt_id"],
                    },
                },
                {
                    name: "update_challenge_prompt",
                    description: "Update a challenge prompt's details",
                    inputSchema: {
                        type: "object",
                        properties: {
                            prompt_id: {
                                type: "string",
                                description: "Challenge prompt ID",
                            },
                            title: {
                                type: "string",
                                description: "Prompt title",
                            },
                            prompt_text: {
                                type: "string",
                                description: "The prompt description",
                            },
                            film_suggestion: {
                                type: "string",
                                description: "Suggested film stock",
                            },
                            location_context: {
                                type: "string",
                                description: "Location or setting context",
                            },
                            frame_range: {
                                type: "string",
                                description: "Suggested number of frames/shots",
                            },
                            special_notes: {
                                type: "string",
                                description: "Additional notes or tips",
                            },
                            phase: {
                                type: "string",
                                description: "Challenge phase or category",
                            },
                        },
                        required: ["prompt_id"],
                    },
                },
                {
                    name: "get_progress_for_prompt",
                    description: "Get progress data for a specific prompt",
                    inputSchema: {
                        type: "object",
                        properties: {
                            prompt_id: {
                                type: "string",
                                description: "Challenge prompt ID",
                            },
                        },
                        required: ["prompt_id"],
                    },
                },
                // Chemistry Inventory Tools
                {
                    name: "list_chemistry",
                    description: "List all chemistry inventory items or filter by process type",
                    inputSchema: {
                        type: "object",
                        properties: {
                            process_type: {
                                type: "string",
                                enum: ["black_white", "color"],
                                description: "Filter by process type (optional)",
                            },
                        },
                    },
                },
                {
                    name: "create_chemistry",
                    description: "Add new chemistry to inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Chemistry name (e.g., Rodinal, HC-110)" },
                            brand: { type: "string", description: "Brand name (optional)" },
                            chemistry_type: {
                                type: "string",
                                enum: ["developer", "stop_bath", "fixer", "bleach", "hypo_clear", "wetting_agent", "pre_wash", "other"],
                                description: "Type of chemistry",
                            },
                            process_type: {
                                type: "string",
                                enum: ["black_white", "color"],
                                description: "Black & white or color process",
                            },
                            volume_ml: { type: "number", description: "Current volume in ml" },
                            original_volume_ml: { type: "number", description: "Original bottle volume in ml" },
                            purchase_date: { type: "string", description: "Purchase date (YYYY-MM-DD) (optional)" },
                            expiry_date: { type: "string", description: "Expiry date (YYYY-MM-DD) (optional)" },
                            cost: { type: "number", description: "Cost in dollars (optional)" },
                            storage_location: { type: "string", description: "Where chemistry is stored (optional)" },
                            max_reuses: { type: "number", description: "Maximum number of times chemistry can be reused", default: 1 },
                            notes: { type: "string", description: "Additional notes (optional)" },
                        },
                        required: ["name", "chemistry_type", "process_type", "volume_ml", "original_volume_ml"],
                    },
                },
                {
                    name: "edit_chemistry",
                    description: "Update existing chemistry in inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Chemistry ID" },
                            name: { type: "string" },
                            brand: { type: "string" },
                            volume_ml: { type: "number" },
                            opened_date: { type: "string", description: "Date chemistry was opened (YYYY-MM-DD)" },
                            times_used: { type: "number" },
                            notes: { type: "string" },
                        },
                        required: ["id"],
                    },
                },
                {
                    name: "delete_chemistry",
                    description: "Delete chemistry from inventory",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Chemistry ID to delete" },
                        },
                        required: ["id"],
                    },
                },
                // Development Recipe Tools
                {
                    name: "list_recipes",
                    description: "List all saved development recipes",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "create_recipe",
                    description: "Create a new development recipe",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Recipe name" },
                            film_type: { type: "string", description: "Film type (e.g., HP5+) (optional)" },
                            developer_id: { type: "string", description: "ID of developer chemistry to use" },
                            dilution_ratio: { type: "string", description: "Dilution ratio (e.g., 1+50) (optional)" },
                            temperature_celsius: { type: "number", description: "Development temperature in Celsius (optional)" },
                            development_time_minutes: { type: "number", description: "Development time in minutes (optional)" },
                            agitation_pattern: { type: "string", description: "Agitation pattern description (optional)" },
                            notes: { type: "string", description: "Additional notes (optional)" },
                        },
                        required: ["name", "developer_id"],
                    },
                },
                {
                    name: "delete_recipe",
                    description: "Delete a development recipe",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "Recipe ID to delete" },
                        },
                        required: ["id"],
                    },
                },
                // Development Session Tools
                {
                    name: "list_development_sessions",
                    description: "List all development sessions",
                    inputSchema: {
                        type: "object",
                        properties: {
                            process_type: {
                                type: "string",
                                enum: ["black_white", "color"],
                                description: "Filter by process type (optional)",
                            },
                        },
                    },
                },
                {
                    name: "create_development_session",
                    description: "Create a new development session for films from completed trips",
                    inputSchema: {
                        type: "object",
                        properties: {
                            session_date: { type: "string", description: "Session date (YYYY-MM-DD)" },
                            process_type: {
                                type: "string",
                                enum: ["black_white", "color"],
                                description: "Process type",
                            },
                            temperature_celsius: { type: "number", description: "Development temperature (optional)" },
                            notes: { type: "string", description: "Session notes (optional)" },
                            film_ids: {
                                type: "array",
                                items: { type: "string" },
                                description: "Array of film IDs to develop",
                            },
                            film_quantities: {
                                type: "object",
                                description: "Map of film IDs to quantities (optional)",
                            },
                            chemistry_usage: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        chemistry_id: { type: "string" },
                                        volume_used_ml: { type: "number" },
                                        dilution_ratio: { type: "string" },
                                        development_time_minutes: { type: "number" },
                                        notes: { type: "string" },
                                    },
                                    required: ["chemistry_id", "volume_used_ml"],
                                },
                                description: "Array of chemistry usage records",
                            },
                        },
                        required: ["session_date", "process_type", "film_ids", "chemistry_usage"],
                    },
                },
                {
                    name: "get_films_from_completed_trips",
                    description: "Get films from completed trips that are ready for development",
                    inputSchema: {
                        type: "object",
                        properties: {
                            process_type: {
                                type: "string",
                                enum: ["black_white", "color"],
                                description: "Filter by process type (optional)",
                            },
                        },
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                console.error(`🛠️  Executing tool: ${name} with monitoring`);
                // Log tool execution start
                logMCPEvent('Tool Start', { tool_name: name, arguments: args });
                MCPMonitoring.info(`Tool execution started: ${name}`, { tool_name: name, arguments: args });
                // Use MCP Monitoring tool wrapper for automatic performance tracking
                const result = await MCPMonitoring.wrapToolExecution(name, async () => {
                    console.error(`📊 Inside tool wrapper for: ${name}`);
                    switch (name) {
                        case "get_film_inventory":
                            return await this.getFilmInventory(args);
                        case "filter_films":
                            return await this.filterFilms(args);
                        case "update_film_quantity":
                            return await this.updateFilmQuantity(args);
                        case "spool_bulk_film":
                            return await this.spoolBulkFilm(args);
                        case "check_low_stock":
                            return await this.checkLowStock(args);
                        case "get_film_usage_history":
                            return await this.getFilmUsageHistory(args);
                        case "get_film_stats":
                            return await this.getFilmStats(args);
                        case "create_film":
                            return await this.createFilm(args);
                        case "edit_film":
                            return await this.editFilm(args);
                        case "delete_film":
                            return await this.deleteFilm(args);
                        case "create_trip":
                            return await this.createTrip(args);
                        case "list_trips":
                            return await this.listTrips(args);
                        case "get_trip_details":
                            return await this.getTripDetails(args);
                        case "edit_trip":
                            return await this.editTrip(args);
                        case "delete_trip":
                            return await this.deleteTrip(args);
                        case "reserve_film_for_trip":
                            return await this.reserveFilmForTrip(args);
                        case "remove_film_reservation":
                            return await this.removeFilmReservation(args);
                        case "update_film_reservation_quantity":
                            return await this.updateFilmReservationQuantity(args);
                        case "get_films_with_availability":
                            return await this.getFilmsWithAvailability(args);
                        case "create_gear":
                            return await this.createGear(args);
                        case "list_gear":
                            return await this.listGear(args);
                        case "edit_gear":
                            return await this.editGear(args);
                        case "delete_gear":
                            return await this.deleteGear(args);
                        case "get_gear_stats":
                            return await this.getGearStats(args);
                        case "reserve_gear_for_trip":
                            return await this.reserveGearForTrip(args);
                        case "remove_gear_reservation":
                            return await this.removeGearReservation(args);
                        case "get_usage_analytics":
                            return await this.getUsageAnalytics(args);
                        case "get_film_usage_by_type":
                            return await this.getFilmUsageByType(args);
                        case "calculate_monthly_costs":
                            return await this.calculateMonthlyCosts(args);
                        case "get_shooting_patterns":
                            return await this.getShootingPatterns(args);
                        case "get_challenges":
                            return await this.getChallenges(args);
                        case "get_challenge":
                            return await this.getChallenge(args);
                        case "create_challenge":
                            return await this.createChallenge(args);
                        case "get_challenge_prompts":
                            return await this.getChallengePrompts(args);
                        case "get_challenge_progress":
                            return await this.getChallengeProgress(args);
                        case "update_challenge_progress":
                            return await this.updateChallengeProgress(args);
                        case "get_challenge_film_rolls":
                            return await this.getChallengeFilmRolls(args);
                        case "get_todays_prompt":
                            return await this.getTodaysPrompt(args);
                        case "get_challenge_prompt":
                            return await this.getChallengePrompt(args);
                        case "update_challenge_prompt":
                            return await this.updateChallengePrompt(args);
                        case "get_progress_for_prompt":
                            return await this.getProgressForPrompt(args);
                        // Chemistry Inventory Tools
                        case "list_chemistry":
                            return await this.listChemistry(args);
                        case "create_chemistry":
                            return await this.createChemistry(args);
                        case "edit_chemistry":
                            return await this.editChemistry(args);
                        case "delete_chemistry":
                            return await this.deleteChemistry(args);
                        // Development Recipe Tools
                        case "list_recipes":
                            return await this.listRecipes(args);
                        case "create_recipe":
                            return await this.createRecipe(args);
                        case "delete_recipe":
                            return await this.deleteRecipe(args);
                        // Development Session Tools
                        case "list_development_sessions":
                            return await this.listDevelopmentSessions(args);
                        case "create_development_session":
                            return await this.createDevelopmentSession(args);
                        case "get_films_from_completed_trips":
                            return await this.getFilmsFromCompletedTrips(args);
                        default:
                            throw new Error(`Unknown tool: ${name}`);
                    }
                }, args);
                // Log tool execution completion
                logMCPEvent('Tool Complete', { tool_name: name, success: true });
                MCPMonitoring.info(`Tool execution completed: ${name}`, { tool_name: name, success: true });
                return result;
            }
            catch (error) {
                // Log error with MCP Monitoring
                logMCPEvent("Error", {
                    message: `Tool execution failed: ${name}`,
                    tool: name,
                    error: error instanceof Error ? error.message : String(error),
                    args,
                });
                MCPMonitoring.error(`Tool execution failed: ${name}`, {
                    tool_name: name,
                    error_message: error instanceof Error ? error.message : String(error),
                    error_stack: error instanceof Error ? error.stack : undefined,
                    arguments: args,
                }, {
                    server_id: "fuinnosho-film-inventory-server",
                    tool_name: name,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                };
            }
        });
    }
    async getFilmInventory(args) {
        const { include_availability = false } = args;
        // Test mode - return mock data
        if (!this.supabase) {
            return {
                content: [
                    {
                        type: "text",
                        text: "🎬 **Test Film Inventory** (Monitoring Test Mode)\n\n" +
                            "• **Kodak Portra 400** (35mm) - 5 rolls\n" +
                            "• **Ilford HP5+** (120) - 3 rolls\n" +
                            "• **Fuji Pro 400H** (35mm) - 2 rolls\n\n" +
                            "*This is test data - MCP monitoring is working!*",
                    },
                ],
            };
        }
        const tableName = include_availability
            ? "films_with_availability"
            : "films";
        const { data: films, error } = await this.supabase
            .from(tableName)
            .select("*")
            .eq("user_id", this.userId)
            .order("brand", { ascending: true })
            .order("name", { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch films: ${error.message}`);
        }
        const totalValue = films?.reduce((sum, film) => {
            return sum + (film.price || 0) * (film.count || 0);
        }, 0) || 0;
        const totalRolls = films?.reduce((sum, film) => {
            return sum + (film.count || 0);
        }, 0) || 0;
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        summary: {
                            total_films: films?.length || 0,
                            total_rolls: totalRolls,
                            total_value: totalValue,
                        },
                        films: films || [],
                    }, null, 2),
                },
            ],
        };
    }
    async filterFilms(args) {
        const { type, iso_min, iso_max, format, brand, in_stock_only = false, } = args;
        let query = this.supabase.from("films").select("*").is("deleted_at", null); // Exclude soft deleted films
        if (type) {
            query = query.eq("type", type);
        }
        if (iso_min !== undefined) {
            query = query.gte("iso", iso_min);
        }
        if (iso_max !== undefined) {
            query = query.lte("iso", iso_max);
        }
        if (format) {
            query = query.eq("format", format);
        }
        if (brand) {
            query = query.ilike("brand", `%${brand}%`);
        }
        if (in_stock_only) {
            query = query.gt("count", 0);
        }
        const { data: films, error } = await query
            .order("brand", { ascending: true })
            .order("name", { ascending: true });
        if (error) {
            throw new Error(`Failed to filter films: ${error.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        filters_applied: {
                            type,
                            iso_range: iso_min !== undefined || iso_max !== undefined
                                ? `${iso_min || 0}-${iso_max || "∞"}`
                                : null,
                            format,
                            brand,
                            in_stock_only,
                        },
                        results_count: films?.length || 0,
                        films: films || [],
                    }, null, 2),
                },
            ],
        };
    }
    async updateFilmQuantity(args) {
        const { film_id, quantity, usage_note } = args;
        if (!film_id || !quantity || !usage_note) {
            throw new Error("film_id, quantity, and usage_note are required");
        }
        if (quantity <= 0) {
            throw new Error("Quantity must be positive");
        }
        // Get current film
        const { data: film, error: filmError } = await this.supabase
            .from("films")
            .select("count, name, brand")
            .eq("id", film_id)
            .single();
        if (filmError || !film) {
            throw new Error("Film not found");
        }
        const currentCount = film.count || 0;
        const newCount = Math.max(0, currentCount - quantity);
        // Update film count
        const { error: updateError } = await this.supabase
            .from("films")
            .update({ count: newCount })
            .eq("id", film_id);
        if (updateError) {
            throw new Error(`Failed to update film count: ${updateError.message}`);
        }
        // Record usage
        const { error: usageError } = await this.supabase
            .from("film_usage")
            .insert({
            film_id,
            quantity,
            usage_note,
        });
        if (usageError) {
            throw new Error(`Failed to record usage: ${usageError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        film: `${film.brand} ${film.name}`,
                        previous_count: currentCount,
                        new_count: newCount,
                        quantity_used: quantity,
                        usage_note,
                    }, null, 2),
                },
            ],
        };
    }
    async spoolBulkFilm(args) {
        const { film_id, exposures_to_spool, cassettes_created, spool_note } = args;
        if (!film_id || !exposures_to_spool || !cassettes_created || !spool_note) {
            throw new Error("film_id, exposures_to_spool, cassettes_created, and spool_note are required");
        }
        if (exposures_to_spool <= 0 || cassettes_created <= 0) {
            throw new Error("exposures_to_spool and cassettes_created must be positive");
        }
        // Get current film
        const { data: film, error: filmError } = await this.supabase
            .from("films")
            .select("bulk_remaining_exposures, spooled_cassettes, is_bulk_film, name, brand, format")
            .eq("id", film_id)
            .single();
        if (filmError || !film) {
            throw new Error("Film not found");
        }
        if (!film.is_bulk_film) {
            throw new Error("This is not a bulk film");
        }
        const currentRemainingExposures = film.bulk_remaining_exposures || 0;
        const currentSpooledCassettes = film.spooled_cassettes || 0;
        if (exposures_to_spool > currentRemainingExposures) {
            throw new Error(`Not enough bulk film remaining. Available: ${currentRemainingExposures} exposures, Requested: ${exposures_to_spool} exposures`);
        }
        const newRemainingExposures = currentRemainingExposures - exposures_to_spool;
        const newSpooledCassettes = currentSpooledCassettes + cassettes_created;
        // Update film with new remaining exposures and cassette count
        const { error: updateError } = await this.supabase
            .from("films")
            .update({
            bulk_remaining_exposures: newRemainingExposures,
            spooled_cassettes: newSpooledCassettes,
            count: newSpooledCassettes, // For bulk films, count represents spooled cassettes
        })
            .eq("id", film_id);
        if (updateError) {
            throw new Error(`Failed to update film: ${updateError.message}`);
        }
        // Record spooling usage
        const { error: usageError } = await this.supabase
            .from("film_usage")
            .insert({
            film_id,
            quantity: cassettes_created,
            usage_note: spool_note,
            usage_type: "spool",
            exposures_used: exposures_to_spool,
        });
        if (usageError) {
            throw new Error(`Failed to record spooling: ${usageError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        film: `${film.brand} ${film.name}`,
                        exposures_used: exposures_to_spool,
                        cassettes_created,
                        remaining_exposures: newRemainingExposures,
                        total_spooled_cassettes: newSpooledCassettes,
                        spool_note,
                    }, null, 2),
                },
            ],
        };
    }
    async checkLowStock(args) {
        const { threshold = 3, include_out_of_stock = true } = args;
        let query = this.supabase
            .from("films")
            .select("*")
            .is("deleted_at", null) // Exclude soft deleted films
            .lte("count", threshold);
        if (!include_out_of_stock) {
            query = query.gt("count", 0);
        }
        const { data: films, error } = await query
            .order("count", { ascending: true })
            .order("brand", { ascending: true });
        if (error) {
            throw new Error(`Failed to check low stock: ${error.message}`);
        }
        const outOfStock = films?.filter((f) => (f.count || 0) === 0) || [];
        const lowStock = films?.filter((f) => (f.count || 0) > 0 && (f.count || 0) <= threshold) || [];
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        alert_threshold: threshold,
                        summary: {
                            out_of_stock: outOfStock.length,
                            low_stock: lowStock.length,
                            total_alerts: films?.length || 0,
                        },
                        out_of_stock: outOfStock,
                        low_stock: lowStock,
                    }, null, 2),
                },
            ],
        };
    }
    async getFilmUsageHistory(args) {
        const { film_id } = args;
        if (!film_id) {
            throw new Error("film_id is required");
        }
        const { data: usage, error } = await this.supabase
            .from("film_usage")
            .select("*")
            .eq("film_id", film_id)
            .order("created_at", { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch usage history: ${error.message}`);
        }
        const totalUsed = usage?.reduce((sum, u) => sum + u.quantity, 0) || 0;
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        film_id,
                        total_usage_records: usage?.length || 0,
                        total_rolls_used: totalUsed,
                        usage_history: usage || [],
                    }, null, 2),
                },
            ],
        };
    }
    async getFilmStats(args) {
        const { group_by = "type" } = args;
        const { data: films, error } = await this.supabase
            .from("films")
            .select("*")
            .is("deleted_at", null); // Exclude soft deleted films
        if (error) {
            throw new Error(`Failed to fetch films for stats: ${error.message}`);
        }
        const stats = {};
        films?.forEach((film) => {
            const key = film[group_by];
            if (!stats[key]) {
                stats[key] = {
                    count: 0,
                    total_rolls: 0,
                    total_value: 0,
                    films: [],
                };
            }
            stats[key].count++;
            stats[key].total_rolls += film.count || 0;
            stats[key].total_value += (film.price || 0) * (film.count || 0);
            stats[key].films.push({
                id: film.id,
                name: film.name,
                brand: film.brand,
                count: film.count,
            });
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        grouped_by: group_by,
                        total_categories: Object.keys(stats).length,
                        statistics: stats,
                    }, null, 2),
                },
            ],
        };
    }
    async createFilm(args) {
        const { name, brand, iso, format, type, expiration_date, count = 1, price, notes = "", editing_notes = "", is_ecn = false, is_bulk_film = false, bulk_length_meters, } = args;
        if (!name || !brand || !iso || !format || !type || !expiration_date) {
            throw new Error("Missing required fields: name, brand, iso, format, type, expiration_date");
        }
        const filmData = {
            name,
            brand,
            iso,
            format,
            type,
            expiration_date,
            count,
            notes,
            editing_notes,
            is_ecn,
            is_bulk_film,
        };
        if (price !== undefined) {
            filmData.price = price;
        }
        if (is_bulk_film && bulk_length_meters) {
            filmData.bulk_length_meters = bulk_length_meters;
            // Calculate number of rolls from bulk length (assuming 36 exposures per roll = ~1.5m)
            filmData.bulk_quantity = count;
            filmData.calculated_rolls = Math.floor(bulk_length_meters / 1.5);
            filmData.count = filmData.calculated_rolls;
        }
        const { data: film, error } = await this.supabase
            .from("films")
            .insert(filmData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create film: ${error.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Film created successfully",
                        film: film,
                    }, null, 2),
                },
            ],
        };
    }
    async editFilm(args) {
        const { film_id, ...updateData } = args;
        if (!film_id) {
            throw new Error("film_id is required");
        }
        // Remove undefined values
        const cleanedData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined));
        if (Object.keys(cleanedData).length === 0) {
            throw new Error("No fields to update");
        }
        // Handle bulk film calculations if relevant fields are being updated
        if (cleanedData.is_bulk_film && cleanedData.bulk_length_meters) {
            cleanedData.calculated_rolls = Math.floor(Number(cleanedData.bulk_length_meters) / 1.5);
            if (!cleanedData.count) {
                cleanedData.count = cleanedData.calculated_rolls;
            }
        }
        const { data: film, error } = await this.supabase
            .from("films")
            .update(cleanedData)
            .eq("id", film_id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update film: ${error.message}`);
        }
        if (!film) {
            throw new Error("Film not found");
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Film updated successfully",
                        film: film,
                    }, null, 2),
                },
            ],
        };
    }
    async deleteFilm(args) {
        const { film_id } = args;
        if (!film_id) {
            throw new Error("film_id is required");
        }
        // First check if film exists and get its info
        const { data: film, error: fetchError } = await this.supabase
            .from("films")
            .select("name, brand")
            .eq("id", film_id)
            .is("deleted_at", null) // Only find non-deleted films
            .single();
        if (fetchError || !film) {
            throw new Error("Film not found");
        }
        // Soft delete the film
        const { error: deleteError } = await this.supabase
            .from("films")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", film_id);
        if (deleteError) {
            throw new Error(`Failed to delete film: ${deleteError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Film "${film.brand} ${film.name}" moved to trash`,
                        deleted_film: {
                            id: film_id,
                            name: film.name,
                            brand: film.brand,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    async createTrip(args) {
        const { title, description = "", start_date, end_date } = args;
        if (!title || !start_date || !end_date) {
            throw new Error("Missing required fields: title, start_date, end_date");
        }
        // Validate date range
        if (new Date(end_date) < new Date(start_date)) {
            throw new Error("End date must be on or after start date");
        }
        const tripData = {
            title,
            description,
            start_date,
            end_date,
            status: "upcoming",
        };
        const { data: trip, error } = await this.supabase
            .from("trips")
            .insert(tripData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create trip: ${error.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Trip created successfully",
                        trip: trip,
                    }, null, 2),
                },
            ],
        };
    }
    async listTrips(args) {
        const { include_past = true, include_films = false } = args;
        let query = this.supabase.from("trips").select("*");
        if (!include_past) {
            const today = new Date().toISOString().split("T")[0];
            query = query.gte("start_date", today);
        }
        const { data: trips, error } = await query.order("start_date", {
            ascending: false,
        });
        if (error) {
            throw new Error(`Failed to fetch trips: ${error.message}`);
        }
        if (include_films && trips) {
            // Fetch films for each trip
            for (const trip of trips) {
                const { data: tripFilms, error: filmsError } = await this.supabase
                    .from("trip_films")
                    .select(`
            quantity,
            films (
              id,
              name,
              brand,
              iso,
              format,
              type
            )
          `)
                    .eq("trip_id", trip.id);
                if (!filmsError) {
                    trip.reserved_films = tripFilms || [];
                }
            }
        }
        const upcomingTrips = trips?.filter((trip) => {
            const startDate = new Date(trip.start_date);
            const today = new Date();
            return startDate >= today;
        }) || [];
        const pastTrips = trips?.filter((trip) => {
            const endDate = new Date(trip.end_date);
            const today = new Date();
            return endDate < today;
        }) || [];
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        summary: {
                            total_trips: trips?.length || 0,
                            upcoming_trips: upcomingTrips.length,
                            past_trips: pastTrips.length,
                        },
                        upcoming_trips: upcomingTrips,
                        past_trips: include_past ? pastTrips : [],
                    }, null, 2),
                },
            ],
        };
    }
    async getTripDetails(args) {
        const { trip_id } = args;
        if (!trip_id) {
            throw new Error("trip_id is required");
        }
        const { data: trip, error } = await this.supabase
            .from("trips")
            .select("*")
            .eq("id", trip_id)
            .single();
        if (error || !trip) {
            throw new Error("Trip not found");
        }
        // Get reserved films for this trip
        const { data: tripFilms, error: filmsError } = await this.supabase
            .from("trip_films")
            .select(`
        quantity,
        films (
          id,
          name,
          brand,
          iso,
          format,
          type,
          count,
          price
        )
      `)
            .eq("trip_id", trip_id);
        if (filmsError) {
            throw new Error(`Failed to fetch trip films: ${filmsError.message}`);
        }
        // Get reserved gear for this trip
        const { data: tripGear, error: gearError } = await this.supabase
            .from("trip_gear")
            .select(`
        gear (
          id,
          name,
          brand,
          type,
          model,
          condition,
          purchase_price
        )
      `)
            .eq("trip_id", trip_id);
        if (gearError) {
            throw new Error(`Failed to fetch trip gear: ${gearError.message}`);
        }
        const totalRolls = tripFilms?.reduce((sum, tf) => sum + tf.quantity, 0) || 0;
        const totalFilmValue = tripFilms?.reduce((sum, tf) => {
            return sum + tf.quantity * (tf.films?.price || 0);
        }, 0) || 0;
        const totalGearValue = tripGear?.reduce((sum, tg) => {
            return sum + (tg.gear?.purchase_price || 0);
        }, 0) || 0;
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        trip: trip,
                        summary: {
                            total_films_reserved: tripFilms?.length || 0,
                            total_rolls: totalRolls,
                            total_gear_reserved: tripGear?.length || 0,
                            estimated_film_value: totalFilmValue,
                            estimated_gear_value: totalGearValue,
                            total_estimated_value: totalFilmValue + totalGearValue,
                        },
                        reserved_films: tripFilms || [],
                        reserved_gear: tripGear || [],
                    }, null, 2),
                },
            ],
        };
    }
    async editTrip(args) {
        const { trip_id, ...updateData } = args;
        if (!trip_id) {
            throw new Error("trip_id is required");
        }
        // Remove undefined values
        const cleanedData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined));
        if (Object.keys(cleanedData).length === 0) {
            throw new Error("No fields to update");
        }
        // Validate date range if both dates are provided
        if (cleanedData.start_date && cleanedData.end_date) {
            const endDate = new Date(cleanedData.end_date.toString());
            const startDate = new Date(cleanedData.start_date.toString());
            if (endDate < startDate) {
                throw new Error("End date must be on or after start date");
            }
        }
        const { data: trip, error } = await this.supabase
            .from("trips")
            .update(cleanedData)
            .eq("id", trip_id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update trip: ${error.message}`);
        }
        if (!trip) {
            throw new Error("Trip not found");
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Trip updated successfully",
                        trip: trip,
                    }, null, 2),
                },
            ],
        };
    }
    async deleteTrip(args) {
        const { trip_id } = args;
        if (!trip_id) {
            throw new Error("trip_id is required");
        }
        // First get trip details
        const { data: trip, error: fetchError } = await this.supabase
            .from("trips")
            .select("title")
            .eq("id", trip_id)
            .single();
        if (fetchError || !trip) {
            throw new Error("Trip not found");
        }
        // Delete trip (this will cascade delete trip_films due to foreign key constraints)
        const { error: deleteError } = await this.supabase
            .from("trips")
            .delete()
            .eq("id", trip_id);
        if (deleteError) {
            throw new Error(`Failed to delete trip: ${deleteError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Trip "${trip.title}" deleted successfully`,
                        deleted_trip: {
                            id: trip_id,
                            title: trip.title,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    async reserveFilmForTrip(args) {
        const { trip_id, film_id, quantity } = args;
        if (!trip_id || !film_id || !quantity) {
            throw new Error("trip_id, film_id, and quantity are required");
        }
        if (quantity <= 0) {
            throw new Error("Quantity must be positive");
        }
        // Check if trip exists
        const { data: trip, error: tripError } = await this.supabase
            .from("trips")
            .select("title")
            .eq("id", trip_id)
            .single();
        if (tripError || !trip) {
            throw new Error("Trip not found");
        }
        // Check film availability
        const { data: film, error: filmError } = await this.supabase
            .from("films_with_availability")
            .select("name, brand, available_count")
            .eq("id", film_id)
            .single();
        if (filmError || !film) {
            throw new Error("Film not found");
        }
        if (film.available_count < quantity) {
            throw new Error(`Not enough available stock. Available: ${film.available_count}, Requested: ${quantity}`);
        }
        // Check if film is already reserved for this trip
        const { data: existingReservation } = await this.supabase
            .from("trip_films")
            .select("quantity")
            .eq("trip_id", trip_id)
            .eq("film_id", film_id)
            .single();
        let result;
        if (existingReservation) {
            // Update existing reservation
            const newQuantity = existingReservation.quantity + quantity;
            const { data, error } = await this.supabase
                .from("trip_films")
                .update({ quantity: newQuantity })
                .eq("trip_id", trip_id)
                .eq("film_id", film_id)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update film reservation: ${error.message}`);
            }
            result = {
                ...data,
                action: "updated",
                previous_quantity: existingReservation.quantity,
            };
        }
        else {
            // Create new reservation
            const { data, error } = await this.supabase
                .from("trip_films")
                .insert({
                trip_id,
                film_id,
                quantity,
            })
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to reserve film: ${error.message}`);
            }
            result = { ...data, action: "created" };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `${quantity} roll(s) of ${film.brand} ${film.name} ${result.action} for trip "${trip.title}"`,
                        reservation: result,
                        film: {
                            name: film.name,
                            brand: film.brand,
                            remaining_available: film.available_count - quantity,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    async removeFilmReservation(args) {
        const { trip_id, film_id } = args;
        if (!trip_id || !film_id) {
            throw new Error("trip_id and film_id are required");
        }
        // Get reservation details before deleting
        const { data: reservation, error: fetchError } = await this.supabase
            .from("trip_films")
            .select(`
        quantity,
        trips (title),
        films (name, brand)
      `)
            .eq("trip_id", trip_id)
            .eq("film_id", film_id)
            .single();
        if (fetchError || !reservation) {
            throw new Error("Film reservation not found for this trip");
        }
        // Delete the reservation
        const { error: deleteError } = await this.supabase
            .from("trip_films")
            .delete()
            .eq("trip_id", trip_id)
            .eq("film_id", film_id);
        if (deleteError) {
            throw new Error(`Failed to remove film reservation: ${deleteError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Removed ${reservation.quantity} roll(s) of ${reservation.films.brand} ${reservation.films.name} from trip "${reservation.trips.title}"`,
                        removed_reservation: {
                            quantity: reservation.quantity,
                            film: `${reservation.films.brand} ${reservation.films.name}`,
                            trip: reservation.trips.title,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    async updateFilmReservationQuantity(args) {
        const { trip_id, film_id, quantity } = args;
        if (!trip_id || !film_id || quantity === undefined) {
            throw new Error("trip_id, film_id, and quantity are required");
        }
        if (quantity < 1) {
            throw new Error("Quantity must be at least 1");
        }
        // Check if reservation exists
        const { data: existingReservation, error: fetchError } = await this.supabase
            .from("trip_films")
            .select(`
        quantity,
        trips (title),
        films (name, brand)
      `)
            .eq("trip_id", trip_id)
            .eq("film_id", film_id)
            .single();
        if (fetchError || !existingReservation) {
            throw new Error("Film reservation not found for this trip");
        }
        // Update the quantity
        const { error: updateError } = await this.supabase
            .from("trip_films")
            .update({ quantity })
            .eq("trip_id", trip_id)
            .eq("film_id", film_id);
        if (updateError) {
            throw new Error(`Failed to update film reservation quantity: ${updateError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Updated reservation for ${existingReservation.films.brand} ${existingReservation.films.name} in trip "${existingReservation.trips.title}" from ${existingReservation.quantity} to ${quantity} roll(s)`,
                        updated_reservation: {
                            old_quantity: existingReservation.quantity,
                            new_quantity: quantity,
                            film: `${existingReservation.films.brand} ${existingReservation.films.name}`,
                            trip: existingReservation.trips.title,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    async getFilmsWithAvailability(args) {
        const { available_only = false, min_available = 1 } = args;
        let query = this.supabase.from("films_with_availability").select("*");
        if (available_only) {
            query = query.gte("available_count", min_available);
        }
        const { data: films, error } = await query
            .order("brand", { ascending: true })
            .order("name", { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch films with availability: ${error.message}`);
        }
        const availableFilms = films?.filter((f) => (f.available_count || 0) >= min_available) ||
            [];
        const reservedFilms = films?.filter((f) => (f.reserved_quantity || 0) > 0) || [];
        const totalValue = films?.reduce((sum, film) => {
            return sum + (film.price || 0) * (film.available_count || 0);
        }, 0) || 0;
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        summary: {
                            total_films: films?.length || 0,
                            films_with_availability: availableFilms.length,
                            films_with_reservations: reservedFilms.length,
                            total_available_rolls: films?.reduce((sum, f) => sum + (f.available_count || 0), 0) || 0,
                            total_reserved_rolls: films?.reduce((sum, f) => sum + (f.reserved_quantity || 0), 0) || 0,
                            available_inventory_value: totalValue,
                        },
                        films: films || [],
                    }, null, 2),
                },
            ],
        };
    }
    async createGear(args) {
        const { name, brand, type, model, serial_number, purchase_date, purchase_price, condition = "good", notes = "", } = args;
        if (!name || !brand || !type || !condition) {
            throw new Error("Missing required fields: name, brand, type, condition");
        }
        const gearData = {
            name,
            brand,
            type,
            condition,
            notes,
            user_id: this.userId,
        };
        if (model)
            gearData.model = model;
        if (serial_number)
            gearData.serial_number = serial_number;
        if (purchase_date)
            gearData.purchase_date = purchase_date;
        if (purchase_price !== undefined)
            gearData.purchase_price = purchase_price;
        const { data: gear, error } = await this.supabase
            .from("gear")
            .insert(gearData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create gear: ${error.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Gear created successfully",
                        gear: gear,
                    }, null, 2),
                },
            ],
        };
    }
    async listGear(args) {
        const { type, brand, condition, include_trip_reservations = false } = args;
        let query = this.supabase
            .from("gear")
            .select("*")
            .eq("user_id", this.userId);
        if (type) {
            query = query.eq("type", type);
        }
        if (brand) {
            query = query.ilike("brand", `%${brand}%`);
        }
        if (condition) {
            query = query.eq("condition", condition);
        }
        const { data: gear, error } = await query
            .order("type", { ascending: true })
            .order("brand", { ascending: true })
            .order("name", { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch gear: ${error.message}`);
        }
        // If requested, include trip reservation info
        if (include_trip_reservations && gear) {
            for (const item of gear) {
                const { data: reservations } = await this.supabase
                    .from("trip_gear")
                    .select(`
            trips (
              id,
              title,
              start_date,
              end_date
            )
          `)
                    .eq("gear_id", item.id);
                item.trip_reservations = reservations || [];
            }
        }
        const totalValue = gear?.reduce((sum, item) => {
            return sum + (item.purchase_price || 0);
        }, 0) || 0;
        const gearByType = gear?.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {}) || {};
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        summary: {
                            total_gear: gear?.length || 0,
                            total_value: totalValue,
                            gear_by_type: gearByType,
                            filters_applied: {
                                type,
                                brand,
                                condition,
                                include_trip_reservations,
                            },
                        },
                        gear: gear || [],
                    }, null, 2),
                },
            ],
        };
    }
    async editGear(args) {
        const { gear_id, ...updateData } = args;
        if (!gear_id) {
            throw new Error("gear_id is required");
        }
        // Remove undefined values
        const cleanedData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined));
        if (Object.keys(cleanedData).length === 0) {
            throw new Error("No fields to update");
        }
        const { data: gear, error } = await this.supabase
            .from("gear")
            .update(cleanedData)
            .eq("id", gear_id)
            .eq("user_id", this.userId)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update gear: ${error.message}`);
        }
        if (!gear) {
            throw new Error("Gear not found");
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Gear updated successfully",
                        gear: gear,
                    }, null, 2),
                },
            ],
        };
    }
    async deleteGear(args) {
        const { gear_id } = args;
        if (!gear_id) {
            throw new Error("gear_id is required");
        }
        // First check if gear exists and get its info
        const { data: gear, error: fetchError } = await this.supabase
            .from("gear")
            .select("name, brand, type")
            .eq("id", gear_id)
            .eq("user_id", this.userId)
            .single();
        if (fetchError || !gear) {
            throw new Error("Gear not found");
        }
        // Check if gear is reserved for any upcoming trips
        const { data: reservations } = await this.supabase
            .from("trip_gear")
            .select(`
        trips (
          title,
          start_date,
          end_date
        )
      `)
            .eq("gear_id", gear_id);
        const upcomingReservations = reservations?.filter((r) => {
            const tripStartDate = new Date(r.trips.start_date);
            const today = new Date();
            return tripStartDate >= today;
        }) || [];
        if (upcomingReservations.length > 0) {
            const tripTitles = upcomingReservations
                .map((r) => r.trips.title)
                .join(", ");
            throw new Error(`Cannot delete gear: it's reserved for upcoming trips: ${tripTitles}`);
        }
        // Delete the gear
        const { error: deleteError } = await this.supabase
            .from("gear")
            .delete()
            .eq("id", gear_id)
            .eq("user_id", this.userId);
        if (deleteError) {
            throw new Error(`Failed to delete gear: ${deleteError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Gear "${gear.brand} ${gear.name}" (${gear.type}) deleted successfully`,
                        deleted_gear: {
                            id: gear_id,
                            name: gear.name,
                            brand: gear.brand,
                            type: gear.type,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    async getGearStats(args) {
        const { group_by = "type" } = args;
        const { data: gear, error } = await this.supabase
            .from("gear")
            .select("*")
            .eq("user_id", this.userId);
        if (error) {
            throw new Error(`Failed to fetch gear for stats: ${error.message}`);
        }
        const stats = {};
        gear?.forEach((item) => {
            const key = item[group_by];
            if (!stats[key]) {
                stats[key] = {
                    count: 0,
                    total_value: 0,
                    gear: [],
                };
            }
            stats[key].count++;
            stats[key].total_value += item.purchase_price || 0;
            stats[key].gear.push({
                id: item.id,
                name: item.name,
                brand: item.brand,
                type: item.type,
                condition: item.condition,
            });
        });
        const totalValue = gear?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) || 0;
        const totalGear = gear?.length || 0;
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        grouped_by: group_by,
                        total_categories: Object.keys(stats).length,
                        overall_summary: {
                            total_gear: totalGear,
                            total_value: totalValue,
                            average_value: totalGear > 0 ? totalValue / totalGear : 0,
                        },
                        statistics: stats,
                    }, null, 2),
                },
            ],
        };
    }
    async reserveGearForTrip(args) {
        const { trip_id, gear_id } = args;
        if (!trip_id || !gear_id) {
            throw new Error("trip_id and gear_id are required");
        }
        // Check if trip exists and belongs to user
        const { data: trip, error: tripError } = await this.supabase
            .from("trips")
            .select("title")
            .eq("id", trip_id)
            .eq("user_id", this.userId)
            .single();
        if (tripError || !trip) {
            throw new Error("Trip not found");
        }
        // Check if gear exists and belongs to user
        const { data: gear, error: gearError } = await this.supabase
            .from("gear")
            .select("name, brand, type")
            .eq("id", gear_id)
            .eq("user_id", this.userId)
            .single();
        if (gearError || !gear) {
            throw new Error("Gear not found");
        }
        // Check if gear is already reserved for this trip
        const { data: existingReservation } = await this.supabase
            .from("trip_gear")
            .select("id")
            .eq("trip_id", trip_id)
            .eq("gear_id", gear_id)
            .single();
        if (existingReservation) {
            throw new Error(`Gear "${gear.brand} ${gear.name}" is already reserved for trip "${trip.title}"`);
        }
        // Create new gear reservation
        const { data: reservation, error } = await this.supabase
            .from("trip_gear")
            .insert({
            trip_id,
            gear_id,
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to reserve gear: ${error.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `${gear.brand} ${gear.name} (${gear.type}) reserved for trip "${trip.title}"`,
                        reservation: {
                            id: reservation.id,
                            trip_title: trip.title,
                            gear: `${gear.brand} ${gear.name}`,
                            gear_type: gear.type,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    async removeGearReservation(args) {
        const { trip_id, gear_id } = args;
        if (!trip_id || !gear_id) {
            throw new Error("trip_id and gear_id are required");
        }
        // Get reservation details before deleting
        const { data: reservation, error: fetchError } = await this.supabase
            .from("trip_gear")
            .select(`
        trips (title),
        gear (name, brand, type)
      `)
            .eq("trip_id", trip_id)
            .eq("gear_id", gear_id)
            .single();
        if (fetchError || !reservation) {
            throw new Error("Gear reservation not found for this trip");
        }
        // Verify the trip and gear belong to the user (additional security)
        const [tripCheck, gearCheck] = await Promise.all([
            this.supabase
                .from("trips")
                .select("id")
                .eq("id", trip_id)
                .eq("user_id", this.userId)
                .single(),
            this.supabase
                .from("gear")
                .select("id")
                .eq("id", gear_id)
                .eq("user_id", this.userId)
                .single(),
        ]);
        if (tripCheck.error || gearCheck.error) {
            throw new Error("Access denied: trip or gear not found");
        }
        // Delete the reservation
        const { error: deleteError } = await this.supabase
            .from("trip_gear")
            .delete()
            .eq("trip_id", trip_id)
            .eq("gear_id", gear_id);
        if (deleteError) {
            throw new Error(`Failed to remove gear reservation: ${deleteError.message}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Removed ${reservation.gear.brand} ${reservation.gear.name} (${reservation.gear.type}) from trip "${reservation.trips.title}"`,
                        removed_reservation: {
                            gear: `${reservation.gear.brand} ${reservation.gear.name}`,
                            gear_type: reservation.gear.type,
                            trip: reservation.trips.title,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    // Development cost mapping based on film types
    // ECN/motion picture films: €9, C41: €6, B&W: €9
    getDevelopmentCost(film) {
        // ECN films: check the is_ecn field
        if (film.is_ecn) {
            return 9; // ECN development cost
        }
        // C41 films: type is "Color Negative"
        if (film.type === "Color Negative") {
            return 6; // C41 development cost
        }
        // B&W films: type contains "Black & White"
        if (film.type?.includes("Black & White")) {
            return 9; // B&W development cost
        }
        // Default to C41 cost for unknown types
        return 6;
    }
    getDevelopmentType(film) {
        if (film.is_ecn) {
            return "ECN";
        }
        if (film.type === "Color Negative") {
            return "C41";
        }
        if (film.type?.includes("Black & White")) {
            return "B&W";
        }
        return "C41"; // Default
    }
    async getUsageAnalytics(args) {
        const { period = "monthly", include_costs = true } = args;
        // Get all usage data with film information
        const { data: usageData, error } = await this.supabase
            .from("film_usage")
            .select(`
        *,
        films (*)
      `)
            .order("created_at", { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch usage data: ${error.message}`);
        }
        // Calculate analytics
        const analytics = {
            total_rolls_used: 0,
            total_cost: 0,
            film_cost: 0,
            development_cost: 0,
            usage_by_type: {},
            cost_by_type: {},
            monthly_trends: {},
            weekly_trends: {},
        };
        usageData.forEach((usage) => {
            const film = usage.films;
            const filmCost = 0; // Film cost is sunk cost - already paid when purchased
            const devCost = this.getDevelopmentCost(film) * usage.quantity;
            const devType = this.getDevelopmentType(film);
            analytics.total_rolls_used += usage.quantity;
            analytics.film_cost += filmCost;
            analytics.development_cost += devCost;
            analytics.total_cost += devCost; // Only count development costs
            analytics.usage_by_type[devType] =
                (analytics.usage_by_type[devType] || 0) + usage.quantity;
            analytics.cost_by_type[devType] =
                (analytics.cost_by_type[devType] || 0) + devCost;
            // Group by period
            const date = new Date(usage.created_at);
            if (period === "monthly") {
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                if (!analytics.monthly_trends[monthKey]) {
                    analytics.monthly_trends[monthKey] = { rolls: 0, cost: 0 };
                }
                analytics.monthly_trends[monthKey].rolls += usage.quantity;
                analytics.monthly_trends[monthKey].cost += devCost;
            }
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(analytics, null, 2),
                },
            ],
        };
    }
    async getFilmUsageByType(args) {
        const { start_date, end_date } = args;
        let query = this.supabase.from("film_usage").select(`
        *,
        films (*)
      `);
        if (start_date) {
            query = query.gte("created_at", start_date);
        }
        if (end_date) {
            query = query.lte("created_at", end_date);
        }
        const { data: usageData, error } = await query.order("created_at", {
            ascending: false,
        });
        if (error) {
            throw new Error(`Failed to fetch usage data: ${error.message}`);
        }
        const typeStats = {};
        usageData.forEach((usage) => {
            const film = usage.films;
            const devType = this.getDevelopmentType(film);
            const filmCost = (film.price || 0) * usage.quantity;
            const devCost = this.getDevelopmentCost(film) * usage.quantity;
            if (!typeStats[devType]) {
                typeStats[devType] = {
                    rolls: 0,
                    film_cost: 0,
                    development_cost: 0,
                    total_cost: 0,
                    films: [],
                };
            }
            typeStats[devType].rolls += usage.quantity;
            typeStats[devType].film_cost += filmCost;
            typeStats[devType].development_cost += devCost;
            typeStats[devType].total_cost += devCost;
            if (!typeStats[devType].films.includes(film.name)) {
                typeStats[devType].films.push(film.name);
            }
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(typeStats, null, 2),
                },
            ],
        };
    }
    async calculateMonthlyCosts(args) {
        const { month } = args;
        const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format
        const startDate = `${targetMonth}-01`;
        const endDate = `${targetMonth}-31`;
        const { data: usageData, error } = await this.supabase
            .from("film_usage")
            .select(`
        *,
        films (*)
      `)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch usage data: ${error.message}`);
        }
        const costs = {
            month: targetMonth,
            total_rolls: 0,
            total_film_cost: 0,
            total_development_cost: 0,
            total_cost: 0,
            breakdown_by_type: {},
            daily_usage: {},
        };
        usageData.forEach((usage) => {
            const film = usage.films;
            const filmCost = 0; // Film cost is sunk cost - already paid when purchased
            const devCost = this.getDevelopmentCost(film) * usage.quantity;
            const devType = this.getDevelopmentType(film);
            costs.total_rolls += usage.quantity;
            costs.total_film_cost += filmCost;
            costs.total_development_cost += devCost;
            costs.total_cost += devCost;
            if (!costs.breakdown_by_type[devType]) {
                costs.breakdown_by_type[devType] = {
                    rolls: 0,
                    film_cost: 0,
                    development_cost: 0,
                    cost_per_roll: devCost / usage.quantity,
                };
            }
            costs.breakdown_by_type[devType].rolls += usage.quantity;
            costs.breakdown_by_type[devType].film_cost += filmCost;
            costs.breakdown_by_type[devType].development_cost += devCost;
            // Daily usage
            const day = usage.created_at.split("T")[0];
            costs.daily_usage[day] = (costs.daily_usage[day] || 0) + usage.quantity;
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(costs, null, 2),
                },
            ],
        };
    }
    async getShootingPatterns(args) {
        const { weeks_back = 12 } = args;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - weeks_back * 7);
        const { data: usageData, error } = await this.supabase
            .from("film_usage")
            .select("*")
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch usage data: ${error.message}`);
        }
        const patterns = {
            day_of_week: {},
            weekly_frequency: {},
            shooting_sessions: 0,
            avg_rolls_per_session: 0,
            total_rolls: 0,
        };
        const sessionDates = new Set();
        usageData.forEach((usage) => {
            const date = new Date(usage.created_at);
            const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
            const weekKey = getWeekKey(date);
            const dayKey = usage.created_at.split("T")[0];
            patterns.day_of_week[dayOfWeek] =
                (patterns.day_of_week[dayOfWeek] || 0) + usage.quantity;
            patterns.weekly_frequency[weekKey] =
                (patterns.weekly_frequency[weekKey] || 0) + usage.quantity;
            patterns.total_rolls += usage.quantity;
            sessionDates.add(dayKey);
        });
        patterns.shooting_sessions = sessionDates.size;
        patterns.avg_rolls_per_session =
            patterns.shooting_sessions > 0
                ? patterns.total_rolls / patterns.shooting_sessions
                : 0;
        function getWeekKey(date) {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return weekStart.toISOString().split("T")[0];
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(patterns, null, 2),
                },
            ],
        };
    }
    async getChallenges(args) {
        console.error(`🎯 Getting challenges with args:`, args);
        const { data, error } = await this.supabase
            .from('challenges')
            .select('*')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching challenges:', error);
            throw new Error('Failed to fetch challenges');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data || [], null, 2),
                },
            ],
        };
    }
    async getChallenge(args) {
        const { challenge_id } = args;
        console.error(`🎯 Getting challenge ${challenge_id}`);
        const { data, error } = await this.supabase
            .from('challenges')
            .select('*')
            .eq('id', challenge_id)
            .eq('user_id', this.userId)
            .single();
        if (error) {
            console.error('Error fetching challenge:', error);
            throw new Error('Failed to fetch challenge');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async createChallenge(args) {
        const { name, description, start_date, end_date, total_days } = args;
        console.error(`🎯 Creating challenge: ${name}`);
        const { data, error } = await this.supabase
            .from('challenges')
            .insert([{
                name,
                description,
                start_date,
                end_date,
                total_days,
                user_id: this.userId
            }])
            .select('*')
            .single();
        if (error) {
            console.error('Error creating challenge:', error);
            throw new Error('Failed to create challenge');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async getChallengePrompts(args) {
        const { challenge_id } = args;
        console.error(`🎯 Getting prompts for challenge ${challenge_id}`);
        const { data, error } = await this.supabase
            .from('challenge_prompts')
            .select('*')
            .eq('challenge_id', challenge_id)
            .order('day_number', { ascending: true });
        if (error) {
            console.error('Error fetching challenge prompts:', error);
            throw new Error('Failed to fetch challenge prompts');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data || [], null, 2),
                },
            ],
        };
    }
    async getChallengeProgress(args) {
        const { challenge_id } = args;
        console.error(`🎯 Getting progress for challenge ${challenge_id}`);
        const { data, error } = await this.supabase
            .from('challenge_progress')
            .select('*')
            .eq('challenge_id', challenge_id)
            .eq('user_id', this.userId)
            .order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching challenge progress:', error);
            throw new Error('Failed to fetch challenge progress');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data || [], null, 2),
                },
            ],
        };
    }
    async updateChallengeProgress(args) {
        const { prompt_id, ...updates } = args;
        console.error(`🎯 Updating progress for prompt ${prompt_id}`);
        // Get the prompt to find challenge_id
        const { data: prompt } = await this.supabase
            .from('challenge_prompts')
            .select('challenge_id')
            .eq('id', prompt_id)
            .single();
        if (!prompt) {
            throw new Error('Prompt not found');
        }
        const { data, error } = await this.supabase
            .from('challenge_progress')
            .upsert({
            prompt_id,
            user_id: this.userId,
            challenge_id: prompt.challenge_id,
            ...updates,
            updated_at: new Date().toISOString(),
        })
            .select('*')
            .single();
        if (error) {
            console.error('Error updating challenge progress:', error);
            throw new Error('Failed to update challenge progress');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async getChallengeFilmRolls(args) {
        const { challenge_id } = args;
        console.error(`🎯 Getting film rolls for challenge ${challenge_id}`);
        const { data, error } = await this.supabase
            .from('challenge_film_rolls')
            .select(`
        *,
        films (
          name,
          brand,
          type,
          iso
        )
      `)
            .eq('challenge_id', challenge_id)
            .eq('user_id', this.userId)
            .order('roll_number', { ascending: true });
        if (error) {
            console.error('Error fetching challenge film rolls:', error);
            throw new Error('Failed to fetch challenge film rolls');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data || [], null, 2),
                },
            ],
        };
    }
    async getTodaysPrompt(args) {
        const { challenge_id } = args;
        console.error(`🎯 Getting today's prompt for challenge ${challenge_id}`);
        // First get the challenge to calculate current day
        const { data: challenge, error: challengeError } = await this.supabase
            .from('challenges')
            .select('*')
            .eq('id', challenge_id)
            .eq('user_id', this.userId)
            .single();
        if (challengeError || !challenge) {
            throw new Error('Challenge not found');
        }
        // Calculate current day
        const today = new Date();
        const startDate = new Date(challenge.start_date);
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const currentDay = Math.max(1, Math.min(diffDays, challenge.total_days));
        // Get today's prompt
        const { data, error } = await this.supabase
            .from('challenge_prompts')
            .select('*')
            .eq('challenge_id', challenge_id)
            .eq('day_number', currentDay)
            .single();
        if (error) {
            console.error('Error fetching today\'s prompt:', error);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: 'No prompt found for today' }, null, 2),
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async getChallengePrompt(args) {
        const { prompt_id } = args;
        console.error(`🎯 Getting challenge prompt ${prompt_id}`);
        const { data, error } = await this.supabase
            .from('challenge_prompts')
            .select('*')
            .eq('id', prompt_id)
            .single();
        if (error) {
            console.error('Error fetching challenge prompt:', error);
            throw new Error('Failed to fetch challenge prompt');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async updateChallengePrompt(args) {
        const { prompt_id, ...updates } = args;
        console.error(`🎯 Updating challenge prompt ${prompt_id}`);
        // Remove any undefined values
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined));
        const { data, error } = await this.supabase
            .from('challenge_prompts')
            .update(cleanUpdates)
            .eq('id', prompt_id)
            .select('*')
            .single();
        if (error) {
            console.error('Error updating challenge prompt:', error);
            throw new Error('Failed to update challenge prompt');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async getProgressForPrompt(args) {
        const { prompt_id } = args;
        console.error(`🎯 Getting progress for prompt ${prompt_id}`);
        const { data, error } = await this.supabase
            .from('challenge_progress')
            .select('*')
            .eq('prompt_id', prompt_id)
            .eq('user_id', this.userId)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is OK
            console.error('Error fetching challenge progress:', error);
            throw new Error('Failed to fetch challenge progress');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data || null, null, 2),
                },
            ],
        };
    }
    async listChemistry(args) {
        const { process_type } = args;
        console.error(`🧪 Listing chemistry inventory${process_type ? ` for ${process_type}` : ''}`);
        let query = this.supabase
            .from('chemistry_inventory')
            .select('*')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false });
        if (process_type) {
            query = query.eq('process_type', process_type);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching chemistry:', error);
            throw new Error('Failed to fetch chemistry inventory');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async createChemistry(args) {
        console.error('🧪 Creating chemistry:', args);
        const chemistryData = {
            user_id: this.userId,
            name: args.name,
            brand: args.brand,
            type: args.type,
            process_type: args.process_type,
            capacity_ml: args.capacity_ml,
            remaining_ml: args.remaining_ml || args.capacity_ml,
            dilution: args.dilution,
            reusable: args.reusable || false,
            expiry_date: args.expiry_date,
            notes: args.notes,
        };
        const { data, error } = await this.supabase
            .from('chemistry_inventory')
            .insert(chemistryData)
            .select()
            .single();
        if (error) {
            console.error('Error creating chemistry:', error);
            throw new Error('Failed to create chemistry');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async editChemistry(args) {
        const { chemistry_id, ...updates } = args;
        console.error(`🧪 Editing chemistry ${chemistry_id}`);
        const updateData = {};
        if (updates.name !== undefined)
            updateData.name = updates.name;
        if (updates.brand !== undefined)
            updateData.brand = updates.brand;
        if (updates.type !== undefined)
            updateData.type = updates.type;
        if (updates.process_type !== undefined)
            updateData.process_type = updates.process_type;
        if (updates.capacity_ml !== undefined)
            updateData.capacity_ml = updates.capacity_ml;
        if (updates.remaining_ml !== undefined)
            updateData.remaining_ml = updates.remaining_ml;
        if (updates.dilution !== undefined)
            updateData.dilution = updates.dilution;
        if (updates.reusable !== undefined)
            updateData.reusable = updates.reusable;
        if (updates.expiry_date !== undefined)
            updateData.expiry_date = updates.expiry_date;
        if (updates.notes !== undefined)
            updateData.notes = updates.notes;
        const { data, error } = await this.supabase
            .from('chemistry_inventory')
            .update(updateData)
            .eq('id', chemistry_id)
            .eq('user_id', this.userId)
            .select()
            .single();
        if (error) {
            console.error('Error updating chemistry:', error);
            throw new Error('Failed to update chemistry');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async deleteChemistry(args) {
        const { chemistry_id } = args;
        console.error(`🧪 Deleting chemistry ${chemistry_id}`);
        const { error } = await this.supabase
            .from('chemistry_inventory')
            .delete()
            .eq('id', chemistry_id)
            .eq('user_id', this.userId);
        if (error) {
            console.error('Error deleting chemistry:', error);
            throw new Error('Failed to delete chemistry');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ success: true, deleted_id: chemistry_id }, null, 2),
                },
            ],
        };
    }
    async listRecipes(args) {
        console.error('📖 Listing development recipes');
        const { data, error } = await this.supabase
            .from('development_recipes')
            .select(`
        *,
        developer:chemistry_inventory(id, name, brand)
      `)
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching recipes:', error);
            throw new Error('Failed to fetch development recipes');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async createRecipe(args) {
        console.error('📖 Creating development recipe:', args);
        const recipeData = {
            user_id: this.userId,
            name: args.name,
            process_type: args.process_type,
            developer_id: args.developer_id,
            fixer_id: args.fixer_id,
            stop_bath_id: args.stop_bath_id,
            temperature_c: args.temperature_c,
            dev_time_minutes: args.dev_time_minutes,
            stop_time_seconds: args.stop_time_seconds,
            fix_time_minutes: args.fix_time_minutes,
            notes: args.notes,
        };
        const { data, error } = await this.supabase
            .from('development_recipes')
            .insert(recipeData)
            .select()
            .single();
        if (error) {
            console.error('Error creating recipe:', error);
            throw new Error('Failed to create development recipe');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async deleteRecipe(args) {
        const { recipe_id } = args;
        console.error(`📖 Deleting recipe ${recipe_id}`);
        const { error } = await this.supabase
            .from('development_recipes')
            .delete()
            .eq('id', recipe_id)
            .eq('user_id', this.userId);
        if (error) {
            console.error('Error deleting recipe:', error);
            throw new Error('Failed to delete development recipe');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ success: true, deleted_id: recipe_id }, null, 2),
                },
            ],
        };
    }
    async listDevelopmentSessions(args) {
        console.error('📸 Listing development sessions');
        const { data, error } = await this.supabase
            .from('development_sessions')
            .select(`
        *,
        recipe:development_recipes(
          name,
          process_type,
          developer:chemistry_inventory(name, brand)
        ),
        session_films(
          film_id,
          quantity,
          film:films(name, brand, format, iso)
        ),
        session_chemistry_usage(
          chemistry_id,
          volume_used_ml,
          chemistry:chemistry_inventory(name, brand, type)
        )
      `)
            .eq('user_id', this.userId)
            .order('session_date', { ascending: false });
        if (error) {
            console.error('Error fetching development sessions:', error);
            throw new Error('Failed to fetch development sessions');
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    async createDevelopmentSession(args) {
        console.error('📸 Creating development session:', args);
        // Create the session
        const sessionData = {
            user_id: this.userId,
            recipe_id: args.recipe_id || null,
            session_date: args.session_date || new Date().toISOString(),
            notes: args.notes,
            cost: args.cost || 0,
        };
        const { data: session, error: sessionError } = await this.supabase
            .from('development_sessions')
            .insert(sessionData)
            .select()
            .single();
        if (sessionError) {
            console.error('Error creating session:', sessionError);
            throw new Error('Failed to create development session');
        }
        // Add films to session
        if (args.film_quantities && args.film_quantities.length > 0) {
            const sessionFilms = args.film_quantities.map((fq) => ({
                session_id: session.id,
                film_id: fq.film_id,
                quantity: fq.quantity,
            }));
            const { error: filmsError } = await this.supabase
                .from('session_films')
                .insert(sessionFilms);
            if (filmsError) {
                console.error('Error adding films to session:', filmsError);
                throw new Error('Failed to add films to session');
            }
        }
        // Add chemistry usage and update remaining volumes
        if (args.chemistry_usage && args.chemistry_usage.length > 0) {
            const usageRecords = args.chemistry_usage.map((cu) => ({
                session_id: session.id,
                chemistry_id: cu.chemistry_id,
                volume_used_ml: cu.volume_used_ml,
            }));
            const { error: usageError } = await this.supabase
                .from('session_chemistry_usage')
                .insert(usageRecords);
            if (usageError) {
                console.error('Error recording chemistry usage:', usageError);
                throw new Error('Failed to record chemistry usage');
            }
            // Update chemistry remaining volumes
            for (const cu of args.chemistry_usage) {
                const { error: updateError } = await this.supabase.rpc('decrement_chemistry_volume', {
                    chem_id: cu.chemistry_id,
                    volume_to_subtract: cu.volume_used_ml,
                });
                if (updateError) {
                    console.error('Error updating chemistry volume:', updateError);
                    // Continue with other updates even if one fails
                }
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(session, null, 2),
                },
            ],
        };
    }
    async getFilmsFromCompletedTrips(args) {
        const { process_type } = args;
        console.error(`📸 Getting films from completed trips${process_type ? ` for ${process_type}` : ''}`);
        // Get all trip_films from completed trips
        let query = this.supabase
            .from('trip_films')
            .select(`
        film_id,
        quantity,
        films!inner(
          id,
          name,
          brand,
          format,
          iso,
          type,
          count
        ),
        trips!inner(
          id,
          title,
          status
        )
      `)
            .eq('trips.status', 'completed')
            .eq('trips.user_id', this.userId);
        // Filter by process type if specified
        if (process_type) {
            if (process_type === 'black_white') {
                query = query.eq('films.type', 'Black & White');
            }
            else if (process_type === 'color') {
                query = query.in('films.type', ['Color Negative', 'Color Positive']);
            }
        }
        const { data: tripFilms, error } = await query;
        if (error) {
            console.error('Error fetching films from completed trips:', error);
            throw new Error('Failed to fetch films from completed trips');
        }
        // Get already developed films
        const { data: developedSessions } = await this.supabase
            .from('session_films')
            .select('film_id, quantity');
        const developedQuantities = new Map();
        developedSessions?.forEach((sf) => {
            const current = developedQuantities.get(sf.film_id) || 0;
            developedQuantities.set(sf.film_id, current + sf.quantity);
        });
        // Aggregate films by film_id
        const filmsMap = new Map();
        tripFilms?.forEach((tf) => {
            const filmId = tf.film_id;
            if (!filmsMap.has(filmId)) {
                filmsMap.set(filmId, {
                    id: tf.films.id,
                    name: tf.films.name,
                    brand: tf.films.brand,
                    format: tf.films.format,
                    iso: tf.films.iso,
                    type: tf.films.type,
                    totalQuantity: 0,
                    trips: [],
                });
            }
            const film = filmsMap.get(filmId);
            film.totalQuantity += tf.quantity;
            film.trips.push({
                trip_id: tf.trips.id,
                trip_title: tf.trips.title,
                quantity: tf.quantity,
            });
        });
        // Subtract developed quantities and filter
        const films = Array.from(filmsMap.values())
            .map(film => {
            const developedQty = developedQuantities.get(film.id) || 0;
            const remainingQty = film.totalQuantity - developedQty;
            return {
                ...film,
                count: remainingQty,
            };
        })
            .filter(film => film.count > 0);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(films, null, 2),
                },
            ],
        };
    }
    async run() {
        console.error("Starting MCP server...");
        const transport = new StdioServerTransport();
        console.error("Transport created, connecting...");
        await this.server.connect(transport);
        console.error("Film Inventory MCP server running on stdio");
        console.error("Server connected successfully, starting authentication...");
        // Authenticate after the server starts with better error handling
        this.authenticateSession().catch((error) => {
            console.error("Authentication failed during startup:", error);
        });
        console.error("Server ready to accept requests");
    }
}
const server = new FilmInventoryMCPServer();
server.run().catch(console.error);
