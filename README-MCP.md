# Fuinnosho Film Inventory MCP Server

This MCP (Model Context Protocol) server provides Claude with real-time access to your film inventory data during photography planning conversations.

## Features

### Core Tools

1. **`get_film_inventory`** - Get complete film inventory with stock levels
   - Optional availability data for trip planning
   - Summary statistics (total films, rolls, value)

2. **`filter_films`** - Filter films by multiple criteria
   - Film type (color/bw/cinema)
   - ISO range (min/max)
   - Format (35mm, 120, 4x5)
   - Brand (partial matching)
   - Stock status (in-stock only option)

3. **`update_film_quantity`** - Update quantities when using rolls
   - Reduces film count
   - Records usage in film_usage table
   - Tracks usage notes

4. **`check_low_stock`** - Monitor inventory levels
   - Configurable threshold (default: 3 rolls)
   - Separate out-of-stock and low-stock alerts
   - Sorted by urgency

5. **`get_film_usage_history`** - View usage history for specific films
   - Complete usage log with notes
   - Total usage statistics

6. **`get_film_stats`** - Aggregate inventory statistics
   - Group by type, brand, format, or ISO
   - Value and quantity summaries

7. **`get_loaded_films`** - See which roll is in which camera right now
   - Loaded rolls with camera, film, box speed, and shooting EI
   - Cameras that are currently empty

8. **`load_film`** - Load a roll into a camera
   - Holds the roll: it can't be reserved for a trip or loaded elsewhere
   - Optional shooting EI (e.g. ISO 400 film shot at 800) and note
   - One roll per camera

9. **`unload_film`** - Finish a loaded roll
   - `outcome: "shot"` consumes a roll and logs it to usage history
   - `outcome: "unused"` releases the hold and leaves the count alone
   - Optionally attributes a shot roll to a trip

## Setup

### 1. Install Dependencies

```bash
# In your project directory
npm install @modelcontextprotocol/sdk @supabase/supabase-js tsx typescript @types/node
```

### 2. Environment Variables

Ensure these are set in your environment:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Build the Server

```bash
# Build TypeScript to JavaScript into dist/
pnpm build:mcp

# Or run the TypeScript source directly
npx tsx --env-file=.env.local mcp-server.ts
```

Restart the MCP client after each build to load the new code.

### 4. Configure Claude Desktop

Add to your Claude Desktop MCP settings (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "fuinnosho-film-inventory": {
      "command": "node",
      "args": ["/path/to/fuinnosho/dist/mcp-server.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your_supabase_url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your_supabase_anon_key"
      }
    }
  }
}
```

## Usage Examples

Once connected, you can ask Claude things like:

### Planning Questions
- "What color film do I have in 35mm format?"
- "Show me all films with ISO 400 or higher"
- "Which films are running low on stock?"

### Inventory Management
- "I just used 2 rolls of Portra 400 for a wedding shoot"
- "What's my total film inventory worth?"
- "Show me usage history for my Tri-X"

### Loaded Film
- "What's in my cameras right now?"
- "Load a roll of Portra 400 into the Nikon F3, shooting it at 800"
- "I finished the roll in the F3"

### Trip Planning
- "What films should I bring for a street photography trip?"
- "Do I have enough high-speed film for low light?"
- "Check availability for upcoming trip reservations"

## Integration with Existing System

This MCP server integrates seamlessly with your existing Fuinnosho codebase:

- **Authentication**: Uses your existing Supabase RLS policies
- **Data Models**: Compatible with your Film and FilmUsage interfaces  
- **Database Views**: Leverages films_with_availability for trip planning
- **Usage Tracking**: Records to the same film_usage table your app uses

## Security

- All database operations respect Row Level Security (RLS)
- No direct database credentials exposed
- Uses same Supabase client configuration as your app
- Read-only operations for inventory queries
- Write operations only for usage tracking (same as your app)

## Timeouts

Each Supabase request aborts after 10 seconds (`MCP_QUERY_TIMEOUT_MS`). A tool with several requests can take longer. An aborted request does not prove that a database write failed; check the result before you retry a write.

## Troubleshooting

### Tools Return Old Behaviour After a Rebuild
Quit the MCP client fully and open it again. A window close may leave the server process active.

### Server Won't Start
- Check environment variables are set
- Verify Supabase credentials
- Ensure dependencies are installed

### No Data Returned
- Verify user authentication in Supabase
- Check RLS policies allow access
- Confirm films table has data for your user

### Permission Errors
- Ensure Supabase anon key has correct permissions
- Verify RLS policies are properly configured
- Check user_id associations in films table