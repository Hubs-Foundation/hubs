const http = require("http");
const https = require("https");

// Set the time (in seconds) for connection to be alive
const keepAliveTimeout = 30 * 1000;

// https://www.browserstack.com/docs/automate/selenium/error-codes/keep-alive-not-used#Node_JS
http.globalAgent.keepAlive = true;
https.globalAgent.keepAlive = true;
http.globalAgent.keepAliveMsecs = keepAliveTimeout;
https.globalAgent.keepAliveMsecs = keepAliveTimeout;
