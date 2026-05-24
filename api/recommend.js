export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { playlistName, trackCount, artists, sample } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a music expert specialising in metal, rock, and heavy music. Return ONLY raw JSON, no markdown, no preamble.
Schema: {"genres":string[],"mood":string,"topArtists":string[],"recommendations":[{"name":string,"artist":string,"year":number,"reason":string,"category":"new_artist"|"new_release"|"classic_fit"}]}
Exactly 50 recommendations: ~30 new_artist (not on playlist, 2020-2025), ~12 new_release (existing artists, recent), ~8 classic_fit (older tracks). Be bold and specific.`,
        messages: [{
          role: "user",
          content: `Playlist: "${playlistName}" (${trackCount} tracks)\nArtists: ${artists}\n\nSample:\n${sample}`
        }]
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
