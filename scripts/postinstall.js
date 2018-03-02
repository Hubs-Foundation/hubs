const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "default.env");
const dst = path.join(__dirname, "..", ".env");

if (!fs.existsSync()) {
  fs.copyFileSync(src, dst);
}
