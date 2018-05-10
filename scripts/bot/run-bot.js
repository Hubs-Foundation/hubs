#!/usr/bin/env node
const doc = `
Usage:
    ./run-bot.js [options]

Options:
    -h --host=<host>  Hubs host [default: localhost:8080]
    -r --room=<room>  Room id [default: 234234].
    -h --help         Show this screen.
`;

const docopt = require("docopt").docopt;
const options = docopt(doc);

const puppeteer = require("puppeteer");
const querystring = require("query-string");

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  const params = {
    room: options["--room"],
    bot: true
  };
  console.log(params);

  const url = `https://${options["--host"]}/hub.html?${querystring.stringify(params)}`;

  console.log("Spawning bot...");

  page.on("console", msg => console.log("PAGE: ", msg.text()));
  const navigate = async () => {
    try {
      await page.goto(url);
      await page.evaluate(() => {
        console.log(navigator.userAgent);
      });
      // Interact with the page so that audio can play.
      await page.mouse.click(100, 100);
      // Signal that the page has been interacted with.
      // If the interacted function has not been defined yet, this will error and restart the process with the
      // setTimeout below.
      await page.evaluate(() => window.interacted());
    } catch (e) {
      console.log("Navigation error", e.toString());
      setTimeout(navigate, 1000);
    }
  };
  navigate();
})();
