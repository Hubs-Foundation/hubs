#!/usr/bin/env node
const doc = `
Usage:
    ./run-bot.js [options]
Options:
    -u --url=<url>    URL
    -o --host=<host>  Hubs host if URL is not specified [default: localhost:8080]
    -r --room=<room>  Room id
    -h --help         Show this screen
`;

const docopt = require("docopt").docopt;
const options = docopt(doc);

const puppeteer = require("puppeteer");
const querystring = require("query-string");

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE: ", msg.text()));
  page.on("error", err => console.error("ERROR: ", err.toString().split("\n")[0]));
  page.on("pageerror", err => console.error("PAGE ERROR: ", err.toString().split("\n")[0]));

  const baseUrl = options["--url"] || `https://${options["--host"]}/hub.html`;

  const params = {
    bot: true,
    allow_multi: true
  };
  const roomOption = options["--room"];
  if (roomOption) {
    params.room = roomOption;
  }

  const url = `${baseUrl}?${querystring.stringify(params)}`;
  console.log(url);

  const navigate = async () => {
    try {
      console.log("Spawning bot...");
      await page.goto(url);
      await page.evaluate(() => console.log(navigator.userAgent));
      let retryCount = 5;
      let backoff = 1000;
      const interact = async () => {
        try {
          // Interact with the page so that audio can play.
          await page.mouse.click(100, 100);
          // Signal that the page has been interacted with.
          await page.evaluate(() => window.interacted());
          console.log("Interacted.");
        } catch (e) {
          console.log("Interaction error", e.message);
          if (retryCount-- < 0) {
            // If retries failed, throw and restart navigation.
            throw new Error("Retries failed");
          }
          console.log("Retrying...");
          backoff *= 2;
          // Retry interaction to start audio playback
          setTimeout(interact, backoff);
        }
      };
      await interact();
    } catch (e) {
      console.log("Navigation error", e.message);
      setTimeout(navigate, 1000);
    }
  };

  navigate();
})();
