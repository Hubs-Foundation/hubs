var http = require("http");
var express = require("express");
var socketIo = require("socket.io");
var easyrtc = require("easyrtc");
var path = require("path");

var port = process.env.PORT || 8080;
process.title = "social-vr-demo-server";

var app = express();
app.use(express.static(path.resolve(__dirname, "..", "public")));

// Run webpack-dev middleware when developing.
if (process.env.NODE_ENV !== "production") {
  var webpack = require("webpack");
  var webpackDevMiddleware = require("webpack-dev-middleware");

  var config = require("../webpack.config.dev.js");
  var compiler = webpack(config);

  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: config.output.publicPath,
      watchOptions: {
        aggregateTimeout: 300,
        poll: true
      }
    })
  );

  app.use(require("webpack-hot-middleware")(compiler));
}

// Start Express http server
var webServer = http.createServer(app).listen(port);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, { "log level": 1 });

var myIceServers = [
  { url: "stun:stun.l.google.com:19302" },
  { url: "stun:stun1.l.google.com:19302" },
  { url: "stun:stun2.l.google.com:19302" },
  { url: "stun:stun3.l.google.com:19302" }
  // {
  //   "url":"turn:[ADDRESS]:[PORT]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // },
  // {
  //   "url":"turn:[ADDRESS]:[PORT][?transport=tcp]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // }
];
easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("demosEnable", false);

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(
  socket,
  easyrtcid,
  msg,
  socketCallback,
  callback
) {
  easyrtc.events.defaultListeners.easyrtcAuth(
    socket,
    easyrtcid,
    msg,
    socketCallback,
    function(err, connectionObj) {
      if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
        callback(err, connectionObj);
        return;
      }

      connectionObj.setField("credential", msg.msgData.credential, {
        isShared: false
      });

      console.log(
        "[" + easyrtcid + "] Credential saved!",
        connectionObj.getFieldValueSync("credential")
      );

      callback(err, connectionObj);
    }
  );
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(
  connectionObj,
  roomName,
  roomParameter,
  callback
) {
  console.log(
    "[" + connectionObj.getEasyrtcid() + "] Credential retrieved!",
    connectionObj.getFieldValueSync("credential")
  );
  easyrtc.events.defaultListeners.roomJoin(
    connectionObj,
    roomName,
    roomParameter,
    callback
  );
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
  console.log("Initiated");

  rtcRef.events.on("roomCreate", function(
    appObj,
    creatorConnectionObj,
    roomName,
    roomOptions,
    callback
  ) {
    console.log("roomCreate fired! Trying to create: " + roomName);

    appObj.events.defaultListeners.roomCreate(
      appObj,
      creatorConnectionObj,
      roomName,
      roomOptions,
      callback
    );
  });
});

webServer.listen(port, function() {
  console.log("listening on http://localhost:" + port);
});

// Expose server to the internet with HTTPS. Useful for testing WebRTC on mobile.
if (process.env.NGROK) {
  var ngrok = require("ngrok");
  var qrcode = require("qrcode-terminal");

  ngrok.connect(port, function(err, url) {
    console.log();
    qrcode.generate(url);
    console.log("\nHTTPS url availible at: " + url);
  });
}
