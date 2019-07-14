import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import StateLink from "./state-link.js";
import { resetTips } from "../systems/tips";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faDoorClosed } from "@fortawesome/free-solid-svg-icons/faDoorClosed";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons/faInfoCircle";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faVideo } from "@fortawesome/free-solid-svg-icons/faVideo";
import { showFullScreenIfAvailable } from "../utils/fullscreen";
import LeaveRoomDialog from "./leave-room-dialog.js";

import styles from "../assets/stylesheets/settings-menu.scss";
import rootStyles from "../assets/stylesheets/ui-root.scss";

export default class SettingsMenu extends Component {
  static propTypes = {
    history: PropTypes.object,
    isStreaming: PropTypes.bool,
    toggleStreamerMode: PropTypes.func,
    mediaSearchStore: PropTypes.object,
    scene: PropTypes.object,
    hubScene: PropTypes.object,
    hubChannel: PropTypes.object,
    performConditionalSignIn: PropTypes.func,
    showNonHistoriedDialog: PropTypes.func,
    pushHistoryState: PropTypes.func
  };

  state = {
    expanded: false
  };

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener("mouseup", () => {
      if (this.state.expanded) {
        this.setState({ expanded: false });
      }
    });
  }

  renderExpandedMenu() {
    const rowClasses = classNames([styles.row, styles.settingsRow]);
    const rowHeader = classNames([styles.row, styles.settingsRow, styles.rowHeader]);
    const showRoomSettings = !!this.props.hubChannel.canOrWillIfCreator("update_hub");
    const showCloseRoom = !!this.props.hubChannel.canOrWillIfCreator("close_hub");
    const showRoomInfo = !!this.props.hubScene;
    const showRoomSection = showRoomSettings || showRoomInfo || showCloseRoom;
    const showStreamerMode = this.props.scene.is("entered") && !!this.props.hubChannel.canOrWillIfCreator("kick_users");

    // Draw self first
    return (
      <div className={styles.settingsMenu}>
        <div className={styles.attachPoint} />
        <div className={styles.contents}>
          <div className={styles.rows}>
            <div className={rowHeader}>
              <FormattedMessage id="settings.row-profile" />
            </div>
            <div className={rowClasses}>
              <div className={styles.icon}>
                <img src="../assets/images/change_avatar.svg" />
              </div>
              <div className={styles.listItem}>
                <StateLink
                  stateKey="overlay"
                  stateValue="profile"
                  history={this.props.history}
                  onClick={() => this.setState({ expanded: false })}
                >
                  <FormattedMessage id="settings.change-avatar" />
                </StateLink>
              </div>
            </div>
            <div className={rowClasses}>
              <div className={styles.icon}>
                <i>
                  <FontAwesomeIcon icon={faStar} />
                </i>
              </div>
              <div className={styles.listItem}>
                <div
                  className={styles.listItemLink}
                  onClick={() => {
                    this.props.performConditionalSignIn(
                      () => this.props.hubChannel.signedIn,
                      () => {
                        showFullScreenIfAvailable();
                        this.props.mediaSearchStore.sourceNavigateWithNoNav("favorites");
                      },
                      "favorite-rooms"
                    );
                  }}
                >
                  <FormattedMessage id="settings.favorites" />
                </div>
              </div>
            </div>
            {showRoomSection && (
              <div className={rowHeader}>
                <FormattedMessage id="settings.row-room" />
              </div>
            )}
            {showRoomSettings && (
              <div className={rowClasses}>
                <div className={styles.icon}>
                  <i>
                    <FontAwesomeIcon icon={faImage} />
                  </i>
                </div>
                <div className={styles.listItem}>
                  <div
                    className={styles.listItemLink}
                    onClick={() => {
                      this.props.performConditionalSignIn(
                        () => this.props.hubChannel.can("update_hub"),
                        () => {
                          showFullScreenIfAvailable();
                          this.props.mediaSearchStore.sourceNavigateWithNoNav("scenes");
                          this.setState({ expanded: false });
                        },
                        "change-scene"
                      );
                    }}
                  >
                    <FormattedMessage id="settings.change-scene" />
                  </div>
                </div>
              </div>
            )}
            {showRoomSettings && (
              <div className={rowClasses}>
                <div className={styles.icon}>
                  <i>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </i>
                </div>
                <div className={styles.listItem}>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();

                      this.props.performConditionalSignIn(
                        () => this.props.hubChannel.can("update_hub"),
                        () => {
                          this.props.pushHistoryState("modal", "rename_room");
                          this.setState({ expanded: false });
                        },
                        "rename-room"
                      );
                    }}
                  >
                    <FormattedMessage id="settings.rename-room" />
                  </a>
                </div>
              </div>
            )}
            {showCloseRoom && (
              <div className={rowClasses}>
                <div className={styles.icon}>
                  <i>
                    <FontAwesomeIcon icon={faDoorClosed} />
                  </i>
                </div>
                <div className={styles.listItem}>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();

                      this.props.performConditionalSignIn(
                        () => this.props.hubChannel.can("update_hub"),
                        () => {
                          this.props.pushHistoryState("modal", "close_room");
                          this.setState({ expanded: false });
                        },
                        "close-room"
                      );
                    }}
                  >
                    <FormattedMessage id="settings.close-room" />
                  </a>
                </div>
              </div>
            )}
            {showRoomInfo && (
              <div className={rowClasses}>
                <div className={styles.icon}>
                  <i>
                    <FontAwesomeIcon icon={faInfoCircle} />
                  </i>
                </div>
                <div className={styles.listItem}>
                  <StateLink
                    stateKey="modal"
                    stateValue="room_info"
                    history={this.props.history}
                    onClick={() => this.setState({ expanded: false })}
                  >
                    <FormattedMessage id="settings.room-info" />
                  </StateLink>
                </div>
              </div>
            )}
            <div className={rowClasses}>
              <div className={styles.icon}>
                <i>
                  <FontAwesomeIcon icon={faPlus} />
                </i>
              </div>
              <div className={styles.listItem}>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    this.props.showNonHistoriedDialog(LeaveRoomDialog, {
                      destinationUrl: "/",
                      messageType: "create-room"
                    });
                    this.setState({ expanded: false });
                  }}
                >
                  <FormattedMessage id="settings.create-room" />
                </a>
              </div>
            </div>
            {showStreamerMode ? (
              <div className={rowHeader}>
                <FormattedMessage id="settings.row-tools" />
              </div>
            ) : (
              <div />
            )}
            {showStreamerMode ? (
              <div className={rowClasses}>
                <div className={styles.icon}>
                  <i>
                    <FontAwesomeIcon icon={faVideo} />
                  </i>
                </div>
                <div className={styles.listItem}>
                  <div
                    className={styles.listItemLink}
                    onClick={() => {
                      this.props.toggleStreamerMode(true);
                      this.setState({ expanded: false });
                    }}
                  >
                    <FormattedMessage id="settings.enable-streamer-mode" />
                  </div>
                </div>
              </div>
            ) : (
              <div />
            )}
            <div className={classNames([styles.bottomLinksMain])}>
              <a href="/whats-new" target="_blank" rel="noreferrer noopener">
                <FormattedMessage id="settings.whats-new" />
              </a>
              <button
                onClick={e => {
                  e.preventDefault();
                  resetTips();
                  this.setState({ expanded: false });
                }}
              >
                <FormattedMessage id="settings.tips" />
              </button>
              <a href="https://github.com/mozilla/hubs/wiki/Hubs-Controls" target="_blank" rel="noreferrer noopener">
                <FormattedMessage id="settings.controls" />
              </a>
            </div>
            <div className={classNames([styles.bottomLinks])}>
              <a href="https://github.com/mozilla/hubs/wiki/Hubs-Features" target="_blank" rel="noreferrer noopener">
                <FormattedMessage id="settings.features" />
              </a>
              <a href="https://discord.gg/wHmY4nd" target="_blank" rel="noreferrer noopener">
                <FormattedMessage id="settings.community" />
              </a>
              <a target="_blank" href="https://forms.gle/1g4H5Ayd1mGWqWpV7" rel="noopener noreferrer">
                <FormattedMessage id="settings.send-feedback" />
              </a>
              <a className={styles.bottomLink} href="/?report" target="_blank" rel="noreferrer noopener">
                <FormattedMessage id="settings.report" />
              </a>
              <a
                className={styles.bottomLink}
                href="https://github.com/mozilla/hubs/blob/master/TERMS.md"
                target="_blank"
                rel="noreferrer noopener"
              >
                <FormattedMessage id="settings.terms" />
              </a>
              <a
                className={styles.bottomLink}
                href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
                target="_blank"
                rel="noreferrer noopener"
              >
                <FormattedMessage id="settings.privacy" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <FontAwesomeIcon
          icon={faBars}
          onClick={() => this.setState({ expanded: !this.state.expanded })}
          className={classNames({
            [rootStyles.cornerButton]: true,
            [rootStyles.cornerButtonSelected]: this.state.expanded
          })}
        />
        {this.state.expanded && this.renderExpandedMenu()}
      </div>
    );
  }
}
