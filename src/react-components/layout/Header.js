import React from "react";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import IfFeature from "../if-feature";
import maskEmail from "../../utils/mask-email";
import styles from "./Header.scss";
import Hubs from "@hubs/core";
import { useStore } from "../store/useStore";

export function Header() {
  const { store } = useStore();

  return (
    <header>
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <IfFeature name="show_cloud">
            <li>
              <a href="/cloud">
                <FormattedMessage id="home.cloud_link" />
              </a>
            </li>
          </IfFeature>
          <IfFeature name="enable_spoke">
            <li>
              <a href="/spoke">
                <FormattedMessage id="editor-name" />
              </a>
            </li>
          </IfFeature>
          <IfFeature name="show_docs_link">
            <li>
              <a href={Hubs.config.link("docs", "https://hubs.mozilla.com/docs")}>
                <FormattedMessage id="home.docs_link" />
              </a>
            </li>
          </IfFeature>
          <IfFeature name="show_source_link">
            <li>
              <a href="https://github.com/mozilla/hubs">
                <FormattedMessage id="home.source_link" />
              </a>
            </li>
          </IfFeature>
          <IfFeature name="show_community_link">
            <li>
              <a href={Hubs.config.link("community", "https://discord.gg/wHmY4nd")}>
                <FormattedMessage id="home.community_link" />
              </a>
            </li>
          </IfFeature>
          {store.isAdmin() && (
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
        {store.isAuthenticated() ? (
          <div>
            <span>
              <FormattedMessage id="sign-in.as" /> {maskEmail(store.getEmail())}
            </span>{" "}
            <a href="#" onClick={() => Hubs.signOut()}>
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
