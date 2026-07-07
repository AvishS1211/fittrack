// Reads an InBody body-composition photo with Gemini and returns structured JSON.
// The Gemini key lives only here (server-side) as a Vercel env var — never in the browser.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set on the server" });

  const { image, mimeType } = req.body || {};
  if (!image) return res.status(400).json({ error: "No image provided" });

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are reading an InBody / body-composition result sheet from a photo.
Extract the values and return ONLY valid JSON (no markdown, no commentary) in exactly this shape:
{
  "date": "YYYY-MM-DD",
  "stats": { "smm": number, "pbf": number, "bmr": number },
  "lean": {
    "rightArm": { "kg": number, "status": "Normal" },
    "leftArm":  { "kg": number, "status": "Normal" },
    "trunk":    { "kg": number, "status": "Normal" },
    "rightLeg": { "kg": number, "status": "Normal" },
    "leftLeg":  { "kg": number, "status": "Normal" }
  },
  "fat": {
    "rightArm": { "kg": number, "status": "Normal" },
    "leftArm":  { "kg": number, "status": "Normal" },
    "trunk":    { "kg": number, "status": "Normal" },
    "rightLeg": { "kg": number, "status": "Normal" },
    "leftLeg":  { "kg": number, "status": "Normal" }
  }
}
Rules:
- smm = Skeletal Muscle Mass in kg. pbf = Percent Body Fat (%). bmr = Basal Metabolic Rate in kcal.
- "lean" = the Segmental Lean Analysis (kg for each body part). "fat" = the Segmental Fat Analysis (kg for each part).
- "status" is the word shown next to that segment: one of "Normal", "Over", or "Under". If you can't tell, use "Normal".
- Right/Left are the subject's own right/left as labelled on the sheet.
- "date" is the test date if visible, otherwise "${today}".
- Use plain numbers (no units). Return JSON only.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mimeType || "image/jpeg", data: image } }] }],
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
