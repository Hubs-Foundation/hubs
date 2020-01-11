import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";

import styles from "../assets/stylesheets/preferences-screen.scss";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { SOUND_PREFERENCE_MENU_SELECT } from "../systems/sound-effects-system";
import { NumberRangeSelector } from "./number-range-selector.js";

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
    onChange: PropTypes.func,
    options: PropTypes.array,
    defaultNumber: PropTypes.number,
    defaultString: PropTypes.string,
    defaultBool: PropTypes.bool
  };
  state = {
    hovered: false,
    selectHovered: false
  };
  UNSAFE_componentWillMount() {
    this.renderControls = this.renderControls.bind(this);
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    waitForDOMContentLoaded().then(() => {
      this.sfx = AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem;
    });
  }
  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    this.forceUpdate();
  };

  renderControls() {
    let options;
    let storedPref;
    switch (this.props.prefType) {
      case PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX:
        storedPref = this.props.store.state.preferences[this.props.storeKey];
        return (
          <div className={classNames(styles.checkbox)}>
            <input
              tabIndex="0"
              type="checkbox"
              checked={storedPref === undefined ? this.props.defaultBool : storedPref}
              onChange={() => {
                this.props.store.update({
                  preferences: { [this.props.storeKey]: !this.props.store.state.preferences[this.props.storeKey] }
                });
              }}
            />
          </div>
        );
      case PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION:
        return <MaxResolutionPreferenceItem store={this.props.store} />;
      case PREFERENCE_LIST_ITEM_TYPE.SELECT:
        options = this.props.options.map((o, i) => {
          const opts = {};
          const storedPref = this.props.store.state.preferences[this.props.storeKey];
          if (
            o.value === storedPref ||
            ((storedPref === undefined || storedPref === "") && o.value === this.props.defaultString)
          ) {
            opts.selected = "selected";
          }

          return (
            <option key={`${this.props.storeKey}_${i}`} value={o.value} {...opts}>
              {o.text}
            </option>
          );
        });
        return (
          <div className={styles.dropdown}>
            <select
              tabIndex="0"
              className={classNames({
                [styles.hovered]: this.state.hovered,
                [styles.selectHovered]: this.state.selectHovered
              })}
              onMouseEnter={() => {
                this.setState({ selectHovered: true });
              }}
              onMouseLeave={() => {
                this.setState({ selectHovered: false });
              }}
              onChange={e => {
                this.props.store.update({ preferences: { [this.props.storeKey]: e.target.value } });
              }}
            >
              {options}
            </select>
            <img
              className={styles.dropdownArrow}
              src="../assets/images/dropdown_arrow.png"
              srcSet="../assets/images/dropdown_arrow@2x.png 2x"
            />
          </div>
        );
      case PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE:
        return (
          <NumberRangeSelector
            min={this.props.min}
            max={this.props.max}
            currentValue={
              this.props.store.state.preferences[this.props.storeKey] !== undefined
                ? this.props.store.state.preferences[this.props.storeKey]
                : this.props.defaultNumber
            }
            onChange={(value, playSound) => {
              this.props.store.update({
                preferences: { [this.props.storeKey]: Number.parseFloat(value) }
              });
              playSound && this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_SELECT);
            }}
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
          { [styles.hovered]: this.state.hovered },
          styles.preferenceListItem,
          !isCheckbox && styles.preferenceListNonCheckbox
        )}
        onMouseEnter={() => {
          this.setState({ hovered: true });
        }}
        onMouseLeave={() => {
          this.setState({ hovered: false });
        }}
      >
        <div className={classNames(styles.checkboxMargin)}>
          {isCheckbox ? this.renderControls() : <span>&nbsp;</span>}
        </div>
        <div className={classNames(styles.part, styles.left, styles.label)}>
          <FormattedMessage id={`preferences.${this.props.storeKey}`} />
        </div>
        <div className={classNames(styles.part, styles.right)}>
          {!isCheckbox && this.renderControls()}
          <button
            className={classNames(styles.resetToDefaultButton)}
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
          >
            <i title="Reset to default">
              <FontAwesomeIcon icon={faUndo} />
            </i>
          </button>
        </div>
      </div>
    );
  }
}
