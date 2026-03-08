import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendAdminOtpRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendAdminOtpRequest = await req.json();

    console.log(`Sending Admin Signup OTP to ${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: Check if user already exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (!userError) {
      const userExists = userData.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return new Response(
          JSON.stringify({ error: "This email is already registered. Please sign in." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Rate limiting
    const { data: recentCode } = await supabase
      .from("email_verifications")
      .select("created_at")
      .eq("email", email.toLowerCase())
      .eq("purpose", "admin_signup")
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recentCode) {
      const waitTime = Math.ceil((60000 - (Date.now() - new Date(recentCode.created_at).getTime())) / 1000);
      return new Response(
        JSON.stringify({ error: `Please wait ${waitTime} seconds before requesting a new code` }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
      console.error("Failed to insert verification record:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lekkside Admin Portal <onboarding@resend.dev>",
        to: [email],
        subject: "Verify your administrative account - Lekkside",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Welcome to Lekkside</h1>
            <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
              You're almost there! Use the following 6-digit code to verify your administrative account and complete your signup:
            </p>
            <div style="background: #f5f5f5; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #000;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #999;">
              This code expires in 10 minutes. If you didn't request this account, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="font-size: 12px; color: #bbb; text-align: center;">
              Lekkside Event Management System
            </p>
          </div>
        `,
        text: `Welcome to Lekkside! Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send verification email. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent",
        debugCode: code // Keep for development if needed
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
