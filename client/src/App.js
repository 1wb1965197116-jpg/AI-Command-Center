import React, { useState, useEffect } from "react";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [pin, setPin] = useState("");
  const [locked, setLocked] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (localStorage.getItem("locked") === "true") {
      setLocked(true);
    }
  }, []);

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
      setApiKey("");
      setPin("");
    } else {
      alert("Wrong PIN");
    }
  };

  // 🤖 CHAT
  const send = async () => {
    const res = await fetch("https://ai-command-center-iq8w.onrender.com/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    setReply(data.reply);
  };

  // 🎤 VOICE
  const voice = () => {
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.onresult = e => setPrompt(e.results[0][0].transcript);
    rec.start();
  };

  // 🖼 IMAGE
  const uploadImage = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const res = await fetch("https://ai-command-center-iq8w.onrender.com/api/image", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ image: reader.result })
      });

      const data = await res.json();
      setReply(data.reply);
    };

    reader.readAsDataURL(file);
  };

  const reset = () => {
    localStorage.removeItem("locked");
    setLocked(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Command Center</h1>

      {!locked && (
        <>
          <input placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} />
          <input placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} />
          <button onClick={execute}>🔐 Execute</button>
        </>
      )}

      {locked && <button onClick={reset}>➕ Add New Key</button>}

      <hr/>

      <input
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Ask AI..."
      />

      <button onClick={send}>Send</button>
      <button onClick={voice}>🎤 Voice</button>
      <input type="file" onChange={uploadImage} />

      <p><b>AI:</b> {reply}</p>
    </div>
  );
}
