#!/bin/bash

echo "Setting up Fuinnosho Film Inventory MCP Server..."

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Environment variables not set. Please set:"
    echo "   export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "   export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo ""
fi

# Test environment variables
echo "Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    exit 1
fi

echo "✅ Environment variables are set"
echo "   URL: ${NEXT_PUBLIC_SUPABASE_URL}"
echo "   Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."

# Test basic server startup
echo ""
echo "Testing MCP server startup..."
echo "Starting server (will output startup message then exit)..."

# Run server with a quick stdin test
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx tsx mcp-server-simple.ts 2>&1 | head -5

echo ""
echo "✅ If you saw 'Film Inventory MCP server running on stdio' above, the server is working!"

echo ""
echo "🎯 Setup complete! Your MCP server is ready."
echo ""
echo "📋 To configure Claude Desktop, add this to your config:"
echo "   ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"fuinnosho-film-inventory\": {"
echo "      \"command\": \"npx\","
echo "      \"args\": [\"tsx\", \"$(pwd)/mcp-server-simple.ts\"],"
echo "      \"env\": {"
echo "        \"NEXT_PUBLIC_SUPABASE_URL\": \"$NEXT_PUBLIC_SUPABASE_URL\","
echo "        \"NEXT_PUBLIC_SUPABASE_ANON_KEY\": \"$NEXT_PUBLIC_SUPABASE_ANON_KEY\""
echo "      }"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "🚀 After configuring Claude Desktop, you can ask things like:"
echo "   - 'What color film do I have in 35mm?'"
echo "   - 'Show me films with ISO 400 or higher'"
echo "   - 'Which films are low on stock?'"
echo "   - 'I used 2 rolls of Portra 400 for a wedding'"


