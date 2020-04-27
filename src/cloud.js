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
import { Page } from "./react-components/layout/Page";

addLocaleData([...en]);
const marketplaceEnterpriseListingUrl = "https://aws.amazon.com/marketplace/pp/B084WNGRRP";
const marketplacePersonalListingUrl = "https://aws.amazon.com/marketplace/pp/B084RZH56R";
const awsQuickStartLink = "https://hubs.mozilla.com/docs/hubs-cloud-aws-quick-start.html";

class HubsCloudPage extends Component {
  componentDidMount() {}

  render() {
    return (
      <Page>
        <div className="row grey-bg">
          <h1 className="hidden-md-up">Introducing Hubs Cloud</h1>
          <video />
          <div className="col center-sm-down">
            <h1>Introducing Hubs Cloud</h1>
            <p>
              Hubs Cloud creates and manages all of the AWS resources needed to host your own immersive spaces from your
              company or organization’s own account. Bring your own domain or use Route53 to create a new site, running
              on a single EC2 instance or scaled up to multiple servers for greater system-wide concurrency. Easily
              customize your platform with your own branding, upload your own 3D content, or select from the vast array
              of avatars and scenes licensed under Creative Commons for the Hubs platform.{" "}
            </p>
            <h3 className="hidden-sm-down">Get it today on the AWS Marketplace</h3>
            <div className="row center-sm-down">
              <a className="btn primary large" href="#">
                Get Hubs Cloud Personal
              </a>
              <a className="btn primary large" href="#">
                Get Hubs Cloud Enterprise
              </a>
            </div>
          </div>
        </div>
      </Page>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<HubsCloudPage />, document.getElementById("ui-root"));
});
