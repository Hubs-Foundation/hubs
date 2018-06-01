const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const shell = require("shelljs");
const flatten = require("lodash/flatten");
const indexTemplate = require("./index.js");

async function extractDocs(file) {
  const contents = (await readFile(file)).toString();
  // Find all the doc strings in the file.
  const matches = contents.match(/\/\*\*.+?\*\//gs);
  if (matches) {
    return matches.map(match => {
      return { doc: match, file };
    });
  } else {
    return null;
  }
}

function parseDocs(doc) {
  const _doc = doc;
  // Capture the description and tags in the doc string
  const matches = _doc.doc.match(/\/\*\*([^@]+)(.+)\*\//s);
  // Trim whitespace and asterisks from a line
  const trimLine = line => line.trim().replace(/^\*\s*|\s*\*$/g, "");

  _doc.doc = {
    desc: matches[1]
      .split("\n")
      .map(trimLine)
      .filter(x => x)
      .join(" "),
    tags: matches[2]
      .split(/[\r\n]/)
      .map(trimLine)
      .filter(x => x.startsWith("@"))
      .reduce((a, x) => {
        const tag = x.split(" ");
        a[tag[0].substring(1)] = tag.slice(1).join();
        return a;
      }, {})
  };
  return _doc;
}

function aframeDocs(doc) {
  const keys = Object.keys(doc.doc.tags);
  return keys.includes("component") || keys.includes("system");
}

(async function() {
  const files = shell.ls("src/components/*.js", "src/systems/*.js");
  const parsedDocs = flatten(await Promise.all(files.map(extractDocs)))
    .filter(x => x)
    .map(parseDocs)
    .filter(aframeDocs);
  writeFile("doc/index.md", indexTemplate(parsedDocs));
})();
