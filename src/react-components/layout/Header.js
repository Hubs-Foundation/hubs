import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import maskEmail from "../../utils/mask-email";
import styles from "./Header.scss";

export function Header({
  showCloud,
  enableSpoke,
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
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          {showCloud && (
            <li>
              <a href="/cloud">
                <FormattedMessage id="home.cloud_link" />
              </a>
            </li>
          )}
          {enableSpoke && (
            <li>
              <a href="/spoke">
                <FormattedMessage id="editor-name" />
              </a>
            </li>
          )}
          {showDocsLink && (
            <li>
              <a href={docsUrl}>
                <FormattedMessage id="home.docs_link" />
              </a>
            </li>
          )}
          {showSourceLink && (
            <li>
              <a href="https://github.com/mozilla/hubs">
                <FormattedMessage id="home.source_link" />
              </a>
            </li>
          )}
          {showCommunityLink && (
            <li>
              <a href={communityUrl}>
                <FormattedMessage id="home.community_link" />
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
                <FormattedMessage id="home.admin" />
              </a>
            </li>
          )}
        </ul>
      </nav>
      <div className={styles.signIn}>
        {isSignedIn ? (
          <div>
            <span>
              <FormattedMessage id="sign-in.as" /> {maskEmail(email)}
            </span>{" "}
            <a href="#" onClick={onSignOut}>
              <FormattedMessage id="sign-in.out" />
            </a>
          </div>
        ) : (
          <a href="/signin" rel="noreferrer noopener">
            <FormattedMessage id="sign-in.in" />
          </a>
        )}
      </div>
    </header>
  );
}

Header.propTypes = {
  showCloud: PropTypes.bool,
  enableSpoke: PropTypes.bool,
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
