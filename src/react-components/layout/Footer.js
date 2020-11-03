import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./Footer.scss";

export function Footer({
  hidePoweredBy,
  showWhatsNewLink,
  showTerms,
  termsUrl,
  showPrivacy,
  privacyUrl,
  showCompanyLogo,
  companyLogoUrl
}) {
  return (
    <footer>
      <div className={styles.poweredBy}>
        {!hidePoweredBy && (
          <>
            <span className={styles.prefix}>
              <FormattedMessage id="home.powered_by_prefix" />
            </span>
            <a className={styles.link} href="https://hubs.mozilla.com/cloud">
              <FormattedMessage id="home.powered_by_link" />
            </a>
          </>
        )}
      </div>
      <nav>
        <ul>
          {showWhatsNewLink && (
            <li>
              <a href="/whats-new">
                <FormattedMessage id="home.whats_new_link" />
              </a>
            </li>
          )}
          {showTerms && (
            <li>
              <a target="_blank" rel="noopener noreferrer" href={termsUrl}>
                <FormattedMessage id="home.terms_of_use" />
              </a>
            </li>
          )}
          {showPrivacy && (
            <li>
              <a className={styles.link} target="_blank" rel="noopener noreferrer" href={privacyUrl}>
                <FormattedMessage id="home.privacy_notice" />
              </a>
            </li>
          )}
          {showCompanyLogo && (
            <li>
              <img className={styles.companyLogo} src={companyLogoUrl} />
            </li>
          )}
        </ul>
      </nav>
    </footer>
  );
}

Footer.propTypes = {
  hidePoweredBy: PropTypes.bool,
  showWhatsNewLink: PropTypes.bool,
  showTerms: PropTypes.bool,
  termsUrl: PropTypes.string,
  showPrivacy: PropTypes.bool,
  privacyUrl: PropTypes.string,
  showCompanyLogo: PropTypes.bool,
  companyLogoUrl: PropTypes.string
};
