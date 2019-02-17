import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";

import styles from "../assets/stylesheets/settings-menu.scss";

const MENU_ITEMS = [];

export default class SettingsMenu extends Component {
  static propTypes = {};

  domForItem = ([sessionId, data]) => {
    /*const meta = data.metas[0];
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
    );*/
    return null;
  };

  render() {
    // Draw self first
    return (
      <div className={styles.settingsMenu}>
        <div className={styles.attachPoint} />
        <div className={styles.contents}>
          <div className={styles.rows}>{MENU_ITEMS.map(this.domForItem)}</div>
        </div>
      </div>
    );
  }
}
