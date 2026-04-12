const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =====================
// 🔐 CONFIG
// =====================
const PIN = "20252025";
const SECRET = "my_super_secret_key";
const KEY_FILE = path.join(__dirname, "secure_key.json");

// =====================
// 🔐 ENCRYPTION
// =====================
function encrypt(text) {
  const cipher = crypto.createCipher("aes-256-ctr", SECRET);
  return cipher.update(text, "utf8", "hex") + cipher.final("hex");
}

function decrypt(hash) {
  const decipher = crypto.createDecipher("aes-256-ctr", SECRET);
  return decipher.update(hash, "hex", "utf8") + decipher.final("utf8");
}

// =====================
// 🔐 SAVE KEY
// =====================
app.post("/api/save-key", (req, res) => {
  const { apiKey, pin } = req.body;

  if (pin !== PIN) {
    return res.json({ status: "DENIED" });
  }

  const encrypted = encrypt(apiKey);
  fs.writeFileSync(KEY_FILE, JSON.stringify({ key: encrypted }));

  res.json({ status: "KEY SAVED" });
});

// =====================
// 🔐 LOAD KEY
// =====================
function getSavedKey() {
  if (!fs.existsSync(KEY_FILE)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(KEY_FILE));
    return decrypt(data.key);
  } catch {
    return null;
  }
}

// =====================
// 🚫 BASIC BOT BLOCK
// =====================
app.use((req, res, next) => {
  const ua = req.headers["user-agent"] || "";

  if (ua.includes("curl") || ua.includes("bot")) {
    return res.status(403).send("Blocked");
  }

  next();
});

// =====================
// ❤️ HEALTH
// =====================
app.get("/", (req, res) => {
  res.send("AI Command Center API Running 🚀");
});

// =====================
// 🤖 CHAT (DEMO + LIVE)
// =====================
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;

  const apiKey =
    req.headers["x-api-key"] ||
    getSavedKey() ||
    process.env.OPENAI_API_KEY;

  // 🧪 DEMO MODE
  if (!apiKey) {
    return res.json({
      reply: "🧪 Demo Mode: AI would respond to → " + prompt
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!data.choices) {
      return res.json({ reply: "Error: " + JSON.stringify(data) });
    }

    res.json({ reply: data.choices[0].message.content });

  } catch (err) {
    res.json({ reply: "Server error: " + err.message });
  }
});

// =====================
// 🖼 IMAGE AI (DEMO + LIVE)
// =====================
app.post("/api/image", async (req, res) => {
  const { image } = req.body;

  const apiKey =
    req.headers["x-api-key"] ||
    getSavedKey() ||
    process.env.OPENAI_API_KEY;

  // 🧪 DEMO MODE
  if (!apiKey) {
    return res.json({
      reply: "🧪 Demo Mode: Image received and would be analyzed."
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Analyze this image in detail."
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    res.json({ reply: "Image error: " + err.message });
  }
});

// =====================
// 🚀 START
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
app.post("/api/deploy", async (req, res) => {
  const { projectName, files } = req.body;

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.json({ error: "Missing GitHub token" });
  }

  try {
    // 1️⃣ Create repo
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

    const repoUrl = repoData.clone_url;

    // 2️⃣ Push files (basic single file demo)
    const fileRes = await fetch(
      `https://api.github.com/repos/${repoData.full_name}/contents/index.html`,
      {
        method: "PUT",
        headers: {
          "Authorization": "token " + GITHUB_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "initial commit",
          content: Buffer.from(files).toString("base64")
        })
      }
    );

    await fileRes.json();

    res.json({
      status: "DEPLOYED",
      repo: repoUrl
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});
