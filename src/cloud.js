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

registerTelemetry("/cloud", "Hubs Cloud Landing Page");

function HubsCloudPage() {
  return (
    <PageContainer>
      <div className={styles.hero}>
        <Container className={styles.colLg}>
          <div className={classNames(styles.hideLgUp, styles.centerLg)}>
            <h1>
              <FormattedMessage id="hubs-cloud-page.page-heading" defaultMessage="Introducing Hubs Cloud" />
            </h1>
          </div>
          <div className={classNames(styles.heroMedia, styles.centerLg)}>
            <iframe
              src="https://player.vimeo.com/video/412377556?app_id=122963"
              allow="autoplay; fullscreen"
              allowFullScreen=""
              frameBorder="0"
            />
          </div>
          <div className={styles.heroContent}>
            <h1 className={classNames(styles.hideLgDown, styles.centerLg)}>
              <FormattedMessage id="hubs-cloud-page.hero-heading" defaultMessage="Introducing Hubs Cloud" />
            </h1>
            <p className={styles.centerLg}>
              <FormattedMessage
                id="hubs-cloud-page.hero-content"
                defaultMessage="Hubs Cloud creates and manages all of the AWS resources needed to host your own immersive spaces from your
              company or organization’s own account. Bring your own domain or use Route53 to create a new site, running
              on a single EC2 instance or scaled up to multiple servers for greater system-wide concurrency. Easily
              customize your platform with your own branding, upload your own 3D content, or select from the vast array
              of avatars and scenes licensed under Creative Commons for the Hubs platform."
              />
            </p>
            <h3 className={styles.center}>
              <FormattedMessage id="hubs-cloud-page.hero-cta" defaultMessage="Get it today on the AWS Marketplace" />
            </h3>
            <div className={classNames(styles.row, styles.colLg, styles.centerLg)}>
              <Button as="a" preset="primary" href="https://aws.amazon.com/marketplace/pp/B084RZH56R">
                <FormattedMessage id="hubs-cloud-page.hero-button.personal" defaultMessage="Get Hubs Cloud Personal" />
              </Button>
              <Button as="a" preset="primary" href="https://aws.amazon.com/marketplace/pp/B084WNGRRP">
                <FormattedMessage
                  id="hubs-cloud-page.hero-button.enterprise"
                  defaultMessage="Get Hubs Cloud Enterprise"
                />
              </Button>
            </div>
            <div className={classNames(styles.getStarted, styles.center)}>
              <Button as="a" preset="transparent" href="https://hubs.mozilla.com/docs/hubs-cloud-aws-quick-start.html">
                <FormattedMessage id="hubs-cloud-page.get-started" defaultMessage="Quick Start Guide" />
              </Button>
            </div>
          </div>
        </Container>
      </div>
      <Container className={classNames(styles.features, styles.colLg, styles.centerLg)}>
        <div className={styles.center}>
          <h3>
            <FormattedMessage id="hubs-cloud-page.features.diy-events-title" defaultMessage="Do-It-Yourself Events" />
          </h3>
          <p>
            <FormattedMessage
              id="hubs-cloud-page.features.diy-events-description"
              defaultMessage="With Hubs Cloud, you can enable your own virtual events infrastructure by tailoring your deployment to meet
            your own needs for uptime, concurrency, and account needs."
            />
          </p>
        </div>
        <div className={styles.center}>
          <h3>
            <FormattedMessage
              id="hubs-cloud-page.features.self-hosted-title"
              defaultMessage="Self-Hosted Infrastructure"
            />
          </h3>
          <p>
            <FormattedMessage
              id="hubs-cloud-page.features.self-hosted-description"
              defaultMessage="With Hubs Cloud, your deployment is on your own organization’s infrastructure, keeping your sensitive data
              private and secure within an AWS account your team owns."
            />
          </p>
        </div>
        <div className={styles.center}>
          <h3>
            <FormattedMessage id="hubs-cloud-page.features.usage-pricing-title" defaultMessage="Usage-Based Pricing" />
          </h3>
          <p>
            <FormattedMessage
              id="hubs-cloud-page.features.usage-pricing-description"
              defaultMessage="Your cost to run Hubs Cloud will be dependent on the size of your deployed instances, bandwidth, and storage
              used. All billing is handled through AWS, so you’ll get visibility into charges at every step of the
              process."
            />
          </p>
        </div>
      </Container>
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
