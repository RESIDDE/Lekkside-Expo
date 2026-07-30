import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { AccessToken } from "npm:livekit-server-sdk@2.17.0";
import { verifyHostJwt } from "../_shared/host-jwt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Support GET params for backward compatibility, but prefer POST body
    let roomName = url.searchParams.get('roomName');
    let participantName = url.searchParams.get('participantName');
    let region = url.searchParams.get('region');
    let hostSecret = url.searchParams.get('hostSecret');
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (body.roomName) roomName = body.roomName;
      if (body.participantName) participantName = body.participantName;
      if (body.region) region = body.region;
      if (body.hostSecret) hostSecret = body.hostSecret;
    }

    if (!roomName || !participantName) {
      return new Response(
        JSON.stringify({ error: 'roomName and participantName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
    const MEET_HOST_SECRET = Deno.env.get("LIVEKIT_API_SECRET"); // Or better, a new LIVEKIT_HOST_SECRET

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new Error("LiveKit credentials not set in environment");
    }

    // Determine moderator status
    let isModerator = false;
    if (hostSecret && MEET_HOST_SECRET) {
      isModerator = await verifyHostJwt(hostSecret, roomName, MEET_HOST_SECRET);
    }

    // Create LiveKit token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
    });
    
    at.ttl = '5m';

    const grant: any = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };
    
    if (isModerator) {
      grant.roomAdmin = true;
      grant.roomCreate = true;
    }
    
    at.addGrant(grant);
    const participantToken = await at.toJwt();

    return new Response(
      JSON.stringify({
        serverUrl: LIVEKIT_URL, // We can skip region-based routing for now, or implement it if needed
        roomName,
        participantToken,
        participantName,
        isModerator,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[livekit-token]', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
