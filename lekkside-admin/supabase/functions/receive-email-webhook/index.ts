import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InboundEmailPayload {
  from_email?: string;
  from_name?: string;
  email?: string;
  name?: string;
  subject?: string;
  text_body?: string;
  message?: string;
  body?: string;
}

const stripHtml = (html: string): string => {
  return html
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as InboundEmailPayload;
    console.log("Received webhook payload:", JSON.stringify(payload));

    const senderEmail = payload.from_email || payload.email;
    const senderName = payload.from_name || payload.name || senderEmail?.split('@')[0] || "Unknown Sender";
    const emailSubject = payload.subject || "No Subject";
    const rawBody = payload.text_body || payload.message || payload.body || "";
    const emailBody = rawBody.includes("<") ? stripHtml(rawBody) : rawBody;

    if (!senderEmail) {
      return new Response(
        JSON.stringify({ error: "Missing sender email in payload" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!emailBody) {
      return new Response(
        JSON.stringify({ error: "Missing email body in payload" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Ignore emails sent by the system to avoid grouping contact forms/system emails
    if (senderEmail.toLowerCase() === "noreply@lekksideexpo.com") {
      console.log("Ignoring system email notification from noreply@lekksideexpo.com");
      return new Response(
        JSON.stringify({ success: true, ignored: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if there's already an existing thread from this email (within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from("contact_messages")
      .select("id, replies")
      .eq("email", senderEmail.toLowerCase())
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const newReply = {
      from: "guest",
      name: senderName,
      text: emailBody,
      timestamp: new Date().toISOString(),
    };

    if (existing) {
      // Append reply to existing thread
      const currentReplies = Array.isArray(existing.replies) ? existing.replies : [];
      const { error } = await supabaseAdmin
        .from("contact_messages")
        .update({
          replies: [...currentReplies, newReply],
          status: "unread",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Error updating thread:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update thread", details: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`Appended reply to existing thread ${existing.id}`);
    } else {
      // Create new thread
      const { error } = await supabaseAdmin
        .from("contact_messages")
        .insert({
          name: senderName,
          email: senderEmail.toLowerCase(),
          subject: emailSubject.replace(/^(\[Reply\]\s*|Re:\s*)*/i, ""),
          message: emailBody,
          replies: [],
          status: "unread",
          source: "email",
        });

      if (error) {
        console.error("Error creating thread:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create thread", details: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Created new thread");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process webhook payload", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
