import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/preferences-screen.scss";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { IntlProvider, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import { lang, messages } from "../utils/i18n";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { PreferenceListItem, PREFERENCE_LIST_ITEM_TYPE } from "./preference-list-item";
addLocaleData([...en]);

export default class PreferencesScreen extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    store: PropTypes.object
  };
  state = {
    muteMicOnEntry: false,
    turningModeCurrOption: 0,
    micActivationSchemeCurrOption: 0,
    turnSnapDegree: 45
  };
  componentDidMount() {
    waitForDOMContentLoaded().then(() => {
      this.sfx = AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem;
    });
  }

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
        />
      );
    };
    const itemInfos = [
      { key: "disableBatching", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "enableFlyMode", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "enableSmoothLocomotion", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "requireUserGestureToLoad", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "muteMicOnEntry", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "muteVideosOnLoad", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "enableReticulumDebugging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "automaticResolution", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "showPhysicsDebugging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "showOnScreenUserInputDebugging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "enableUserInputMaskLogging", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "changeMovementSpeedWithMouseWheel", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "allowMultipleHubsInstances", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "disableTelemetry", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "enableVRStats", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "enableAvatarEditorDebugger", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "enableSpatializedAudio", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "disableRendering", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "lowBandwidthMode", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      { key: "disableWorldUpdatePatch", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX },
      {
        key: "turningMode",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "snap", text: "Snap" }, { value: "smooth", text: "Smooth" }]
      },
      {
        key: "touchscreenMovementScheme",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "joysticks", text: "On-Screen Joysticks" }, { value: "pinch", text: "Pinch and Drag" }]
      },
      {
        key: "micActivationScheme",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "pushToTalk", text: "Push to Talk" }, { value: "openMic", text: "Open Mic" }]
      },
      {
        key: "baseMovementSpeed",
        prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
        min: 0,
        max: 10
      }
    ];
    // TODO: Add search text field and sort rows by fuzzy search
    const items = itemInfos.map(preferenceListItem);

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
            <div className={classNames(styles.scrollingContent)}>{items}</div>
          </div>
        </div>
      </IntlProvider>
    );
  }
}
