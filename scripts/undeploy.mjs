import { readFileSync, existsSync } from "fs";
import ora from "ora";
import fetch from "node-fetch";

if (!existsSync(".ret.credentials")) {
  console.log("Not logged in, so cannot deploy. To log in, run npm run login.");
  process.exit(0);
}

const { host, token } = JSON.parse(readFileSync(".ret.credentials"));
const spinner = ora(`Undeploying ${host}.`).start();

(async () => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  await fetch(`https://${host}/api/ita/undeploy/hubs`, { headers, method: "POST" });
  spinner.text = `${host} now using Hubs master client.`;
  spinner.succeed();
  process.exit(0);
})();
