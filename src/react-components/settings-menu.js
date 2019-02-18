import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import StateLink from "./state-link.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";

import styles from "../assets/stylesheets/settings-menu.scss";

export default class SettingsMenu extends Component {
  static propTypes = {
    history: PropTypes.object,
    mediaSearchStore: PropTypes.object
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
                <div
                  className={styles.listItemLink}
                  onClick={() => this.props.mediaSearchStore.sourceNavigate("scenes", null, false)}
                >
                  <FormattedMessage id="settings.change_scene" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
