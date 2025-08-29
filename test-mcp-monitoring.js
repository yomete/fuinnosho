#!/usr/bin/env node

// Simple MCP client to test monitoring integration
import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';

console.log('🧪 Testing MCP Monitoring Integration...\n');

// Test input - simulate calling the get_film_inventory tool
const testInput = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "get_film_inventory",
    arguments: {
      include_availability: true
    }
  }
};

console.log('📤 Sending tool call request...');
console.log('Tool:', testInput.params.name);
console.log('Args:', JSON.stringify(testInput.params.arguments, null, 2));

// Start MCP server process
const mcpServer = spawn('npx', ['tsx', 'mcp-server.ts'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env }
});

let responseData = '';
let errorData = '';

mcpServer.stdout.on('data', (data) => {
  responseData += data.toString();
});

mcpServer.stderr.on('data', (data) => {
  errorData += data.toString();
  console.log('📊 Server output:', data.toString());
});

// Send the test request
setTimeout(() => {
  console.log('\n📤 Sending request to MCP server...');
  mcpServer.stdin.write(JSON.stringify(testInput) + '\n');
}, 1000);

// Wait for response and cleanup
setTimeout(() => {
  console.log('\n📋 Test Results:');
  console.log('=================');
  
  if (responseData) {
    console.log('✅ Response received:', responseData.substring(0, 200) + '...');
  } else {
    console.log('❌ No response received');
  }
  
  if (errorData.includes('Authentication') || errorData.includes('Supabase')) {
    console.log('⚠️  Expected authentication errors (need real Supabase config)');
  }
  
  console.log('\n🔍 Check the monitoring dashboard for events!');
  console.log('Dashboard: https://mcp-monitoring.vercel.app');
  
  mcpServer.kill();
  process.exit(0);
}, 5000);

mcpServer.on('error', (error) => {
  console.error('❌ Error starting MCP server:', error);
  process.exit(1);
});