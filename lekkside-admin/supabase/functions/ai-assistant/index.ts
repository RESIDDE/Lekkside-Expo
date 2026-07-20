import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY")?.trim();
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not set in edge function environment.");
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing API key." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const systemPrompt = `You are the official AI Assistant for the Lekkside Education Fair. Answer questions politely and concisely. You must ONLY answer questions related to the Lekkside Education Fair, studying abroad, event details, registration, and universities. If a user asks anything unrelated to the event or international education, politely decline to answer.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lekksideexpo.com",
        "X-Title": "Lekkside Education Fair"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages
      })
    });

    if (!openRouterRes.ok) {
      const errData = await openRouterRes.text();
      console.error("OpenRouter API Error:", openRouterRes.status, errData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch response from AI." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = await openRouterRes.json();
    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
