import React, { useState, useEffect } from "react";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [pin, setPin] = useState("");
  const [locked, setLocked] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");

  // 🔐 Remember lock state
  useEffect(() => {
    if (localStorage.getItem("locked") === "true") {
      setLocked(true);
    }
  }, []);

  // 🔐 SAVE KEY + LOCK
  const execute = async () => {
    const res = await fetch("https://ai-command-center-iq8w.onrender.com/api/save-key", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ apiKey, pin })
    });

    const data = await res.json();

    if (data.status === "KEY SAVED") {
      localStorage.setItem("locked", "true");
      setLocked(true);
      setApiKey(""); // 🔥 erase from memory
      setPin("");
    } else {
      alert("Wrong PIN");
    }
  };

  // 🤖 ASK AI
  const send = async () => {
    const res = await fetch("https://ai-command-center-iq8w.onrender.com/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    setReply(data.reply);
  };

  // 🔓 RESET KEY
  const reset = () => {
    localStorage.removeItem("locked");
    setLocked(false);
  };

  return (
    <div style={{ padding: 20 }}>

      <h1>AI Command Center</h1>

      {/* 🔐 KEY INPUT */}
      {!locked && (
        <>
          <input
            placeholder="Enter API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <input
            placeholder="Enter PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <button onClick={execute}>🔐 EXECUTE</button>
        </>
      )}

      {/* 🔓 RESET BUTTON */}
      {locked && (
        <button onClick={reset}>➕ Add New API Key</button>
      )}

      <hr/>

      {/* 🤖 AI */}
      <input
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Ask AI..."
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={send}>Send</button>

      <p><b>AI:</b> {reply}</p>

    </div>
  );
}
