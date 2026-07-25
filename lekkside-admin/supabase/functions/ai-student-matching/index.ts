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
    const { profile, universities } = await req.json();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile data is required" }),
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

    const prompt = `You are an expert AI university admission counselor. Given the following student profile, recommend exactly 3-4 personalized universities that best match their criteria. 
    
IMPORTANT RULES:
1. You MUST ONLY select universities from the "Available Universities" list provided below. DO NOT recommend any university that is not in this list.
2. Return the result ONLY as a valid JSON array of objects. Do not wrap in markdown tags or add any extra text.

Available Universities:
${JSON.stringify(universities, null, 2)}

Student Profile:
- Highest Qualification: ${profile.highest_qualification}
- Current GPA/Grade: ${profile.gpa}
- Intended Course: ${profile.intended_course}
- Preferred Destination: ${profile.preferred_destination}
- Annual Budget: ${profile.budget}
- Scholarship Required: ${profile.scholarship}
- English Test: ${profile.english_test} (${profile.english_score})

The JSON array must have objects with exactly these keys:
- name (string: University name)
- country (string: Country of the university)
- program (string: A specific program name matching the intended course)
- estimatedTuition (string: Formatted estimated annual tuition)
- matchReason (string: Why this is a good match, 2-3 sentences max)
- scholarshipOpportunities (string: Available scholarships for international students)
- matchScore (number: A score from 80 to 99 indicating how strong the match is)
`;

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
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!openRouterRes.ok) {
      const errData = await openRouterRes.text();
      console.error("OpenRouter API Error:", openRouterRes.status, errData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch recommendations from AI." }),
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
