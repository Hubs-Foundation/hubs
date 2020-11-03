import React from "react";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "../wrapped-intl-provider";
import IfFeature from "../if-feature";
import UnlessFeature from "../unless-feature";
import configs from "../../utils/configs";
import styles from "./Footer.scss";

export function Footer() {
  return (
    <WrappedIntlProvider>
      <footer>
        <div className={styles.poweredBy}>
          <UnlessFeature name="hide_powered_by">
            <span className={styles.prefix}>
              <FormattedMessage id="home.powered_by_prefix" />
            </span>
            <a className={styles.link} href="https://hubs.mozilla.com/cloud">
              <FormattedMessage id="home.powered_by_link" />
            </a>
          </UnlessFeature>
        </div>
        <nav>
          <ul>
            <IfFeature name="show_whats_new_link">
              <li>
                <a href="/whats-new">
                  <FormattedMessage id="home.whats_new_link" />
                </a>
              </li>
            </IfFeature>
            <IfFeature name="show_terms">
              <li>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
                >
                  <FormattedMessage id="home.terms_of_use" />
                </a>
              </li>
            </IfFeature>
            <IfFeature name="show_privacy">
              <li>
                <a
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  href={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
                >
                  <FormattedMessage id="home.privacy_notice" />
                </a>
              </li>
            </IfFeature>
            <IfFeature name="show_company_logo">
              <li>
                <img className={styles.companyLogo} src={configs.image("company_logo")} />
              </li>
            </IfFeature>
          </ul>
        </nav>
      </footer>
    </WrappedIntlProvider>
  );
}
