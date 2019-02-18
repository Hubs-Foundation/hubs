import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import { pushHistoryPath, pushHistoryState } from "../utils/history";
import StateLink from "./state-link.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";
import { DEFAULT_FILTERS } from "./media-browser.js";

import styles from "../assets/stylesheets/settings-menu.scss";

/*const MENU_ITEMS = [
  { name: "change_avatar", state: { key: "overlay", value: "profile" } },
  { name: "change_scene", path: "/media/scenes" },
  { name: "controls", link: "/media/scenes" },
  { divider: true },
  { name: "help", link: "/media/scenes" },
  { name: "community", link: "/media/scenes" },
  { name: "terms", link: "/media/scenes" },
  { name: "privacy", link: "/media/scenes" }
];*/

export default class SettingsMenu extends Component {
  static propTypes = {
    history: PropTypes.object
  };

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
    const rowClasses = classNames([styles.row, styles.settingsRow]);
    // Draw self first
    return (
      <div className={styles.settingsMenu}>
        <div className={styles.attachPoint} />
        <div className={styles.contents}>
          <div className={styles.rows}>
            <div className={rowClasses}>
              <div className={styles.icon}>
                <img src="../assets/images/change_avatar.svg" />
              </div>
              <div className={styles.listItem}>
                <StateLink stateKey="overlay" stateValue="profile" history={this.props.history}>
                  <FormattedMessage id="settings.change_avatar" />
                </StateLink>
              </div>
            </div>
            <div className={rowClasses}>
              <div className={styles.icon}>
                <i>
                  <FontAwesomeIcon icon={faImage} />
                </i>
              </div>
              <div className={styles.listItem}>
                <a
                  href="#"
                  onClick={() => pushHistoryPath(this.props.history, `/media/scenes?filter=${DEFAULT_FILTERS.scenes}`)}
                >
                  <FormattedMessage id="settings.change_scene" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
