import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import maskEmail from "../../utils/mask-email";
import styles from "./Header.scss";
import { Container } from "./Container";

export function Header({
  appName,
  appLogo,
  showCloud,
  enableSpoke,
  editorName,
  showDocsLink,
  docsUrl,
  showSourceLink,
  showCommunityLink,
  communityUrl,
  isAdmin,
  isSignedIn,
  email,
  onSignOut
}) {
  return (
    <header>
      <Container as="div" className={styles.container}>
        <nav>
          <ul>
            <li>
              <a href="/" className={styles.homeLink}>
                <img alt={appName} src={appLogo} />
              </a>
            </li>
            {showCloud && (
              <li>
                <a href="/cloud">
                  <FormattedMessage id="header.cloud" defaultMessage="Hubs Cloud" />
                </a>
              </li>
            )}
            {enableSpoke && (
              <li>
                <a href="/spoke">{editorName}</a>
              </li>
            )}
            {showDocsLink && (
              <li>
                <a href={docsUrl}>
                  <FormattedMessage id="header.docs" defaultMessage="Docs" />
                </a>
              </li>
            )}
            {showSourceLink && (
              <li>
                <a href="https://github.com/mozilla/hubs">
                  <FormattedMessage id="header.source" defaultMessage="Source" />
                </a>
              </li>
            )}
            {showCommunityLink && (
              <li>
                <a href={communityUrl}>
                  <FormattedMessage id="header.community" defaultMessage="Community" />
                </a>
              </li>
            )}
            {isAdmin && (
              <li>
                <a href="/admin" rel="noreferrer noopener">
                  <i>
                    <FontAwesomeIcon icon={faCog} />
                  </i>
                  &nbsp;
                  <FormattedMessage id="header.admin" defaultMessage="Admin" />
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div className={styles.signIn}>
          {isSignedIn ? (
            <div>
              <span>
                <FormattedMessage
                  id="header.signed-in-as"
                  defaultMessage="Signed in as {email}"
                  values={{ email: maskEmail(email) }}
                />
              </span>{" "}
              <a href="#" onClick={onSignOut}>
                <FormattedMessage id="header.sign-out" defaultMessage="Sign Out" />
              </a>
            </div>
          ) : (
            <a href="/signin" rel="noreferrer noopener">
              <FormattedMessage id="header.sign-in" defaultMessage="Sign In" />
            </a>
          )}
        </div>
      </Container>
    </header>
  );
}

Header.propTypes = {
  appName: PropTypes.string,
  appLogo: PropTypes.string,
  showCloud: PropTypes.bool,
  enableSpoke: PropTypes.bool,
  editorName: PropTypes.string,
  showDocsLink: PropTypes.bool,
  docsUrl: PropTypes.string,
  showSourceLink: PropTypes.bool,
  showCommunityLink: PropTypes.bool,
  communityUrl: PropTypes.string,
  isAdmin: PropTypes.bool,
  isSignedIn: PropTypes.bool,
  email: PropTypes.string,
  onSignOut: PropTypes.func
};
