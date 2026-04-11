import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { createMcpSupabaseClient } from "@/lib/mcp/supabase";
import {
  createToolHandlers,
  TOOL_DEFINITIONS,
  type MCPToolResult,
} from "@/lib/mcp/tools";
import type { ToolName } from "@/lib/mcp/tool-types";

const handler = createMcpHandler(
  (server) => {
    const { supabase, userId } = createMcpSupabaseClient();
    const tools = createToolHandlers(supabase, userId);

    for (const def of TOOL_DEFINITIONS) {
      const toolName = def.name as ToolName;
      server.registerTool(def.name, {
        description: def.description,
        inputSchema: def.inputSchema as any,
      }, async (args: any) => {
        return (await tools[toolName](args)) as MCPToolResult & {
          [key: string]: unknown;
        };
      });
    }
  },
  {
    capabilities: { tools: {} },
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
  }
);

async function verifyToken(_req: Request, token?: string) {
  const expected = process.env.MCP_API_TOKEN;
  if (!expected) {
    throw new Error("MCP_API_TOKEN is not configured on the server");
  }
  if (!token || token !== expected) {
    throw new Error("Invalid token");
  }
  return { token, clientId: "mcp-client", scopes: [] };
}

const authedHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authedHandler as GET, authedHandler as POST, authedHandler as DELETE };
