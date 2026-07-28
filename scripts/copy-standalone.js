const fs = require("node:fs");
const path = require("node:path");

function copyIfExists(source, destination) {
  if (!fs.existsSync(source)) {
    console.warn(`Skipped missing path: ${source}`);
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, {
    recursive: true,
    force: true,
  });
}

copyIfExists(
  path.join(".next", "static"),
  path.join(".next", "standalone", ".next", "static"),
);

copyIfExists(
  "public",
  path.join(".next", "standalone", "public"),
);

console.log("Standalone assets copied successfully.");
