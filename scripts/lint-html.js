#!/usr/bin/env node

const { promisify } = require("util");
const fs = require("fs");
const mkdtemp = promisify(fs.mkdtemp);
const path = require("path");
const os = require("os");
const shell = require("shelljs");

(async function() {
  function lintFile(tempDir, arg, file) {
    const out = path.join(tempDir, file);
    shell.mkdir("-p", path.dirname(out));
    shell.sed(/<%.+%>/, "", file).to(out);
    const result = shell.exec(`node_modules/.bin/htmlhint ${arg} --config=.htmlhintrc ${out}`);
    return result.code;
  }

  let result = 0;
  if (process.argv.length > 2) {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "lint-html-"));
    let files;
    let arg = "";
    if (process.argv.length === 4) {
      arg = process.argv[2];
      files = process.argv[3];
    } else {
      files = process.argv[2];
    }
    const results = shell.ls(files).map(lintFile.bind(null, tempDir, arg));
    result = results.reduce((a, r) => a + r, 0);
    shell.rm("-r", tempDir);
  }

  shell.exit(result);
})();
