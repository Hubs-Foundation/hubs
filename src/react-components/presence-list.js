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

  render() {
    return (
      <div className={styles.presenceList}>
        <div className={styles.attachPoint} />
        <div className={styles.contents}>
          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={HMDImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: true })}>
                Rian Long
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.lobby" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={PhoneImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Greg Fodor
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.lobby" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Dominick D&quot;Aniello
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Really-Long-Named-Person-12348
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Really-Long-Named-Person-12348
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Really-Long-Named-Person-12348
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Really-Long-Named-Person-12348
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Really-Long-Named-Person-12348
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Really-Long-Named-Person-12348
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.device}>
                <img src={DesktopImage} />
              </div>
              <div className={classNames({ [styles.displayName]: true, [styles.selfDisplayName]: false })}>
                Really-Long-Named-Person-12348
              </div>
              <div className={styles.presence}>
                <FormattedMessage id="presence.in_room" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
