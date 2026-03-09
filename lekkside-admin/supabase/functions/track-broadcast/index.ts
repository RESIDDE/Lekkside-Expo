import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const logId = url.searchParams.get("log_id");
  const type = url.searchParams.get("type"); // 'open' or 'click'
  const redirectUrl = url.searchParams.get("url");

  if (!logId) {
    return new Response("Missing log_id", { status: 400 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get the log first
    const { data: log, error: logError } = await supabaseClient
      .from("broadcast_logs")
      .select("broadcast_id")
      .eq("id", logId)
      .single();

    if (!logError && log) {
      const now = new Date().toISOString();
      const updates: any = {};

      if (type === "open") {
        updates.opened_at = now;
        updates.status = "opened";
        
        // Update log
        await supabaseClient
          .from("broadcast_logs")
          .update(updates)
          .eq("id", logId)
          .is("opened_at", null); // Only update if not already opened
          
        // Increment broadcast open count (naive, might undercount if concurrent, but okay for now)
        // Better to use a stored procedure or just count logs on read
        await supabaseClient.rpc("increment_broadcast_stats", { 
          row_id: log.broadcast_id, 
          field: "open_count" 
        });
        
      } else if (type === "click") {
        updates.clicked_at = now;
        updates.status = "clicked";
        
        await supabaseClient
          .from("broadcast_logs")
          .update(updates)
          .eq("id", logId)
          .is("clicked_at", null);

        await supabaseClient.rpc("increment_broadcast_stats", { 
          row_id: log.broadcast_id, 
          field: "click_count" 
        });
      }
    }

  } catch (error) {
    console.error("Tracking error:", error);
  }

  // Response based on type
  if (type === "open") {
    // Return 1x1 transparent GIF
    const gif = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    ]);
    return new Response(gif, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } else if (redirectUrl) {
    return Response.redirect(redirectUrl, 302);
  }

  return new Response("OK");
};

serve(handler);
