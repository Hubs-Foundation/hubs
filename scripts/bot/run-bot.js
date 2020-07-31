#!/usr/bin/env node
const doc = `
Usage:
    ./run-bot.js [options]
Options:
    -h --help         Show this screen
    -u --url=<url>    URL
    -o --host=<host>  Hubs host if URL is not specified [default: localhost:8080]
    -r --room=<room>  Room id
    -a --audio=<file> File to replay for the bot's outgoing audio
    -d --data=<file>  File to replay for the bot's data channel
`;

const docopt = require("docopt").docopt;
const options = docopt(doc);

const puppeteer = require("puppeteer");
const querystring = require("query-string");

function log(...objs) {
  console.log.call(null, [new Date().toISOString()].concat(objs).join(" "));
}

(async () => {
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-gpu-blacklist", "--ignore-certificate-errors"]
  });
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  page.on("console", msg => log("PAGE: ", msg.text()));
  page.on("error", err => log("ERROR: ", err.toString().split("\n")[0]));
  page.on("pageerror", err => log("PAGE ERROR: ", err.toString().split("\n")[0]));

  const baseUrl = options["--url"] || `https://${options["--host"]}/hub.html`;

  const params = {
    bot: true,
    allow_multi: true
  };
  const roomOption = options["--room"];
  if (roomOption) {
    params.hub_id = roomOption;
  }

  const url = `${baseUrl}?${querystring.stringify(params)}`;
  log(url);

  const navigate = async () => {
    try {
      log("Spawning bot...");
      await page.goto(url);
      await page.evaluate(() => console.log(navigator.userAgent));
      let retryCount = 5;
      let backoff = 1000;
      const loadFiles = async () => {
        try {
          // Interact with the page so that audio can play.
          await page.mouse.click(100, 100);
          if (options["--audio"]) {
            const audioInput = await page.waitForSelector("#bot-audio-input");
            audioInput.uploadFile(options["--audio"]);
            log("Uploaded audio file.");
          }
          if (options["--data"]) {
            const dataInput = await page.waitForSelector("#bot-data-input");
            dataInput.uploadFile(options["--data"]);
            log("Uploaded data file.");
          }
        } catch (e) {
          log("Interaction error", e.message);
          if (retryCount-- < 0) {
            // If retries failed, throw and restart navigation.
            throw new Error("Retries failed");
          }
          log("Retrying...");
          backoff *= 2;
          // Retry interaction to start audio playback
          setTimeout(loadFiles, backoff);
        }
      };

      await loadFiles();

      // Do a periodic sanity check of the state of the bots.
      setInterval(async function() {
        let avatarCounts;
        try {
          avatarCounts = await page.evaluate(() => ({
            connectionCount: Object.keys(NAF.connection.adapter.occupants).length,
            avatarCount: document.querySelectorAll("[networked-avatar]").length - 1
          }));
          log(JSON.stringify(avatarCounts));
        } catch (e) {
          // Ignore errors. This usually happens when the page is shutting down.
        }
        // Check for more than two connections to allow for a margin where we have a connection but the a-frame
        // entity has not initialized yet.
        if (avatarCounts && avatarCounts.connectionCount > 2 && avatarCounts.avatarCount === 0) {
          // It seems the bots have dog-piled on to a restarting server, so we're going to shut things down and
          // let the hubs-ops bash script restart us.
          log("Detected avatar dog-pile. Restarting.");
          process.exit(1);
        }
      }, 60 * 1000);
    } catch (e) {
      log("Navigation error", e.message);
      setTimeout(navigate, 1000);
    }
  };

  navigate();
})();
