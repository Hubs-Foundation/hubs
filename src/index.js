import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route } from "react-router-dom";

import "./assets/stylesheets/index.scss";
import registerTelemetry from "./telemetry";
import HomeRoot from "./react-components/home-root";
import AuthChannel from "./utils/auth-channel";
import { createAndRedirectToNewHub, connectToReticulum, fetchReticulumAuthenticated } from "./utils/phoenix-utils";
import Store from "./storage/store";
import JoinUsDialog from "./react-components/join-us-dialog";
import ReportDialog from "./react-components/report-dialog";
import jwtDecode from "jwt-decode";
import "./utils/theme";
import configs from "./utils/configs";

const qs = new URLSearchParams(location.search);
registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };

const authChannel = new AuthChannel(store);
let installEvent = null;
let favoriteHubsResult = null;
let mountedUI = false;
let hideHero = true;
let showAdmin = false;
let publicRoomsResult = null;

const remountUI = function() {
  mountedUI = true;

  const root = (
    <HomeRoot
      store={store}
      authChannel={authChannel}
      authVerify={qs.has("auth_topic")}
      authTopic={qs.get("auth_topic")}
      authToken={qs.get("auth_token")}
      authPayload={qs.get("auth_payload")}
      authOrigin={qs.get("auth_origin")}
      showSignIn={qs.has("sign_in")}
      signInDestination={qs.get("sign_in_destination")}
      signInReason={qs.get("sign_in_reason")}
      hideHero={hideHero}
      showAdmin={showAdmin}
      favoriteHubsResult={favoriteHubsResult}
      publicRoomsResult={publicRoomsResult}
      installEvent={installEvent}
    />
  );

  function returnToRoot() {
    location.href = "/#/";
  }

  const router = (
    <HashRouter>
      <>
        {root}
        <Route path="/join-us" render={() => <JoinUsDialog onClose={returnToRoot} />} />
        <Route path="/report" render={() => <ReportDialog onClose={returnToRoot} />} />
      </>
    </HashRouter>
  );

  ReactDOM.render(router, document.getElementById("home-root"));
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
    createAndRedirectToNewHub(null, null, true);
    return;
  }

  const socket = await connectToReticulum();

  authChannel.setSocket(socket);
  remountUI();

  publicRoomsResult = await fetchReticulumAuthenticated("/api/v1/media/search?source=public_rooms");
  remountUI();

  if (authChannel.signedIn) {
    // Fetch favorite rooms
    const path = `/api/v1/media/search?source=favorites&type=hubs&user=${store.credentialsAccountId}`;
    favoriteHubsResult = await fetchReticulumAuthenticated(path);

    const retPhxChannel = socket.channel(`ret`, { hub_id: "index", token: store.state.credentials.token });
    retPhxChannel.join().receive("ok", () => {
      retPhxChannel.push("refresh_perms_token").receive("ok", ({ perms_token }) => {
        const perms = jwtDecode(perms_token);
        configs.setIsAdmin(perms.postgrest_role === "ret_admin");

        if (perms.postgrest_role === "ret_admin") {
          showAdmin = true;
          remountUI();
        }

        retPhxChannel.leave();
      });
    });
  }

  hideHero = false;
  remountUI();
})();
