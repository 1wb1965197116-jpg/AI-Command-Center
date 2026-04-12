import React, { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");

  const send = async () => {
    try {
      const res = await fetch("https://ai-command-center-iq8w.onrender.com/api/ask", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      setReply(data.reply);

    } catch (err) {
      setReply("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Command Center</h1>

      <input
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Ask something..."
      />

      <button onClick={send}>Send</button>

      <p><b>AI:</b> {reply}</p>
    </div>
  );
}
