import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { getLocale, getMessages } from "./utils/i18n";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { SignInPage } from "./react-components/auth/SignInPage";
import "./assets/stylesheets/globals.scss";

registerTelemetry("/signin", "Hubs Sign In Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider locale={getLocale()} messages={getMessages()}>
      <AuthContextProvider store={store}>
        <SignInPage />
      </AuthContextProvider>
    </WrappedIntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
