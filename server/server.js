import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DB_FILE = "./db.json";

// INIT DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// SAVE CHAT HISTORY
function saveChat(prompt, reply) {
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  data.unshift({ prompt, reply, time: new Date() });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// GET HISTORY
app.get("/api/history", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  res.json(data);
});


// =====================
// 🤖 AI CHAT (MULTI MODEL)
// =====================
app.post("/api/ask", async (req, res) => {
  const { prompt, model } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response";

    saveChat(prompt, reply);

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
// 🖼 IMAGE AI (READY FOR VISION UPGRADE)
// =====================
app.post("/api/image", async (req, res) => {
  const { image } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: "Analyze this image in detail." }
        ]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
// 💼 BUSINESS AI TOOL
// =====================
app.post("/api/business", async (req, res) => {
  const { revenue, expenses } = req.body;

  const prompt = `
Analyze this business:
Revenue: ${revenue}
Expenses: ${expenses}
Give profit insights, improvements, and strategy.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
// ❤️ HEALTH CHECK
// =====================
app.get("/api/health", (req, res) => {
  res.json({ status: "AI Server Running" });
});


// =====================
// 🌐 SERVE FRONTEND
// =====================
app.use(express.static("client/build"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve("client/build/index.html"));
});


// =====================
// 🚀 START SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("AI Server running on port", PORT));
