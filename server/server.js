const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// ❤️ HEALTH
// =====================
app.get("/", (req, res) => {
  res.send("AI Command Center API Running 🚀");
});

// =====================
// 🤖 AI CHAT
// =====================
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.json({
      reply: "🧪 Demo Mode → " + prompt
    });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const d = await r.json();
    res.json({ reply: d.choices?.[0]?.message?.content });

  } catch (e) {
    res.json({ reply: "Error: " + e.message });
  }
});

// =====================
// 🤖 FULL APP BUILDER (NEW)
// =====================
app.post("/api/build-full-app", async (req, res) => {
  const { idea } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.json({
      files: [
        { path: "index.html", content: "<h1>Demo App</h1>" }
      ]
    });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content:
`Create a FULL deployable web app.

Return JSON like:
[
 { "path": "index.html", "content": "..." },
 { "path": "style.css", "content": "..." },
 { "path": "script.js", "content": "..." }
]

APP IDEA:
${idea}`
        }]
      })
    });

    const d = await r.json();
    let files;

    try {
      files = JSON.parse(d.choices[0].message.content);
    } catch {
      files = [
        { path: "index.html", content: d.choices[0].message.content }
      ];
    }

    res.json({ files });

  } catch (e) {
    res.json({ error: e.message });
  }
});

// =====================
// 🚀 DEPLOY (GITHUB + RENDER READY)
// =====================
app.post("/api/full-deploy", async (req, res) => {
  const { projectName, files } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.json({ error: "Missing GitHub token" });
  }

  try {
    const repoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: "token " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: projectName })
    });

    const repo = await repoRes.json();

    for (const f of files) {
      await fetch(
        `https://api.github.com/repos/${repo.full_name}/contents/${f.path}`,
        {
          method: "PUT",
          headers: {
            Authorization: "token " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "AI deploy",
            content: Buffer.from(f.content).toString("base64")
          })
        }
      );
    }

    res.json({
      repo: repo.html_url,
      render: "Connect repo to Render for auto deploy"
    });

  } catch (e) {
    res.json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000);
