const fs = require("fs");

function check(file) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
    console.log("✅ Valid JSON:", file);
  } catch (e) {
    console.error("❌ INVALID JSON:", file);
    console.error(e.message);
    process.exit(1);
  }
}

console.log("🔍 Running pre-deploy validation...");

check("./package.json");
check("./client/package.json");
check("./server/package.json");

console.log("🚀 All configs valid. Safe to deploy.");
