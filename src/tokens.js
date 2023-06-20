import React from "react";
import { createRoot } from "react-dom/client";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { TokensContainer } from "./react-components/tokens/TokensContainer";
import "./assets/stylesheets/globals.scss";
import "./react-components/styles/global.scss";
import { TokenPageLayout } from "./react-components/tokens/TokenPageLayout";
import configs from "./utils/configs";
import { ThemeProvider } from "./react-components/styles/theme";
import { store } from "./utils/store-instance";

registerTelemetry("/tokens", "Backend API Tokens Page");

window.APP = { store };

function TokensRoot() {
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

const container = document.getElementById("ui-root");

const root = createRoot(container);
root.render(<TokensRoot />);
