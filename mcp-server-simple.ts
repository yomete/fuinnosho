#!/usr/bin/env node

/**
 * Fuinnosho Film Inventory MCP Server
 * Provides Claude with real-time access to film inventory data
 */

import * as Sentry from "@sentry/node";

// Initialize Sentry first, before any other imports
Sentry.init({
  dsn: process.env.SENTRY_DSN || "YOUR_SENTRY_DSN_HERE",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || "development",
});

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

interface Challenge {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  created_at: string;
  updated_at: string;
}

interface ChallengePrompt {
  id: string;
  challenge_id: string;
  day_number: number;
  title: string;
  prompt_text: string;
  film_suggestion?: string;
  frame_range?: string;
  location_context?: string;
  special_notes?: string;
  phase?: string;
  created_at: string;
}

interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  prompt_id: string;
  completion_date?: string;
  completed: boolean;
  notes?: string;
  photos_taken: number;
  film_used_id?: string;
  frames_used?: number;
  reflection?: string;
  created_at: string;
  updated_at: string;
}

interface ChallengeFilmRoll {
  id: string;
  user_id: string;
  challenge_id: string;
  film_id: string;
  roll_number: number;
  start_date?: string;
  end_date?: string;
  frames_used: number;
  frames_total: number;
  status: 'loaded' | 'active' | 'completed' | 'developed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

class FilmInventoryMCPServer {
  private server: Server;
  private supabase: any;

  constructor() {
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

    // Wrap server with Sentry monitoring
    this.server = Sentry.wrapMcpServerWithSentry(server);

    this.setupToolHandlers();
    this.initializeSupabase();
  }

