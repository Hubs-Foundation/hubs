import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";
import en from "react-intl/locale-data/en";
import { FormattedMessage, IntlProvider, addLocaleData } from "react-intl";
import styles from "../assets/stylesheets/preferences-screen.scss";
import { lang, messages } from "../utils/i18n";

const isMobile = AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR();
addLocaleData([...en]);

function round(step, n) {
  return Math.round(n / step) * step;
}

function ResetToDefaultButton({ onClick }) {
  return (
    <button className={classNames(styles.resetToDefaultButton)} onClick={onClick}>
      <i className={styles.flex} title="Reset to default">
        <FontAwesomeIcon icon={faUndo} />
      </i>
    </button>
  );
}
ResetToDefaultButton.propTypes = {
  onClick: PropTypes.func
};

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
    storeKey: PropTypes.string
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
    this.props.store.update({
      preferences: { [this.props.storeKey]: num }
    });
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
              this.props.store.update({
                preferences: { [this.props.storeKey]: numberOrReset }
              });
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
            this.props.store.update({
              preferences: { [this.props.storeKey]: num }
            });
          }}
        >
          <input
            type="range"
            step={this.props.step}
            min={this.props.min}
            max={this.props.max}
            value={currentValue}
            onChange={e => {
              const num = round(e.target.value);
              this.setState({ displayValue: num.toFixed(this.props.digits), digitsFromUser: 0 });
              this.props.store.update({
                preferences: { [this.props.storeKey]: parseFloat(num.toFixed(this.props.digits)) }
              });
            }}
          />
        </div>
      </div>
    );
  }
}

function BooleanPreference({ store, storeKey, defaultBool }) {
  const storedPref = store.state.preferences[storeKey];
  const value = storedPref === undefined ? defaultBool : storedPref;
  return (
    <div className={classNames(styles.checkbox)}>
      <input // TODO AriaLabel
        tabIndex="0"
        type="checkbox"
        checked={value}
        onChange={() => {
          store.update({ preferences: { [storeKey]: !store.state.preferences[storeKey] } });
        }}
      />
    </div>
  );
}
BooleanPreference.propTypes = {
  store: PropTypes.object,
  storeKey: PropTypes.string,
  defaultBool: PropTypes.bool
};

class Dropdown extends React.Component {
  static propTypes = {
    options: PropTypes.array,
    defaultString: PropTypes.string,
    store: PropTypes.object,
    storeKey: PropTypes.string
  };

  constructor(props) {
    super();
    this.options = props.options.map((o, i) => {
      const opts = {};
      const key = `option_${props.storeKey}_${i}`;
      //TODO: Aria label?
      return (
        <option key={key} value={o.value} {...opts}>
          {o.text}
        </option>
      );
    });
  }

