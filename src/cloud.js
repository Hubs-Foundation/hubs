import ReactDOM from "react-dom";
import React, { Component } from "react";
import "./utils/configs";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import styles from "./assets/stylesheets/cloud.scss";
import hubsCloudLogo from "./assets/images/hubs-cloud-light.png";
import hubsCloudDiagram from "./assets/images/hubs-cloud-diagram.png";

import registerTelemetry from "./telemetry";

registerTelemetry("/cloud", "Hubs Cloud Landing Page");

import en from "react-intl/locale-data/en";
import { lang, messages } from "./utils/i18n";

addLocaleData([...en]);
const marketplaceEnterpriseListingUrl = "https://aws.amazon.com/marketplace/pp/B084WNGRRP";
const marketplacePersonalListingUrl = "https://aws.amazon.com/marketplace/pp/B084RZH56R";
const awsQuickStartLink = "https://hubs.mozilla.com/docs/hubs-cloud-aws-quick-start.html";

class DiscordLanding extends Component {
  componentDidMount() {}

  render() {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.ui}>
          <div className={styles.header}>
            <div className={styles.headerLinks}>
              <a href="/" rel="noreferrer noopener">
                Try Hubs
              </a>
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.heroPane}>
              <div className={styles.heroMessage}>
                <div className={styles.cloudLogo}>
                  <img src={hubsCloudLogo} />
                </div>
                <div className={styles.primaryTagline}>
                  <FormattedMessage id="cloud.primary_tagline" />
                </div>
                <div className={styles.secondaryTagline}>
                  <FormattedMessage id="cloud.secondary_tagline" />
                </div>
                <div className={styles.actionButtons}>
                  <a href={marketplaceEnterpriseListingUrl} className={styles.downloadButton}>
                    <div>
                      <FormattedMessage id="cloud.call_to_action_enterprise" />
                    </div>
                  </a>
                </div>
                <div className={styles.actionButtons}>
                  <a href={marketplacePersonalListingUrl} className={styles.downloadButton}>
                    <div>
                      <FormattedMessage id="cloud.call_to_action_personal" />
                    </div>
                  </a>
                </div>
                <div className={styles.docLink}>
                  <a href={awsQuickStartLink}>
                    <div>
                      <FormattedMessage id="cloud.aws_quick_start" />
                    </div>
                  </a>
                </div>
              </div>
              <div className={styles.heroSplash}>
                <img src={hubsCloudDiagram} />
                <div className={styles.splashTagline}>
                  <FormattedMessage id="cloud.splash_tag" />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.bg} />
        </div>
      </IntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<DiscordLanding />, document.getElementById("ui-root"));
});
