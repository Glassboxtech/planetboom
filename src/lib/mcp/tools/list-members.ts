import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_members",
  title: "List members",
  description: "List members visible to the signed-in user. Supports optional search and status filters.",
  inputSchema: {
    search: z.string().optional().describe("Case-insensitive substring match on first or last name."),
    status: z.enum(["active", "inactive"]).optional().describe("Filter by member status."),
    limit: z.number().int().min(1).max(200).optional().describe("Max number of members to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("members")
      .select("id, first_name, last_name, gender, date_of_birth, status, attendance_count, type")
      .order("last_name", { ascending: true })
      .limit(limit ?? 50);
    if (status) q = q.eq("status", status);
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { members: data ?? [] },
    };
  },
});
