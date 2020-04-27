import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import IfFeature from "../if-feature";
import configs from "../../utils/configs";
import maskEmail from "../../utils/mask-email";
import styles from "./Header.scss";

export function Header({ showAdmin, signedIn, email, onSignOut, onSignIn }) {
  return (
    <div className={styles.headerContent}>
      <div className={styles.titleAndNav} onClick={() => (document.location = "/")}>
        <div className={styles.links}>
          <IfFeature name="show_whats_new_link">
            <a href="/whats-new">
              <FormattedMessage id="home.whats_new_link" />
            </a>
          </IfFeature>
          <IfFeature name="show_source_link">
            <a href="https://github.com/mozilla/hubs" rel="noreferrer noopener">
              <FormattedMessage id="home.source_link" />
            </a>
          </IfFeature>
          <IfFeature name="show_community_link">
            <a href={configs.link("community", "https://discord.gg/wHmY4nd")} rel="noreferrer noopener">
              <FormattedMessage id="home.community_link" />
            </a>
          </IfFeature>
          <IfFeature name="enable_spoke">
            <a href="/spoke" rel="noreferrer noopener">
              <FormattedMessage id="editor-name" />
            </a>
          </IfFeature>
          <IfFeature name="show_docs_link">
            <a href={configs.link("docs", "https://hubs.mozilla.com/docs")} rel="noreferrer noopener">
              <FormattedMessage id="home.docs_link" />
            </a>
          </IfFeature>
          <IfFeature name="show_cloud">
            <a href="https://hubs.mozilla.com/cloud" rel="noreferrer noopener">
              <FormattedMessage id="home.cloud_link" />
            </a>
          </IfFeature>
          {showAdmin && (
            <a href="/admin" rel="noreferrer noopener">
              <i>
                <FontAwesomeIcon icon={faCog} />
              </i>
              &nbsp;
              <FormattedMessage id="home.admin" />
            </a>
          )}
        </div>
      </div>
      <div className={styles.signIn}>
        {signedIn ? (
          <div>
            <span>
              <FormattedMessage id="sign-in.as" /> {maskEmail(email)}
            </span>{" "}
            <a onClick={onSignOut}>
              <FormattedMessage id="sign-in.out" />
            </a>
          </div>
        ) : (
          <a onClick={onSignIn}>
            <FormattedMessage id="sign-in.in" />
          </a>
        )}
      </div>
    </div>
  );
}

Header.propTypes = {
  showAdmin: PropTypes.bool,
  signedIn: PropTypes.bool,
  email: PropTypes.string,
  onSignOut: PropTypes.func.isRequired,
  onSignIn: PropTypes.func.isRequired
};
