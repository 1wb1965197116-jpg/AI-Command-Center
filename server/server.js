const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 10000);
const clientBuild = path.join(__dirname, "../client/build");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(clientBuild));

app.get("/health", (_req, res) => res.status(200).json({ ok: true, service: "ai-command-center" }));
app.get("/", (_req, res) => res.sendFile(path.join(clientBuild, "index.html")));

app.post("/api/ask", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) return res.status(400).json({ error: "A prompt is required" });
  if (prompt.length > 12000) return res.status(413).json({ error: "Prompt is too long" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", messages: [{ role: "user", content: prompt }] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "AI provider request failed" });
    res.json({ reply: data?.choices?.[0]?.message?.content || "" });
  } catch (err) {
    console.error("AI request failed:", err.message);
    res.status(502).json({ error: "AI request failed" });
  }
});

app.post("/api/build-full-app", async (req, res) => {
  const idea = typeof req.body?.idea === "string" ? req.body.idea.trim() : "";
  if (!idea) return res.status(400).json({ error: "Describe the app you want to build" });
  if (idea.length > 8000) return res.status(413).json({ error: "App description is too long" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return only a JSON array of files. Each item must have path and content string fields. Do not include secrets, executable deployment scripts, or path traversal." },
          { role: "user", content: `Create a small deployable web app for this idea: ${idea}. Return files such as index.html, style.css, and script.js.` }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "AI provider request failed" });
    const raw = data?.choices?.[0]?.message?.content || "";
    const files = JSON.parse(raw);
    if (!Array.isArray(files) || !files.length || files.length > 10) throw new Error("AI returned an invalid file list");
    const safeFiles = files.map(file => {
      const filePath = String(file.path || "");
      if (!/^(?!\/)(?!.*\.\.)[A-Za-z0-9._/-]+$/.test(filePath) || typeof file.content !== "string") throw new Error("AI returned an unsafe file");
      return { path: filePath, content: file.content };
    });
    res.json({ files: safeFiles });
  } catch (err) {
    console.error("App generation failed:", err.message);
    res.status(502).json({ error: "Unable to generate a valid app file set" });
  }
});

function approved(req) {
  const expected = process.env.DEPLOY_APPROVAL_TOKEN || "";
  const supplied = req.get("x-deploy-approval") || "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.post("/api/full-deploy", async (req, res) => {
  if (!approved(req)) return res.status(403).json({ error: "A deployment approval token is required" });
  if (!process.env.GITHUB_TOKEN) return res.status(503).json({ error: "GITHUB_TOKEN is not configured on the server" });
  const projectName = typeof req.body?.projectName === "string" ? req.body.projectName : "";
  const files = req.body?.files;
  if (!/^[a-zA-Z0-9._-]{3,80}$/.test(projectName) || !Array.isArray(files) || !files.length || files.length > 10) {
    return res.status(400).json({ error: "Invalid project name or file list" });
  }
  for (const file of files) {
    if (!file || typeof file.path !== "string" || typeof file.content !== "string" ||
        !/^(?!\/)(?!.*\.\.)[A-Za-z0-9._/-]+$/.test(file.path) || file.content.length > 250000) {
      return res.status(400).json({ error: "Invalid or oversized file" });
    }
  }

  try {
    const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json", Accept: "application/vnd.github+json" };
    const repoResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST", headers, body: JSON.stringify({ name: projectName, private: true, auto_init: true })
    });
    const repo = await repoResponse.json();
    if (!repoResponse.ok || !repo.full_name) return res.status(502).json({ error: repo.message || "GitHub repository creation failed" });

    for (const file of files) {
      const pathEncoded = file.path.split("/").map(encodeURIComponent).join("/");
      const writeResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${pathEncoded}`, {
        method: "PUT", headers,
        body: JSON.stringify({ message: "Create app from AI Command Center", content: Buffer.from(file.content, "utf8").toString("base64") })
      });
      if (!writeResponse.ok) {
        const detail = await writeResponse.json();
        return res.status(502).json({ error: detail.message || "GitHub file upload failed", repo: repo.html_url });
      }
    }
    res.json({ repo: repo.html_url, status: "FILES_UPLOADED" });
  } catch (err) {
    console.error("GitHub deploy failed:", err.message);
    res.status(502).json({ error: "GitHub deployment request failed" });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(clientBuild, "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`AI Command Center listening on ${PORT}`));
