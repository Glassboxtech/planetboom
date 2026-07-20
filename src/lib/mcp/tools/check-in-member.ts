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
  name: "check_in_member",
  title: "Check in member",
  description: "Record an attendance for a member on a given event date (defaults to today).",
  inputSchema: {
    member_id: z.string().uuid().describe("The member to check in."),
    event_date: z.string().optional().describe("Event date ISO YYYY-MM-DD (defaults to today)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ member_id, event_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const date = event_date ?? new Date().toISOString().slice(0, 10);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("attendance_records")
      .insert({ member_id, event_date: date })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Checked in member ${member_id} on ${date}` }],
      structuredContent: { record: data },
    };
  },
});
