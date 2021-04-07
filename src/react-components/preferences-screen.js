import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle";
import { FormattedMessage, injectIntl, useIntl, defineMessages } from "react-intl";
import styles from "../assets/stylesheets/preferences-screen.scss";
import { defaultMaterialQualitySetting } from "../storage/store";
import { AVAILABLE_LOCALES } from "../assets/locales/locale_config";
import { themes } from "./styles/theme";

function round(step, n) {
  return Math.round(n / step) * step;
}

function WarnIcon() {
  return (
    <i className={styles.flex}>
      <FontAwesomeIcon className={styles.warnIcon} icon={faExclamationTriangle} />
    </i>
  );
}

function ResetToDefaultButton({ onClick }) {
  const intl = useIntl();
  const title = intl.formatMessage({
    id: "preferences-screen.reset-to-default",
    defaultMessage: "Reset preference to default"
  });

  return (
    <button className={styles.noDefaultButtonStyle} title={title} aria-label={title} onClick={onClick}>
      <i className={styles.flex}>
        <FontAwesomeIcon className={classNames(styles.resetToDefaultButton)} icon={faUndo} />
      </i>
    </button>
  );
}
ResetToDefaultButton.propTypes = {
  onClick: PropTypes.func
};
function ResetToDefaultButtonPlaceholder() {
  return <div className={styles.resetToDefaultButtonPlaceholder} />;
}

function sanitize(s) {
  s = s.replace(/[^0-9.]/g, "");
  const split = s.split(".");
  if (split.length > 1) {
    return `${split.shift()}.${split.join("")}`;
  } else {
    return s;
  }
}
function countDigits(s) {
  const split = s.split("."); // Assume input is sanitized.
  return (split.length > 1 && split[1].length) || 0;
}

