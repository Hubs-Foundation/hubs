import "./assets/stylesheets/index.scss";
import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import HomeRoot from "./react-components/home-root";

const qs = new URLSearchParams(location.search);
registerTelemetry();

let component;
const container = document.getElementById("home-root");
const root = <HomeRoot ref={c => (component = c)} initialEnvironment={qs.get("initial_environment")} />;
ReactDOM.render(root, container, () => {
  if (qs.has("list_signup")) {
    component.showUpdatesDialog();
  } else if (qs.has("report")) {
    component.showReportDialog();
  }
});
