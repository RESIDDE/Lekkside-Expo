import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BroadcastRequest {
  broadcastId: string;
  eventId: string;
  recipients?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    // Also create admin client for operations bypassing RLS if needed (like reading all guests if policy restricts)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { broadcastId, eventId, recipients } = (await req.json()) as BroadcastRequest;

    if (!broadcastId || !eventId) {
      throw new Error("Missing broadcastId or eventId");
    }

    // 1. Fetch broadcast details
    const { data: broadcast, error: broadcastError } = await supabaseClient
      .from("broadcasts")
      .select("*")
      .eq("id", broadcastId)
      .single();

    if (broadcastError || !broadcast) {
      throw new Error("Broadcast not found");
    }

    // 2. Fetch event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // 3. Construct target list (from recipients or by fetching all guests)
    let validGuests = [];

    if (recipients && recipients.length > 0) {
      validGuests = recipients.map((email: string) => ({
        id: null,
        email: email.trim(),
        first_name: null,
        last_name: null,
      }));
    } else {
      // Fetch all guests
      // Using admin client to ensure we get all guests even if RLS is tricky (though RLS should allow creator to see guests)
      const { data: guests, error: guestsError } = await supabaseAdmin
        .from("guests")
        .select("id, email, first_name, last_name")
        .eq("event_id", eventId)
        .not("email", "is", null);

      if (guestsError) {
        throw guestsError;
      }

      validGuests =
        guests?.filter((g: any) => g.email && g.email.includes("@")) || [];
    }

    if (validGuests.length === 0) {
      await supabaseAdmin
        .from("broadcasts")
        .update({ status: "sent", sent_count: 0 })
        .eq("id", broadcastId);

      return new Response(
        JSON.stringify({ success: true, message: "No guests to send to" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Update status to sending
    await supabaseAdmin
      .from("broadcasts")
      .update({ status: "sending" })
      .eq("id", broadcastId);

let sentCount = 0;
    const projectUrl = Deno.env.get("SUPABASE_URL");
    const trackBaseUrl = `${projectUrl}/functions/v1/track-broadcast`;

    for (const guest of validGuests) {
      try {
        // Create log entry first
        const { data: log, error: logError } = await supabaseAdmin
          .from("broadcast_logs")
          .insert({
            broadcast_id: broadcastId,
            guest_id: guest.id,
            email: guest.email,
            status: "pending",
          })
          .select()
          .single();

        if (logError) {
          console.error("Failed to create log:", logError);
          continue;
        }

        const trackingPixel = `<img src="${trackBaseUrl}?log_id=${log.id}&type=open" alt="" width="1" height="1" border="0" style="height:1px !important;width:1px !important;border-width:0 !important;margin-top:0 !important;margin-bottom:0 !important;margin-right:0 !important;margin-left:0 !important;padding-top:0 !important;padding-bottom:0 !important;padding-right:0 !important;padding-left:0 !important;" />`;

        const htmlContent = `
          ${broadcast.content}
          <br/><br/>
          <p style="font-size: 12px; color: #999;">
            You are receiving this email because you registered for ${event.name}.
          </p>
          ${trackingPixel}
        `;

        try {
          await sendEmail({
            from: "Lekkside Events <noreply@lekksideexpo.com>",
            replyTo: "support@lekksideexpo.com",
            to: guest.email,
            subject: broadcast.subject,
            html: htmlContent,
          });

          await supabaseAdmin
            .from("broadcast_logs")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", log.id);
          sentCount++;
        } catch (emailError: any) {
          await supabaseAdmin
            .from("broadcast_logs")
            .update({ status: "failed", error_message: emailError.message })
            .eq("id", log.id);
        }
      } catch (err: any) {
        console.error(`Error sending to ${guest.email}:`, err);
      }
    }

    // 5. Update broadcast status
    await supabaseAdmin
      .from("broadcasts")
      .update({
        status: "sent",
        sent_count: sentCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", broadcastId);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: validGuests.length,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error in send-broadcast:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
