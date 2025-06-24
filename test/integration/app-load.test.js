const test = require("ava");
const puppeteer = require("puppeteer");
const handler = require("serve-handler");
const http = require("http");
const path = require("path");
const { resolveStackTrace } = require("./source-map-resolver");

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
  const warnings = [];
  
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
    } else if (msg.type() === "warning") {
      warnings.push({
        type: "console.warn",
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // Collect page errors (uncaught exceptions)
  page.on("pageerror", async error => {
    const text = error.toString();
    // Filter out expected errors in test environment
    const isExpectedError = 
      (text.includes("Failed to fetch") && error.stack && (error.stack.includes("reticulum") || error.stack.includes("api/v1"))) ||
      (text.includes("Failed to fetch") && error.stack && error.stack.includes("RETRY_DELAY_MS"));
    
    if (!isExpectedError) {
      const resolvedStack = await resolveStackTrace(error.stack);
      errors.push({
        type: "uncaught exception",
        text: text,
        stack: resolvedStack || error.stack
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

  return { errors, warnings };
}

// Port counter to avoid conflicts
let portCounter = 9000;

function getNextPort() {
  return portCounter++;
}

test.before(async t => {
  // Build the project before running tests
  const { execSync } = require("child_process");
  
  console.log("Building main project...");
  execSync("npm run build", { 
    stdio: "inherit",
    cwd: path.join(__dirname, "../..")
  });
  
  console.log("Building admin project...");
  execSync("npm run build", { 
    stdio: "inherit",
    cwd: path.join(__dirname, "../../admin")
  });
});

test("main app loads without errors", async t => {
  let server;
  let browser;
  
  try {
    // Start server for main app
    const distDir = path.join(__dirname, "../../dist");
    const port = getNextPort();
    server = await createServer(distDir, port);
    
    // Launch headless Chrome
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security", // Allow loading resources from different origins
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
    const { errors, warnings } = await setupErrorCollection(page);
    
    // Navigate to the main page
    await page.goto(`http://localhost:${port}/index.html`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    
    // Wait a bit for any async errors to surface
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for unhandled promise rejections
    const unhandledRejections = await page.evaluate(() => window.__unhandledRejections || []);
    
    // Report any errors found
    if (errors.length > 0) {
      console.error("Console errors found:");
      for (const error of errors) {
        console.error(`\n[${error.type}] ${error.text}`);
        if (error.stack) {
          console.error(error.stack);
        }
      }
    }
    if (unhandledRejections.length > 0) {
      console.error("Unhandled promise rejections:", unhandledRejections);
    }
    
    // Assert no errors
    t.is(errors.length, 0, `Found ${errors.length} console errors`);
    t.is(unhandledRejections.length, 0, `Found ${unhandledRejections.length} unhandled promise rejections`);
    
    // Check that the page has some expected content
    const title = await page.title();
    t.truthy(title, "Page should have a title");
    
  } finally {
    if (browser) await browser.close();
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  }
});

test("admin app loads without errors", async t => {
  let server;
  let browser;
  
  try {
    // Start server for admin app
    const distDir = path.join(__dirname, "../../admin/dist");
    const port = getNextPort();
    server = await createServer(distDir, port);
    
    // Launch headless Chrome
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security"
      ]
    });
    
    const page = await browser.newPage();
    const { errors, warnings } = await setupErrorCollection(page);
    
    // Navigate to the admin page
    await page.goto(`http://localhost:${port}/admin.html`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    
    // Wait a bit for any async errors to surface
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for unhandled promise rejections
    const unhandledRejections = await page.evaluate(() => window.__unhandledRejections || []);
    
    // Report any errors found
    if (errors.length > 0) {
      console.error("Console errors found:");
      for (const error of errors) {
        console.error(`\n[${error.type}] ${error.text}`);
        if (error.stack) {
          console.error(error.stack);
        }
      }
    }
    if (unhandledRejections.length > 0) {
      console.error("Unhandled promise rejections:", unhandledRejections);
    }
    
    // Assert no errors
    t.is(errors.length, 0, `Found ${errors.length} console errors`);
    t.is(unhandledRejections.length, 0, `Found ${unhandledRejections.length} unhandled promise rejections`);
    
    // Check that the page has some expected content
    const title = await page.title();
    t.truthy(title, "Page should have a title");
    
  } finally {
    if (browser) await browser.close();
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  }
});

// Test other key pages in the main app
const mainAppPages = [
  "hub.html",
  "scene.html", 
  "avatar.html",
  "link.html"
];

for (const pageName of mainAppPages) {
  test(`${pageName} loads without errors`, async t => {
    let server;
    let browser;
    
    try {
      const distDir = path.join(__dirname, "../../dist");
      const port = getNextPort();
      server = await createServer(distDir, port);
      
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security"
        ]
      });
      
      const page = await browser.newPage();
      const { errors, warnings } = await setupErrorCollection(page);
      
      await page.goto(`http://localhost:${port}/${pageName}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const unhandledRejections = await page.evaluate(() => window.__unhandledRejections || []);
      
      if (errors.length > 0) {
        console.error(`\nConsole errors in ${pageName}:`);
        for (const error of errors) {
          console.error(`\n[${error.type}] ${error.text}`);
          if (error.stack) {
            console.error(error.stack);
          }
        }
      }
      if (unhandledRejections.length > 0) {
        console.error(`Unhandled rejections in ${pageName}:`, unhandledRejections);
      }
      
      t.is(errors.length, 0, `Found ${errors.length} console errors in ${pageName}`);
      t.is(unhandledRejections.length, 0, `Found ${unhandledRejections.length} unhandled promise rejections in ${pageName}`);
      
    } finally {
      if (browser) await browser.close();
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    }
  });
}