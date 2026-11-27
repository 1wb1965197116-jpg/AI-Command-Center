import React, { useRef, useState } from "react";

const API = "";

export default function App() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [files, setFiles] = useState([]);
  const [deployToken, setDeployToken] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const request = async (path, body, extraHeaders = {}) => {
    const response = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  };

  const send = async () => {
    if (!input.trim()) return setReply("Enter a prompt first.");
    setBusy(true);
    try {
      const data = await request("/api/ask", { prompt: input });
      setReply(data.reply || "No response returned.");
    } catch (error) {
      setReply(error.message);
    } finally {
      setBusy(false);
    }
  };

  const buildApp = async () => {
    if (!input.trim()) return setReply("Describe the app you want to build first.");
    setBusy(true);
    try {
      const data = await request("/api/build-full-app", { idea: input });
      setFiles(data.files || []);
      const html = (data.files || []).find(file => file.path === "index.html");
      setHtmlCode(html?.content || JSON.stringify(data.files, null, 2));
      setReply(`Generated ${data.files?.length || 0} file(s). Review them before deployment.`);
    } catch (error) {
      setReply(error.message);
    } finally {
      setBusy(false);
    }
  };

  const deployFiles = async (items = files) => {
    if (!deployToken.trim()) return setReply("Enter the deployment approval token configured in Render.");
    if (!items.length) return setReply("Build an app before deploying.");
    setBusy(true);
    try {
      const data = await request("/api/full-deploy", {
        projectName: "ai-app-" + Date.now(),
        files: items
      }, { "x-deploy-approval": deployToken });
      setReply(`GitHub repository created and files uploaded:\n${data.repo}`);
    } catch (error) {
      setReply(error.message);
    } finally {
      setBusy(false);
    }
  };

  const autoBuildDeploy = async () => buildApp();

  const runHTML = () => {
    if (!htmlCode.trim()) return setReply("Build or paste HTML before running it.");
    setPreviewHtml(htmlCode);
    setReply("Preview rendered in a sandboxed frame. Scripts cannot access this dashboard.");
  };

  const handleFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result || ""));
    reader.onerror = () => setReply("Could not read that file.");
    reader.readAsText(file);
    event.target.value = "";
  };

  const openSite = () => {
    const value = input.trim();
    if (!value) return setReply("Enter a website address first.");
    const url = /^https?:\/\//i.test(value) ? value : "https://" + value;
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      window.open(parsed.href, "_blank", "noopener,noreferrer");
    } catch {
      setReply("Enter a valid website address.");
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return setReply("Voice input is not supported by this browser.");
    const recognition = new SpeechRecognition();
    recognition.onresult = event => setInput(event.results[0][0].transcript);
    recognition.onerror = () => setReply("Voice input could not start.");
    recognition.start();
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setReply("Camera access is not supported here.");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise(resolve => setTimeout(resolve, 1200));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      setReply("Camera image captured locally. Image understanding is not connected yet.");
    } catch (error) {
      setReply("Camera capture failed: " + error.message);
    } finally {
      stream?.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>AI Command Center</h1>
      <p>Chat, generate app files, preview them safely, and deploy to a new private GitHub repository after approval.</p>
      <label htmlFor="prompt"><strong>Prompt or app description</strong></label>
      <textarea id="prompt" rows="6" style={{ width: "100%", marginTop: 8, padding: 10 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question or describe the app you want to build..." />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
        <button disabled={busy} onClick={send}>Chat</button>
        <button disabled={busy} onClick={buildApp}>Build App</button>
        <button disabled={busy} onClick={runHTML}>Preview HTML</button>
        <button disabled={busy} onClick={autoBuildDeploy}>Generate Files</button>
        <button onClick={() => fileRef.current?.click()}>Upload Text File</button>
        <button onClick={openSite}>Open Website</button>
        <button onClick={startVoice}>Voice Input</button>
        <button onClick={startCamera}>Camera Capture</button>
      </div>
      <input ref={fileRef} type="file" accept=".txt,.md,.html,.css,.js,.json" hidden onChange={handleFile} />
      <label htmlFor="html-output"><strong>Generated HTML / output</strong></label>
      <textarea id="html-output" rows="12" style={{ width: "100%", marginTop: 8, padding: 10, fontFamily: "monospace" }} value={htmlCode} onChange={e => setHtmlCode(e.target.value)} />
      {previewHtml && <section style={{ marginTop: 16 }}>
        <h2>Sandboxed preview</h2>
        <iframe title="Generated app preview" sandbox="allow-scripts" srcDoc={previewHtml} style={{ width: "100%", minHeight: 360, border: "1px solid #bbb", background: "white" }} />
      </section>}
      <p>{files.length} generated file(s) available for deployment.</p>
      <label htmlFor="deploy-token"><strong>Deployment approval token</strong></label>
      <input id="deploy-token" type="password" autoComplete="off" value={deployToken} onChange={e => setDeployToken(e.target.value)} placeholder="Set DEPLOY_APPROVAL_TOKEN in Render first" style={{ width: "100%", padding: 10, marginTop: 8 }} />
      <div style={{ margin: "12px 0" }}>
        <button disabled={busy || !files.length} onClick={() => deployFiles()}>Deploy files to private GitHub repository</button>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f3f4f6", padding: 12, borderRadius: 8 }}>{busy ? "Working..." : reply}</pre>
    </main>
  );
}