  private initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables. Please set:");
      console.error("NEXT_PUBLIC_SUPABASE_URL");
      console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      process.exit(1);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_film_inventory",
          description: "Get complete film inventory with current stock levels and summary statistics",
          inputSchema: {
            type: "object",
            properties: {
              include_availability: {
                type: "boolean",
                description: "Include availability data for trip planning (shows reserved quantities)",
                default: false,
              },
            },
          },
        },
        {
          name: "filter_films",
          description: "Filter films by type (color/bw/cinema), ISO range, format, brand, or stock status",
          inputSchema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description: "Film type: color, bw, or cinema",
                enum: ["color", "bw", "cinema"],
              },
              iso_min: {
                type: "number",
                description: "Minimum ISO value (e.g., 100)",
                minimum: 1,
              },
              iso_max: {
                type: "number",
                description: "Maximum ISO value (e.g., 3200)",
                minimum: 1,
              },
              format: {
                type: "string",
                description: "Film format: 35mm, 120, or 4x5",
                enum: ["35mm", "120", "4x5"],
              },
              brand: {
                type: "string",
                description: "Film brand (partial match, e.g., 'Kodak', 'Fuji')",
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
          description: "Reduce film count when using rolls and record usage in history",
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
                minimum: 1,
              },
              usage_note: {
                type: "string",
                description: "Description of how the film was used (e.g., 'Wedding shoot at Central Park')",
              },
            },
            required: ["film_id", "quantity", "usage_note"],
          },
        },
        {
          name: "check_low_stock",
          description: "Check for films with low stock levels or out of stock",
          inputSchema: {
            type: "object",
            properties: {
              threshold: {
                type: "number",
                description: "Stock level considered low (default: 3)",
                default: 3,
                minimum: 0,
              },
              include_out_of_stock: {
                type: "boolean",
                description: "Include films with 0 count in results",
                default: true,
              },
            },
          },
        },
        {
          name: "get_film_usage_history",
          description: "Get complete usage history for a specific film",
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
          name: "get_challenges",
          description: "Get all photography challenges",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_challenge",
          description: "Get a specific challenge by ID with full details",
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
          name: "get_todays_prompt",
          description: "Get today's prompt for an active challenge",
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
            },
            required: ["prompt_id"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_film_inventory":
            return await this.getFilmInventory(args);
          case "filter_films":
            return await this.filterFilms(args);
          case "update_film_quantity":
            return await this.updateFilmQuantity(args);
          case "check_low_stock":
            return await this.checkLowStock(args);
          case "get_film_usage_history":
            return await this.getFilmUsageHistory(args);
          case "get_film_stats":
            return await this.getFilmStats(args);
          case "get_challenges":
            return await this.getChallenges(args);
          case "get_challenge":
            return await this.getChallenge(args);
          case "get_challenge_prompts":
            return await this.getChallengePrompts(args);
          case "get_todays_prompt":
            return await this.getTodaysPrompt(args);
          case "get_challenge_prompt":
            return await this.getChallengePrompt(args);
          case "update_challenge_prompt":
            return await this.updateChallengePrompt(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
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

  private async getFilmInventory(args: any) {
    const { include_availability = false } = args;
    
    const tableName = include_availability ? "films_with_availability" : "films";
    
    const { data: films, error } = await this.supabase
      .from(tableName)
      .select("*")
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch films: ${error.message}`);
    }

    const totalValue = films?.reduce((sum: number, film: Film) => {
      return sum + ((film.price || 0) * (film.count || 0));
    }, 0) || 0;

    const totalRolls = films?.reduce((sum: number, film: Film) => {
      return sum + (film.count || 0);
    }, 0) || 0;

    const inStock = films?.filter((f: Film) => (f.count || 0) > 0).length || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            summary: {
              total_films: films?.length || 0,
              films_in_stock: inStock,
              total_rolls: totalRolls,
              total_value: `$${totalValue.toFixed(2)}`,
            },
            films: films || [],
          }, null, 2),
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

    let query = this.supabase.from("films").select("*");

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
              iso_range: iso_min !== undefined || iso_max !== undefined ? 
                `${iso_min || 'any'}-${iso_max || 'any'}` : null,
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
    if (currentCount < quantity) {
      throw new Error(`Insufficient stock. Current count: ${currentCount}, requested: ${quantity}`);
    }

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
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async checkLowStock(args: any) {
    const { threshold = 3, include_out_of_stock = true } = args;

    let query = this.supabase
      .from("films")
      .select("*")
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
    const lowStock = films?.filter((f: Film) => (f.count || 0) > 0 && (f.count || 0) <= threshold) || [];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            alert_threshold: threshold,
            summary: {
              out_of_stock_count: outOfStock.length,
              low_stock_count: lowStock.length,
              total_alerts: films?.length || 0,
            },
            out_of_stock: outOfStock,
            low_stock: lowStock,
          }, null, 2),
        },
      ],
    };
  }

  private async getFilmUsageHistory(args: any) {
    const { film_id } = args;

    if (!film_id) {
      throw new Error("film_id is required");
    }

    // Get film info
    const { data: film, error: filmError } = await this.supabase
      .from("films")
      .select("name, brand")
      .eq("id", film_id)
      .single();

    if (filmError || !film) {
      throw new Error("Film not found");
    }

    // Get usage history
    const { data: usage, error } = await this.supabase
      .from("film_usage")
      .select("*")
      .eq("film_id", film_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch usage history: ${error.message}`);
    }

    const totalUsed = usage?.reduce((sum: number, u: FilmUsage) => sum + u.quantity, 0) || 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            film: `${film.brand} ${film.name}`,
            film_id,
            total_usage_records: usage?.length || 0,
            total_rolls_used: totalUsed,
            usage_history: usage || [],
          }, null, 2),
        },
      ],
    };
  }

  private async getFilmStats(args: any) {
    const { group_by = "type" } = args;

    const { data: films, error } = await this.supabase
      .from("films")
      .select("*");

    if (error) {
      throw new Error(`Failed to fetch films for stats: ${error.message}`);
    }

    const stats: Record<string, any> = {};
    
    films?.forEach((film: Film) => {
      const key = String(film[group_by as keyof Film] || "unknown");
      
      if (!stats[key]) {
        stats[key] = {
          unique_films: 0,
          total_rolls: 0,
          total_value: 0,
          films: [],
        };
      }
      
      stats[key].unique_films++;
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

  private async getChallenges(args: any) {
    const { data: challenges, error } = await this.supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch challenges: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            challenges: challenges || [],
            total_challenges: (challenges || []).length,
          }, null, 2),
        },
      ],
    };
  }

  private async getChallenge(args: any) {
    const { challenge_id } = args;

    const { data: challenge, error } = await this.supabase
      .from("challenges")
      .select("*")
      .eq("id", challenge_id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch challenge: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(challenge, null, 2),
        },
      ],
    };
  }

  private async getChallengePrompts(args: any) {
    const { challenge_id } = args;

    const { data: prompts, error } = await this.supabase
      .from("challenge_prompts")
      .select("*")
      .eq("challenge_id", challenge_id)
      .order("day_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch challenge prompts: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            prompts: prompts || [],
            total_prompts: (prompts || []).length,
          }, null, 2),
        },
      ],
    };
  }

  private async getTodaysPrompt(args: any) {
    const { challenge_id } = args;

    // Get the challenge first
    const { data: challenge, error: challengeError } = await this.supabase
      .from("challenges")
      .select("*")
      .eq("id", challenge_id)
      .single();

    if (challengeError || !challenge) {
      throw new Error(`Failed to fetch challenge: ${challengeError?.message || 'Challenge not found'}`);
    }

    // Calculate current day
    const today = new Date();
    const startDate = new Date(challenge.start_date);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.max(1, Math.min(diffDays, challenge.total_days));

    // Get today's prompt
    const { data: prompt, error } = await this.supabase
      .from("challenge_prompts")
      .select("*")
      .eq("challenge_id", challenge_id)
      .eq("day_number", currentDay)
      .single();

    if (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              challenge,
              current_day: currentDay,
              error: "No prompt found for today",
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            challenge,
            current_day: currentDay,
            todays_prompt: prompt,
          }, null, 2),
        },
      ],
    };
  }

  private async getChallengePrompt(args: any) {
    const { prompt_id } = args;

    const { data: prompt, error } = await this.supabase
      .from("challenge_prompts")
      .select("*")
      .eq("id", prompt_id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch challenge prompt: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(prompt, null, 2),
        },
      ],
    };
  }

  private async updateChallengePrompt(args: any) {
    const { prompt_id, ...updates } = args;

    // Remove any undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const { data, error } = await this.supabase
      .from("challenge_prompts")
      .update(cleanUpdates)
      .eq("id", prompt_id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update challenge prompt: ${error.message}`);
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Film Inventory MCP server running on stdio");
  }
}

const server = new FilmInventoryMCPServer();
server.run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});