self.addEventListener("install", function(e) {
  e.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", function(e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("push", function() {});

self.addEventListener("notificationclick", function() {});
