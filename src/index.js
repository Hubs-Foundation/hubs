import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { HomePage } from "./react-components/home/HomePage";
import "./assets/stylesheets/globals.scss";
import { AuthContextProvider } from "./react-components/auth/AuthContext";

registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <AuthContextProvider store={store}>
        <HomePage />
      </AuthContextProvider>
    </WrappedIntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("home-root"));
