import "./assets/stylesheets/index.scss";
import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import HomeRoot from "./react-components/home-root";
import InfoDialog from "./react-components/info-dialog.js";
import queryString from "query-string";

const qs = queryString.parse(location.search);

registerTelemetry();

ReactDOM.render(
  <HomeRoot dialogType={qs.list_signup ? InfoDialog.dialogTypes.updates : null} />,
  document.getElementById("home-root")
);
