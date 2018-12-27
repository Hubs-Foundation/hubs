/*
 * indent-linter <glob> <num-spaces>
 * Generic, syntax-unaware indentation linter that checks if indentation is even and does not skip indentation levels.
 */

const fs = require("fs");
const glob = require("glob");

function lintFile(filename, spaces) {
  const file = fs.readFileSync(filename, { encoding: "utf8" });
  const lines = file.split("\n");

  const errors = [];
  let level = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const firstNonSpaceIndex = (line.match(/[^ ]/) || { index: 0 }).index;

    const indentation = firstNonSpaceIndex;
    const indentationDividesCleanly = indentation % spaces === 0;
    const indentationIsNoMoreThanOneLevelHigher = (indentation - level) / spaces <= 1;

    if (indentationDividesCleanly && indentationIsNoMoreThanOneLevelHigher) {
      if (indentation !== 0) {
        level = indentation;
      }
    } else {
      const expected = level;
      const delta = indentation - expected;
      const postfix = delta < 0 ? "fewer" : "extra";
      errors.push(
        `  ${i + 1}\tExpected ${expected / spaces} levels of indentation, saw ${Math.abs(delta)} space(s) ${postfix}.`
      );
    }
  }

  if (errors.length) {
    console.log(filename);
    console.log(errors.join("\n"));
    console.log(`  ${errors.length} indentation error(s).\n`);
  }

  return errors.length;
}

glob(process.argv[2], (err, files) => {
  console.log("");
  const spaces = parseInt(process.argv[3] || "4", 10);

  const errorCount = files.map(file => lintFile(file, spaces)).reduce((a, c) => a + c, 0);

  console.log(`${errorCount} total indentation error(s).\n`);
  process.exit(errorCount > 0 ? 1 : 0);
});
