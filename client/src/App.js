import React, { useState } from "react";

export default function App() {
  const [mode, setMode] = useState("chat");
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [htmlCode, setHtmlCode] = useState("");

  const API = "https://ai-command-center-iq8w.onrender.com";

  // =====================
  // 🤖 BASIC CHAT
  // =====================
  const send = async () => {
    const res = await fetch(API + "/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input })
    });

    const data = await res.json();
    setReply(data.reply);
  };

  // =====================
  // 🎤 VOICE INPUT
  // =====================
  const voice = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      alert("Voice not supported on this device");
      return;
    }

    const rec = new Speech();
    rec.onresult = e => setInput(e.results[0][0].transcript);
    rec.start();
  };

  // =====================
  // 🖼 IMAGE UPLOAD
  // =====================
  const uploadImage = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const res = await fetch(API + "/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: reader.result })
      });

      const data = await res.json();
      setReply(data.reply);
    };

    reader.readAsDataURL(file);
  };

  // =====================
  // 📷 CAMERA SCANNER
  // =====================
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      setTimeout(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const image = canvas.toDataURL("image/png");

        fetch(API + "/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image })
        })
          .then(res => res.json())
          .then(data => setReply(data.reply));

        stream.getTracks().forEach(track => track.stop());
      }, 2000);
    } catch (err) {
      alert("Camera error: " + err.message);
    }
  };

  // =====================
  // 🤖 MULTI-AI
  // =====================
  const multiAI = async () => {
    let results = [];

    for (let i = 0; i < 2; i++) {
      const res = await fetch(API + "/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input })
      });

      const data = await res.json();
      results.push("🤖 AI " + (i + 1) + ":\n" + data.reply);
    }

    setReply(results.join("\n\n----------------\n\n"));
  };

  // =====================
  // 💰 MONEY MODE
  // =====================
  const moneyMode = async () => {
    const res = await fetch(API + "/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Create a step-by-step business plan to make money: " + input
      })
    });

    const data = await res.json();
    setReply("💰 MONEY PLAN:\n\n" + data.reply);
  };

  // =====================
  // 🌐 OPEN WEBSITE
  // =====================
  const openSite = () => {
    const url = prompt("Enter URL (https://...)");
    if (url) window.open(url, "_blank");
  };

  // =====================
  // 🧠 HTML RUNNER (AI BROWSER)
  // =====================
  const runHTML = () => {
    const newWindow = window.open();
    newWindow.document.open();
    newWindow.document.write(htmlCode);
    newWindow.document.close();
  };

  // =====================
  // UI
  // =====================
  return (
    <div style={{ padding: 20 }}>

      <h1>AI Command Center</h1>

      {/* MODE SWITCH */}
      <div>
        <button onClick={() => setMode("chat")}>💬 Chat</button>
        <button onClick={() => setMode("code")}>💻 Code</button>
        <button onClick={() => setMode("doc")}>📄 Document</button>
        <button onClick={() => setMode("html")}>🌐 HTML</button>
      </div>

      <hr />

      {/* INPUT AREA */}
      {mode !== "html" && (
        <textarea
          rows="10"
          style={{ width: "100%" }}
          placeholder="Enter text..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      )}

      {/* HTML RUNNER */}
      {mode === "html" && (
        <>
          <textarea
            rows="10"
            style={{ width: "100%" }}
            placeholder="<html>...</html>"
            value={htmlCode}
            onChange={e => setHtmlCode(e.target.value)}
          />
          <br />
          <button onClick={runHTML}>🚀 Run HTML</button>
        </>
      )}

      <br />

      {/* ACTION BUTTONS */}
      {mode !== "html" && (
        <>
          <button onClick={send}>Send</button>
          <button onClick={voice}>🎤 Voice</button>
          <button onClick={multiAI}>🤖 Multi-AI</button>
          <button onClick={moneyMode}>💰 Money</button>
          <button onClick={openCamera}>📷 Scan</button>
          <button onClick={openSite}>🌐 Open</button>
          <input type="file" onChange={uploadImage} />
        </>
      )}

      <hr />

      {/* OUTPUT */}
      <h3>AI Response:</h3>
      <div style={{
        whiteSpace: "pre-wrap",
        background: "#eee",
        padding: 10,
        minHeight: 100
      }}>
        {reply}
      </div>

    </div>
  );
}
const deployProject = async () => {
  const res = await fetch(API + "/api/deploy", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      projectName: "ai-generated-app",
      files: htmlCode || "<h1>Hello from AI</h1>"
    })
  });

  const data = await res.json();

  setReply("🚀 Repo Created:\n" + data.repo);
};
