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
let favoritedRooms = null;
let publicRooms = null;
let mountedUI = false;
let hideHero = true;
let showAdmin = false;
let showCreate = false;

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
      signInDestinationUrl={qs.get("sign_in_destination_url")}
      signInReason={qs.get("sign_in_reason")}
      hideHero={hideHero}
      showAdmin={showAdmin}
      showCreate={showCreate}
      favoritedRooms={favoritedRooms}
      publicRooms={publicRooms}
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

async function fetchFavoritedRooms() {
  if (!authChannel.signedIn) {
    favoritedRooms = [];
    return;
  }

  const res = await fetchReticulumAuthenticated(
    `/api/v1/media/search?source=favorites&type=rooms&user=${store.credentialsAccountId}`
  )

  favoritedRooms = res.entries;
}

async function fetchPublicRooms() {
  let hasMore = true;
  const results = [];

  const queryParams = new URLSearchParams();
  queryParams.set("source", "rooms");
  queryParams.set("filter", "public");

  while (hasMore) {

    const res = await fetchReticulumAuthenticated(`/api/v1/media/search?${queryParams}`);

    for (const entry of res.entries) {
      if (!results.find(item => item.id === entry.id)) {
        results.push(entry);
      } else {
        console.log(`Duplicate page: ${queryParams.get("cursor")} id: ${entry.id}`);
      }
    }

    queryParams.set("cursor", res.meta.next_cursor);
    hasMore = !!res.meta.next_cursor;
  }

  publicRooms = results;
}

// Fetch favorite + public rooms and merge, sorting by member count
async function fetchFeaturedRooms() {
  await Promise.all([
    fetchFavoritedRooms(),
    fetchPublicRooms()
  ]);

  remountUI();
}

(async () => {
  if (qs.get("new") !== null) {
    createAndRedirectToNewHub(null, null, true);
    return;
  }

  const socket = await connectToReticulum();

  authChannel.setSocket(socket);
  const joinParams = { hub_id: "index" };

  if (store.state.credentials && store.state.credentials.token) {
    joinParams.token = store.state.credentials.token;
  }

  const retPhxChannel = socket.channel("ret", joinParams);
  retPhxChannel.join().receive("ok", () => {
    retPhxChannel.push("refresh_perms_token").receive("ok", ({ perms_token }) => {
      const perms = jwtDecode(perms_token);
      configs.setIsAdmin(perms.postgrest_role === "ret_admin");

      if (perms.postgrest_role === "ret_admin") {
        showAdmin = true;
      }

      showCreate = !!perms.create_hub;
      remountUI();

      retPhxChannel.leave();
    });
  });

  hideHero = false;
  remountUI();

  fetchFeaturedRooms();
})();
