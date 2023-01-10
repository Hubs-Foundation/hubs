import { readFileSync, existsSync, unlinkSync } from "fs";

if (!existsSync(".ret.credentials")) {
  console.log("Not logged in. To log in, run npm run login.");
  process.exit(0);
}

const creds = JSON.parse(readFileSync(".ret.credentials"));
unlinkSync(".ret.credentials");
console.log(`Logged out of ${creds.host}.`);
