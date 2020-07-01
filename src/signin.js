import React from "react";
import ReactDOM from "react-dom";
import { IntlProvider } from "react-intl";
import registerTelemetry from "./telemetry";
import "./utils/theme";
import { lang, messages } from "./utils/i18n";
import Hubs from "@hubs/core";
import { SignInPage } from "./react-components/auth/SignInPage";
import "./assets/stylesheets/globals.scss";

registerTelemetry("/signin", "Hubs Sign In Page");

window.APP = { store: Hubs.store };

function Root() {
  return (
    <IntlProvider locale={lang} messages={messages}>
      <SignInPage />
    </IntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
