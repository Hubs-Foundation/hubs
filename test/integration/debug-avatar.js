const puppeteer = require("puppeteer");
const handler = require("serve-handler");
const http = require("http");
const path = require("path");

async function debugAvatar() {
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: path.join(__dirname, "../../dist"),
      headers: [
        {
          source: "**/*",
          headers: [
            {
              key: "Access-Control-Allow-Origin",
              value: "*"
            }
          ]
        },
        {
          source: "**/*.map",
          headers: [
            {
              key: "Content-Type",
              value: "application/json"
            }
          ]
        }
      ]
    });
  });

  await new Promise((resolve, reject) => {
    server.listen(9999, error => {
      if (error) reject(error);
      else resolve();
    });
  });

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--enable-webgl",
      "--enable-webgl2",
      "--use-gl=swiftshader"
    ]
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on("console", msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", error => {
    console.error("Page error:", error.toString());
    console.error("Stack:", error.stack);
  });

  console.log("Loading avatar.html...");
  await page.goto("http://localhost:9999/avatar.html", {
    waitUntil: "networkidle2",
    timeout: 30000
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();
  server.close();
}

debugAvatar().catch(console.error);