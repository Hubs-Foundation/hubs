import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { TokensContainer } from "./react-components/tokens/TokensContainer";
import "./assets/stylesheets/globals.scss";
import "./react-components/styles/global.scss";
import { TokenPageLayout } from "./react-components/tokens/TokenPageLayout";
import configs from "./utils/configs";
import { ThemeProvider } from "./react-components/styles/theme";

registerTelemetry("/tokens", "Backend API Tokens Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <ThemeProvider store={store}>
        <AuthContextProvider store={store}>
          <TokenPageLayout>{configs.feature("public_api_access") && <TokensContainer />}</TokenPageLayout>
        </AuthContextProvider>
      </ThemeProvider>
    </WrappedIntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
