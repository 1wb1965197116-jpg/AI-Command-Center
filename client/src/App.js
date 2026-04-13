import React, { useState, useEffect } from "react";

export default function App() {
  const API = "https://ai-command-center-iq8w.onrender.com";

  const [apiKey, setApiKey] = useState("");
  const [pin, setPin] = useState("");
  const [locked, setLocked] = useState(false);

  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [htmlCode, setHtmlCode] = useState("");

  // =====================
  // 🔐 LOAD LOCK STATE
  // =====================
  useEffect(() => {
    if (localStorage.getItem("locked") === "true") {
      setLocked(true);
    }
  }, []);

  // =====================
  // 🔐 SAVE KEY
  // =====================
  const execute = async () => {
    const res = await fetch(API + "/api/save-key", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ apiKey, pin })
    });

    const data = await res.json();

    if (data.status === "KEY SAVED") {
      localStorage.setItem("locked", "true");
      setLocked(true);
      setApiKey("");
      setPin("");
    } else {
      alert("Wrong PIN");
    }
  };

  const resetKey = () => {
    localStorage.removeItem("locked");
    setLocked(false);
  };

  // =====================
  // 🤖 CHAT
  // =====================
  const send = async () => {
    const res = await fetch(API + "/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt: input })
    });

    const data = await res.json();
    setReply(data.reply);
  };

  // =====================
  // 🚀 AI BUILD PROJECT
  // =====================
  const buildApp = async () => {
    const res = await fetch(API + "/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        prompt: "Generate a full working HTML app with styling and script based on: " + input
      })
    });

    const data = await res.json();

    setHtmlCode(data.reply);
    setReply("✅ App generated. Go to HTML tab.");
  };

  // =====================
  // 🚀 FULL DEPLOY
  // =====================
  const deploy = async () => {
    const res = await fetch(API + "/api/full-deploy", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        projectName: "ai-app-" + Date.now(),
        files: [
          { path: "index.html", content: htmlCode }
        ]
      })
    });

    const data = await res.json();

    setReply(
      "🚀 DEPLOYED:\n\nGitHub:\n" + data.repo +
      "\n\n(Render auto optional)"
    );
  };

  // =====================
  // 🌐 RUN HTML
  // =====================
  const runHTML = () => {
    const win = window.open();
    win.document.write(htmlCode);
    win.document.close();
  };

  return (
    <div style={{ padding: 20 }}>

      <h1>AI Command Center</h1>

      {/* 🔐 API KEY BOX */}
      {!locked && (
        <>
          <input
            placeholder="Enter API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <input
            placeholder="Enter PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
          />
          <button onClick={execute}>🔐 Execute</button>
        </>
      )}

      {locked && (
        <button onClick={resetKey}>➕ Add New Key</button>
      )}

      <hr />

      {/* INPUT */}
      <textarea
        rows="6"
        style={{ width: "100%" }}
        placeholder="Describe app or ask AI..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <br />

      {/* ACTIONS */}
      <button onClick={send}>💬 Chat</button>
      <button onClick={buildApp}>🧠 Build App</button>
      <button onClick={runHTML}>🌐 Run HTML</button>
      <button onClick={deploy}>🚀 Deploy</button>

      <hr />

      {/* OUTPUT */}
      <h3>AI Output</h3>
      <textarea
        rows="10"
        style={{ width: "100%" }}
        value={htmlCode}
        onChange={e => setHtmlCode(e.target.value)}
      />

      <pre style={{ whiteSpace: "pre-wrap" }}>{reply}</pre>

    </div>
  );
}
