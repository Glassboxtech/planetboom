import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);

    // GET: fetch member info + existing consent form
    if (req.method === "GET") {
      const memberId = url.searchParams.get("memberId");
      if (!memberId) {
        return new Response(JSON.stringify({ error: "Missing memberId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [memberRes, formRes] = await Promise.all([
        supabase.from("members").select("id, first_name, last_name, name, dob").eq("id", memberId).single(),
        supabase.from("consent_forms").select("*").eq("member_id", memberId).maybeSingle(),
      ]);

      if (memberRes.error || !memberRes.data) {
        return new Response(JSON.stringify({ error: "Member not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ member: memberRes.data, consentForm: formRes.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: save consent form
    if (req.method === "POST") {
      const body = await req.json();
      const { memberId, formData } = body;

      if (!memberId || !formData?.parent_full_name?.trim() || !formData?.parent_relationship?.trim()) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate lengths
      if (formData.parent_full_name.length > 200 || formData.parent_relationship.length > 100) {
        return new Response(JSON.stringify({ error: "Field values too long" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = {
        member_id: memberId,
        parent_full_name: formData.parent_full_name.trim(),
        parent_relationship: formData.parent_relationship.trim(),
        parent_phone: formData.parent_phone?.trim() || null,
        parent_email: formData.parent_email?.trim() || null,
        parent_id_number: formData.parent_id_number?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || null,
        emergency_contact_relationship: formData.emergency_contact_relationship?.trim() || null,
        medical_conditions: formData.medical_conditions?.trim() || null,
        allergies: formData.allergies?.trim() || null,
        medications: formData.medications?.trim() || null,
        medical_aid_name: formData.medical_aid_name?.trim() || null,
        medical_aid_number: formData.medical_aid_number?.trim() || null,
        additional_notes: formData.additional_notes?.trim() || null,
        signature_acknowledged: !!formData.signature_acknowledged,
        signed_at: formData.signature_acknowledged ? new Date().toISOString() : null,
      };

      // Check if form exists
      const { data: existing } = await supabase
        .from("consent_forms")
        .select("id")
        .eq("member_id", memberId)
        .maybeSingle();

      let result;
      if (existing) {
        result = await supabase.from("consent_forms").update(payload).eq("id", existing.id).select().single();
      } else {
        result = await supabase.from("consent_forms").insert(payload).select().single();
      }

      if (result.error) {
        console.error("Save error:", result.error);
        return new Response(JSON.stringify({ error: "Failed to save" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update member consent flag
      await supabase.from("members").update({ consent_signed: !!formData.signature_acknowledged }).eq("id", memberId);

      return new Response(JSON.stringify({ success: true, consentForm: result.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
