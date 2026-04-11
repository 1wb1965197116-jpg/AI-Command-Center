import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// AI ROUTE
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SERVE REACT
app.use(express.static("client/build"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve("client/build/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
