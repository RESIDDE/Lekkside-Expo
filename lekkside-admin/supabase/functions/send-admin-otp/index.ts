import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendAdminOtpRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { email }: SendAdminOtpRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required", success: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format", success: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const { data: recentCode } = await supabase
      .from("email_verifications")
      .select("created_at")
      .eq("email", email.toLowerCase())
      .eq("purpose", "admin_signup")
      .gte("created_at", new Date(Date.now() - 20000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recentCode) {
      const waitTime = Math.ceil((20000 - (Date.now() - new Date(recentCode.created_at).getTime())) / 1000);
      return new Response(
        JSON.stringify({ error: "Please wait " + waitTime + " seconds before requesting a new code", success: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up old codes
    await supabase
      .from("email_verifications")
      .delete()
      .eq("email", email.toLowerCase())
      .eq("purpose", "admin_signup")
      .eq("verified", false);

    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        email: email.toLowerCase(),
        code,
        purpose: "admin_signup",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "DB Error", details: insertError.message, success: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    const maskedKey = resendApiKey ? resendApiKey.substring(0, 10) + "..." : "MISSING";
    
    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + resendApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Lekkside Check-in Portal <noreply@lekksideexpo.com>",
          to: [email],
          subject: "Verify your administrative account - Lekkside",
          html: "<div style=\"font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; color: #1a1a1a;\">" +
                "<h1 style=\"font-size: 24px; font-weight: bold; margin-bottom: 16px;\">Welcome to Lekkside</h1>" +
                "<p style=\"font-size: 16px; color: #666; margin-bottom: 24px;\">" +
                "You're almost there! Use the following 6-digit code to verify your administrative account and complete your signup:" +
                "</p>" +
                "<div style=\"background: #f5f5f5; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;\">" +
                "<span style=\"font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #000;\">" + code + "</span>" +
                "</div>" +
                "<p style=\"font-size: 14px; color: #999;\">" +
                "This code expires in 10 minutes. If you didn't request this account, you can safely ignore this email." +
                "</p>" +
                "<hr style=\"border: none; border-top: 1px solid #eee; margin: 32px 0;\" />" +
                "<p style=\"font-size: 12px; color: #bbb; text-align: center;\">" +
                "Lekkside Event Management System" +
                "</p>" +
                "</div>",
          text: "Welcome to Lekkside! Your verification code is: " + code + "\n\nThis code expires in 10 minutes.",
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        return new Response(
          JSON.stringify({ 
            error: "Resend API Error", 
            details: errorData,
            apiKeyPrefix: maskedKey,
            success: false
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Verification code sent",
          debugCode: code
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (fetchError: any) {
      return new Response(
        JSON.stringify({ 
          error: "Fetch Error", 
          details: fetchError.message,
          apiKeyPrefix: maskedKey,
          success: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: "Runtime Error", details: error.message, success: false }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
