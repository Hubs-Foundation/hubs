import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";

import styles from "../assets/stylesheets/presence-list.scss";
import PhoneImage from "../assets/images/presence_phone.png";
import DesktopImage from "../assets/images/presence_desktop.png";
import DiscordImage from "../assets/images/presence_discord.png";
import CameraImage from "../assets/images/presence_camera.png";
import HMDImage from "../assets/images/presence_vr.png";
import maskEmail from "../utils/mask-email";
import StateLink from "./state-link.js";
import { WithHoverSound } from "./wrap-with-audio";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { pushHistoryPath, withSlug } from "../utils/history";

function getPresenceImage(ctx) {
  if (ctx && ctx.mobile) {
    return PhoneImage;
  } else if (ctx && ctx.hmd) {
    return HMDImage;
  } else if (ctx && ctx.discord) {
    return DiscordImage;
  } else {
    return DesktopImage;
  }
}

export function navigateToClientInfo(history, clientId) {
  const currentParams = new URLSearchParams(history.location.search);

  if (process.env.RETICULUM_SERVER && document.location.host !== process.env.RETICULUM_SERVER) {
    currentParams.set("client_id", clientId);
    pushHistoryPath(history, history.location.pathname, currentParams.toString());
  } else {
    pushHistoryPath(history, withSlug(history.location, `/clients/${clientId}`), currentParams.toString());
  }
}

export default class PresenceList extends Component {
  static propTypes = {
    presences: PropTypes.object,
    history: PropTypes.object,
    sessionId: PropTypes.string,
    signedIn: PropTypes.bool,
    email: PropTypes.string,
    onSignIn: PropTypes.func,
    onSignOut: PropTypes.func
  };

  navigateToClientInfo = clientId => {
    navigateToClientInfo(this.props.history, clientId);
  };

  domForPresence = ([sessionId, data]) => {
    const meta = data.metas[data.metas.length - 1];
    const context = meta.context;
    const profile = meta.profile;
    const recording = meta.streaming || meta.recording;
    const image = recording ? CameraImage : getPresenceImage(context);
    const isBot = context && context.discord;
    const isModerator = meta.roles && meta.roles.moderator;
    const badge = isModerator && (
      <span className={styles.moderatorBadge} title="Moderator">
        &#x2605;
      </span>
    );

    return (
      <WithHoverSound key={sessionId}>
        <div className={styles.row}>
          <div className={styles.icon}>
            <img src={image} />
          </div>
          <div
            className={classNames({
              [styles.listItem]: true
            })}
          >
            {sessionId === this.props.sessionId ? (
              <StateLink className={styles.self} stateKey="overlay" stateValue="profile" history={this.props.history}>
                {profile && profile.displayName}
                {badge}
                <i>
                  <FontAwesomeIcon icon={faPencilAlt} />
                </i>
              </StateLink>
            ) : (
              <div>
                {!isBot ? (
                  <button className={styles.clientLink} onClick={() => this.navigateToClientInfo(sessionId)}>
                    {profile && profile.displayName}
                  </button>
                ) : (
                  <span>{profile && profile.displayName}</span>
                )}
                {badge}
              </div>
            )}
          </div>
          <div className={styles.presence}>
            <FormattedMessage id={`presence.in_${meta.presence}`} />
          </div>
        </div>
      </WithHoverSound>
    );
  };

  render() {
    // Draw self first
    return (
      <div className={styles.presenceList}>
        <div className={styles.attachPoint} />
        <div className={styles.contents}>
          <div className={styles.rows}>
            {Object.entries(this.props.presences || {})
              .filter(([k]) => k === this.props.sessionId)
              .map(this.domForPresence)}
            {Object.entries(this.props.presences || {})
              .filter(([k]) => k !== this.props.sessionId)
              .map(this.domForPresence)}
          </div>
          <div className={styles.signIn}>
            {this.props.signedIn ? (
              <div>
                <span>
                  <FormattedMessage id="sign-in.as" /> {maskEmail(this.props.email)}
                </span>{" "}
                <a onClick={this.props.onSignOut}>
                  <FormattedMessage id="sign-in.out" />
                </a>
              </div>
            ) : (
              <a onClick={this.props.onSignIn}>
                <FormattedMessage id="sign-in.in" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
}
