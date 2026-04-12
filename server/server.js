const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =====================
// DB
// =====================
const DB_FILE = path.join(__dirname, "db.json");

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

function saveChat(prompt, reply) {
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  data.unshift({ prompt, reply, time: new Date() });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// =====================
// HEALTH
// =====================
app.get("/api/health", (req, res) => {
  res.json({ status: "AI Server Running" });
});

// =====================
// AI CHAT
// =====================
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
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

    const reply = data.choices[0].message.content;

    saveChat(prompt, reply);

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "Server error: " + err.message });
  }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