export class NumberRangeSelector extends Component {
  // TODO: Simplify this component.
  //       This component got a bit complicated when I tried to make sure that the number of digits
  //       shown to the user was correct in all cases. The cases I have in mind are:
  //         - User drags slider. Should use step and digits props.
  //         - User clicks "reset to default" button. Should use step and digits props again.
  //         - User enters text in the text box. Should display however many digits they type. (Maybe it shouldn't?)
  //       We also take into account the difference between stored value and displayed value. The display string
  //       may not match the stored value due to rounding-when-presenting or when nothing is stored (and the default value is displayed).
  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    digits: PropTypes.number,
    defaultNumber: PropTypes.number,
    store: PropTypes.object,
    storeKey: PropTypes.string,
    setValue: PropTypes.func
  };
  state = {
    isFocused: false,
    isDragging: false,
    displayValue: "",
    digitsFromUser: 0
  };
  constructor(props) {
    super(props);
    this.myRoot = React.createRef();
    this.stopDragging = this.stopDragging.bind(this);
    this.drag = this.drag.bind(this);
    this.storeUpdated = this.storeUpdated.bind(this);
  }

  storeUpdated() {
    if (!this.state.isFocused) {
      const currentValue =
        this.props.store.state.preferences[this.props.storeKey] !== undefined
          ? this.props.store.state.preferences[this.props.storeKey]
          : this.props.defaultNumber;
      const digits = Math.max(this.state.digitsFromUser, this.props.digits);
      this.setState({ displayValue: currentValue.toFixed(digits) });
    }
    this.forceUpdate();
  }

  componentDidMount() {
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    window.addEventListener("mouseup", this.stopDragging);
    window.addEventListener("mousemove", this.drag);
    const currentValue =
      this.props.store.state.preferences[this.props.storeKey] !== undefined
        ? this.props.store.state.preferences[this.props.storeKey]
        : this.props.defaultNumber;
    this.setState({ displayValue: currentValue.toFixed(this.props.digits) });
  }
  componentWillUnmount() {
    window.removeEventListener("mouseup", this.stopDragging);
    window.removeEventListener("mousemove", this.drag);
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
  }

  stopDragging() {
    this.setState({ isDragging: false });
  }

  drag(e) {
    if (!this.state.isDragging) return;
    const t = Math.max(0, Math.min((e.clientX - this.myRoot.current.offsetLeft) / this.myRoot.current.clientWidth, 1));
    const num = round(this.props.step, this.props.min + t * (this.props.max - this.props.min));
    this.setState({ displayValue: num.toFixed(this.props.digits) });
    this.props.setValue(num);
  }

  render() {
    const currentValue =
      this.props.store.state.preferences[this.props.storeKey] !== undefined
        ? this.props.store.state.preferences[this.props.storeKey]
        : this.props.defaultNumber;

    return (
      <div className={classNames(styles.numberWithRange)}>
        <div className={classNames(styles.numberInNumberWithRange)}>
          <input
            type="text"
            value={this.state.displayValue}
            onClick={e => {
              //e.preventDefault();
              e.target.focus();
              e.target.select();
            }}
            onBlur={() => {
              if (this.props.store.state.preferences[this.props.storeKey] === undefined) {
                this.setState({ displayValue: this.props.defaultNumber, isFocused: false });
              } else {
                this.setState({ isFocused: false });
              }
            }}
            onFocus={() => {
              this.setState({ isFocused: true });
            }}
            onChange={e => {
              const sanitizedInput = sanitize(e.target.value);
              this.setState({ displayValue: sanitizedInput, digitsFromUser: countDigits(sanitizedInput) });
              const numberOrReset = isNaN(parseFloat(sanitizedInput)) ? undefined : parseFloat(sanitizedInput);
              this.props.setValue(numberOrReset);
            }}
          />
        </div>
        <div
          ref={this.myRoot}
          className={classNames(styles.rangeSlider)}
          onMouseDown={e => {
            e.preventDefault();
            this.setState({ isDragging: true, digitsFromUser: 0 });
            const t = Math.max(
              0,
              Math.min((e.clientX - this.myRoot.current.offsetLeft) / this.myRoot.current.clientWidth, 1)
            );
            const num = round(this.props.step, this.props.min + t * (this.props.max - this.props.min));
            this.setState({ displayValue: num.toFixed(this.props.digits) });
            this.props.setValue(num);
          }}
        >
          <input
            type="range"
            step={this.props.step}
            min={this.props.min}
            max={this.props.max}
            value={currentValue}
            onChange={e => {
              const num = round(this.props.step, parseFloat(e.target.value));
              this.setState({ displayValue: num.toFixed(this.props.digits), digitsFromUser: 0 });
              this.props.setValue(parseFloat(num.toFixed(this.props.digits)));
            }}
          />
        </div>
      </div>
    );
  }
}

function CheckboxPlaceholder() {
  return <div className={styles.checkboxPlaceholder} />;
}
function BooleanPreference({ store, storeKey, defaultBool, setValue }) {
  const storedPref = store.state.preferences[storeKey];
  const value = storedPref === undefined ? defaultBool : storedPref;
  return (
    <input
      tabIndex="0"
      type="checkbox"
      checked={value}
      onChange={() => {
        setValue(!value);
      }}
    />
  );
}
BooleanPreference.propTypes = {
  store: PropTypes.object,
  storeKey: PropTypes.string,
  defaultBool: PropTypes.bool,
  setValue: PropTypes.func
};

class Select extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  render() {
    return (
      <div className={styles.dropdown}>
        <select value={this.props.value} tabIndex="0" onChange={this.props.onChange}>
          {this.props.children}
        </select>
        <img
          className={styles.dropdownArrow}
          src="../assets/images/dropdown_arrow.png"
          srcSet="../assets/images/dropdown_arrow@2x.png 2x"
        />
      </div>
    );
  }
}

