import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";

import styles from "../assets/stylesheets/presence-list.scss";
import PhoneImage from "../assets/images/presence_phone.png";
import DesktopImage from "../assets/images/presence_desktop.png";
import HMDImage from "../assets/images/presence_vr.png";
import maskEmail from "../utils/mask-email";

export default class PresenceList extends Component {
  static propTypes = {
    presences: PropTypes.object,
    sessionId: PropTypes.string,
    signedIn: PropTypes.bool,
    email: PropTypes.string,
    onSignIn: PropTypes.func,
    onSignOut: PropTypes.func
  };

  domForPresence = ([sessionId, data]) => {
    const meta = data.metas[0];
    const context = meta.context;
    const profile = meta.profile;

    const image = context && context.mobile ? PhoneImage : context && context.hmd ? HMDImage : DesktopImage;

    return (
      <div className={styles.row} key={sessionId}>
        <div className={styles.device}>
          <img src={image} />
        </div>
        <div
          className={classNames({
            [styles.displayName]: true,
            [styles.selfDisplayName]: sessionId === this.props.sessionId
          })}
        >
          {profile && profile.displayName}
        </div>
        <div className={styles.presence}>
          <FormattedMessage id={`presence.in_${meta.presence}`} />
        </div>
      </div>
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
