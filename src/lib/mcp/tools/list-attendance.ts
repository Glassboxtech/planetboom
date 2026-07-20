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
  name: "list_attendance",
  title: "List attendance records",
  description: "List attendance records within an optional date range. Dates are ISO YYYY-MM-DD.",
  inputSchema: {
    from: z.string().optional().describe("Start date (inclusive), ISO YYYY-MM-DD."),
    to: z.string().optional().describe("End date (inclusive), ISO YYYY-MM-DD."),
    member_id: z.string().uuid().optional().describe("Filter to a single member."),
    limit: z.number().int().min(1).max(500).optional().describe("Max records (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, member_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("attendance_records")
      .select("id, member_id, event_date, created_at")
      .order("event_date", { ascending: false })
      .limit(limit ?? 100);
    if (from) q = q.gte("event_date", from);
    if (to) q = q.lte("event_date", to);
    if (member_id) q = q.eq("member_id", member_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { records: data ?? [] },
    };
  },
});