class PreferenceSelect extends React.Component {
  static propTypes = {
    options: PropTypes.array,
    defaultString: PropTypes.string,
    store: PropTypes.object,
    storeKey: PropTypes.string,
    setValue: PropTypes.func,
    onChanged: PropTypes.func
  };
  constructor() {
    super();
  }
  render() {
    const options = this.props.options.map(({ text, value }, i) => {
      return (
        <option key={`option_${this.props.storeKey}_${i}`} value={value}>
          {text}
        </option>
      );
    });
    const storedPref = this.props.store.state.preferences[this.props.storeKey];
    const value = storedPref === undefined || storedPref === "" ? this.props.defaultString : storedPref;
    return (
      <Select
        value={value}
        onChange={e => {
          this.props.setValue(e.target.value);
          this.props.onChanged && this.props.onChanged(e.target.value);
        }}
      >
        {options}
      </Select>
    );
  }
}

export const PREFERENCE_LIST_ITEM_TYPE = {
  CHECK_BOX: 1,
  SELECT: 2,
  NUMBER_WITH_RANGE: 3,
  MAX_RESOLUTION: 4
};

export class MaxResolutionPreferenceItem extends Component {
  static propTypes = {
    store: PropTypes.object
  };
  render() {
    return (
      <div className={classNames(styles.maxResolutionPreferenceItem)}>
        <input
          tabIndex="0"
          type="number"
          step="1"
          min="0"
          value={
            this.props.store.state.preferences.maxResolutionWidth === undefined
              ? 1920
              : this.props.store.state.preferences.maxResolutionWidth
          }
          onClick={e => {
            e.preventDefault();
            e.target.focus();
            e.target.select();
          }}
          onChange={e => {
            const num = parseInt(e.target.value);
            this.props.store.update({
              preferences: { maxResolutionWidth: num ? num : 0 }
            });
          }}
        />
        &nbsp;{"x"}&nbsp;
        <input
          tabIndex="0"
          type="number"
          step="1"
          min="0"
          value={
            this.props.store.state.preferences.maxResolutionHeight === undefined
              ? 1920
              : this.props.store.state.preferences.maxResolutionHeight
          }
          onClick={e => {
            e.preventDefault();
            e.target.focus();
            e.target.select();
          }}
          onChange={e => {
            const num = parseInt(e.target.value);
            this.props.store.update({
              preferences: { maxResolutionHeight: num ? num : 0 }
            });
          }}
        />
      </div>
    );
  }
}
function ListItem({ children }) {
  return <div className={styles.listItem}>{children}</div>;
}
ListItem.propTypes = {
  children: PropTypes.node.isRequired
};

