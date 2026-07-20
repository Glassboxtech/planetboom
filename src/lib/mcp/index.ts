import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMembersTool from "./tools/list-members";
import getMemberTool from "./tools/get-member";
import listAttendanceTool from "./tools/list-attendance";
import checkInMemberTool from "./tools/check-in-member";

// Build the direct Supabase issuer from the project ref (Vite inlines this at build time).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "youth-checkin-mcp",
  title: "Youth Check-In MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Youth Check-In app. Use list_members to search members, get_member for details, list_attendance to view attendance history, and check_in_member to record attendance. All actions run as the signed-in admin and are enforced by row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMembersTool, getMemberTool, listAttendanceTool, checkInMemberTool],
});
