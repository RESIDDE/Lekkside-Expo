import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyAdminOtpRequest {
  email: string;
  code: string;
  password?: string;
  fullName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { email, code, password, fullName }: VerifyAdminOtpRequest =
      await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find matching verification record
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("purpose", "admin_signup")
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verification) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // 2. Mark as verified
    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Failed to update verification:", updateError);
      return new Response(JSON.stringify({ error: "Failed to verify code" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3. Create the user if password/fullName provided
    if (password) {
      console.log(`Creating user for ${email}`);
      const { data: userData, error: createError } =
        await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      if (createError) {
        console.error("Failed to create user:", createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // 4. Update profile role if needed (Default to 'administrator' or similar)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "admin" }) // Set default role
        .eq("user_id", userData.user.id);

      if (profileError) {
        console.warn("Failed to set profile role:", profileError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created and verified successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in verify-admin-otp function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
