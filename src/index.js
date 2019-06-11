import React from "react";
import ReactDOM from "react-dom";

import "./assets/stylesheets/index.scss";
import registerTelemetry from "./telemetry";
import HomeRoot from "./react-components/home-root";
import AuthChannel from "./utils/auth-channel";
import { createAndRedirectToNewHub, connectToReticulum, fetchReticulum } from "./utils/phoenix-utils";
import Store from "./storage/store";

const qs = new URLSearchParams(location.search);
registerTelemetry("/home", "Hubs Home Page");

const { pathname } = document.location;
const sceneId = qs.get("scene_id") || (pathname.startsWith("/scenes/") && pathname.substring(1).split("/")[1]);

const store = new Store();
window.APP = { store };

const authChannel = new AuthChannel(store);
let installEvent = null;
let favoriteHubsResult = null;
let mountedUI = false;
let hideHero = true;

const remountUI = function() {
  mountedUI = true;

  const root = (
    <HomeRoot
      initialEnvironment={qs.get("initial_environment")}
      sceneId={sceneId || ""}
      store={store}
      authChannel={authChannel}
      authVerify={qs.has("auth_topic")}
      authTopic={qs.get("auth_topic")}
      authToken={qs.get("auth_token")}
      authOrigin={qs.get("auth_origin")}
      listSignup={qs.has("list_signup")}
      hideHero={hideHero}
      favoriteHubsResult={favoriteHubsResult}
      report={qs.has("report")}
      installEvent={installEvent}
    />
  );
  ReactDOM.render(root, document.getElementById("home-root"));
};

// PWA install prompt
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  installEvent = e;

  if (mountedUI) {
    remountUI();
  }
});

(async () => {
  if (qs.get("new") !== null) {
    createAndRedirectToNewHub(null, process.env.DEFAULT_SCENE_SID, null, true);
    return;
  }

  authChannel.setSocket(await connectToReticulum());
  remountUI();

  if (authChannel.signedIn) {
    // Fetch favorite rooms
    const path = `/api/v1/media/search?source=favorites&type=hubs&user=${store.credentialsAccountId}`;
    favoriteHubsResult = await fetchReticulum(path);
  }

  hideHero = false;
  remountUI();
})();
