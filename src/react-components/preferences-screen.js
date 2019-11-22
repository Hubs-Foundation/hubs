import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/preferences-screen.scss";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { IntlProvider, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import { lang, messages } from "../utils/i18n";
import { PreferenceListItem, PREFERENCE_LIST_ITEM_TYPE } from "./preference-list-item";
addLocaleData([...en]);

export default class PreferencesScreen extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    store: PropTypes.object
  };

  render() {
    const preferenceListItem = props => {
      return (
        <PreferenceListItem
          key={props.key}
          store={this.props.store}
          storeKey={props.key}
          prefType={props.prefType}
          min={props.min}
          max={props.max}
          currentValue={props.currentValue}
          onChange={props.onChange}
          options={props.options}
          defaultNumber={props.defaultNumber}
          defaultString={props.defaultString}
          defaultBool={props.defaultBool}
        />
      );
    };
    // TODO: Add search text field and sort rows by fuzzy search
    const general = [
      { key: "muteMicOnEntry", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      {
        key: "turningMode",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "snap", text: "Snap" }, { value: "smooth", text: "Smooth" }],
        defaultString: "snap"
      },
      {
        key: "touchscreenMovementScheme",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "joysticks", text: "On-Screen Joysticks" }, { value: "pinch", text: "Pinch and Drag" }],
        defaultString: "pinch"
      },
      {
        key: "micActivationScheme",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "pushToTalk", text: "Push to Talk" }, { value: "openMic", text: "Open Mic" }],
        defaultString: "openMic"
      }
    ].map(preferenceListItem);

    const advanced = [
      { key: "disableBatching", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableFlyMode", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableSmoothLocomotion", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "requireUserGestureToLoad", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "muteVideosOnLoad", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableReticulumDebugging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "automaticResolution", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: true },
      { key: "showPhysicsDebugging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "showOnScreenUserInputDebugging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableUserInputMaskLogging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "changeMovementSpeedWithMouseWheel", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "allowMultipleHubsInstances", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "disableTelemetry", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableVRStats", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableAvatarEditorDebugger", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableSpatializedAudio", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: true },
      { key: "disableRendering", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "lowBandwidthMode", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "disableWorldUpdatePatch", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      {
        key: "baseMovementSpeed",
        prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
        min: 0.1,
        max: 10,
        defaultNumber: 1
      }
    ].map(preferenceListItem);

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={classNames(styles.root)}>
          <i className={classNames(styles.floatRight)} onClick={e => this.props.onClose(e)}>
            <FontAwesomeIcon icon={faTimes} />
          </i>
          <div className={classNames(styles.contentContainer)}>
            <div className={classNames(styles.titleBar)}>
              <div className={classNames(styles.title)}>
                <span>Preferences</span>
              </div>
            </div>
            <div className={classNames(styles.sectionBar)}>
              <div className={classNames(styles.sectionTitle)}>
                <span>General</span>
              </div>
            </div>
            <div className={classNames(styles.scrollingContent)}>{general}</div>
            <div className={classNames(styles.sectionBar)}>
              <div className={classNames(styles.sectionTitle)}>
                <span>Advanced</span>
              </div>
            </div>
            <div className={classNames(styles.scrollingContent)}>{advanced}</div>
          </div>
        </div>
      </IntlProvider>
    );
  }
}