const preferenceLabels = defineMessages({
  preferredCamera: {
    id: "preferences-screen.preference.preferred-camera",
    defaultMessage: "Preferred camera"
  },
  preferredMic: {
    id: "preferences-screen.preference.preferred-mic",
    defaultMessage: "Preferred mic"
  },
  muteMicOnEntry: {
    id: "preferences-screen.preference.mute-mic-on-entry",
    defaultMessage: "Mute microphone on entry"
  },
  globalVoiceVolume: {
    id: "preferences-screen.preference.global-voice-volume",
    defaultMessage: "Incoming Voice Volume"
  },
  globalMediaVolume: {
    id: "preferences-screen.preference.global-media-volume",
    defaultMessage: "Media Volume"
  },
  disableSoundEffects: {
    id: "preferences-screen.preference.disable-sound-effects",
    defaultMessage: "Disable Sound Effects"
  },
  disableEchoCancellation: {
    id: "preferences-screen.preference.disable-echo-cancellation",
    defaultMessage: "Disable microphone echo cancellation"
  },
  disableNoiseSuppression: {
    id: "preferences-screen.preference.disable-noise-suppression",
    defaultMessage: "Disable microphone noise supression"
  },
  disableAutoGainControl: {
    id: "preferences-screen.preference.disable-auto-gain-control",
    defaultMessage: "Disable microphone automatic gain control"
  },
  snapRotationDegrees: {
    id: "preferences-screen.preference.snap-rotation-degrees",
    defaultMessage: "Rotation per snap (in degrees)"
  },
  disableMovement: {
    id: "preferences-screen.preference.disable-movement",
    defaultMessage: "Disable movement"
  },
  disableBackwardsMovement: {
    id: "preferences-screen.preference.disable-backwards-movement",
    defaultMessage: "Disable backwards movement"
  },
  disableStrafing: {
    id: "preferences-screen.preference.disable-strafing",
    defaultMessage: "Disable strafing"
  },
  disableTeleporter: {
    id: "preferences-screen.preference.disable-teleporter",
    defaultMessage: "Disable teleporter"
  },
  movementSpeedModifier: {
    id: "preferences-screen.preference.movement-speed-modifier",
    defaultMessage: "Movement speed modifier"
  },
  enableOnScreenJoystickLeft: {
    id: "preferences-screen.preference.enable-on-screen-joystick-left",
    defaultMessage: "Enable left on-screen joystick for moving around"
  },
  enableOnScreenJoystickRight: {
    id: "preferences-screen.preference.enable-on-screen-joystick-right",
    defaultMessage: "Enable right on-screen joystick for looking around"
  },
  enableGyro: {
    id: "preferences-screen.preference.enable-gyro",
    defaultMessage: "Enable gyroscope (when supported by browser/device)"
  },
  invertTouchscreenCameraMove: {
    id: "preferences-screen.preference.invert-touchscreen-camera-move",
    defaultMessage: "Invert direction of camera movement for touchscreens"
  },
  locale: {
    id: "preferences-screen.preference.locale",
    defaultMessage: "Language"
  },
  onlyShowNametagsInFreeze: {
    id: "preferences-screen.preference.only-show-nametags-in-freeze",
    defaultMessage: "Only show nametags while frozen"
  },
  animateWaypointTransitions: {
    id: "preferences-screen.preference.animate-waypoint-transitions",
    defaultMessage: "Animate waypoint transitions"
  },
  showFPSCounter: {
    id: "preferences-screen.preference.show-fps-counter",
    defaultMessage: "Show FPS Counter"
  },
  maxResolution: {
    id: "preferences-screen.preference.max-resolution",
    defaultMessage: "Max Resolution"
  },
  materialQualitySetting: {
    id: "preferences-screen.preference.material-quality-setting",
    defaultMessage: "Material quality"
  },
  enableDynamicShadows: {
    id: "preferences-screen.preference.enable-dynamic-shadows",
    defaultMessage: "Enable Dynamic Shadows"
  },
  disableAutoPixelRatio: {
    id: "preferences-screen.preference.disable-auto-pixel-ratio",
    defaultMessage: "Disable automatic pixel ratio adjustments"
  },
  allowMultipleHubsInstances: {
    id: "preferences-screen.preference.allow-multiple-hubs-instances",
    defaultMessage: "Disable auto-exit when multiple hubs instances are open"
  },
  disableIdleDetection: {
    id: "preferences-screen.preference.disable-idle-detection",
    defaultMessage: "Disable auto-exit when idle or backgrounded"
  },
  preferMobileObjectInfoPanel: {
    id: "preferences-screen.preference.prefer-mobile-object-info-panel",
    defaultMessage: "Prefer Mobile Object Info Panel"
  },
  showRtcDebugPanel: {
    id: "preferences-screen.preference.show-rtc-debug-panel",
    defaultMessage: "Show RTC Panel"
  },
  theme: {
    id: "preferences-screen.preference.theme",
    defaultMessage: "Theme"
  }
});

