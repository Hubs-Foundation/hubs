import React from "react";
import ReactDOM from "react-dom";
import { IntlProvider } from "react-intl";
import registerTelemetry from "./telemetry";
import "./utils/theme";
import { lang, messages } from "./utils/i18n";
import Hubs from "@hubs/core";
import { VerifyPage } from "./react-components/auth/VerifyPage";

registerTelemetry("/verify", "Hubs Verify Email Page");

window.APP = { store: Hubs.store };

function Root() {
  return (
    <IntlProvider locale={lang} messages={messages}>
      <VerifyPage />
    </IntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
