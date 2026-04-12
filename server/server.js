app.post("/api/full-deploy", async (req, res) => {
  const { projectName, files } = req.body;

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const RENDER_API_KEY = process.env.RENDER_API_KEY;

  if (!GITHUB_TOKEN) {
    return res.json({ error: "Missing GitHub token" });
  }

  try {
    // =========================
    // 1️⃣ CREATE GITHUB REPO
    // =========================
    const repoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": "token " + GITHUB_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: projectName,
        private: false
      })
    });

    const repoData = await repoRes.json();

    if (!repoData.full_name) {
      return res.json({ error: "GitHub repo creation failed", details: repoData });
    }

    // =========================
    // 2️⃣ PUSH MULTIPLE FILES
    // =========================
    for (const file of files) {
      await fetch(
        `https://api.github.com/repos/${repoData.full_name}/contents/${file.path}`,
        {
          method: "PUT",
          headers: {
            "Authorization": "token " + GITHUB_TOKEN,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "AI initial commit",
            content: Buffer.from(file.content).toString("base64")
          })
        }
      );
    }

    // =========================
    // 3️⃣ DEPLOY TO RENDER
    // =========================
    let renderUrl = "Render not connected";

    if (RENDER_API_KEY) {
      const renderRes = await fetch("https://api.render.com/v1/services", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + RENDER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: projectName,
          type: "web_service",
          repo: repoData.clone_url,
          branch: "main",
          buildCommand: "npm install",
          startCommand: "node server.js"
        })
      });

      const renderData = await renderRes.json();
      renderUrl = renderData.service?.url || "Deploy started...";
    }

    res.json({
      status: "SUCCESS",
      repo: repoData.html_url,
      render: renderUrl
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});
