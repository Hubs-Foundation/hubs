import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";
import { faUserAlt } from "@fortawesome/free-solid-svg-icons/faUserAlt";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faDoorClosed } from "@fortawesome/free-solid-svg-icons/faDoorClosed";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons/faInfoCircle";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faVideo } from "@fortawesome/free-solid-svg-icons/faVideo";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";

import configs from "../utils/configs";
import IfFeature from "./if-feature";
import StateLink from "./state-link.js";
import { resetTips } from "../systems/tips";
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
    showAsOverlay: PropTypes.bool, // Shows the settings as an overlay menu, instead of a dropdown
    onCloseOverlay: PropTypes.func,
    hubScene: PropTypes.object,
    hubChannel: PropTypes.object,
    performConditionalSignIn: PropTypes.func,
    showNonHistoriedDialog: PropTypes.func,
    showPreferencesScreen: PropTypes.func,
    pushHistoryState: PropTypes.func
  };

  state = {
    expanded: false
  };

  unexpand() {
    if (this.state.expanded && !this.props.showAsOverlay) {
      this.setState({ expanded: false });
    }
  }

  componentDidMount() {
    this.onMouseUp = () => this.unexpand();
    this.acanvas = document.querySelector(".a-canvas");
    this.acanvas.addEventListener("mouseup", this.onMouseUp);
  }

  componentWillUnmount() {
    this.acanvas.removeEventListener("mouseup", this.onMouseUp);
  }

  renderExpandedMenu() {
    const rowClasses = classNames([styles.row, styles.settingsRow]);
    const rowHeader = classNames([styles.row, styles.settingsRow, styles.rowHeader]);

    // When showing as overlay, hide some menu items for now since the overlay mode is intended for immersive
    // mode browsers which have limited vertical screen real estate.
    //
    // The reason I didn't do this with CSS is because this changes available functionality, so being more
    // explicit in code seems like a wise idea.
    const hideExtranousItems = this.props.showAsOverlay;

    const showRoomSettings = !!this.props.hubChannel.canOrWillIfCreator("update_hub");
    const showCloseRoom = !!this.props.hubChannel.canOrWillIfCreator("close_hub");
    const showRoomInfo = !!this.props.hubScene && !hideExtranousItems;
    const showRoomSection = showRoomSettings || showRoomInfo || showCloseRoom;
    const showStreamerMode =
      this.props.scene.is("entered") && !!this.props.hubChannel.canOrWillIfCreator("kick_users") && !hideExtranousItems;

    // Draw self first
    return (
      <div
        className={classNames({
          [styles.settingsMenuDrop]: !this.props.showAsOverlay,
          [styles.settingsMenuOverlay]: this.props.showAsOverlay
        })}
      >
        {!this.props.showAsOverlay && <div className={styles.attachPoint} />}
        <div className={styles.contents}>
          {this.props.showAsOverlay && (
            <button autoFocus className={styles.closeButton} onClick={() => this.props.onCloseOverlay()}>
              <i>
                <FontAwesomeIcon icon={faTimes} />
              </i>
            </button>
          )}
          <div className={styles.rows}>
            {!hideExtranousItems && (
              <div className={rowHeader}>
                <FormattedMessage id="settings.row-profile" />
              </div>
            )}
            <div className={rowClasses}>
              <div className={styles.icon}>
                <i>
                  <FontAwesomeIcon icon={faUserAlt} />
                </i>
              </div>
              <div className={styles.listItem}>
                <StateLink
                  stateKey="overlay"
                  stateValue="profile"
                  history={this.props.history}
                  onClick={() => this.unexpand()}
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
                  role="button"
                  onClick={() => {
                    this.props.performConditionalSignIn(
                      () => this.props.hubChannel.signedIn,
                      () => {
                        showFullScreenIfAvailable();
                        this.props.mediaSearchStore.sourceNavigateWithNoNav("favorites", "use");
                      },
                      "favorite-rooms"
                    );
                  }}
                >
                  <FormattedMessage id="settings.favorites" />
                </div>
              </div>
            </div>
            <div className={rowClasses}>
              <div className={styles.icon}>
                <i>
                  <FontAwesomeIcon icon={faCog} />
                </i>
              </div>
              <div className={styles.listItem}>
                <div
                  className={styles.listItemLink}
                  role="button"
                  onClick={() => {
                    this.props.showPreferencesScreen();
                  }}
                >
                  <FormattedMessage id="settings.preferences" />
                </div>
              </div>
            </div>
            {showRoomSection &&
              !hideExtranousItems && (
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
                    role="button"
                    onClick={() => {
                      this.props.performConditionalSignIn(
                        () => this.props.hubChannel.can("update_hub"),
                        () => {
                          showFullScreenIfAvailable();
                          this.props.mediaSearchStore.sourceNavigateWithNoNav("scenes", "use");
                          this.unexpand();
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
                    role="button"
                    onClick={e => {
                      e.preventDefault();

                      this.props.performConditionalSignIn(
                        () => this.props.hubChannel.can("update_hub"),
                        () => {
                          this.props.pushHistoryState("modal", "room_settings");
                          this.unexpand();
                        },
                        "room-settings"
                      );
                    }}
                  >
                    <FormattedMessage id="settings.room-settings" />
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
                    role="button"
                    onClick={e => {
                      e.preventDefault();

                      this.props.performConditionalSignIn(
                        () => this.props.hubChannel.can("update_hub"),
                        () => {
                          this.props.pushHistoryState("modal", "close_room");
                          this.unexpand();
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
                    role="button"
                    onClick={() => this.unexpand()}
                  >
                    <FormattedMessage id="settings.room-info" />
                  </StateLink>
                </div>
              </div>
            )}
            {!hideExtranousItems && (
              <div className={rowClasses}>
                <div className={styles.icon}>
                  <i>
                    <FontAwesomeIcon icon={faPlus} />
                  </i>
                </div>
                <div className={styles.listItem}>
                  <a
                    href="#"
                    role="button"
                    onClick={e => {
                      e.preventDefault();
                      this.props.showNonHistoriedDialog(LeaveRoomDialog, {
                        destinationUrl: "/",
                        messageType: "create-room"
                      });
                      this.unexpand();
                    }}
                  >
                    <FormattedMessage id="settings.create-room" />
                  </a>
                </div>
              </div>
            )}
            {showStreamerMode && !hideExtranousItems ? (
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
                    role="button"
                    onClick={() => {
                      this.props.toggleStreamerMode(true);
                      this.unexpand();
                    }}
                  >
                    <FormattedMessage id="settings.enable-streamer-mode" />
                  </div>
                </div>
              </div>
            ) : (
              <div />
            )}
            {this.props.showAsOverlay && (
              <div className={rowClasses}>
                <div className={classNames([styles.listItem, styles.secondaryLinkItem])}>
                  <div className={styles.secondaryButton} onClick={() => this.props.onCloseOverlay()}>
                    <FormattedMessage id="settings.return-to-vr" />
                  </div>
                </div>
              </div>
            )}
            {!hideExtranousItems && (
              <div className={classNames([styles.bottomLinksMain])}>
                <IfFeature name="show_whats_new_link">
                  <a href="/whats-new" target="_blank" rel="noreferrer noopener">
                    <FormattedMessage id="settings.whats-new" />
                  </a>
                </IfFeature>
                <button
                  onClick={e => {
                    e.preventDefault();
                    resetTips();
                    this.setState({ expanded: false });
                  }}
                >
                  <FormattedMessage id="settings.tips" />
                </button>
                <IfFeature name="show_controls_link">
                  <a
                    href={configs.link("controls", "https://hubs.mozilla.com/docs/hubs-controls.html")}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="settings.controls" />
                  </a>
                </IfFeature>
              </div>
            )}
            {!hideExtranousItems && (
              <div className={classNames([styles.bottomLinks])}>
                <IfFeature name="show_docs_link">
                  <a
                    href={configs.link("docs", "https://hubs.mozilla.com/docs")}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="settings.help" />
                  </a>
                </IfFeature>
                <IfFeature name="show_community_link">
                  <a
                    href={configs.link("community", "https://discord.gg/wHmY4nd")}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="settings.community" />
                  </a>
                </IfFeature>
                <IfFeature name="show_feedback_ui">
                  <button
                    onClick={e => {
                      e.preventDefault();
                      this.props.pushHistoryState("modal", "feedback");
                    }}
                  >
                    <FormattedMessage id="settings.send-feedback" />
                  </button>
                </IfFeature>
                <IfFeature name="show_issue_report_link">
                  <a
                    className={styles.bottomLink}
                    href={configs.link("issue_report", "https://hubs.mozilla.com/docs/help.html")}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="settings.report" />
                  </a>
                </IfFeature>
                <IfFeature name="show_terms">
                  <a
                    className={styles.bottomLink}
                    href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="settings.terms" />
                  </a>
                </IfFeature>
                <IfFeature name="show_privacy">
                  <a
                    className={styles.bottomLink}
                    href={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="settings.privacy" />
                  </a>
                </IfFeature>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        {!this.props.showAsOverlay && (
          <div
            role="button"
            aria-label="settings menu"
            onClick={() => this.setState({ expanded: !this.state.expanded })}
            className={classNames({
              [rootStyles.cornerButton]: true,
              [rootStyles.cornerButtonSelected]: this.state.expanded
            })}
          >
            <FontAwesomeIcon icon={faBars} />
          </div>
        )}
        {this.props.showAsOverlay ? (
          <div className={styles.settingsMenuOverlayWrap}>{this.renderExpandedMenu()}</div>
        ) : (
          this.state.expanded && this.renderExpandedMenu()
        )}
      </div>
    );
  }
}
