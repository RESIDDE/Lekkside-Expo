import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendPasswordResetRequest = await req.json();

    console.log(`Sending password reset OTP to ${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify MX records
    const domain = email.split("@")[1];
    try {
      const mxRecords = await Deno.resolveDns(domain, "MX");
      if (!mxRecords || mxRecords.length === 0) {
        return new Response(
          JSON.stringify({ error: "This email domain cannot receive emails. Please use a valid email address." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } catch (dnsError: any) {
      console.error(`MX lookup failed for ${domain}:`, dnsError.message);
      return new Response(
        JSON.stringify({ error: "This email domain does not exist or cannot receive emails. Please check your email address." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: (...args) => fetch(...args),
      }
    });

    // Skip checking if user exists for security and to avoid Auth API bugs.
    // If an account doesn't exist, they still get a dummy email or we pretend success.

    // Rate limiting
    const { data: recentCode } = await supabase
      .from("email_verifications")
      .select("created_at")
      .eq("email", email.toLowerCase())
      .eq("purpose", "password_reset")
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recentCode) {
      const waitTime = Math.ceil((60000 - (Date.now() - new Date(recentCode.created_at).getTime())) / 1000);
      return new Response(
        JSON.stringify({ error: `Please wait ${waitTime} seconds before requesting a new code` }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up old codes
    await supabase
      .from("email_verifications")
      .delete()
      .eq("email", email.toLowerCase())
      .eq("purpose", "password_reset")
      .eq("verified", false);

    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        email: email.toLowerCase(),
        code,
        purpose: "password_reset",
        form_id: null,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error("Failed to insert verification record:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create reset code" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send via ZeptoMail
try {
      const result = await sendEmail({
        from: "Lekkside Check-in Portal <noreply@lekksideexpo.com>",
        to: email,
        subject: "Reset your password - Lekkside Check-in Portal",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Reset Your Password</h1>
            <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
              You requested to reset your password for Lekkside Check-in Portal. Use the code below to proceed:
            </p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">
              This code expires in 10 minutes. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
        `,
        text: `Your password reset code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this code, please ignore this email and your password will remain unchanged.`,
      });

      console.log(`Password reset email sent via ZeptoMail, ID: ${result.id}`);
    } catch (emailError: any) {
      console.error("Email API error:", emailError);

      await supabase
        .from("email_verifications")
        .delete()
        .eq("email", email.toLowerCase())
        .eq("purpose", "password_reset")
        .eq("code", code);

      return new Response(
        JSON.stringify({ error: "Failed to send reset email. Please try again." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If an account exists with this email, a reset code has been sent."
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
