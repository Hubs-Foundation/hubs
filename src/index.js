import "./assets/stylesheets/index.scss";
import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import HomeRoot from "./react-components/home-root";

const qs = new URLSearchParams(location.search);
registerTelemetry();

const root = (
  <HomeRoot
    initialEnvironment={qs.get("initial_environment")}
    listSignup={qs.has("list_signup")}
    report={qs.has("report")}
  />
);
ReactDOM.render(root, document.getElementById("home-root"));
