import React from "react";
import ReactDOM from "react-dom";
import { IntlProvider } from "react-intl";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { lang, messages } from "./utils/i18n";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { VerifyPage } from "./react-components/auth/VerifyPage";
import "./assets/stylesheets/globals.scss";

registerTelemetry("/verify", "Hubs Verify Email Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <IntlProvider locale={lang} messages={messages}>
      <AuthContextProvider store={store}>
        <VerifyPage />
      </AuthContextProvider>
    </IntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
