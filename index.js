const Anthropic = require("@anthropic-ai/sdk");
const http = require("http");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Main function: Analyze reel + generate prompts
async function generateVideoPrompts(reelDescription, concept, rajOutfit) {
  const prompt = `You are a Higgsfield video prompt engineer.

TASK: Analyze a reel and create hyperspecific 15-second video chunks with Higgsfield instructions.

REEL DESCRIPTION: "${reelDescription}"

CONCEPT: "${concept}"

RAJ'S APPEARANCE: "${rajOutfit || 'Realistic AI founder aesthetic. Vary outfit based on concept.'}"

OUTPUT FORMAT (EXACTLY):

---CHUNK 1 (0-15s)---

VIDEO PROMPT:
[Start with "GLOBAL RULE" section (camera style, audio, lighting)]
[Then "CHARACTER APPEARANCE" section (Raj's exact look)]
[Then second-by-second breakdown: [0s], [1s], [2s], etc.]
[Include dialogue word-for-word with timing]
[Make it HYPERSPECIFIC so Higgsfield generates photorealistic video]
[NO generic descriptions. Every detail matters.]

HIGGSFIELD INSTRUCTIONS:
Step 1: [First action]
Step 2: [Second action]
[Continue with exact steps]
[Tell which feature to use: Soul ID? Cinema Studio? Lipsync?]
[Include duration: 15 seconds]

---CHUNK 2 (15-30s)---
[Repeat format]

---END---

CRITICAL: 
- Estimate total reel length first
- Split into 15-second MAX chunks
- Generate VIDEO PROMPT that's so specific Higgsfield can't fail
- Generate HIGGSFIELD INSTRUCTIONS that tell user exactly what to do
- Include character details (skin texture, pores, facial lines, outfit, jewelry)
- Include camera behavior (handheld? autofocus hunting?)
- Include audio specs (what sounds, when, volume)`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Main endpoint
  if (req.url === "/api/generate" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const { reelDescription, concept, rajOutfit } = JSON.parse(body);

        const result = await generateVideoPrompts(
          reelDescription,
          concept,
          rajOutfit
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, result }));
      } catch (error) {
        console.error(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  // Health check
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MCP running on port ${PORT}`);
});