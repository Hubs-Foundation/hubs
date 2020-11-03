import ReactDOM from "react-dom";
import React from "react";
import "./utils/configs";
import styles from "./assets/stylesheets/cloud.scss";
import classNames from "classnames";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import { Page } from "./react-components/layout/Page";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import Store from "./storage/store";

import registerTelemetry from "./telemetry";

registerTelemetry("/cloud", "Hubs Cloud Landing Page");

function HubsCloudPage() {
  return (
    <Page>
      <div className={styles.hero}>
        <section className={styles.colLg}>
          <div className={classNames(styles.hideLgUp, styles.centerLg)}>
            <h1>Introducing Hubs Cloud</h1>
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
            <h1 className={classNames(styles.hideLgDown, styles.centerLg)}>Introducing Hubs Cloud</h1>
            <p className={styles.centerLg}>
              Hubs Cloud creates and manages all of the AWS resources needed to host your own immersive spaces from your
              company or organization’s own account. Bring your own domain or use Route53 to create a new site, running
              on a single EC2 instance or scaled up to multiple servers for greater system-wide concurrency. Easily
              customize your platform with your own branding, upload your own 3D content, or select from the vast array
              of avatars and scenes licensed under Creative Commons for the Hubs platform.
            </p>
            <h3 className={styles.center}>Get it today on the AWS Marketplace</h3>
            <div className={classNames(styles.row, styles.colLg, styles.centerLg)}>
              <a className={styles.primaryButton} href="https://aws.amazon.com/marketplace/pp/B084RZH56R">
                Get Hubs Cloud Personal
              </a>
              <a className={styles.primaryButton} href="https://aws.amazon.com/marketplace/pp/B084WNGRRP">
                Get Hubs Cloud Enterprise
              </a>
            </div>
            <div className={classNames(styles.getStarted, styles.center)}>
              <a href="https://hubs.mozilla.com/docs/hubs-cloud-aws-quick-start.html">Quick Start Guide</a>
            </div>
          </div>
        </section>
      </div>
      <section className={classNames(styles.features, styles.colLg, styles.centerLg)}>
        <div className={styles.center}>
          <h3>Do-It-Yourself Events</h3>
          <p>
            With Hubs Cloud, you can enable your own virtual events infrastructure by tailoring your deployment to meet
            your own needs for uptime, concurrency, and account needs.
          </p>
        </div>
        <div className={styles.center}>
          <h3>Self-Hosted Infrastructure</h3>
          <p>
            With Hubs Cloud, your deployment is on your own organization’s infrastructure, keeping your sensitive data
            private and secure within an AWS account your team owns.
          </p>
        </div>
        <div className={styles.center}>
          <h3>Usage-Based Pricing</h3>
          <p>
            Your cost to run Hubs Cloud will be dependent on the size of your deployed instances, bandwidth, and storage
            used. All billing is handled through AWS, so you’ll get visibility into charges at every step of the
            process.
          </p>
        </div>
      </section>
    </Page>
  );
}

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <WrappedIntlProvider>
      <AuthContextProvider store={store}>
        <HubsCloudPage />
      </AuthContextProvider>
    </WrappedIntlProvider>
  );
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Root />, document.getElementById("ui-root"));
});
