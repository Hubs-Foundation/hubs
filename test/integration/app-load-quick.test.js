const test = require("ava");
const puppeteer = require("puppeteer");
const handler = require("serve-handler");
const http = require("http");
const path = require("path");
const fs = require("fs");

// Port counter to avoid conflicts
let portCounter = 9100;

function getNextPort() {
  return portCounter++;
}

// Create a static file server for the built files
function createServer(rootDir, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      return handler(request, response, {
        public: rootDir,
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

    server.listen(port, error => {
      if (error) {
        reject(error);
      } else {
        resolve(server);
      }
    });
  });
}

// Helper to collect console errors and uncaught exceptions
async function setupErrorCollection(page) {
  const errors = [];
  
  // Collect console errors
  page.on("console", msg => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter out expected errors in test environment
      const isExpectedError = 
        text.includes("Failed to load resource: net::ERR_NAME_NOT_RESOLVED") ||
        text.includes("manifest.webmanifest") ||
        text.includes("favicon.ico") ||
        text.includes("dev.reticulum.io") ||
        text.includes("Failed to load resource: the server responded with a status of 404");
      
      if (!isExpectedError) {
        errors.push({
          type: "console.error",
          text: text,
          location: msg.location()
        });
      }
    }
  });

  // Collect page errors (uncaught exceptions)
  page.on("pageerror", error => {
    const text = error.toString();
    // Filter out expected errors in test environment
    const isExpectedError = 
      (text.includes("Failed to fetch") && error.stack && (error.stack.includes("reticulum") || error.stack.includes("api/v1"))) ||
      (text.includes("Failed to fetch") && error.stack && error.stack.includes("RETRY_DELAY_MS"));
    
    if (!isExpectedError) {
      errors.push({
        type: "uncaught exception",
        text: text,
        stack: error.stack
      });
    }
  });

  // Collect unhandled promise rejections
  await page.evaluateOnNewDocument(() => {
    window.addEventListener("unhandledrejection", event => {
      window.__unhandledRejections = window.__unhandledRejections || [];
      window.__unhandledRejections.push({
        reason: event.reason?.toString() || "Unknown reason",
        promise: event.promise
      });
    });
  });

  return { errors };
}

// Quick test that assumes build is already done
test("main app index.html loads without errors (quick)", async t => {
  const distDir = path.join(__dirname, "../../dist");
  
  // Skip if dist doesn't exist
  if (!fs.existsSync(distDir)) {
    t.pass("Skipping - dist directory doesn't exist. Run 'npm run build' first.");
    return;
  }

  let server;
  let browser;
  
  try {
    const port = getNextPort();
    server = await createServer(distDir, port);
    
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--enable-webgl",
        "--enable-webgl2",
        "--use-gl=swiftshader", // Software WebGL rendering for headless
        "--enable-features=WebRTC",
        "--enable-unsafe-webgpu",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream"
      ]
    });
    
    const page = await browser.newPage();
    const { errors } = await setupErrorCollection(page);
    
    await page.goto(`http://localhost:${port}/index.html`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const unhandledRejections = await page.evaluate(() => window.__unhandledRejections || []);
    
    if (errors.length > 0) {
      console.error("Console errors found:", errors);
    }
    if (unhandledRejections.length > 0) {
      console.error("Unhandled promise rejections:", unhandledRejections);
    }
    
    t.is(errors.length, 0, `Found ${errors.length} console errors`);
    t.is(unhandledRejections.length, 0, `Found ${unhandledRejections.length} unhandled promise rejections`);
    
  } finally {
    if (browser) await browser.close();
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  }
});

test("admin app loads without errors (quick)", async t => {
  const distDir = path.join(__dirname, "../../admin/dist");
  
  // Skip if dist doesn't exist
  if (!fs.existsSync(distDir)) {
    t.pass("Skipping - admin dist directory doesn't exist. Run 'npm run build' in admin/ first.");
    return;
  }

  let server;
  let browser;
  
  try {
    const port = getNextPort();
    server = await createServer(distDir, port);
    
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--enable-webgl",
        "--enable-webgl2",
        "--use-gl=swiftshader", // Software WebGL rendering for headless
        "--enable-features=WebRTC",
        "--enable-unsafe-webgpu",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream"
      ]
    });
    
    const page = await browser.newPage();
    const { errors } = await setupErrorCollection(page);
    
    await page.goto(`http://localhost:${port}/admin.html`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const unhandledRejections = await page.evaluate(() => window.__unhandledRejections || []);
    
    if (errors.length > 0) {
      console.error("Console errors found:", errors);
    }
    if (unhandledRejections.length > 0) {
      console.error("Unhandled promise rejections:", unhandledRejections);
    }
    
    t.is(errors.length, 0, `Found ${errors.length} console errors`);
    t.is(unhandledRejections.length, 0, `Found ${unhandledRejections.length} unhandled promise rejections`);
    
  } finally {
    if (browser) await browser.close();
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  }
});