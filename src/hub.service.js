self.addEventListener("install", function (e) {
  return e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (e) {
  return e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function () {});

// Reticulum will inject an overrided app name.
// eslint-disable-next-line prefer-const
let appFullName = "";

// DO NOT REMOVE/EDIT THIS COMMENT - META_TAGS

self.addEventListener("push", function (e) {
  const payload = JSON.parse(e.data.text());

  return e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.indexOf(e.notification.data.hub_id) >= 0) return;
      }

      return self.registration.showNotification(appFullName, {
        body: "Someone has joined " + payload.hub_name,
        image: payload.image,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: payload.hub_id,
        data: { hub_url: payload.hub_url }
      });
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();

  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.indexOf(e.notification.data.hub_url) >= 0 && "focus" in client) return client.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(e.notification.data.hub_url);
      }
    })
  );
});
