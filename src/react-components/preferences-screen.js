import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./wrapped-intl-provider";
import styles from "../assets/stylesheets/preferences-screen.scss";
import { getMessages } from "../utils/i18n";
import { AVAILABLE_LOCALES } from "../assets/locales/locale_config";

const isMobile = AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR();

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
  return (
    <button
      className={styles.noDefaultButtonStyle}
      title={getMessages()["preferences.resetToDefault"]}
      aria-label={getMessages()["preferences.resetToDefault"]}
      onClick={onClick}
    >
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
          alt="dropdown arrow"
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
    setValue: PropTypes.func
  };
  constructor(props) {
    super();
    this.options = props.options.map(({ text, value }, i) => {
      return (
        <option key={`option_${props.storeKey}_${i}`} value={value}>
          {text}
        </option>
      );
    });
  }
  render() {
    const storedPref = this.props.store.state.preferences[this.props.storeKey];
    const value = storedPref === undefined || storedPref === "" ? this.props.defaultString : storedPref;
    return (
      <Select
        value={value}
        onChange={e => {
          this.props.setValue(e.target.value);
        }}
      >
        {this.options}
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
        &nbsp;x&nbsp;
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
export class PreferenceListItem extends Component {
  static propTypes = {
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
    const isCheckbox = this.props.itemProps.prefType === PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX;
    const isSmallScreen = window.innerWidth < 600;
    const label = <span className={styles.preferenceLabel}>{getMessages()[`preferences.${this.props.storeKey}`]}</span>;
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

const CATEGORY_AUDIO = 0;
const CATEGORY_CONTROLS = 1;
const CATEGORY_MISC = 2;
const CATEGORY_MOVEMENT = 3;
const CATEGORY_TOUCHSCREEN = 4;
const TOP_LEVEL_CATEGORIES = [CATEGORY_AUDIO, CATEGORY_CONTROLS, CATEGORY_MISC];
const CATEGORY_NAMES = new Map([
  [CATEGORY_AUDIO, getMessages()[`preferences.category_audio`]],
  [CATEGORY_CONTROLS, getMessages()["preferences.category_controls"]],
  [CATEGORY_MISC, getMessages()["preferences.category_misc"]],
  [CATEGORY_MOVEMENT, getMessages()["preferences.category_movement"]],
  [CATEGORY_TOUCHSCREEN, getMessages()["preferences.category_touchscreen"]]
]);

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
  return (
    <button
      autoFocus
      aria-label={getMessages()["preferences.closeButton"]}
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

const preferredCamera = {
  key: "preferredCamera",
  prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
  options: [
    { value: "user", text: "User-Facing" },
    { value: "environment", text: "Environment" },
    { value: "default", text: "Default" }
  ],
  defaultString: "default"
};

const availableLocales = [{ value: "browser", text: getMessages()["preferences.browserDefault"] }];
for (const locale in AVAILABLE_LOCALES) {
  availableLocales.push({ value: locale, text: AVAILABLE_LOCALES[locale] });
}

const DEFINITIONS = new Map([
  [
    CATEGORY_TOUCHSCREEN,
    [
      { key: "enableOnScreenJoystickLeft", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "enableOnScreenJoystickRight", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
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
      { key: "onlyShowNametagsInFreeze", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
      { key: "maxResolution", prefType: PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION },
      preferredCamera,
      {
        key: "materialQualitySetting",
        prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
        options: [{ value: "low", text: "Low" }, { value: "medium", text: "Medium" }, { value: "high", text: "High" }],
        defaultString: isMobile ? "low" : "high",
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
      { key: "animateWaypointTransitions", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: true }
    ]
  ]
]);

// add camera choices to preferredCamera's options
navigator.mediaDevices
  .enumerateDevices()
  .then(function(devices) {
    devices.forEach(function(device) {
      if (device.kind == "videoinput") {
        const shortId = device.deviceId.substr(0, 9);
        preferredCamera.options.push({
          value: device.deviceId,
          text: device.label || `Camera (${shortId})`
        });
      }
    });
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  });

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
    <PreferenceListItem
      key={itemProps.key}
      itemProps={itemProps}
      store={store}
      storeKey={itemProps.key}
      setValue={setValue}
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
          <div className={styles.refreshPrompt}>{getMessages()["preferences.promptForRefresh"]}</div>
          <div className={styles.warnIconPlaceholder} />
        </div>
        <button
          className={styles.refreshNowButton}
          onClick={() => {
            const href = location.href;
            location.href = href;
          }}
        >
          <FormattedMessage id={"preferences.refreshNow"} />
        </button>
      </div>
    );
  }
}

export default class PreferencesScreen extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    store: PropTypes.object
  };

  state = {
    category: CATEGORY_AUDIO,
    toastHeight: "150px"
  };

  constructor(props) {
    // TODO: When this component is recreated it clears its state.
    // This happens several times as the page is loading.
    // We should either avoid remounting or persist the category somewhere besides state.
    super();
    const toItem = itemProps => createItem(itemProps, props.store);
    const items = new Map();
    for (const [category, definitions] of DEFINITIONS) {
      items.set(category, definitions.map(toItem));
    }
    this.sections = new Map([
      [CATEGORY_AUDIO, [{ items: items.get(CATEGORY_AUDIO) }]],
      [
        CATEGORY_CONTROLS,
        [
          {
            name: CATEGORY_NAMES.get(CATEGORY_MOVEMENT),
            items: items.get(CATEGORY_MOVEMENT)
          },
          {
            name: CATEGORY_NAMES.get(CATEGORY_TOUCHSCREEN),
            items: items.get(CATEGORY_TOUCHSCREEN)
          }
        ]
      ],
      [CATEGORY_MISC, [{ items: items.get(CATEGORY_MISC) }]]
    ]);
    this.onresize = () => {
      this.forceUpdate();
    };
    this.storeUpdated = () => {
      this.forceUpdate();
    };
  }

  componentDidMount() {
    window.APP.preferenceScreenIsVisible = true;
    window.addEventListener("resize", this.onresize);
    this.props.store.addEventListener("statechanged", this.storeUpdated);
  }
  componentWillUnmount() {
    window.APP.preferenceScreenIsVisible = false;
    window.removeEventListener("resize", this.onresize);
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
  }

  render() {
    const shouldPromptForRefresh = !!this.props.store.state.preferences.shouldPromptForRefresh;
    return (
      <WrappedIntlProvider>
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
                title={CATEGORY_NAMES.get(category)}
                onClick={() => {
                  this.setState({ category });
                }}
                ariaLabel={`${getMessages()["preferences.selectCategory"]} ${CATEGORY_NAMES.get(category)}`}
                selected={category === this.state.category}
              />
            ))}
          </Nav>
          <div className={styles.contentContainer}>
            <div className={styles.scrollingContent}>
              {this.sections.get(this.state.category).map(Section)}
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
      </WrappedIntlProvider>
    );
  }
}
