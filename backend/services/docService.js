const fs = require("fs");
const path = require("path");

let cachedDocs = "";

function loadDocs() {
  if (cachedDocs) return cachedDocs;

  const docsDir = path.join(__dirname, "../docs");
  const files = fs.readdirSync(docsDir);

  let content = "";

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(docsDir, file);
    const text = fs.readFileSync(filePath, "utf8");

    content += `\n\n=== Tài liệu: ${file} ===\n${text}`;
  }

  cachedDocs = content;
  return cachedDocs;
}

module.exports = {
  loadDocs,
};