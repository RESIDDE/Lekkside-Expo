import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  universityId: string;
  studentName: string;
  studentEmail: string;
  requestType: "video" | "chat";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { universityId, studentName, studentEmail, requestType }: NotificationRequest = await req.json();

    if (!universityId || !studentName || !studentEmail || !requestType) {
      return new Response(
        JSON.stringify({ error: "universityId, studentName, studentEmail, and requestType are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const title = requestType === "video" ? "New Video Meeting Request" : "New Live Chat Request";
    const message = `${studentName} (${studentEmail}) has requested a ${requestType === 'video' ? 'video meeting' : 'live chat'} with your booth.`;
    const link = requestType === "video" ? `/meetings/booth-${universityId}` : undefined;

    // 1. Insert notification into DB
    const { error: dbError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: universityId,
        title,
        message,
        type: requestType,
        link,
        read: false
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to create notification", details: dbError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Fetch the university admin's email
    // Since universityId is the user_id in auth.users, we can fetch their email via Admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(universityId);
    
    if (userError || !userData.user?.email) {
      console.error("Failed to fetch user email:", userError);
      // We don't fail the request if email sending fails, but we log it.
    } else {
      const universityEmail = userData.user.email;
      const { sendEmail } = await import("../_shared/email.ts");

      try {
        await sendEmail({
          from: "Lekkside Expo <noreply@lekksideexpo.com>",
          to: universityEmail,
          replyTo: studentEmail,
          subject: title,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4a5568;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #4a5568;">
                Hello,
              </p>
              <p style="font-size: 16px; line-height: 1.5; color: #4a5568;">
                ${studentName} has requested a ${requestType === 'video' ? 'video meeting' : 'live chat'} with you.
              </p>
              <p style="font-size: 16px; line-height: 1.5; color: #4a5568;">
                <strong>Student Email:</strong> ${studentEmail}
              </p>
              ${requestType === 'video' ? `
                <div style="margin-top: 30px;">
                  <a href="${Deno.env.get("PUBLIC_APP_URL") || "http://localhost:8080"}/meetings/booth-${universityId}" 
                     style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Join Meeting Room
                  </a>
                </div>
              ` : ''}
              <p style="font-size: 14px; color: #718096; margin-top: 40px;">
                Log into your dashboard to manage your incoming requests.
              </p>
            </div>
          `,
          text: `${title}\n\n${studentName} (${studentEmail}) has requested a ${requestType === 'video' ? 'video meeting' : 'live chat'}.`
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-university function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
