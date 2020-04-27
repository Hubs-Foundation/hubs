import React from "react";
import { FormattedMessage } from "react-intl";
import IfFeature from "../if-feature";
import UnlessFeature from "./unless-feature";
import configs from "../../utils/configs";
import styles from "./Footer.scss";

export function Footer() {
  return (
    <div className={styles.footerContent}>
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
      <div className={styles.links}>
        <div className={styles.top}>
          <IfFeature name="show_join_us_dialog">
            <a className={styles.link} rel="noopener noreferrer" href="/#/join-us">
              <FormattedMessage id="home.join_us" />
            </a>
          </IfFeature>
          <IfFeature name="show_newsletter_signup">
            <a className={styles.link} target="_blank" rel="noopener noreferrer" href="http://eepurl.com/gX_fH9">
              <FormattedMessage id="home.subscribe_to_mailing_list" />
            </a>
          </IfFeature>
          <IfFeature name="show_issue_report_link">
            {configs.feature("show_issue_report_dialog") ? (
              <a className={styles.link} rel="noopener noreferrer" href="/#/report">
                <FormattedMessage id="home.report_issue" />
              </a>
            ) : (
              <a
                className={styles.link}
                href={configs.link("issue_report", "/#/report")}
                target="_blank"
                rel="noreferrer noopener"
              >
                <FormattedMessage id="settings.report" />
              </a>
            )}
          </IfFeature>
          <IfFeature name="show_terms">
            <a
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
              href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
            >
              <FormattedMessage id="home.terms_of_use" />
            </a>
          </IfFeature>
          <IfFeature name="show_privacy">
            <a
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
              href={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
            >
              <FormattedMessage id="home.privacy_notice" />
            </a>
          </IfFeature>
          <IfFeature name="show_company_logo">
            <img className={styles.companyLogo} src={configs.image("company_logo")} />
          </IfFeature>
        </div>
      </div>
    </div>
  );
}
