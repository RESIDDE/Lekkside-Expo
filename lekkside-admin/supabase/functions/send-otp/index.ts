import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  formId: string;
  eventName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, formId, eventName }: SendOtpRequest = await req.json();

    console.log(`Sending OTP to ${email} for form ${formId}`);

    if (!email || !formId) {
      return new Response(
        JSON.stringify({ error: "Email and formId are required" }),
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

    // Verify MX records
    const domain = email.split("@")[1];
    try {
      const mxRecords = await Deno.resolveDns(domain, "MX");
      if (!mxRecords || mxRecords.length === 0) {
        return new Response(
          JSON.stringify({ error: "This email domain cannot receive emails. Please use a valid email address." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } catch (dnsError: any) {
      console.error(`MX lookup failed for ${domain}:`, dnsError.message);
      return new Response(
        JSON.stringify({ error: "This email domain does not exist or cannot receive emails. Please check your email address." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("email_verifications")
      .select("created_at")
      .eq("email", email.toLowerCase())
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (formId === 'portal-signup') {
      query = query.is("form_id", null);
    } else {
      query = query.eq("form_id", formId);
    }

    const { data: recentCode } = await query.single();

    if (recentCode) {
      const waitTime = Math.ceil((60000 - (Date.now() - new Date(recentCode.created_at).getTime())) / 1000);
      return new Response(
        JSON.stringify({ error: `Please wait ${waitTime} seconds before requesting a new code` }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const randomSuffix = Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const tempPassword = `Lekkside-${randomSuffix}`;

    // Clean up old codes
    let deleteQuery = supabase
      .from("email_verifications")
      .delete()
      .eq("email", email.toLowerCase())
      .eq("verified", false);
      
    if (formId === 'portal-signup') {
      deleteQuery = deleteQuery.is("form_id", null);
    } else {
      deleteQuery = deleteQuery.eq("form_id", formId);
    }
    
    await deleteQuery;

    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        email: email.toLowerCase(),
        code,
        form_id: formId === 'portal-signup' ? null : formId,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        temp_password: tempPassword
      });

    if (insertError) {
      console.error("Failed to insert verification record:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send via ZeptoMail
    const { sendEmail } = await import("../_shared/email.ts");
    
    try {
      const result = await sendEmail({
        from: "Lekkside Check-in Portal <noreply@lekksideexpo.com>",
        to: email,
        subject: `Your verification code and password for ${eventName || "event registration"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Verify your email</h1>
            <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
              Use the following code to verify your email address for ${eventName || "event registration"}:
            </p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
            <h2 style="color: #1a1a1a; font-size: 18px; margin-bottom: 12px;">Your Student Portal Login</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
              You can also use the password below to log in to your student portal anytime. We recommend keeping this email safe or changing your password once logged in.
            </p>
            <div style="background: #eef2ff; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px; border: 1px solid #c7d2fe;">
              <strong style="font-size: 16px; color: #4338ca;">Password: </strong>
              <span style="font-size: 18px; font-family: monospace; color: #1a1a1a;">${tempPassword}</span>
            </div>
            <p style="color: #999; font-size: 14px;">
              This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
        `,
        text: `Your verification code is: ${code}\n\nYour temporary student portal password is: ${tempPassword}\n\nThis code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.`,
      });

      console.log(`Email sent successfully via ZeptoMail, ID: ${result.id}`);
    } catch (emailError: any) {
      console.error("Email send error:", emailError);

      // Clean up verification record since email failed
      let cleanupQuery = supabase
        .from("email_verifications")
        .delete()
        .eq("email", email.toLowerCase())
        .eq("code", code);
        
      if (formId === 'portal-signup') {
        cleanupQuery = cleanupQuery.is("form_id", null);
      } else {
        cleanupQuery = cleanupQuery.eq("form_id", formId);
      }
      
      await cleanupQuery;

      return new Response(
        JSON.stringify({ error: "Failed to send verification email. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
