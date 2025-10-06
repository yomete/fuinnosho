# MCP Server Update Guide for Chemistry & Development Features

This guide outlines the changes needed to add chemistry inventory and development session tools to your MCP server.

## 1. Add New Interfaces

Add these interfaces after the existing interfaces (around line 180):

```typescript
interface ChemistryInventory {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  chemistry_type: 'developer' | 'stop_bath' | 'fixer' | 'bleach' | 'hypo_clear' | 'wetting_agent' | 'pre_wash' | 'other';
  process_type: 'black_white' | 'color';
  volume_ml: number;
  original_volume_ml: number;
  purchase_date?: string;
  expiry_date?: string;
  opened_date?: string;
  cost?: number;
  storage_location?: string;
  notes?: string;
  max_reuses: number;
  times_used: number;
  total_volume_processed_ml: number;
  created_at: string;
  updated_at: string;
}

interface DevelopmentRecipe {
  id: string;
  user_id: string;
  name: string;
  film_type?: string;
  developer_id: string;
  dilution_ratio?: string;
  temperature_celsius?: number;
  development_time_minutes?: number;
  agitation_pattern?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DevelopmentSession {
  id: string;
  user_id: string;
  session_date: string;
  process_type: 'black_white' | 'color';
  temperature_celsius?: number;
  notes?: string;
  total_cost: number;
  created_at: string;
}
```

## 2. Add New Tools to ListToolsRequestSchema Handler

Add these tool definitions to the tools array (find where "create_film", "edit_film" are defined):

### Chemistry Inventory Tools

```typescript
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
```

### Development Recipe Tools

```typescript
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
```

### Development Session Tools

```typescript
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
```

## 3. Add Tool Handlers in CallToolRequestSchema Handler

Add these case statements in the switch statement (find where "create_film", "edit_film" cases are):

```typescript
case "list_chemistry": {
  const processType = args.process_type as 'black_white' | 'color' | undefined;
  let query = this.supabase
    .from("chemistry_inventory")
    .select("*")
    .eq("user_id", this.userId)
    .order("created_at", { ascending: false });

  if (processType) {
    query = query.eq("process_type", processType);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch chemistry: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

case "create_chemistry": {
  const chemData = {
    user_id: this.userId,
    name: args.name,
    brand: args.brand,
    chemistry_type: args.chemistry_type,
    process_type: args.process_type,
    volume_ml: args.volume_ml,
    original_volume_ml: args.original_volume_ml,
    purchase_date: args.purchase_date,
    expiry_date: args.expiry_date,
    cost: args.cost,
    storage_location: args.storage_location,
    max_reuses: args.max_reuses || 1,
    times_used: 0,
    total_volume_processed_ml: 0,
    notes: args.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await this.supabase
    .from("chemistry_inventory")
    .insert([chemData])
    .select()
    .single();

  if (error) throw new Error(`Failed to create chemistry: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: `Chemistry "${data.name}" added successfully. ID: ${data.id}`,
      },
    ],
  };
}

case "edit_chemistry": {
  const updates: any = { updated_at: new Date().toISOString() };
  if (args.name) updates.name = args.name;
  if (args.brand) updates.brand = args.brand;
  if (args.volume_ml !== undefined) updates.volume_ml = args.volume_ml;
  if (args.opened_date) updates.opened_date = args.opened_date;
  if (args.times_used !== undefined) updates.times_used = args.times_used;
  if (args.notes) updates.notes = args.notes;

  const { error } = await this.supabase
    .from("chemistry_inventory")
    .update(updates)
    .eq("id", args.id)
    .eq("user_id", this.userId);

  if (error) throw new Error(`Failed to update chemistry: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: `Chemistry updated successfully`,
      },
    ],
  };
}

case "delete_chemistry": {
  const { error } = await this.supabase
    .from("chemistry_inventory")
    .delete()
    .eq("id", args.id)
    .eq("user_id", this.userId);

  if (error) throw new Error(`Failed to delete chemistry: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: "Chemistry deleted successfully",
      },
    ],
  };
}

