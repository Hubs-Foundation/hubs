// this script syncs changes made in en.json to any other .json files found in this directory

const fs = require("fs");
const path = require("path");

const localeFiles = [];
fs.readdirSync(__dirname).forEach(file => {
  if (file.endsWith(".json") && file !== "en.json") {
    localeFiles.push(path.resolve(__dirname, file));
  }
});

const raw_default_en = fs.readFileSync(path.resolve(__dirname, "en.json"));
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

  const keysToRemove = new Set(Object.keys(parsed_locale));

  for (const key in parsed_default_en) {
    if (parsed_locale[key]) {
      output[key] = parsed_locale[key];
    } else {
      output[key] = parsed_default_en[key];
    }

    keysToRemove.delete(key);
  }

  for (const key of keysToRemove) {
    delete output[key];
  }

  const stringified_output = JSON.stringify(output, null, 2);
  fs.writeFileSync(localeFile, stringified_output);
  console.log(`${localeFile} updated.`);
}
