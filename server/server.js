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
const SECRET = "my_super_secret_key"; // change if you want

const KEY_FILE = path.join(__dirname, "secure_key.json");

// =====================
// 🔐 ENCRYPT / DECRYPT
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
// 🔐 SAVE KEY (PIN PROTECTED)
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
// 🚫 BASIC ANTI-SCRAPE
// =====================
app.use((req, res, next) => {
  const ua = req.headers["user-agent"] || "";

  if (
    ua.includes("curl") ||
    ua.includes("bot") ||
    ua.includes("spider")
  ) {
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
// 🤖 AI CHAT
// =====================
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;

  // Priority:
  // 1. Header key
  // 2. Saved key
  // 3. Env key
  const apiKey =
    req.headers["x-api-key"] ||
    getSavedKey() ||
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.json({ reply: "No API key found" });
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
// 🚀 START
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
