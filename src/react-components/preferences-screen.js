import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle";
import { FormattedMessage, injectIntl, useIntl, defineMessages } from "react-intl";
import styles from "../assets/stylesheets/preferences-screen.scss";
import { AVAILABLE_LOCALES } from "../assets/locales/locale_config";
import { themes } from "./styles/theme";
import MediaDevicesManager from "../utils/media-devices-manager";
import { MediaDevicesEvents } from "../utils/media-devices-utils";
import { Slider } from "./input/Slider";
import {
  addOrientationChangeListener,
  removeOrientationChangeListener,
  getMaxResolutionWidth,
  getMaxResolutionHeight,
  setMaxResolution
} from "../utils/screen-orientation-utils";

export const CLIPPING_THRESHOLD_MIN = 0.0;
export const CLIPPING_THRESHOLD_MAX = 0.1;
export const CLIPPING_THRESHOLD_STEP = 0.001;
export const GLOBAL_VOLUME_MIN = 0;
export const GLOBAL_VOLUME_MAX = 200;
export const GLOBAL_VOLUME_STEP = 5;

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
    store: PropTypes.object,
    storeKey: PropTypes.string,
    setValue: PropTypes.func
  };
  state = {
    isFocused: false,
    displayValue: "",
    digitsFromUser: 0
  };
  constructor(props) {
    super(props);
    this.storeUpdated = this.storeUpdated.bind(this);
  }

  storeUpdated() {
    if (!this.state.isFocused) {
      const digits = Math.max(this.state.digitsFromUser, this.props.digits);
      this.setState({ displayValue: this.props.store.state.preferences[this.props.storeKey].toFixed(digits) });
    }
    this.forceUpdate();
  }

  componentDidMount() {
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.setState({ displayValue: this.props.store.state.preferences[this.props.storeKey].toFixed(this.props.digits) });
  }
  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
  }

  render() {
    return (
      <div className={classNames(styles.numberWithRange)}>
        <div className={classNames(styles.numberInNumberWithRange)}>
          <input
            type="text"
            value={this.state.displayValue}
            onClick={e => {
              e.target.focus();
              e.target.select();
            }}
            onBlur={e => {
              const sanitizedInput = sanitize(e.target.value);
              const numberOrReset = isNaN(parseFloat(sanitizedInput)) ? undefined : parseFloat(sanitizedInput);
              this.setState({
                displayValue:
                  numberOrReset === undefined
                    ? this.props.store.state.preferences[this.props.storeKey].toFixed(this.props.digits)
                    : Math.min(Math.max(this.props.min, numberOrReset), this.props.max).toFixed(this.props.digits),
                isFocused: false
              });
            }}
            onFocus={() => {
              this.setState({ isFocused: true });
            }}
            onChange={e => {
              const sanitizedInput = sanitize(e.target.value);
              const numberOrReset = isNaN(parseFloat(sanitizedInput)) ? undefined : parseFloat(sanitizedInput);
              const finalValue = Math.min(Math.max(this.props.min, numberOrReset), this.props.max);
              this.setState({
                displayValue: numberOrReset === undefined ? "" : finalValue,
                digitsFromUser: countDigits(sanitizedInput)
              });
              this.props.setValue(
                numberOrReset === undefined
                  ? parseFloat(this.props.store.state.preferences[this.props.storeKey])
                  : finalValue
              );
            }}
          />
        </div>
        <Slider
          step={this.props.step}
          min={this.props.min}
          max={this.props.max}
          value={this.props.store.state.preferences[this.props.storeKey]}
          onChange={value => {
            const num = value.toFixed(this.props.digits);
            this.setState({ displayValue: num, digitsFromUser: 0 });
            this.props.setValue(parseFloat(num));
          }}
        />
      </div>
    );
  }
}

function CheckboxPlaceholder() {
  return <div className={styles.checkboxPlaceholder} />;
}
function BooleanPreference({ store, storeKey, setValue }) {
  const value = store.state.preferences[storeKey];
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
  setValue: PropTypes.func
};

