import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-list.scss";
import classNames from "classnames";
import PhoneImage from "../assets/images/mobile_screen_entry.svg";
import DesktopImage from "../assets/images/desktop_screen_entry.svg";
import HMDImage from "../assets/images/generic_vr_entry.svg";
import { FormattedMessage } from "react-intl";

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
        </div>
      </div>
    );
  }
}
