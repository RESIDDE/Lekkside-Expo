import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyEmailRequest {
  to_email: string;
  subject: string;
  reply_text: string;
  original_message: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Request Headers:", Object.fromEntries(req.headers.entries()));
    const authHeader = req.headers.get('Authorization');
    console.log("Authorization Header:", authHeader ? "Present" : "Missing");

    const { to_email, subject, reply_text, original_message, name }: ReplyEmailRequest = await req.json();

    console.log(`Sending reply to ${to_email}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "lekkside@lekksideexpo.com",
        to: [to_email],
        reply_to: "lekkside@lekksideexpo.com",
        subject: `Re: ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #667eea;">Hello ${name},</h2>
              <p>${reply_text}</p>
              <br />
              <div style="border-top: 2px solid #f4f4f4; margin-top: 30px; padding-top: 20px;">
                <p style="font-size: 14px; color: #666;"><strong>Original Message:</strong></p>
                <blockquote style="border-left: 4px solid #667eea; padding-left: 15px; margin-left: 0; color: #777;">
                  ${original_message}
                </blockquote>
              </div>
              <footer style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">
                <p>Sent by Lekkside Education Fair Administration</p>
              </footer>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorData }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in reply-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
