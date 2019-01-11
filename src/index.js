import React from "react";
import ReactDOM from "react-dom";

import "./assets/stylesheets/index.scss";
import registerTelemetry from "./telemetry";
import HomeRoot from "./react-components/home-root";
import { createAndRedirectToNewHub } from "./utils/phoenix-utils";

const qs = new URLSearchParams(location.search);
registerTelemetry();

const { pathname } = document.location;
const sceneId = qs.get("scene_id") || (pathname.startsWith("/scenes/") && pathname.substring(1).split("/")[1]);

(() => {
  if (qs.get("new") !== null) {
    createAndRedirectToNewHub(
      null,
      null,
      "https://asset-bundles-prod.reticulum.io/rooms/atrium/Atrium.bundle.json",
      true
    );
    return;
  }

  const root = (
    <HomeRoot
      initialEnvironment={qs.get("initial_environment")}
      sceneId={sceneId || ""}
      authVerify={qs.has("auth_topic")}
      authTopic={qs.get("auth_topic")}
      authToken={qs.get("auth_token")}
      authOrigin={qs.get("auth_origin")}
      listSignup={qs.has("list_signup")}
      report={qs.has("report")}
    />
  );
  ReactDOM.render(root, document.getElementById("home-root"));
})();
