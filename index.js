const Anthropic = require("@anthropic-ai/sdk");
const http = require("http");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

HIGGSFIELD INSTRUCTIONS:
Step 1: [First action]
Step 2: [Second action]
[Continue with exact steps]

---CHUNK 2 (15-30s)---
[Repeat format]

---END---

CRITICAL: 
- Estimate total reel length first
- Split into 15-second MAX chunks
- Generate VIDEO PROMPT that's hyperspecific
- Generate HIGGSFIELD INSTRUCTIONS that tell user exactly what to do`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

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
  } else if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    const filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      const contentType = ext === ".html" ? "text/html" : ext === ".css" ? "text/css" : ext === ".js" ? "application/javascript" : "text/plain";
      
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SC Manager running on port ${PORT}`);
}); 