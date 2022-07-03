import ReactDOM from "react-dom";
import React from "react";
import "./utils/configs";
import "./react-components/styles/global.scss";
import styles from "./assets/stylesheets/cloud.scss";
import classNames from "classnames";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import { PageContainer } from "./react-components/layout/PageContainer";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import Store from "./storage/store";
import { Container } from "./react-components/layout/Container";
import { Button } from "./react-components/input/Button";

import registerTelemetry from "./telemetry";
import { FormattedMessage } from "react-intl";
import { ThemeProvider } from "./react-components/styles/theme";

registerTelemetry("/creator", "c");

function HubsCloudPage() {
  return (
    <PageContainer>
      <div className={styles.hero}>
        <Container className={styles.colLg}>
          <div className={classNames(styles.hideLgUp, styles.centerLg)}>
            <h1>
              <FormattedMessage id="hubs-cloud-page.page-heading" defaultMessage="Avatar Creator" />
            </h1>
          </div>
          <div className={classNames(styles.heroMedia, styles.centerLg)}>
            <iframe src="./avatarcreator.html" title="Avatar Creator" />
          </div>
        </Container>
      </div>
    </PageContainer>
  );
}

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <ThemeProvider store={store}>
        <AuthContextProvider store={store}>
          <HubsCloudPage />
        </AuthContextProvider>
      </ThemeProvider>
    </WrappedIntlProvider>
  );
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Root />, document.getElementById("ui-root"));
});
