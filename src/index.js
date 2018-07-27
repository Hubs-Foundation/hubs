import "./assets/stylesheets/index.scss";
import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import HomeRoot from "./react-components/home-root";
import InfoDialog from "./react-components/info-dialog.js";

const qs = new URLSearchParams(location.search);
registerTelemetry();

ReactDOM.render(
  <HomeRoot
    initialEnvironment={qs.get("initial_environment")}
    dialogType={qs.has("list_signup") ? InfoDialog.dialogTypes.updates : null}
  />,
  document.getElementById("home-root")
);
