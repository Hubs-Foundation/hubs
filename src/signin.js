import React from "react";
import { createRoot } from "react-dom/client";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { SignInModalContainer } from "./react-components/auth/SignInModalContainer";
import { PageContainer } from "./react-components/layout/PageContainer";
import "./react-components/styles/global.scss";
import "./assets/stylesheets/globals.scss";
import { Center } from "./react-components/layout/Center";
import { ThemeProvider } from "./react-components/styles/theme";
import { store } from "./utils/store-instance";

registerTelemetry("/signin", "Hubs Sign In Page");

window.APP = { store };

function SignInRoot() {
  return (
    <WrappedIntlProvider>
      <ThemeProvider store={store}>
        <AuthContextProvider store={store}>
          <PageContainer>
            <Center>
              <SignInModalContainer />
            </Center>
          </PageContainer>
        </AuthContextProvider>
      </ThemeProvider>
    </WrappedIntlProvider>
  );
}

const container = document.getElementById("ui-root");

const root = createRoot(container);
root.render(<SignInRoot />);
