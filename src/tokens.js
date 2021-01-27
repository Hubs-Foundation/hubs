import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { TokensModalContainer } from "./react-components/auth/TokensModalContainer";
import "./assets/stylesheets/globals.scss";
import { PageContainer } from "./react-components/layout/PageContainer";
import { Container } from "./react-components/layout/Container";
import configs from "./utils/configs";

registerTelemetry("/tokens", "Backend API Tokens Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <AuthContextProvider store={store}>
        <PageContainer>
          {(true || configs.feature("public_api_access")) && (
            <Container>
              <TokensModalContainer />
            </Container>
          )}
        </PageContainer>
      </AuthContextProvider>
    </WrappedIntlProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
