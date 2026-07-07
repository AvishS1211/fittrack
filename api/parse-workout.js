// Reads a weekly workout-plan PDF with Gemini and returns structured JSON.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set on the server" });

  const { pdf, mimeType } = req.body || {};
  if (!pdf) return res.status(400).json({ error: "No PDF provided" });

  const prompt = `You are reading a weekly workout plan from a document.
Extract it and return ONLY valid JSON (no markdown, no commentary) in exactly this shape:
{
  "days": {
    "Mon": { "title": "Push", "focus": "chest · shoulders · triceps", "exercises": [ { "name": "Incline DB press", "sets": "4 × 8-10", "note": "" } ] },
    "Tue": { "title": "", "focus": "", "exercises": [] },
    "Wed": { "title": "", "focus": "", "exercises": [] },
    "Thu": { "title": "", "focus": "", "exercises": [] },
    "Fri": { "title": "", "focus": "", "exercises": [] },
    "Sat": { "title": "", "focus": "", "exercises": [] },
    "Sun": null
  }
}
Rules:
- One entry per weekday Mon..Sun. Use null for a rest day (no training that day).
- "title" = the workout name for that day (e.g. Push, Pull, Legs, Upper, Full Body).
- "focus" = the muscle groups if stated, else "".
- "exercises" = ordered list. "sets" = the sets×reps or time exactly as written (e.g. "4 × 8-10", "3 × 12", "30 min"). "note" = any cue/tip if present, else "".
- If the plan defines workout types and maps them to days (e.g. "Push/Pull/Legs, twice a week: Mon & Thu Push..."), expand each weekday accordingly.
- If a weekday is not specified anywhere, set it to null.
- Return JSON only.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mimeType || "application/pdf", data: pdf } }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      }
    );
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "Empty response from Gemini" });

    let parsed;
    try { parsed = JSON.parse(text); }
    catch { return res.status(500).json({ error: "Could not parse the result", raw: text.slice(0, 400) }); }

    return res.status(200).json({ data: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
