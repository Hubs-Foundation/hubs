const path = require("path");
const { extract } = require("@formatjs/cli-lib");
const glob = require("glob");
const promisify = require("util").promisify;
const asyncGlob = promisify(glob);
const fs = require("fs");
const asyncWriteFile = promisify(fs.writeFile);

async function main(argv) {
  const command = argv[2];
  const basePath = path.resolve(__dirname, "..", "..", "..");
  const files = await asyncGlob("../../../src/**/*.js", { cwd: __dirname, absolute: true });

  if (command === "en") {
    const outPath = path.join(__dirname, "en.json");

    const extractedMessages = await extract(files, {
      extractSourceLocation: false,
      extractFromFormatMessageCall: true,
      removeDefaultMessage: false,
      format: {
        format: msgs => {
          for (const id in msgs) {
            msgs[id] = msgs[id].defaultMessage;
          }
          return msgs;
        }
      }
    });

    await asyncWriteFile(outPath, extractedMessages);

    console.log(`Wrote file to ${outPath}`);
  } else {
    const outPath = path.join(__dirname, "extracted-messages.json");

    const extractedMessages = await extract(files, {
      extractSourceLocation: true,
      extractFromFormatMessageCall: true,
      removeDefaultMessage: false,
      format: {
        format: msgs => {
          for (const id in msgs) {
            const msg = msgs[id];
            msg.file = path.relative(basePath, msg.file);
          }

          return msgs;
        }
      }
    });

    await asyncWriteFile(outPath, extractedMessages);

    console.log(`Wrote file to ${outPath}`);
  }
}

main(process.argv)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
