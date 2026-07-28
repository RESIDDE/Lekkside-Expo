import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { RoomServiceClient } from "npm:livekit-server-sdk@2.17.0";
import { signHostJwt } from "../_shared/host-jwt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { roomName } = await req.json();

    if (typeof roomName !== 'string' || !roomName.trim()) {
      return new Response(
        JSON.stringify({ error: 'roomName is required and must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
    const MEET_HOST_SECRET = Deno.env.get("LIVEKIT_API_SECRET"); // Or better, a new LIVEKIT_HOST_SECRET if added to Supabase secrets

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new Error("LiveKit credentials not set in environment");
    }

    const svc = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    await svc.createRoom({ name: roomName });

    const hostSecret = await signHostJwt(roomName, MEET_HOST_SECRET || LIVEKIT_API_SECRET);

    return new Response(
      JSON.stringify({ roomName, hostSecret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[create-livekit-meeting]', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
