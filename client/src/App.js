import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const API = "https://ai-command-center-iq8w.onrender.com";

  const [apiKey, setApiKey] = useState("");
  const [pin, setPin] = useState("");
  const [locked, setLocked] = useState(false);

  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [htmlCode, setHtmlCode] = useState("");

  const fileRef = useRef();

  // =====================
  // 🔐 LOAD LOCK
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
  // 🧠 BUILD APP
  // =====================
  const buildApp = async () => {
    const res = await fetch(API + "/api/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        prompt: "Generate full working HTML/CSS/JS app: " + input
      })
    });

    const data = await res.json();
    setHtmlCode(data.reply);
  };

  // =====================
  // 🚀 DEPLOY
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
    setReply("🚀 Repo: " + data.repo);
  };

  // =====================
  // 🌐 RUN HTML
  // =====================
  const runHTML = () => {
    const win = window.open();
    win.document.write(htmlCode);
  };

  // =====================
  // 📁 FILE UPLOAD
  // =====================
  const handleFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      setInput(reader.result);
    };

    reader.readAsText(file);
  };

  // =====================
  // 🌐 OPEN WEBSITE
  // =====================
  const openSite = () => {
    window.open(input.startsWith("http") ? input : "https://" + input);
  };

  // =====================
  // 🎤 VOICE INPUT
  // =====================
  const startVoice = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };
    recognition.start();
  };

  // =====================
  // 📷 CAMERA SCAN
  // =====================
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    const canvas = document.createElement("canvas");

    setTimeout(() => {
      canvas.getContext("2d").drawImage(video, 0, 0, 300, 200);
      const img = canvas.toDataURL();
      setReply("📷 Captured image (ready for AI processing)");
      stream.getTracks().forEach(track => track.stop());
    }, 3000);
  };

  return (
    <div style={{ padding: 20 }}>

      <h1>🤖 AI Command Center</h1>

      {/* 🔐 KEY SYSTEM */}
      {!locked ? (
        <>
          <input placeholder="API Key" value={apiKey} onChange={e=>setApiKey(e.target.value)} />
          <input placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)} />
          <button onClick={execute}>🔐 Execute</button>
        </>
      ) : (
        <button onClick={resetKey}>➕ New Key</button>
      )}

      <hr />

      {/* INPUT */}
      <textarea
        rows="5"
        style={{ width: "100%" }}
        value={input}
        onChange={e=>setInput(e.target.value)}
        placeholder="Ask AI or describe app..."
      />

      <br />

      {/* 🔥 MAIN TOOLS */}
      <button onClick={send}>💬 Chat</button>
      <button onClick={autoBuildDeploy}>
       🤖 AUTO BUILD + DEPLOY
        
      </button>
      <button onClick={buildApp}>🧠 Build</button>
      <button onClick={runHTML}>🌐 Run</button>
      <button onClick={deploy}>🚀 Deploy</button>

      <hr />

      {/* 🧩 EXTRA TOOLS */}
      <button onClick={()=>fileRef.current.click()}>📁 Upload</button>
      <input type="file" ref={fileRef} style={{display:"none"}} onChange={handleFile} />

      <button onClick={openSite}>🌐 Open Site</button>
      <button onClick={startVoice}>🎤 Voice</button>
      <button onClick={startCamera}>📷 Scan</button>

      <hr />

      {/* OUTPUT */}
      <textarea
        rows="10"
        style={{ width: "100%" }}
        value={htmlCode}
        onChange={e=>setHtmlCode(e.target.value)}
      />

      <pre>{reply}</pre>

    </div>
  );
}
const autoBuildDeploy = async () => {
  setReply("🤖 Building app...");

  const build = await fetch(API + "/api/build-full-app", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ idea: input })
  });

  const buildData = await build.json();

  setReply("🚀 Deploying...");

  const deploy = await fetch(API + "/api/full-deploy", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      projectName: "ai-auto-" + Date.now(),
      files: buildData.files
    })
  });

  const deployData = await deploy.json();

  setReply(
    "✅ FULL APP CREATED + DEPLOYED\n\n🐙 Repo:\n" +
    deployData.repo
  );
};