class PreferenceListItem extends Component {
  static propTypes = {
    intl: PropTypes.object,
    store: PropTypes.object,
    storeKey: PropTypes.string,
    setValue: PropTypes.func,
    itemProps: PropTypes.object
  };
  componentDidMount() {
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    document.body.addEventListener("locale-updated", this.storeUpdated);
  }
  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    document.body.removeEventListener("locale-updated", this.storeUpdated);
  }

  storeUpdated = () => {
    this.forceUpdate();
  };

  render() {
    const intl = this.props.intl;
    const isCheckbox = this.props.itemProps.prefType === PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX;
    const isSmallScreen = window.innerWidth < 600;
    const label = (
      <span className={styles.preferenceLabel}>{intl.formatMessage(preferenceLabels[this.props.storeKey])}</span>
    );
    const hasPref =
      this.props.store.state.preferences[this.props.storeKey] !== undefined ||
      (this.props.itemProps.prefType === PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION &&
        (this.props.store.state.preferences.maxResolutionWidth !== undefined ||
          this.props.store.state.preferences.maxResolutionHeight !== undefined));
    const resetToDefault = hasPref ? (
      <ResetToDefaultButton
        onClick={() => {
          switch (this.props.itemProps.prefType) {
            case PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION:
              this.props.store.update({
                preferences: {
                  maxResolutionWidth: undefined,
                  maxResolutionHeight: undefined
                }
              });
              break;
            default:
              this.props.setValue(undefined);
              break;
          }
          this.forceUpdate();
        }}
      />
    ) : (
      <ResetToDefaultButtonPlaceholder />
    );
    if (isCheckbox) {
      return (
        <ListItem>
          <div className={styles.row}>
            <Control itemProps={this.props.itemProps} store={this.props.store} setValue={this.props.setValue} />
            {label}
            <div className={styles.rowRight}>{resetToDefault}</div>
          </div>
        </ListItem>
      );
    } else if (isSmallScreen) {
      return (
        <ListItem>
          <div className={styles.column}>
            <div className={styles.row}>
              {<CheckboxPlaceholder />}
              {label}
            </div>
            <div className={styles.row}>
              <div className={styles.rowCenter}>
                <Control itemProps={this.props.itemProps} store={this.props.store} setValue={this.props.setValue} />
              </div>
              <div className={styles.rowRight}>{resetToDefault}</div>
            </div>
          </div>
        </ListItem>
      );
    }
    return (
      <ListItem>
        <div className={styles.row}>
          {<CheckboxPlaceholder />}
          {label}
          <div className={styles.rowRight}>
            <Control itemProps={this.props.itemProps} store={this.props.store} setValue={this.props.setValue} />
          </div>
          <div className={styles.rowRight}>{resetToDefault}</div>
        </div>
      </ListItem>
    );
  }
}

const IntlPreferenceListItem = injectIntl(PreferenceListItem);

const CATEGORY_AUDIO = 0;
const CATEGORY_CONTROLS = 1;
const CATEGORY_MISC = 2;
const CATEGORY_MOVEMENT = 3;
const CATEGORY_TOUCHSCREEN = 4;
const TOP_LEVEL_CATEGORIES = [CATEGORY_AUDIO, CATEGORY_CONTROLS, CATEGORY_MISC];
const categoryNames = defineMessages({
  [CATEGORY_AUDIO]: { id: "preferences-screen.category.audio", defaultMessage: "Audio" },
  [CATEGORY_CONTROLS]: { id: "preferences-screen.category.controls", defaultMessage: "Controls" },
  [CATEGORY_MISC]: { id: "preferences-screen.category.misc", defaultMessage: "Misc" },
  [CATEGORY_MOVEMENT]: { id: "preferences-screen.category.movement", defaultMessage: "Movement" },
  [CATEGORY_TOUCHSCREEN]: { id: "preferences-screen.category.touchscreen", defaultMessage: "Touchscreen" }
});

function NavItem({ ariaLabel, title, onClick, selected }) {
  return (
    <button
      aria-label={ariaLabel}
      className={classNames(styles.navItem, { [styles.selected]: selected })}
      onClick={onClick}
    >
      {title}
    </button>
  );
}
NavItem.propTypes = {
  ariaLabel: PropTypes.string,
  title: PropTypes.string,
  onClick: PropTypes.func,
  selected: PropTypes.bool
};
function CloseButton({ onClick }) {
  const intl = useIntl();
  return (
    <button
      autoFocus
      aria-label={intl.formatMessage({
        id: "preferences-screen.close-button",
        defaultMessage: "Close Preferences Menu"
      })}
      className={classNames(styles.closeButton)}
      onClick={onClick}
    >
      <i className={styles.flex}>
        <FontAwesomeIcon className={styles.icon} icon={faTimes} />
      </i>
    </button>
  );
}
CloseButton.propTypes = {
  onClick: PropTypes.func
};

