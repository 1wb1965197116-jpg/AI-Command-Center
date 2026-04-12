import React, { useState } from "react";

export default function App() {
  const [mode, setMode] = useState("chat");
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");

  const send = async () => {
    const res = await fetch("https://ai-command-center-iq8w.onrender.com/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt: input })
    });

    const data = await res.json();
    setReply(data.reply);
  };

  // 🎤 VOICE
  const voice = () => {
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.onresult = e => setInput(e.results[0][0].transcript);
    rec.start();
  };

  // 🖼 IMAGE UPLOAD
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

  return (
    <div style={{ padding: 20 }}>

      <h1>AI Command Center</h1>

      {/* MODE SWITCH */}
      <div>
        <button onClick={() => setMode("chat")}>💬 Chat</button>
        <button onClick={() => setMode("code")}>💻 Code</button>
        <button onClick={() => setMode("doc")}>📄 Document</button>
      </div>

      <hr/>

      {/* INPUT AREA */}
      <textarea
        rows="10"
        style={{ width: "100%" }}
        placeholder={
          mode === "chat" ? "Ask anything..." :
          mode === "code" ? "Paste code here..." :
          "Paste document text here..."
        }
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <br/>

      <button onClick={send}>Send</button>
      <button onClick={voice}>🎤 Voice</button>
      <input type="file" onChange={uploadImage} />

      <hr/>

      <h3>AI Response:</h3>
      <div style={{ whiteSpace: "pre-wrap", background: "#eee", padding: 10 }}>
        {reply}
      </div>

    </div>
  );
}
