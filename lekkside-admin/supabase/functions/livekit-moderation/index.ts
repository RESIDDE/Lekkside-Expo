import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { RoomServiceClient } from "npm:livekit-server-sdk@2.17.0";
import { jwtVerify } from "npm:jose@5.2.2";
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
    const body = await req.json();
    const { action, roomName, hostSecret, livekitToken, identity, permissions } = body;

    if (!roomName || !action) {
      return new Response(
        JSON.stringify({ error: 'roomName and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
    const MEET_HOST_SECRET = Deno.env.get("LIVEKIT_API_SECRET");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new Error("LiveKit credentials not set in environment");
    }
    
    const svc = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    let isAuthorized = false;
    let isOriginalHost = false;

    if (hostSecret && MEET_HOST_SECRET) {
      isOriginalHost = await verifyHostJwt(hostSecret, roomName, MEET_HOST_SECRET);
      if (isOriginalHost) isAuthorized = true;
    } 
    
    if (!isAuthorized && livekitToken) {
      let payload: any = null;
      try {
        const result = await jwtVerify(livekitToken, new TextEncoder().encode(LIVEKIT_API_SECRET));
        payload = result.payload;
      } catch (e: any) {
        if (e?.code === 'ERR_JWT_EXPIRED' && e?.payload) {
          payload = e.payload;
        } else {
          console.error("JWT verify error:", e);
        }
      }

      if (payload && payload.video && typeof payload.video === 'object' && (payload.video as any).room === roomName) {
        const requesterIdentity = payload.sub;
        if (requesterIdentity) {
           const participant = await svc.getParticipant(roomName, requesterIdentity);
           if (participant && participant.metadata) {
              let isMod = false;
              try { isMod = JSON.parse(participant.metadata).isModerator; } catch (e) {}
              if (isMod) isAuthorized = true;
           }
        }
      }
      
      if (isAuthorized && !isOriginalHost) {
        if (action !== 'updateParticipant') {
           return new Response(
             JSON.stringify({ error: 'Promoted moderators can only mute/unmute participants' }),
             { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
           );
        }
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid hostSecret or livekitToken' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle actions
    if (action === 'updateParticipant') {
      if (!identity || !permissions) throw new Error('identity and permissions are required for updateParticipant');
      await svc.updateParticipant(roomName, identity, undefined, permissions);
    } else if (action === 'updateMetadata') {
      if (!identity || typeof body.metadata !== 'string') throw new Error('identity and metadata string are required for updateMetadata');
      await svc.updateParticipant(roomName, identity, body.metadata);
    } else if (action === 'removeParticipant') {
      if (!identity) throw new Error('identity is required for removeParticipant');
      await svc.removeParticipant(roomName, identity);
    } else if (action === 'lockRoom' || action === 'unlockRoom') {
       // Currently no direct lock room API in SDK, but could implement via room metadata
       console.log(`Action ${action} called for room ${roomName}`);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[livekit-moderation]', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
