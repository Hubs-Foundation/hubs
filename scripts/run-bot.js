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

  console.log("spawning bots...");

  page.on("console", msg => console.log("PAGE: ", msg.text()));
  const navigate = async () => {
    try {
      await page.goto(url);
      await page.evaluate(() => {
        console.log(navigator.userAgent);
      });
      console.log("BPDEBUG navigated");
      // Interact with the page so that audio can play.
      await page.mouse.click(100, 100);
      await page.evaluate(() => {
        window.interacted();
      });
    } catch (e) {
      console.log("Navigation error", e);
      setTimeout(navigate, 1000);
    }
  };
  navigate();
})();
