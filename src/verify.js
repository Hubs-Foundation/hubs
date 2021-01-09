import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { VerifyModalContainer } from "./react-components/auth/VerifyModalContainer";
import "./assets/stylesheets/globals.scss";
import { PageContainer } from "./react-components/layout/PageContainer";
import { Center } from "./react-components/layout/Center";

registerTelemetry("/verify", "Hubs Verify Email Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <AuthContextProvider store={store}>
        <PageContainer>
          <Center>
            <VerifyModalContainer />
          </Center>
        </PageContainer>
      </AuthContextProvider>
    </WrappedIntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
