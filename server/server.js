const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// HEALTH
app.get("/", (req, res) => {
  res.send("AI Command Center API Running 🚀");
});

// CHAT
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.json({
      reply: "🧪 Demo Mode: AI would respond to → " + prompt
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content });

  } catch (err) {
    res.json({ reply: "Error: " + err.message });
  }
});

// FULL DEPLOY
app.post("/api/full-deploy", async (req, res) => {
  const { projectName, files } = req.body;

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.json({ error: "Missing GitHub token" });
  }

  try {
    const repoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": "token " + GITHUB_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: projectName,
        private: false
      })
    });

    const repoData = await repoRes.json();

    for (const file of files) {
      await fetch(
        `https://api.github.com/repos/${repoData.full_name}/contents/${file.path}`,
        {
          method: "PUT",
          headers: {
            "Authorization": "token " + GITHUB_TOKEN,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "AI commit",
            content: Buffer.from(file.content).toString("base64")
          })
        }
      );
    }

    res.json({
      status: "DEPLOYED",
      repo: repoData.html_url
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