const controlType = new Map([
  [PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, BooleanPreference],
  [PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION, MaxResolutionPreferenceItem],
  [PREFERENCE_LIST_ITEM_TYPE.SELECT, PreferenceSelect],
  [PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE, NumberRangeSelector]
]);

function Control({ itemProps, store, setValue }) {
  const ControlType = controlType.get(itemProps.prefType);
  return <ControlType {...{ store, storeKey: itemProps.key, setValue, ...itemProps }} />;
}
Control.propTypes = {
  itemProps: PropTypes.object,
  store: PropTypes.object,
  setValue: PropTypes.func
};

function createItem(itemProps, store) {
  const setValue = v => {
    if (itemProps.promptForRefresh) {
      store.update({ preferences: { [itemProps.key]: v, shouldPromptForRefresh: true } });
    } else {
      store.update({ preferences: { [itemProps.key]: v } });
    }
  };
  return (
    <IntlPreferenceListItem
      key={itemProps.key}
      itemProps={itemProps}
      store={store}
      storeKey={itemProps.key}
      setValue={setValue}
      onChanged={itemProps.onChanged}
    />
  );
}

function Section({ name, items }, i) {
  return (
    <div key={`section-${i}`} className={styles.section}>
      {name && <div className={styles.sectionTitle}>{name}</div>}
      {items}
    </div>
  );
}
Section.propTypes = {
  name: PropTypes.string,
  items: PropTypes.node.isRequired
};

class Nav extends Component {
  render() {
    const { children } = this.props;
    return (
      <div className={styles.navContainer}>
        <div className={classNames(styles.nav)}>{children}</div>
      </div>
    );
  }
}
Nav.propTypes = {
  children: PropTypes.node.isRequired,
  selected: PropTypes.number
};

class RefreshPrompt extends React.Component {
  static propTypes = {
    reportHeight: PropTypes.func
  };
  constructor() {
    super();
    this.ref = React.createRef();
  }
  componentDidMount() {
    this.props.reportHeight(window.getComputedStyle(this.ref.current).height);
  }

  render() {
    return (
      <div ref={this.ref} className={styles.toast}>
        <div className={styles.row}>
          <WarnIcon />
          <div className={styles.refreshPrompt}>
            <FormattedMessage
              id="preferences-screen.prompt-for-refresh"
              defaultMessage="Your preferences are saved, but some of your changes will not take effect until you refresh the page."
            />
          </div>
          <div className={styles.warnIconPlaceholder} />
        </div>
        <button
          className={styles.refreshNowButton}
          onClick={() => {
            const href = location.href;
            location.href = href;
          }}
        >
          <FormattedMessage id="preferences-screen.refresh-now" defaultMessage="Refresh Now" />
        </button>
      </div>
    );
  }
}

class PreferencesScreen extends Component {
  static propTypes = {
    intl: PropTypes.object,
    onClose: PropTypes.func,
    store: PropTypes.object,
    scene: PropTypes.object
  };

