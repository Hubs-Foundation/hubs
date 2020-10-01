// this script syncs changes made in en.json to any other .json files found in this directory

const fs = require("fs");

const localeFiles = [];
fs.readdirSync(".").forEach(file => {
  if (file.endsWith(".json") && file !== "en.json") {
    localeFiles.push(file);
  }
});

const raw_default_en = fs.readFileSync("en.json");
const parsed_default_en = JSON.parse(raw_default_en);

for (let i = 0; i < localeFiles.length; i++) {
  const localeFile = localeFiles[i];

  const raw_locale = fs.readFileSync(localeFile);
  let parsed_locale = {};
  try {
    parsed_locale = JSON.parse(raw_locale);
  } catch (e) {
    console.log(`malformed json found, copying en.json completely to ${localeFile}.`);
    fs.writeFileSync(localeFile, raw_default_en);
    continue;
  }

  const output = {};

  for (const key in parsed_default_en) {
    if (parsed_locale[key]) {
      output[key] = parsed_locale[key];
    } else {
      output[key] = parsed_default_en[key];
    }
  }

  const stringified_output = JSON.stringify(output, null, 2);
  fs.writeFileSync(localeFile, stringified_output);
  console.log(`${localeFile} updated.`);
}
