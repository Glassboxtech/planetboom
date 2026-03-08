import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function hslToHex(hslStr: string): string {
  // Parse "220 75% 55%" format
  const parts = hslStr.trim().split(/\s+/);
  if (parts.length < 3) return '#3b82f6';
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, memberName, consentUrl } = await req.json();

    if (!email || !memberName || !consentUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch branding from site_settings
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings } = await supabase
      .from("site_settings")
      .select("app_name, logo_url, primary_color, accent_color")
      .limit(1)
      .maybeSingle();

    const appName = settings?.app_name || "Youth Check-In";
    const primaryHex = settings?.primary_color ? hslToHex(settings.primary_color) : "#3b82f6";
    const accentHex = settings?.accent_color ? hslToHex(settings.accent_color) : "#10b981";
    const logoUrl = settings?.logo_url || "";

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${appName}" style="height: 48px; margin-bottom: 16px;" />`
      : "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${appName} <onboarding@resend.dev>`,
        to: [email],
        subject: `Consent Form Required for ${memberName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${primaryHex}, ${accentHex}); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
              ${logoHtml}
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${appName}</h1>
            </div>

            <!-- Body -->
            <div style="padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 20px;">Consent Form Required</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">Dear Parent/Guardian,</p>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                We need you to complete a consent form for <strong style="color: #1f2937;">${memberName}</strong> to participate in our youth group activities. This can be done quickly and digitally.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${consentUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryHex}, ${accentHex}); color: #ffffff; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Fill in Consent Form
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: ${primaryHex}; font-size: 13px; word-break: break-all; margin: 0 0 24px;">${consentUrl}</p>

              <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />

              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This email was sent by ${appName}. If you did not expect this, please disregard it.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
