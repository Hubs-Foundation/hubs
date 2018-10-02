import "./assets/stylesheets/link.scss";
import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import LinkRoot from "./react-components/link-root";

registerTelemetry();

ReactDOM.render(<LinkRoot />, document.getElementById("link-root"));
