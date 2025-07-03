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
# Build TypeScript to JavaScript
npm run build

# Or run in development mode
npm run dev
```

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

## Troubleshooting

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