case "list_recipes": {
  const { data, error } = await this.supabase
    .from("development_recipes")
    .select(`
      *,
      developer:chemistry_inventory(*)
    `)
    .eq("user_id", this.userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch recipes: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

case "create_recipe": {
  const recipeData = {
    user_id: this.userId,
    name: args.name,
    film_type: args.film_type,
    developer_id: args.developer_id,
    dilution_ratio: args.dilution_ratio,
    temperature_celsius: args.temperature_celsius,
    development_time_minutes: args.development_time_minutes,
    agitation_pattern: args.agitation_pattern,
    notes: args.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await this.supabase
    .from("development_recipes")
    .insert([recipeData])
    .select()
    .single();

  if (error) throw new Error(`Failed to create recipe: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: `Recipe "${data.name}" created successfully. ID: ${data.id}`,
      },
    ],
  };
}

case "delete_recipe": {
  const { error } = await this.supabase
    .from("development_recipes")
    .delete()
    .eq("id", args.id)
    .eq("user_id", this.userId);

  if (error) throw new Error(`Failed to delete recipe: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: "Recipe deleted successfully",
      },
    ],
  };
}

case "list_development_sessions": {
  const processType = args.process_type as 'black_white' | 'color' | undefined;
  let query = this.supabase
    .from("development_sessions")
    .select(`
      *,
      session_films(*),
      session_chemistry_usage(*)
    `)
    .eq("user_id", this.userId)
    .order("session_date", { ascending: false });

  if (processType) {
    query = query.eq("process_type", processType);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch sessions: ${error.message}`);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

case "get_films_from_completed_trips": {
  const processType = args.process_type as 'black_white' | 'color' | undefined;

  const { data: completedTrips, error: tripsError } = await this.supabase
    .from("trips")
    .select(`
      id,
      trip_films (
        film_id,
        films (*)
      )
    `)
    .eq("status", "completed")
    .eq("user_id", this.userId);

  if (tripsError) throw new Error(`Failed to fetch trips: ${tripsError.message}`);

  const filmsMap = new Map();
  completedTrips?.forEach((trip: any) => {
    trip.trip_films?.forEach((tf: any) => {
      if (tf.films) {
        const film = tf.films;
        if (processType) {
          const isBlackWhite = film.type?.toLowerCase().includes('black') ||
                               film.type?.toLowerCase().includes('b&w') ||
                               film.type?.toLowerCase().includes('bw');
          if (processType === 'black_white' && !isBlackWhite) return;
          if (processType === 'color' && isBlackWhite) return;
        }
        filmsMap.set(film.id, film);
      }
    });
  });

  const films = Array.from(filmsMap.values());

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(films, null, 2),
      },
    ],
  };
}

case "create_development_session": {
  // Calculate total cost
  let totalCost = 0;
  for (const chemUsage of args.chemistry_usage) {
    const { data: chemistry } = await this.supabase
      .from("chemistry_inventory")
      .select("cost, original_volume_ml")
      .eq("id", chemUsage.chemistry_id)
      .single();

    if (chemistry && chemistry.cost) {
      const costPerMl = chemistry.cost / chemistry.original_volume_ml;
      totalCost += costPerMl * chemUsage.volume_used_ml;
    }
  }

  // Create session
  const sessionData = {
    user_id: this.userId,
    session_date: args.session_date,
    process_type: args.process_type,
    temperature_celsius: args.temperature_celsius,
    notes: args.notes,
    total_cost: totalCost,
    created_at: new Date().toISOString(),
  };

  const { data: session, error: sessionError } = await this.supabase
    .from("development_sessions")
    .insert([sessionData])
    .select()
    .single();

  if (sessionError) throw new Error(`Failed to create session: ${sessionError.message}`);

  // Insert session_films
  const sessionFilms = args.film_ids.map((filmId: string) => ({
    session_id: session.id,
    film_id: filmId,
    created_at: new Date().toISOString(),
  }));

  await this.supabase.from("session_films").insert(sessionFilms);

  // Insert chemistry usage and update inventory
  for (const chemUsage of args.chemistry_usage) {
    await this.supabase.from("session_chemistry_usage").insert([{
      session_id: session.id,
      chemistry_id: chemUsage.chemistry_id,
      volume_used_ml: chemUsage.volume_used_ml,
      dilution_ratio: chemUsage.dilution_ratio,
      development_time_minutes: chemUsage.development_time_minutes,
      notes: chemUsage.notes,
      created_at: new Date().toISOString(),
    }]);

    // Update chemistry inventory
    const { data: chem } = await this.supabase
      .from("chemistry_inventory")
      .select("*")
      .eq("id", chemUsage.chemistry_id)
      .single();

    if (chem) {
      await this.supabase
        .from("chemistry_inventory")
        .update({
          volume_ml: Math.max(0, chem.volume_ml - chemUsage.volume_used_ml),
          times_used: chem.times_used + 1,
          total_volume_processed_ml: chem.total_volume_processed_ml +
            (args.film_ids.length * chemUsage.volume_used_ml),
          updated_at: new Date().toISOString(),
        })
        .eq("id", chemUsage.chemistry_id);
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Development session created successfully. ID: ${session.id}, Total cost: $${totalCost.toFixed(2)}`,
      },
    ],
  };
}
```

## 4. Rebuild the MCP Server

After making all the above changes, rebuild the MCP server:

```bash
npx tsc --project tsconfig.mcp.json
```

## Summary

The MCP server now supports:
- ✅ Chemistry inventory management (list, create, edit, delete)
- ✅ Development recipes (list, create, delete)
- ✅ Development sessions (list, create, get films from completed trips)
- ✅ Automatic chemistry volume tracking and reuse counting
- ✅ Cost calculation for development sessions
- ✅ Integration with completed trips to find films ready for development