  render() {
    const storedPref = this.props.store.state.preferences[this.props.storeKey];
    return (
      <div className={styles.dropdown}>
        <select
          value={storedPref === undefined || storedPref === "" ? this.props.defaultString : storedPref}
          tabIndex="0"
          onChange={e => {
            this.props.store.update({ preferences: { [this.props.storeKey]: e.target.value } });
          }}
        >
          {this.options}
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
export class PreferenceListItem extends Component {
  static propTypes = {
    store: PropTypes.object,
    storeKey: PropTypes.string,
    prefType: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    digits: PropTypes.number,
    step: PropTypes.number,
    onChange: PropTypes.func,
    options: PropTypes.array,
    defaultNumber: PropTypes.number,
    defaultString: PropTypes.string,
    defaultBool: PropTypes.bool
  };
  componentDidMount() {
    this.props.store.addEventListener("statechanged", this.storeUpdated);
  }
  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    this.forceUpdate();
  };

  renderControls() {
    switch (this.props.prefType) {
      case PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX: {
        return (
          <BooleanPreference
            store={this.props.store}
            storeKey={this.props.storeKey}
            defaultBool={this.props.defaultBool}
          />
        );
      }
      case PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION:
        return <MaxResolutionPreferenceItem store={this.props.store} />;
      case PREFERENCE_LIST_ITEM_TYPE.SELECT: {
        return (
          <Dropdown
            options={this.props.options}
            defaultString={this.props.defaultString}
            store={this.props.store}
            storeKey={this.props.storeKey}
          />
        );
      }
      case PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE:
        return (
          <NumberRangeSelector
            min={this.props.min}
            max={this.props.max}
            digits={this.props.digits}
            step={this.props.step}
            store={this.props.store}
            storeKey={this.props.storeKey}
            defaultNumber={this.props.defaultNumber}
          />
        );
      default:
        return <div />;
    }
  }

  render() {
    const isCheckbox = this.props.prefType === PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX;

    return (
      <div
        className={classNames(
          {
            [styles.preferenceListNonCheckbox]: !isCheckbox
          },
          styles.preferenceListItem
        )}
      >
        <div className={classNames(styles.checkboxMargin)}>
          {isCheckbox ? this.renderControls() : <span>&nbsp;</span>}
        </div>
        <div className={classNames(styles.part, styles.left, styles.label)}>
          <FormattedMessage id={`preferences.${this.props.storeKey}`} />
        </div>
        <div className={classNames(styles.part, styles.right)}>
          {!isCheckbox && this.renderControls()}
          <ResetToDefaultButton
            onClick={() => {
              switch (this.props.prefType) {
                case PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION:
                  this.props.store.update({
                    preferences: {
                      maxResolutionWidth: undefined,
                      maxResolutionHeight: undefined
                    }
                  });
                  break;
                default:
                  this.props.store.update({ preferences: { [this.props.storeKey]: undefined } });
                  break;
              }
              this.forceUpdate();
            }}
          />
        </div>
      </div>
    );
  }
}

const CATEGORY_GENERAL = 0;
const CATEGORY_TOUCHSCREEN = 1;
const CATEGORY_ADVANCED = 2;
const CATEGORIES = [CATEGORY_GENERAL, CATEGORY_TOUCHSCREEN, CATEGORY_ADVANCED];
const CATEGORY_NAMES = new Map([
  [CATEGORY_GENERAL, "general"],
  [CATEGORY_TOUCHSCREEN, "touchscreen"],
  [CATEGORY_ADVANCED, "advanced"]
]);

function titleFor(categoryName) {
  return messages[`preferences.${categoryName}`];
}

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
      aria-label={messages["preferences.closeButton"]}
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

const general = [
  { key: "muteMicOnEntry", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "onlyShowNametagsInFreeze", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
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
];
const touchscreen = [
  { key: "enableOnScreenJoystickLeft", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "enableOnScreenJoystickRight", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false }
];

const advanced = [
  { key: "maxResolution", prefType: PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION },
  {
    key: "materialQualitySetting",
    prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
    options: [{ value: "low", text: "Low" }, { value: "high", text: "High" }],
    defaultString: isMobile ? "low" : "high"
  },
  { key: "disableAutoPixelRatio", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "allowMultipleHubsInstances", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableIdleDetection", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "preferMobileObjectInfoPanel", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableEchoCancellation", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableNoiseSuppression", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableAutoGainControl", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false }
];

export default class PreferencesScreen extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    store: PropTypes.object
  };

  state = {
    category: CATEGORY_GENERAL
  };

  constructor(props) {
    super();

    const item = itemProps => <PreferenceListItem store={props.store} storeKey={itemProps.key} {...itemProps} />;
    this.items = new Map([
      [CATEGORY_GENERAL, general.map(item)],
      [CATEGORY_TOUCHSCREEN, touchscreen.map(item)],
      [CATEGORY_ADVANCED, advanced.map(item)]
    ]);
  }

  componentDidMount() {
    window.APP.preferenceScreenIsVisible = true;
  }
  componentWillUnmount() {
    window.APP.preferenceScreenIsVisible = false;
  }

  render() {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={classNames(styles.preferencesPanel)}>
          <CloseButton onClick={this.props.onClose} />
          <div className={styles.navContainer}>
            <div className={classNames(styles.nav)}>
              {CATEGORIES.map(category => (
                <NavItem
                  key={`category-${category}-header`}
                  title={titleFor(CATEGORY_NAMES.get(category))}
                  onClick={() => {
                    this.setState({ category });
                  }}
                  ariaLabel={`${messages["preferences.selectCategory"]} ${titleFor(CATEGORY_NAMES.get(category))}`}
                  selected={category === this.state.category}
                />
              ))}
            </div>
          </div>
          <div className={classNames(styles.contentContainer)}>
            <div className={classNames(styles.scrollingContent)}>{this.items.get(this.state.category)}</div>
          </div>
        </div>
      </IntlProvider>
    );
  }
}
