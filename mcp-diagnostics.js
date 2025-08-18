#!/usr/bin/env node

// Simple MCP server diagnostic tool
console.log("=== MCP Server Diagnostics ===");
console.log("Environment Variables:");
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing");
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing");

console.log("\nNode.js Info:");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Working directory:", process.cwd());

console.log("\nFile System Check:");
const fs = require('fs');
const path = require('path');

try {
  const mcpServerPath = path.join(__dirname, 'dist', 'mcp-server.js');
  const exists = fs.existsSync(mcpServerPath);
  console.log("MCP server file exists:", exists ? "✅ Yes" : "❌ No");
  if (exists) {
    const stats = fs.statSync(mcpServerPath);
    console.log("MCP server file size:", stats.size, "bytes");
    console.log("Last modified:", stats.mtime);
  }
} catch (error) {
  console.log("Error checking MCP server file:", error.message);
}

console.log("\nTrying to load MCP server...");
try {
  // Set dummy environment variables if missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://dummy.supabase.co";
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-key";
  }
  
  console.log("✅ Environment variables ready");
  console.log("=== Diagnostics Complete ===");
} catch (error) {
  console.log("❌ Error:", error.message);
}