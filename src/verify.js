import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { VerifyPage } from "./react-components/auth/VerifyPage";
import "./assets/stylesheets/globals.scss";

registerTelemetry("/verify", "Hubs Verify Email Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <AuthContextProvider store={store}>
        <VerifyPage />
      </AuthContextProvider>
    </WrappedIntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
