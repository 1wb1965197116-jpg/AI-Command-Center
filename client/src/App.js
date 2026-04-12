import React, { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!prompt) return;

    setLoading(true);

    const res = await fetch("https://ai-command-center-iq8w.onrender.com/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    setChat([{ prompt, reply: data.reply }, ...chat]);
    setPrompt("");
    setLoading(false);
  };

  return (
    <div style={{background:"#000", color:"#0f0", padding:20}}>
      <h1>AI Command Center</h1>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Ask AI anything..."
      />

      <br/>

      <button onClick={send}>Send</button>

      {loading && <p>Thinking...</p>}

      <hr/>

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
