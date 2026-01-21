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
  // Enhanced observability features
  enableTracing: true,
  enableMetrics: true,
  enableAutoInstrumentation: true,
  metricsInterval: 10000, // Collect system metrics every 10 seconds
});

// Helper function to log monitoring events
function logMCPEvent(type: string, details: any) {
  console.error(`🔍 MCP Monitoring ${type}:`, JSON.stringify(details, null, 2));
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

interface Film {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  price?: number;
  count?: number;
  notes?: string;
  editing_notes?: string;
  is_ecn?: boolean;
  deleted_at?: string;
  is_bulk_film?: boolean;
  bulk_length_meters?: number;
  bulk_quantity?: number;
  bulk_rolls_used?: number;
  calculated_rolls?: number;
  bulk_remaining_exposures?: number;
  spooled_cassettes?: number;
  total_count?: number;
  reserved_quantity?: number;
  available_count?: number;
}

interface FilmUsage {
  id: string;
  film_id: string;
  quantity: number;
  usage_note: string;
  created_at: string;
  usage_type?: "spool" | "shoot" | "add";
  exposures_used?: number;
  trip_id?: string;
}

interface Trip {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  status?: "upcoming" | "ongoing" | "past" | "completed";
}

interface TripFilm {
  id: string;
  trip_id: string;
  film_id: string;
  quantity: number;
  created_at: string;
}

// Format dimensions for exposure calculations
const formatDimensions: Record<string, { rollLength?: number; sheetsPerBox?: number; bulkLengthPerRoll: number }> = {
  "35mm": { rollLength: 36, bulkLengthPerRoll: 1.65 },
  "120": { rollLength: 12, bulkLengthPerRoll: 0.8 },
  "4x5": { sheetsPerBox: 10, bulkLengthPerRoll: 0 },
};

// Get exposures per roll/sheet for a given format
function getExposuresPerRoll(format: string): number {
  const formatInfo = formatDimensions[format];
  if (!formatInfo) return 36; // default fallback for unknown formats
  if (formatInfo.rollLength !== undefined) return formatInfo.rollLength;
  if (formatInfo.sheetsPerBox !== undefined) return formatInfo.sheetsPerBox;
  return 36;
}

interface Gear {
  id: string;
  name: string;
  brand: string;
  type: string; // 'camera', 'lens', 'flash', 'accessory', 'tripod', 'filter', 'bag'
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  condition: string; // 'excellent', 'good', 'fair', 'poor'
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

interface TripGear {
  id: string;
  trip_id: string;
  gear_id: string;
  created_at: string;
}

class FilmInventoryMCPServer {
  private server: Server;
  private supabase: any;
  private userId: string;

  constructor() {
    // Log server startup
    MCPMonitoring.info("MCP Server starting up", {
      server_name: "fuinnosho-film-inventory",
      version: "1.0.0",
    });

    const server = new Server(
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

    // Use server directly (monitoring will be added at tool level)
    this.server = server;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "⚠️  Missing Supabase environment variables - running in TEST MODE"
      );
      MCPMonitoring.warning("MCP Server starting in test mode", {
        reason: "Missing Supabase credentials",
        mode: "test",
      });
      this.supabase = null; // Test mode
    } else if (serviceRoleKey) {
      // Use service role key if available (bypasses RLS)
      console.error("🔑 Using service role key for Supabase client");
      this.supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    } else {
      // Fall back to anon key
      console.error("🔓 Using anon key for Supabase client (RLS will apply)");
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Set user ID for filtering (configured via environment variable)
    this.userId = process.env.MCP_USER_ID || "";

    // If using service role key and no user ID configured, fetch it from existing data
    if (serviceRoleKey && !this.userId) {
      this.fetchDefaultUserId();
    }

    this.setupToolHandlers();
  }

  private async fetchDefaultUserId() {
    try {
      // Try to get user_id from an existing trip
      const { data } = await this.supabase
        .from("trips")
        .select("user_id")
        .limit(1)
        .single();

      if (data?.user_id) {
        this.userId = data.user_id;
        console.error(`📋 Found default user_id from trips: ${this.userId}`);
      }
    } catch (error) {
      console.error("Could not fetch default user_id:", error);
    }
  }

  private async authenticateSession() {
    console.error("Starting authentication process...");
    MCPMonitoring.info("Authentication process starting");

    try {
      // Option 1: Use service role key if available (bypasses RLS)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        console.error("Using service role authentication");
        // Create service role client without making any network calls yet
        this.supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
              detectSessionInUrl: false,
            },
          }
        );
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
            } else {
              console.error("Successfully authenticated user session");
            }
          } catch (authError) {
            console.error(
              "Authentication error during deferred login:",
              authError
            );
          }
        }, 1000); // Defer authentication by 1 second
        return;
      }

      console.error(
        "No authentication credentials provided - using anonymous access"
      );
    } catch (error) {
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

  private setupToolHandlers() {
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
          description:
            "Filter films by type, ISO range, format, or other criteria",
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
          description:
            "Update film quantity when using rolls (reduces count and logs usage)",
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
                description:
                  "Number of exposures from bulk film to use for spooling",
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
          description:
            "Check for films with low stock (configurable threshold)",
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
                description:
                  "Whether this is an ECN (Eastman Color Negative) motion picture film",
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
                description:
                  "Whether this is an ECN (Eastman Color Negative) motion picture film",
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
                description:
                  "Gear type (camera, lens, flash, accessory, tripod, filter, bag)",
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
        const result = await MCPMonitoring.wrapToolExecution(
          name,
          async () => {
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

              default:
                throw new Error(`Unknown tool: ${name}`);
            }
          },
          args
        );

        // Log tool execution completion
        logMCPEvent('Tool Complete', { tool_name: name, success: true });
        MCPMonitoring.info(`Tool execution completed: ${name}`, { tool_name: name, success: true });

        return result;
      } catch (error) {
        // Log error with MCP Monitoring
        logMCPEvent("Error", {
          message: `Tool execution failed: ${name}`,
          tool: name,
          error: error instanceof Error ? error.message : String(error),
          args,
        });
        MCPMonitoring.error(
          `Tool execution failed: ${name}`,
          {
            tool_name: name,
            error_message:
              error instanceof Error ? error.message : String(error),
            error_stack: error instanceof Error ? error.stack : undefined,
            arguments: args,
          },
          {
            server_id: "fuinnosho-film-inventory-server",
            tool_name: name,
          }
        );

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

  private async getFilmInventory(args: any) {
    const { include_availability = false } = args;

    // Test mode - return mock data
    if (!this.supabase) {
      return {
        content: [
          {
            type: "text",
            text:
              "🎬 **Test Film Inventory** (Monitoring Test Mode)\n\n" +
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

    let filmsQuery = this.supabase.from(tableName).select("*");

    if (this.userId) {
      filmsQuery = filmsQuery.eq("user_id", this.userId);
    }

    const { data: films, error } = await filmsQuery
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch films: ${error.message}`);
    }

    const totalValue =
      films?.reduce((sum: number, film: Film) => {
        return sum + (film.price || 0) * (film.count || 0);
      }, 0) || 0;

    const totalRolls =
      films?.reduce((sum: number, film: Film) => {
        return sum + (film.count || 0);
      }, 0) || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              summary: {
                total_films: films?.length || 0,
                total_rolls: totalRolls,
                total_value: totalValue,
              },
              films: films || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async filterFilms(args: any) {
    const {
      type,
      iso_min,
      iso_max,
      format,
      brand,
      in_stock_only = false,
    } = args;

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
          text: JSON.stringify(
            {
              filters_applied: {
                type,
                iso_range:
                  iso_min !== undefined || iso_max !== undefined
                    ? `${iso_min || 0}-${iso_max || "∞"}`
                    : null,
                format,
                brand,
                in_stock_only,
              },
              results_count: films?.length || 0,
              films: films || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async updateFilmQuantity(args: any) {
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
          text: JSON.stringify(
            {
              success: true,
              film: `${film.brand} ${film.name}`,
              previous_count: currentCount,
              new_count: newCount,
              quantity_used: quantity,
              usage_note,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async spoolBulkFilm(args: any) {
    const { film_id, exposures_to_spool, cassettes_created, spool_note } = args;

    if (!film_id || !exposures_to_spool || !cassettes_created || !spool_note) {
      throw new Error(
        "film_id, exposures_to_spool, cassettes_created, and spool_note are required"
      );
    }

    if (exposures_to_spool <= 0 || cassettes_created <= 0) {
      throw new Error(
        "exposures_to_spool and cassettes_created must be positive"
      );
    }

    // Get current film
    const { data: film, error: filmError } = await this.supabase
      .from("films")
      .select(
        "bulk_remaining_exposures, spooled_cassettes, is_bulk_film, name, brand, format"
      )
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
      throw new Error(
        `Not enough bulk film remaining. Available: ${currentRemainingExposures} exposures, Requested: ${exposures_to_spool} exposures`
      );
    }

    const newRemainingExposures =
      currentRemainingExposures - exposures_to_spool;
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
          text: JSON.stringify(
            {
              success: true,
              film: `${film.brand} ${film.name}`,
              exposures_used: exposures_to_spool,
              cassettes_created,
              remaining_exposures: newRemainingExposures,
              total_spooled_cassettes: newSpooledCassettes,
              spool_note,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async checkLowStock(args: any) {
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

    const outOfStock = films?.filter((f: Film) => (f.count || 0) === 0) || [];
    const lowStock =
      films?.filter(
        (f: Film) => (f.count || 0) > 0 && (f.count || 0) <= threshold
      ) || [];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              alert_threshold: threshold,
              summary: {
                out_of_stock: outOfStock.length,
                low_stock: lowStock.length,
                total_alerts: films?.length || 0,
              },
              out_of_stock: outOfStock,
              low_stock: lowStock,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getFilmUsageHistory(args: any) {
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

    const totalUsed =
      usage?.reduce((sum: number, u: FilmUsage) => sum + u.quantity, 0) || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              film_id,
              total_usage_records: usage?.length || 0,
              total_rolls_used: totalUsed,
              usage_history: usage || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getFilmStats(args: any) {
    const { group_by = "type" } = args;

    const { data: films, error } = await this.supabase
      .from("films")
      .select("*")
      .is("deleted_at", null); // Exclude soft deleted films

    if (error) {
      throw new Error(`Failed to fetch films for stats: ${error.message}`);
    }

    const stats: Record<string, any> = {};

    films?.forEach((film: Film) => {
      const key = film[group_by as keyof Film] as string;

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
          text: JSON.stringify(
            {
              grouped_by: group_by,
              total_categories: Object.keys(stats).length,
              statistics: stats,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async createFilm(args: any) {
    const {
      name,
      brand,
      iso,
      format,
      type,
      expiration_date,
      count = 1,
      price,
      notes = "",
      editing_notes = "",
      is_ecn = false,
      is_bulk_film = false,
      bulk_length_meters,
    } = args;

    if (!name || !brand || !iso || !format || !type || !expiration_date) {
      throw new Error(
        "Missing required fields: name, brand, iso, format, type, expiration_date"
      );
    }

    const filmData: any = {
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

    // Include user_id if available
    if (this.userId) {
      filmData.user_id = this.userId;
    }

    if (price !== undefined) {
      filmData.price = price;
    }

    if (is_bulk_film && bulk_length_meters) {
      filmData.bulk_length_meters = bulk_length_meters;
      // Calculate number of rolls from bulk length using format-specific values
      const formatInfo = formatDimensions[format];
      const bulkLengthPerRoll = formatInfo?.bulkLengthPerRoll || 1.5;
      filmData.bulk_quantity = count;
      filmData.calculated_rolls = Math.floor(bulk_length_meters / bulkLengthPerRoll);
      filmData.count = filmData.calculated_rolls;
      // Calculate initial exposures based on format
      filmData.bulk_remaining_exposures = filmData.calculated_rolls * getExposuresPerRoll(format);
      filmData.spooled_cassettes = 0;
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
          text: JSON.stringify(
            {
              success: true,
              message: "Film created successfully",
              film: film,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async editFilm(args: any) {
    const { film_id, ...updateData } = args;

    if (!film_id) {
      throw new Error("film_id is required");
    }

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No fields to update");
    }

    // Handle bulk film calculations if relevant fields are being updated
    if (cleanedData.is_bulk_film && cleanedData.bulk_length_meters) {
      cleanedData.calculated_rolls = Math.floor(
        Number(cleanedData.bulk_length_meters) / 1.5
      );
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
          text: JSON.stringify(
            {
              success: true,
              message: "Film updated successfully",
              film: film,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async deleteFilm(args: any) {
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
          text: JSON.stringify(
            {
              success: true,
              message: `Film "${film.brand} ${film.name}" moved to trash`,
              deleted_film: {
                id: film_id,
                name: film.name,
                brand: film.brand,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async createTrip(args: any) {
    const { title, description = "", start_date, end_date } = args;

    if (!title || !start_date || !end_date) {
      throw new Error("Missing required fields: title, start_date, end_date");
    }

    // Validate date range
    if (new Date(end_date) < new Date(start_date)) {
      throw new Error("End date must be on or after start date");
    }

    const tripData: any = {
      title,
      description,
      start_date,
      end_date,
      status: "upcoming",
    };

    // Include user_id if available
    if (this.userId) {
      tripData.user_id = this.userId;
    }

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
          text: JSON.stringify(
            {
              success: true,
              message: "Trip created successfully",
              trip: trip,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async listTrips(args: any) {
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
          .select(
            `
            quantity,
            films (
              id,
              name,
              brand,
              iso,
              format,
              type
            )
          `
          )
          .eq("trip_id", trip.id);

        if (!filmsError) {
          trip.reserved_films = tripFilms || [];
        }
      }
    }

    const upcomingTrips =
      trips?.filter((trip: Trip) => {
        const startDate = new Date(trip.start_date);
        const today = new Date();
        return startDate >= today;
      }) || [];

    const pastTrips =
      trips?.filter((trip: Trip) => {
        const endDate = new Date(trip.end_date);
        const today = new Date();
        return endDate < today;
      }) || [];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              summary: {
                total_trips: trips?.length || 0,
                upcoming_trips: upcomingTrips.length,
                past_trips: pastTrips.length,
              },
              upcoming_trips: upcomingTrips,
              past_trips: include_past ? pastTrips : [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getTripDetails(args: any) {
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
      .select(
        `
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
      `
      )
      .eq("trip_id", trip_id);

    if (filmsError) {
      throw new Error(`Failed to fetch trip films: ${filmsError.message}`);
    }

    // Get reserved gear for this trip
    const { data: tripGear, error: gearError } = await this.supabase
      .from("trip_gear")
      .select(
        `
        gear (
          id,
          name,
          brand,
          type,
          model,
          condition,
          purchase_price
        )
      `
      )
      .eq("trip_id", trip_id);

    if (gearError) {
      throw new Error(`Failed to fetch trip gear: ${gearError.message}`);
    }

    const totalRolls =
      tripFilms?.reduce((sum: number, tf: any) => sum + tf.quantity, 0) || 0;
    const totalFilmValue =
      tripFilms?.reduce((sum: number, tf: any) => {
        return sum + tf.quantity * (tf.films?.price || 0);
      }, 0) || 0;

    const totalGearValue =
      tripGear?.reduce((sum: number, tg: any) => {
        return sum + (tg.gear?.purchase_price || 0);
      }, 0) || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
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
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async editTrip(args: any) {
    const { trip_id, ...updateData } = args;

    if (!trip_id) {
      throw new Error("trip_id is required");
    }

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

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
          text: JSON.stringify(
            {
              success: true,
              message: "Trip updated successfully",
              trip: trip,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async deleteTrip(args: any) {
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
          text: JSON.stringify(
            {
              success: true,
              message: `Trip "${trip.title}" deleted successfully`,
              deleted_trip: {
                id: trip_id,
                title: trip.title,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async reserveFilmForTrip(args: any) {
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
      throw new Error(
        `Not enough available stock. Available: ${film.available_count}, Requested: ${quantity}`
      );
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
    } else {
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
          text: JSON.stringify(
            {
              success: true,
              message: `${quantity} roll(s) of ${film.brand} ${film.name} ${result.action} for trip "${trip.title}"`,
              reservation: result,
              film: {
                name: film.name,
                brand: film.brand,
                remaining_available: film.available_count - quantity,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async removeFilmReservation(args: any) {
    const { trip_id, film_id } = args;

    if (!trip_id || !film_id) {
      throw new Error("trip_id and film_id are required");
    }

    // Get reservation details before deleting
    const { data: reservation, error: fetchError } = await this.supabase
      .from("trip_films")
      .select(
        `
        quantity,
        trips (title),
        films (name, brand)
      `
      )
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
      throw new Error(
        `Failed to remove film reservation: ${deleteError.message}`
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Removed ${reservation.quantity} roll(s) of ${reservation.films.brand} ${reservation.films.name} from trip "${reservation.trips.title}"`,
              removed_reservation: {
                quantity: reservation.quantity,
                film: `${reservation.films.brand} ${reservation.films.name}`,
                trip: reservation.trips.title,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async updateFilmReservationQuantity(args: any) {
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
      .select(
        `
        quantity,
        trips (title),
        films (name, brand)
      `
      )
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
      throw new Error(
        `Failed to update film reservation quantity: ${updateError.message}`
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Updated reservation for ${existingReservation.films.brand} ${existingReservation.films.name} in trip "${existingReservation.trips.title}" from ${existingReservation.quantity} to ${quantity} roll(s)`,
              updated_reservation: {
                old_quantity: existingReservation.quantity,
                new_quantity: quantity,
                film: `${existingReservation.films.brand} ${existingReservation.films.name}`,
                trip: existingReservation.trips.title,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getFilmsWithAvailability(args: any) {
    const { available_only = false, min_available = 1 } = args;

    let query = this.supabase.from("films_with_availability").select("*");

    if (available_only) {
      query = query.gte("available_count", min_available);
    }

    const { data: films, error } = await query
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch films with availability: ${error.message}`
      );
    }

    const availableFilms =
      films?.filter((f: Film) => (f.available_count || 0) >= min_available) ||
      [];
    const reservedFilms =
      films?.filter((f: Film) => (f.reserved_quantity || 0) > 0) || [];
    const totalValue =
      films?.reduce((sum: number, film: Film) => {
        return sum + (film.price || 0) * (film.available_count || 0);
      }, 0) || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              summary: {
                total_films: films?.length || 0,
                films_with_availability: availableFilms.length,
                films_with_reservations: reservedFilms.length,
                total_available_rolls:
                  films?.reduce(
                    (sum: number, f: Film) => sum + (f.available_count || 0),
                    0
                  ) || 0,
                total_reserved_rolls:
                  films?.reduce(
                    (sum: number, f: Film) => sum + (f.reserved_quantity || 0),
                    0
                  ) || 0,
                available_inventory_value: totalValue,
              },
              films: films || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async createGear(args: any) {
    const {
      name,
      brand,
      type,
      model,
      serial_number,
      purchase_date,
      purchase_price,
      condition = "good",
      notes = "",
    } = args;

    if (!name || !brand || !type || !condition) {
      throw new Error("Missing required fields: name, brand, type, condition");
    }

    const gearData: any = {
      name,
      brand,
      type,
      condition,
      notes,
    };

    // Only set user_id if it's configured
    if (this.userId) {
      gearData.user_id = this.userId;
    }

    if (model) gearData.model = model;
    if (serial_number) gearData.serial_number = serial_number;
    if (purchase_date) gearData.purchase_date = purchase_date;
    if (purchase_price !== undefined) gearData.purchase_price = purchase_price;

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
          text: JSON.stringify(
            {
              success: true,
              message: "Gear created successfully",
              gear: gear,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async listGear(args: any) {
    const { type, brand, condition, include_trip_reservations = false } = args;

    let query = this.supabase.from("gear").select("*");

    // Only filter by user_id if it's set
    if (this.userId) {
      query = query.eq("user_id", this.userId);
    }

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
          .select(
            `
            trips (
              id,
              title,
              start_date,
              end_date
            )
          `
          )
          .eq("gear_id", item.id);

        item.trip_reservations = reservations || [];
      }
    }

    const totalValue =
      gear?.reduce((sum: number, item: Gear) => {
        return sum + (item.purchase_price || 0);
      }, 0) || 0;

    const gearByType =
      gear?.reduce((acc: Record<string, number>, item: Gear) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}) || {};

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
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
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async editGear(args: any) {
    const { gear_id, ...updateData } = args;

    if (!gear_id) {
      throw new Error("gear_id is required");
    }

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("No fields to update");
    }

    let updateQuery = this.supabase
      .from("gear")
      .update(cleanedData)
      .eq("id", gear_id);

    if (this.userId) {
      updateQuery = updateQuery.eq("user_id", this.userId);
    }

    const { data: gear, error } = await updateQuery.select().single();

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
          text: JSON.stringify(
            {
              success: true,
              message: "Gear updated successfully",
              gear: gear,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async deleteGear(args: any) {
    const { gear_id } = args;

    if (!gear_id) {
      throw new Error("gear_id is required");
    }

    // First check if gear exists and get its info
    let fetchQuery = this.supabase
      .from("gear")
      .select("name, brand, type")
      .eq("id", gear_id);

    if (this.userId) {
      fetchQuery = fetchQuery.eq("user_id", this.userId);
    }

    const { data: gear, error: fetchError } = await fetchQuery.single();

    if (fetchError || !gear) {
      throw new Error("Gear not found");
    }

    // Check if gear is reserved for any upcoming trips
    const { data: reservations } = await this.supabase
      .from("trip_gear")
      .select(
        `
        trips (
          title,
          start_date,
          end_date
        )
      `
      )
      .eq("gear_id", gear_id);

    const upcomingReservations =
      reservations?.filter((r: any) => {
        const tripStartDate = new Date(r.trips.start_date);
        const today = new Date();
        return tripStartDate >= today;
      }) || [];

    if (upcomingReservations.length > 0) {
      const tripTitles = upcomingReservations
        .map((r: any) => r.trips.title)
        .join(", ");
      throw new Error(
        `Cannot delete gear: it's reserved for upcoming trips: ${tripTitles}`
      );
    }

    // Delete the gear
    let deleteQuery = this.supabase.from("gear").delete().eq("id", gear_id);

    if (this.userId) {
      deleteQuery = deleteQuery.eq("user_id", this.userId);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      throw new Error(`Failed to delete gear: ${deleteError.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Gear "${gear.brand} ${gear.name}" (${gear.type}) deleted successfully`,
              deleted_gear: {
                id: gear_id,
                name: gear.name,
                brand: gear.brand,
                type: gear.type,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getGearStats(args: any) {
    const { group_by = "type" } = args;

    let statsQuery = this.supabase.from("gear").select("*");

    if (this.userId) {
      statsQuery = statsQuery.eq("user_id", this.userId);
    }

    const { data: gear, error } = await statsQuery;

    if (error) {
      throw new Error(`Failed to fetch gear for stats: ${error.message}`);
    }

    const stats: Record<string, any> = {};

    gear?.forEach((item: Gear) => {
      const key = item[group_by as keyof Gear] as string;

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

    const totalValue =
      gear?.reduce(
        (sum: number, item: Gear) => sum + (item.purchase_price || 0),
        0
      ) || 0;
    const totalGear = gear?.length || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              grouped_by: group_by,
              total_categories: Object.keys(stats).length,
              overall_summary: {
                total_gear: totalGear,
                total_value: totalValue,
                average_value: totalGear > 0 ? totalValue / totalGear : 0,
              },
              statistics: stats,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async reserveGearForTrip(args: any) {
    const { trip_id, gear_id } = args;

    if (!trip_id || !gear_id) {
      throw new Error("trip_id and gear_id are required");
    }

    // Check if trip exists and belongs to user
    let tripQuery = this.supabase.from("trips").select("title").eq("id", trip_id);
    if (this.userId) {
      tripQuery = tripQuery.eq("user_id", this.userId);
    }
    const { data: trip, error: tripError } = await tripQuery.single();

    if (tripError || !trip) {
      throw new Error("Trip not found");
    }

    // Check if gear exists and belongs to user
    let gearQuery = this.supabase
      .from("gear")
      .select("name, brand, type")
      .eq("id", gear_id);
    if (this.userId) {
      gearQuery = gearQuery.eq("user_id", this.userId);
    }
    const { data: gear, error: gearError } = await gearQuery.single();

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
      throw new Error(
        `Gear "${gear.brand} ${gear.name}" is already reserved for trip "${trip.title}"`
      );
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
          text: JSON.stringify(
            {
              success: true,
              message: `${gear.brand} ${gear.name} (${gear.type}) reserved for trip "${trip.title}"`,
              reservation: {
                id: reservation.id,
                trip_title: trip.title,
                gear: `${gear.brand} ${gear.name}`,
                gear_type: gear.type,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async removeGearReservation(args: any) {
    const { trip_id, gear_id } = args;

    if (!trip_id || !gear_id) {
      throw new Error("trip_id and gear_id are required");
    }

    // Get reservation details before deleting
    const { data: reservation, error: fetchError } = await this.supabase
      .from("trip_gear")
      .select(
        `
        trips (title),
        gear (name, brand, type)
      `
      )
      .eq("trip_id", trip_id)
      .eq("gear_id", gear_id)
      .single();

    if (fetchError || !reservation) {
      throw new Error("Gear reservation not found for this trip");
    }

    // Verify the trip and gear belong to the user (additional security)
    if (this.userId) {
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
    }

    // Delete the reservation
    const { error: deleteError } = await this.supabase
      .from("trip_gear")
      .delete()
      .eq("trip_id", trip_id)
      .eq("gear_id", gear_id);

    if (deleteError) {
      throw new Error(
        `Failed to remove gear reservation: ${deleteError.message}`
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Removed ${reservation.gear.brand} ${reservation.gear.name} (${reservation.gear.type}) from trip "${reservation.trips.title}"`,
              removed_reservation: {
                gear: `${reservation.gear.brand} ${reservation.gear.name}`,
                gear_type: reservation.gear.type,
                trip: reservation.trips.title,
              },
            },
            null,
            2
          ),
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
