import "./assets/stylesheets/index.scss";
import React from "react";
import ReactDOM from "react-dom";
import HomeRoot from "./react-components/home-root";
import registerTelemetry from "./telemetry";

ReactDOM.render(<HomeRoot />, document.getElementById("home-root"));
