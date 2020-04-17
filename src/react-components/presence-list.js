import configs from "../utils/configs";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";

import rootStyles from "../assets/stylesheets/ui-root.scss";
import styles from "../assets/stylesheets/presence-list.scss";
import maskEmail from "../utils/mask-email";
import StateLink from "./state-link.js";
import { WithHoverSound } from "./wrap-with-audio";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faDesktop } from "@fortawesome/free-solid-svg-icons/faDesktop";
import { faVideo } from "@fortawesome/free-solid-svg-icons/faVideo";
import discordIcon from "../assets/images/discord.svgi";
import hmdIcon from "../assets/images/hmd-icon.svgi";
import { faMobileAlt } from "@fortawesome/free-solid-svg-icons/faMobileAlt";
import { pushHistoryPath, withSlug } from "../utils/history";
import { hasReticulumServer } from "../utils/phoenix-utils";
import { InlineSVG } from "./svgi";

function getPresenceIcon(ctx) {
  if (ctx && ctx.hmd) {
    return <InlineSVG src={hmdIcon} />;
  } else if (ctx && ctx.mobile) {
    return <FontAwesomeIcon icon={faMobileAlt} />;
  } else if (ctx && ctx.discord) {
    return <InlineSVG src={discordIcon} />;
  } else {
    return <FontAwesomeIcon icon={faDesktop} />;
  }
}

export function navigateToClientInfo(history, clientId) {
  const currentParams = new URLSearchParams(history.location.search);

  if (hasReticulumServer() && document.location.host !== configs.RETICULUM_SERVER) {
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
    onSignOut: PropTypes.func,
    expanded: PropTypes.bool,
    onExpand: PropTypes.func
  };

  navigateToClientInfo = clientId => {
    navigateToClientInfo(this.props.history, clientId);
  };

  domForPresence = ([sessionId, data]) => {
    const meta = data.metas[data.metas.length - 1];
    const context = meta.context;
    const profile = meta.profile;
    const recording = meta.streaming || meta.recording;
    const icon = recording ? <FontAwesomeIcon icon={faVideo} /> : getPresenceIcon(context);
    const isBot = context && context.discord;
    const isEntering = context && context.entering;
    const isOwner = meta.roles && meta.roles.owner;
    const messageId = isEntering ? "presence.entering" : `presence.in_${meta.presence}`;
    const badge = isOwner && (
      <span className={styles.moderatorBadge} title="Moderator">
        &#x2605;
      </span>
    );

    return (
      <WithHoverSound key={sessionId}>
        <div className={styles.row}>
          <div className={styles.icon}>
            <i>{icon}</i>
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
            <FormattedMessage id={messageId} />
          </div>
        </div>
      </WithHoverSound>
    );
  };

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener(
      "mouseup",
      () => {
        this.props.onExpand(false);
      },
      { once: true }
    );
  }

  renderExpandedList() {
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

  render() {
    const occupantCount = this.props.presences ? Object.entries(this.props.presences).length : 0;
    return (
      <div>
        <button
          title={"Members"}
          onClick={() => {
            this.props.onExpand(!this.props.expanded);
          }}
          className={classNames({
            [rootStyles.presenceListButton]: true,
            [rootStyles.presenceInfoSelected]: this.props.expanded
          })}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span className={rootStyles.occupantCount}>{occupantCount}</span>
        </button>
        {this.props.expanded && this.renderExpandedList()}
      </div>
    );
  }
}