function MapCountPreference({ store, storeKey, defaultValue, text }) {
  const storedPref = store.state.preferences[storeKey];
  const value = storedPref ? Object.keys(storedPref).length : defaultValue;
  return (
    <span className={styles.preferenceLabel}>
      {value} {text}
    </span>
  );
}
MapCountPreference.propTypes = {
  store: PropTypes.object,
  storeKey: PropTypes.string,
  defaultValue: PropTypes.number,
  text: PropTypes.string
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
    return (
      <Select
        value={this.props.store.state.preferences[this.props.storeKey]}
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
  MAX_RESOLUTION: 4,
  MAP_COUNT: 5
};

export class MaxResolutionPreferenceItem extends Component {
  static propTypes = {
    store: PropTypes.object
  };

  onOrientationChange = () => {
    // Width and height should be swapped on screen orientation change
    // then need to update.
    this.forceUpdate();
  };

  componentDidMount() {
    addOrientationChangeListener(this.onOrientationChange);
  }

  componentWillUnmount() {
    removeOrientationChangeListener(this.onOrientationChange);
  }

  render() {
    const onChange = () => {
      const numWidth = parseInt(document.getElementById("maxResolutionWidth").value);
      const numHeight = parseInt(document.getElementById("maxResolutionHeight").value);
      setMaxResolution(this.props.store, numWidth ? numWidth : 0, numHeight ? numHeight : 0);
    };
    return (
      <div className={classNames(styles.maxResolutionPreferenceItem)}>
        <input
          id="maxResolutionWidth"
          tabIndex="0"
          type="number"
          step="1"
          min="0"
          value={getMaxResolutionWidth(this.props.store)}
          onClick={e => {
            e.preventDefault();
            e.target.focus();
            e.target.select();
          }}
          onChange={onChange}
        />
        &nbsp;{"x"}&nbsp;
        <input
          id="maxResolutionHeight"
          tabIndex="0"
          type="number"
          step="1"
          min="0"
          value={getMaxResolutionHeight(this.props.store)}
          onClick={e => {
            e.preventDefault();
            e.target.focus();
            e.target.select();
          }}
          onChange={onChange}
        />
      </div>
    );
  }
}
function ListItem({ children, disabled, indent }) {
  return <div className={classNames(styles.listItem, { disabled, indent })}>{children}</div>;
}
ListItem.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  indent: PropTypes.bool
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
  preferredSpeakers: {
    id: "preferences-screen.preference.preferred-speakers",
    defaultMessage: "Preferred speakers"
  },
  globalVoiceVolume: {
    id: "preferences-screen.preference.global-voice-volume",
    defaultMessage: "Incoming Voice Volume"
  },
  globalMediaVolume: {
    id: "preferences-screen.preference.global-media-volume",
    defaultMessage: "Media Volume"
  },
  globalSFXVolume: {
    id: "preferences-screen.preference.global-sfx-volume",
    defaultMessage: "SFX Volume"
  },
  avatarVoiceLevels: {
    id: "preferences-screen.preference.avatar-volumes",
    defaultMessage: "Stored avatar volumes"
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
    defaultMessage: "Enable Real-time Shadows"
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
  showAudioDebugPanel: {
    id: "preferences-screen.preference.show-audio-debug-panel",
    defaultMessage: "Show Audio Debug Panel"
  },
  enableAudioClipping: {
    id: "preferences-screen.preference.enable-audio-clipping",
    defaultMessage: "Enable Audio Clipping"
  },
  audioClippingThreshold: {
    id: "preferences-screen.preference.audio-clipping-threshold",
    defaultMessage: "Audio Clipping Threshold"
  },
  theme: {
    id: "preferences-screen.preference.theme",
    defaultMessage: "Theme"
  },
  fastRoomSwitching: {
    id: "preferences-screen.preference.fast-room-switching",
    defaultMessage: "Enable Fast Room Switching"
  },
  lazyLoadSceneMedia: {
    id: "preferences-screen.preference.lazy-load-scene-media",
    defaultMessage: "Enable Scene Media Lazy Loading"
  },
  disableLeftRightPanning: {
    id: "preferences-screen.preference.disable-panning",
    defaultMessage: "Disable audio left/right panning"
  },
  cursorSize: {
    id: "preferences-screen.preference.cursor-size",
    defaultMessage: "Cursor Size"
  },
  nametagVisibility: {
    id: "preferences-screen.preference.nametag-visibility",
    defaultMessage: "Show Nametag"
  },
  nametagVisibilityDistance: {
    id: "preferences-screen.preference.nametag-visibility-distance",
    defaultMessage: "Nametag visibility distance"
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
    window.addEventListener("locale-updated", this.storeUpdated);
  }
  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    window.removeEventListener("locale-updated", this.storeUpdated);
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
    const prefSchema = this.props.store.schema.definitions.preferences.properties;
    const hasPref =
      this.props.itemProps.prefType === PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION
        ? this.props.store.state.preferences.maxResolutionWidth !== undefined ||
          this.props.store.state.preferences.maxResolutionHeight !== undefined
        : this.props.store.state.preferences[this.props.storeKey] !== prefSchema[this.props.storeKey].default;
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
              this.props.setValue(prefSchema[this.props.storeKey].default);
              break;
          }
          this.forceUpdate();
        }}
      />
    ) : (
      <ResetToDefaultButtonPlaceholder />
    );

    const disabled =
      (this.props.itemProps.disableIfTrue && this.props.store.state.preferences[this.props.itemProps.disableIfTrue]) ||
      (this.props.itemProps.disableIfFalse && !this.props.store.state.preferences[this.props.itemProps.disableIfFalse]);
    const indent = this.props.itemProps.disableIfTrue || this.props.itemProps.disableIfFalse;

    if (isCheckbox) {
      return (
        <ListItem disabled={disabled} indent={indent}>
          <div className={styles.row}>
            <Control itemProps={this.props.itemProps} store={this.props.store} setValue={this.props.setValue} />
            {label}
            <div className={styles.rowRight}>{resetToDefault}</div>
          </div>
        </ListItem>
      );
    } else if (isSmallScreen) {
      return (
        <ListItem disabled={disabled} indent={indent}>
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
      <ListItem disabled={disabled} indent={indent}>
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
const CATEGORY_ACCESSIBILITY = 5;
const TOP_LEVEL_CATEGORIES = [CATEGORY_AUDIO, CATEGORY_CONTROLS, CATEGORY_MISC];
const categoryNames = defineMessages({
  [CATEGORY_AUDIO]: { id: "preferences-screen.category.audio", defaultMessage: "Audio" },
  [CATEGORY_CONTROLS]: { id: "preferences-screen.category.controls", defaultMessage: "Controls" },
  [CATEGORY_MISC]: { id: "preferences-screen.category.misc", defaultMessage: "Misc" },
  [CATEGORY_MOVEMENT]: { id: "preferences-screen.category.movement", defaultMessage: "Movement" },
  [CATEGORY_TOUCHSCREEN]: { id: "preferences-screen.category.touchscreen", defaultMessage: "Touchscreen" },
  [CATEGORY_ACCESSIBILITY]: { id: "preferences-screen.category.accessibility", defaultMessage: "Accessibility" }
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
  [PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE, NumberRangeSelector],
  [PREFERENCE_LIST_ITEM_TYPE.MAP_COUNT, MapCountPreference]
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

    this.storeUpdated = this.storeUpdated.bind(this);

    this.mediaDevicesManager = APP.mediaDevicesManager;

    this.state = {
      category: CATEGORY_AUDIO,
      toastHeight: "150px",
      preferredMic: {
        key: "preferredMic",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "none", text: "None" }]
      },
      preferredCamera: {
        key: "preferredCamera",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "none", text: "None" }]
      },
      ...(MediaDevicesManager.isAudioOutputSelectEnabled && {
        preferredSpeakers: {
          key: "preferredSpeakers",
          prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
          options: [{ value: "none", text: "None" }]
        }
      })
    };
  }

  onMediaDevicesUpdated = () => {
    const currentSpeakers = this.mediaDevicesManager.selectedSpeakersDeviceId;
    if (this.props.store.state.preferences.preferredSpeakers !== currentSpeakers) {
      this.props.store.update({
        preferences: { preferredSpeakers: currentSpeakers }
      });
    }
    this.updateMediaDevices();
  };

  updateMediaDevices = () => {
    // Audio devices update
    const micOptions = this.mediaDevicesManager.micDevicesOptions.map(device => ({
      value: device.value,
      text: device.label
    }));
    const preferredMic = { ...this.state.preferredMic };
    preferredMic.options = micOptions;

    const speakersOptions = this.mediaDevicesManager.outputDevicesOptions.map(device => ({
      value: device.value,
      text: device.label
    }));
    const preferredSpeakers = { ...this.state.preferredSpeakers };
    preferredSpeakers.options = speakersOptions?.length > 0 ? speakersOptions : [{ value: "none", text: "None" }];

    // Video devices update
    const videoOptions = this.mediaDevicesManager.videoDevicesOptions.map(device => ({
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
    this.setState({
      preferredMic,
      preferredSpeakers,
      preferredCamera
    });
  };

  componentDidMount() {
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.mediaDevicesManager.on(MediaDevicesEvents.DEVICE_CHANGE, this.onMediaDevicesUpdated);

    this.mediaDevicesManager.fetchMediaDevices().then(this.updateMediaDevices);
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    this.mediaDevicesManager.off(MediaDevicesEvents.DEVICE_CHANGE, this.onMediaDevicesUpdated);
  }

  storeUpdated() {
    const { preferredMic } = this.props.store.state.preferences;
    if (preferredMic !== this.mediaDevicesManager.selectedMicDeviceId) {
      this.mediaDevicesManager.startMicShare({ updatePrefs: false }).then(this.updateMediaDevices);
    }
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
          {
            key: "enableOnScreenJoystickLeft",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "enableOnScreenJoystickRight",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "enableGyro",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "invertTouchscreenCameraMove",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          }
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
            digits: 0
          },
          {
            key: "disableMovement",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "disableBackwardsMovement",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "disableStrafing",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "disableTeleporter",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "movementSpeedModifier",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 0,
            max: 2,
            step: 0.1,
            digits: 1
          }
        ]
      ],
      [
        CATEGORY_AUDIO,
        [
          ...(MediaDevicesManager.isAudioInputSelectEnabled ? [this.state.preferredMic] : []),
          ...(MediaDevicesManager.isAudioOutputSelectEnabled ? [this.state.preferredSpeakers] : []),
          {
            key: "globalVoiceVolume",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: GLOBAL_VOLUME_MIN,
            max: GLOBAL_VOLUME_MAX,
            step: GLOBAL_VOLUME_STEP,
            digits: 0
          },
          {
            key: "globalMediaVolume",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: GLOBAL_VOLUME_MIN,
            max: GLOBAL_VOLUME_MAX,
            step: GLOBAL_VOLUME_STEP,
            digits: 0
          },
          {
            key: "globalSFXVolume",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 0,
            max: 200,
            step: 5,
            digits: 0
          },
          {
            key: "avatarVoiceLevels",
            prefType: PREFERENCE_LIST_ITEM_TYPE.MAP_COUNT,
            defaultValue: 0,
            text: intl.formatMessage({
              id: "preferences-screen.preference.avatar-volumes.entries",
              defaultMessage: "Entries"
            })
          },
          {
            key: "disableSoundEffects",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "disableEchoCancellation",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            promptForRefresh: true
          },
          {
            key: "disableNoiseSuppression",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            promptForRefresh: true
          },
          {
            key: "disableAutoGainControl",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            promptForRefresh: true
          },
          {
            key: "enableAudioClipping",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "audioClippingThreshold",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: CLIPPING_THRESHOLD_MIN,
            max: CLIPPING_THRESHOLD_MAX,
            step: CLIPPING_THRESHOLD_STEP,
            digits: 3
          },
          {
            key: "showAudioDebugPanel",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          }
        ]
      ],
      [
        CATEGORY_MISC,
        [
          {
            key: "locale",
            prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
            options: availableLocales
          },
          {
            key: "theme",
            prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
            options: availableThemes
          },
          { key: "maxResolution", prefType: PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION },
          {
            key: "nametagVisibility",
            prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
            options: [
              {
                value: "showAll",
                text: intl.formatMessage({
                  id: "preferences-screen.nametag-visibility.show-all",
                  defaultMessage: "Always"
                })
              },
              {
                value: "showNone",
                text: intl.formatMessage({
                  id: "preferences-screen.nametag-visibility.show-none",
                  defaultMessage: "Never"
                })
              },
              {
                value: "showFrozen",
                text: intl.formatMessage({
                  id: "preferences-screen.nametag-visibility.show-frozen",
                  defaultMessage: "Only in Frozen state"
                })
              },
              {
                value: "showSpeaking",
                text: intl.formatMessage({
                  id: "preferences-screen.nametag-visibility.show-speaking",
                  defaultMessage: "Only speaking"
                })
              },
              {
                value: "showClose",
                text: intl.formatMessage({
                  id: "preferences-screen.nametag-visibility.show-close",
                  defaultMessage: "Close to me"
                })
              }
            ]
          },
          {
            key: "nametagVisibilityDistance",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 1,
            max: 20,
            step: 1,
            digits: 2
          },
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
            promptForRefresh: true
          },
          {
            key: "enableDynamicShadows",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX,
            defaultBool: false
          },
          {
            key: "disableAutoPixelRatio",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "allowMultipleHubsInstances",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "disableIdleDetection",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "fastRoomSwitching",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "lazyLoadSceneMedia",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "preferMobileObjectInfoPanel",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "animateWaypointTransitions",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "showFPSCounter",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "showRtcDebugPanel",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          },
          {
            key: "cursorSize",
            prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
            min: 1,
            max: 5,
            step: 0.5,
            digits: 1
          }
        ]
      ],
      [
        CATEGORY_ACCESSIBILITY,
        [
          {
            key: "disableLeftRightPanning",
            prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX
          }
        ]
      ]
    ]);

    const toItem = itemProps => createItem(itemProps, this.props.store);

    const items = new Map();

    for (const [category, definitions] of DEFINITIONS) {
      items.set(category, definitions.map(toItem));
    }

    return new Map([
      [
        CATEGORY_AUDIO,
        [
          { items: items.get(CATEGORY_AUDIO) },
          {
            name: intl.formatMessage(categoryNames[CATEGORY_ACCESSIBILITY]),
            items: items.get(CATEGORY_ACCESSIBILITY)
          }
        ]
      ],
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
    const shouldPromptForRefresh = this.props.store.state.preferences.shouldPromptForRefresh;

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
