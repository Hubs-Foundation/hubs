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
import footerSVG from "./assets/images/footer.svg";
import registerTelemetry from "./telemetry";
import { FormattedMessage } from "react-intl";
import { ThemeProvider } from "./react-components/styles/theme";
import { AvatarUrlModal } from "./react-components/room/AvatarUrlModal";


registerTelemetry("/cloud", "Hubs Cloud Landing Page");

function HubsCloudPage() {
  return (
    <PageContainer>
      <div className={styles.hero}>
        <Container className={styles.colLg}>
          <iframe
            src="https://avatarcreator.netlify.app/"
            title=" "
            frameborder="0"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; "
            allowfullscreen
          />

        </Container>
        <Button onClick={AvatarUrlModal}>CUSTOM</Button>
        
        <img src={footerSVG} alt="Metaverse+" />

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