  constructor() {
    // TODO: When this component is recreated it clears its state.
    // This happens several times as the page is loading.
    // We should either avoid remounting or persist the category somewhere besides state.
    super();

    this.devicesUpdated = () => {
      this.updateVideoDevices();
    };
    this.mediaDevicesManager = window.APP.mediaDevicesManager;

    this.state = {
      category: CATEGORY_AUDIO,
      toastHeight: "150px",
      preferredMic: {
        key: "preferredMic",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "none", text: "None" }],
        defaultString: "none",
        onChanged: this.onMicSelectionChanged
      },
      preferredCamera: {
        key: "preferredCamera",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "none", text: "None" }],
        defaultString: "none"
      }
    };
  }

  onMicSelectionChanged = deviceId => {
    if (deviceId === "none") {
      this.mediaDevicesManager.stopMicShare().then(this.updateMediaDevices);
    } else {
      this.mediaDevicesManager.startMicShare(deviceId).then(this.updateMediaDevices);
    }
  };

  onMediaDevicesUpdated = () => {
    this.updateMediaDevices();
  };

  updateMediaDevices = () => {
    // Audio devices update
    const micOptions = this.mediaDevicesManager.micDevices.map(device => ({
      value: device.value,
      text: device.label
    }));
    const preferredMic = { ...this.state.preferredMic };
    preferredMic.options = [
      {
        value: "none",
        text: this.props.intl.formatMessage({
          id: "preferences-screen.preferred-mic.default",
          defaultMessage: "None"
        })
      }
    ];
    preferredMic.options.push(...micOptions);
    this.props.store.update({ preferences: { ["preferredMic"]: this.mediaDevicesManager.selectedMicDeviceId } });

    // Video devices update
    const videoOptions = this.mediaDevicesManager.videoDevices.map(device => ({
      value: device.value,
      text: device.label
    }));
    const preferredCamera = { ...this.state.preferredCamera };
    preferredCamera.options = [
      {
        value: "user",
        text: this.props.intl.formatMessage({
          id: "preferences-screen.preferred-camera.user-facing",
          defaultMessage: "User-Facing"
        })
      },
      {
        value: "environment",
        text: this.props.intl.formatMessage({
          id: "preferences-screen.preferred-camera.environment",
          defaultMessage: "Environment"
        })
      },
      {
        value: "default",
        text: this.props.intl.formatMessage({
          id: "preferences-screen.preferred-camera.default",
          defaultMessage: "Default"
        })
      }
    ];
    preferredCamera.options.push(...videoOptions);

    // Update media devices state
    this.setState({ preferredMic, preferredCamera });
  };

  storeUpdated = () => {
    const deviceId = this.props.store?.state?.preferences?.preferredMic;
    if (!deviceId && this.mediaDevicesManager.isMicShared) {
      this.mediaDevicesManager.stopMicShare();
    }
  };

  componentDidMount() {
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.props.scene.addEventListener("devicechange", this.onMediaDevicesUpdated);

    if (!this.mediaDevicesManager.isMicShared) {
      this.mediaDevicesManager.startMicShare().then(this.updateMediaDevices);
    } else {
      this.mediaDevicesManager.fetchMediaDevices().then(this.updateMediaDevices);
    }
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    this.props.scene.removeEventListener("devicechange", this.onMediaDevicesUpdated);
  }

  createSections() {
    const intl = this.props.intl;

    const browserDefault = intl.formatMessage({
      id: "preferences-screen.browser-default",
      defaultMessage: "Browser Default"
    });

    const availableLocales = [
      {
        value: "browser",
        text: browserDefault
      }
    ];

    for (const locale in AVAILABLE_LOCALES) {
      availableLocales.push({ value: locale, text: AVAILABLE_LOCALES[locale] });
    }

    const availableThemes = [
      {
        value: null,
        text: browserDefault
      }
    ];

    for (const { id, name } of themes) {
      availableThemes.push({
        value: id,
        text: name
      });
    }

    const DEFINITIONS = new Map([
      [
        CATEGORY_TOUCHSCREEN,
        [
          { key: "enableOnScreenJoystickLeft", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "enableOnScreenJoystickRight", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "enableGyro", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: true },
          { key: "invertTouchscreenCameraMove", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: true }
        ]
      ],
      [
        CATEGORY_MOVEMENT,
        [
          {
            key: "snapRotationDegrees",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 0,
            max: 90,
            step: 5,
            digits: 0,
            defaultNumber: 45
          },
          { key: "disableMovement", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "disableBackwardsMovement", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "disableStrafing", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "disableTeleporter", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          {
            key: "movementSpeedModifier",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 0,
            max: 2,
            step: 0.1,
            digits: 1,
            defaultNumber: 1
          }
        ]
      ],
      [
        CATEGORY_AUDIO,
        [
          this.state.preferredMic,
          { key: "muteMicOnEntry", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          {
            key: "globalVoiceVolume",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 0,
            max: 200,
            step: 5,
            digits: 0,
            defaultNumber: 100
          },
          {
            key: "globalMediaVolume",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 0,
            max: 200,
            step: 5,
            digits: 0,
            defaultNumber: 100
          },
          { key: "disableSoundEffects", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          {
            key: "disableEchoCancellation",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            defaultBool: false,
            promptForRefresh: true
          },
          {
            key: "disableNoiseSuppression",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            defaultBool: false,
            promptForRefresh: true
          },
          {
            key: "disableAutoGainControl",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            defaultBool: false,
            promptForRefresh: true
          }
        ]
      ],
      [
        CATEGORY_MISC,
        [
          {
            key: "locale",
            prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
            options: availableLocales,
            defaultString: "browser"
          },
          {
            key: "theme",
            prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
            options: availableThemes,
            defaultString: "Browser Default"
          },
          { key: "onlyShowNametagsInFreeze", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "maxResolution", prefType: PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION },
          this.state.preferredCamera,
          {
            key: "materialQualitySetting",
            prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
            options: [
              {
                value: "low",
                text: intl.formatMessage({
                  id: "preferences-screen.material-quality-setting.low",
                  defaultMessage: "Low"
                })
              },
              {
                value: "medium",
                text: intl.formatMessage({
                  id: "preferences-screen.material-quality-setting.medium",
                  defaultMessage: "Medium"
                })
              },
              {
                value: "high",
                text: intl.formatMessage({
                  id: "preferences-screen.material-quality-setting.high",
                  defaultMessage: "High"
                })
              }
            ],
            defaultString: defaultMaterialQualitySetting,
            promptForRefresh: true
          },
          {
            key: "enableDynamicShadows",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            defaultBool: false,
            promptForRefresh: true
          },
          { key: "disableAutoPixelRatio", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "allowMultipleHubsInstances", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "disableIdleDetection", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "preferMobileObjectInfoPanel", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "animateWaypointTransitions", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: true },
          { key: "showFPSCounter", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
          { key: "showRtcDebugPanel", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false }
        ]
      ]
    ]);

    const toItem = itemProps => createItem(itemProps, this.props.store);

    const items = new Map();

    for (const [category, definitions] of DEFINITIONS) {
      items.set(category, definitions.map(toItem));
    }

    return new Map([
      [CATEGORY_AUDIO, [{ items: items.get(CATEGORY_AUDIO) }]],
      [
        CATEGORY_CONTROLS,
        [
          {
            name: intl.formatMessage(categoryNames[CATEGORY_MOVEMENT]),
            items: items.get(CATEGORY_MOVEMENT)
          },
          {
            name: intl.formatMessage(categoryNames[CATEGORY_TOUCHSCREEN]),
            items: items.get(CATEGORY_TOUCHSCREEN)
          }
        ]
      ],
      [CATEGORY_MISC, [{ items: items.get(CATEGORY_MISC) }]]
    ]);
  }

  render() {
    const intl = this.props.intl;
    const shouldPromptForRefresh = !!this.props.store.state.preferences.shouldPromptForRefresh;

    return (
      <div className={classNames(styles.preferencesPanel)}>
        {shouldPromptForRefresh && (
          <RefreshPrompt
            reportHeight={toastHeight => {
              this.setState({ toastHeight });
            }}
          />
        )}
        <CloseButton onClick={this.props.onClose} />
        <Nav selected={this.state.category}>
          {TOP_LEVEL_CATEGORIES.map(category => (
            <NavItem
              key={`category-${category}-header`}
              title={intl.formatMessage(categoryNames[category])}
              onClick={() => {
                this.setState({ category });
              }}
              ariaLabel={intl.formatMessage(
                { id: "preferences-screen.select-category ", defaultMessage: "Select category {categoryName}" },
                {
                  categoryName: intl.formatMessage(categoryNames[category])
                }
              )}
              selected={category === this.state.category}
            />
          ))}
        </Nav>
        <div className={styles.contentContainer}>
          <div className={styles.scrollingContent}>
            {this.createSections()
              .get(this.state.category)
              .map(Section)}
            {shouldPromptForRefresh && (
              <div
                style={{
                  width: "100%",
                  minHeight: `${this.state.toastHeight}`
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(PreferencesScreen);
