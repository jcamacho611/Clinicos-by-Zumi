import "server-only";

import { z } from "zod";
import type { ZumiMcpServer } from "@/features/zumi/providers";

const mcpServerSchema = z.object({
  label: z.string().trim().min(2).max(80),
  serverUrl: z.string().url().optional(),
  connectorId: z.string().trim().min(2).max(200).optional(),
  requireApproval: z.boolean().default(true),
  allowedTools: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
}).refine((value) => Boolean(value.serverUrl) !== Boolean(value.connectorId), {
  message: "Each MCP server must provide exactly one of serverUrl or connectorId.",
});

const mcpConfigSchema = z.array(mcpServerSchema).max(20);

export function configuredZumiMcpServers(raw = process.env.ZUMI_MCP_SERVERS_JSON): ZumiMcpServer[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = mcpConfigSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return parsed.data;
  } catch {
    return [];
  }
}
