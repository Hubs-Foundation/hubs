#!/usr/bin/env node
const puppeteer = require("puppeteer");
const querystring = require("query-string");

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  const params = {
    room: 234234,
    bot: true
  };
  console.log(params);

  const url = "https://localhost:8080/hub.html?" + querystring.stringify(params);

  console.log("spawning squawkers...");
  page.on("console", msg => console.log("PAGE: ", msg.text()));
  await page.goto(url);
  // Interact with the page so that audio can play.
  page.mouse.click(100, 100);
})();
