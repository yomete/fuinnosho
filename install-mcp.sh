#!/bin/bash

# Installation script for MCP server dependencies
echo "Installing MCP server dependencies..."

# Install required packages
npm install @modelcontextprotocol/sdk @supabase/supabase-js tsx typescript @types/node

# Test the MCP server first with tsx
echo "Testing MCP server..."
echo "Running: npx tsx mcp-server.ts"
echo "You can test with: echo '{\"method\":\"tools/list\",\"params\":{}}' | npx tsx mcp-server.ts"
echo ""
echo "Building MCP server..."
npx tsc --project tsconfig.mcp.json

echo "MCP server setup complete!"
echo ""
echo "Next steps:"
echo "1. Set your environment variables:"
echo "   export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
echo "   export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo ""
echo "2. Test the server:"
echo "   node dist/mcp-server.js"
echo ""
echo "3. Configure Claude Desktop with the path to dist/mcp-server.js"