import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";
import styles from "../assets/stylesheets/preferences-screen.scss";

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

export class NumberRangeSelector extends Component {
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
    isDragging: false,
    displayValue: ""
  };
  constructor(props) {
    super(props);
    this.myRoot = React.createRef();
    this.stopDragging = this.stopDragging.bind(this);
    this.drag = this.drag.bind(this);
  }

  storeUpdated = () => {
    this.forceUpdate();
  };

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
                this.setState({ displayValue: this.props.defaultNumber });
              }
            }}
            onChange={e => {
              const sanitizedInput = sanitize(e.target.value);
              this.setState({ displayValue: sanitizedInput });
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
            this.setState({ isDragging: true });
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
              this.setState({ displayValue: num.toFixed(this.props.digits) });
              this.props.store.update({
                preferences: { [this.props.storeKey]: num }
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
      <input
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
