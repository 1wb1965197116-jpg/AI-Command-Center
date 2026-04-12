import React, { useState, useEffect } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  // LOAD HISTORY
  useEffect(() => {
    fetch("/api/history")
      .then(res => res.json())
      .then(data => setChat(data))
      .catch(() => {});
  }, []);

  // SEND MESSAGE
  const send = async () => {
    if (!prompt) return;

    setLoading(true);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    setChat([{ prompt, reply: data.reply }, ...chat]);
    setPrompt("");
    setLoading(false);
  };

  // 🎤 VOICE INPUT
  const voice = () => {
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.onresult = e => setPrompt(e.results[0][0].transcript);
    rec.start();
  };

  // 🖼 IMAGE UPLOAD
  const imageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ image: reader.result })
      });

      const data = await res.json();
      setChat([{ prompt: "Image", reply: data.reply }, ...chat]);
    };

    reader.readAsDataURL(file);
  };

  // 💼 BUSINESS TOOL
  const runBusiness = async () => {
    const res = await fetch("/api/business", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ revenue: 10000, expenses: 5000 })
    });

    const data = await res.json();
    setChat([{ prompt: "Business Analysis", reply: data.reply }, ...chat]);
  };

  return (
    <div style={{background:"#000", color:"#0f0", padding:20}}>
      <h1>AI Command Center</h1>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Ask anything..."
      />

      <br/>

      <button onClick={send}>Send</button>
      <button onClick={voice}>🎤</button>
      <input type="file" onChange={imageUpload} />

      <br/><br/>

      <button onClick={runBusiness}>💼 Analyze Business</button>

      <hr/>

      {loading && <p>Thinking...</p>}

      {chat.map((c,i)=>(
        <div key={i}>
          <b>YOU:</b> {c.prompt}<br/>
          <b>AI:</b> {c.reply}
          <hr/>
        </div>
      ))}
    </div>
  );
}
