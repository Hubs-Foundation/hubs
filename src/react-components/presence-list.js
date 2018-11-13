import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-list.scss";
import classNames from "classnames";
import PhoneImage from "../assets/images/presence_phone.png";
import DesktopImage from "../assets/images/presence_desktop.png";
import HMDImage from "../assets/images/presence_vr.png";
import { FormattedMessage } from "react-intl";
import { WithHoverSound } from "./wrap-with-audio";

export default class PresenceList extends Component {
  static propTypes = {
    presences: PropTypes.object,
    sessionId: PropTypes.string
  };

  domForPresence = ([sessionId, data]) => {
    const meta = data.metas[0];
    const context = meta.context;
    const profile = meta.profile;

    const image = context && context.mobile ? PhoneImage : context && context.hmd ? HMDImage : DesktopImage;

    return (
      <WithHoverSound key={sessionId}>
        <div className={styles.row}>
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
        </div>
      </div>
    );
  }
}
