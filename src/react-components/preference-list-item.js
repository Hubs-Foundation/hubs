import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/preferences-screen.scss";
import classNames from "classnames";
import { SOUND_PREFERENCE_MENU_SELECT } from "../systems/sound-effects-system";
import { FormattedMessage } from "react-intl";
import { CheckBox } from "./checkbox.js";
import { NumberRangeSelector } from "./number-range-selector.js";
export const PREFERENCE_LIST_ITEM_TYPE = {
  CHECK_BOX: 1,
  FLIP_SELECTOR: 2,
  DROP_DOWN: 2,
  NUMBER_WITH_RANGE: 3
};
export class PreferenceListItem extends Component {
  static propTypes = {
    store: PropTypes.object,
    storeKey: PropTypes.string,
    prefType: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    onChange: PropTypes.func,
    options: PropTypes.array
  };
  state = {
    hovered: false,
    selectHovered: false
  };
  UNSAFE_componentWillMount() {
    this.renderControls = this.renderControls.bind(this);
    this.props.store.addEventListener("statechanged", this.storeUpdated);
  }
  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    this.forceUpdate();
  };

  renderControls() {
    let options;
    switch (this.props.prefType) {
      case PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX:
        return (
          <CheckBox
            checked={this.props.store.state.preferences[this.props.storeKey]}
            onChange={() => {
              this.props.store.update({
                preferences: { [this.props.storeKey]: !this.props.store.state.preferences[this.props.storeKey] }
              });
            }}
          />
        );
      case PREFERENCE_LIST_ITEM_TYPE.SELECT:
        options = this.props.options.map((o, i) => {
          return (
            <option key={`${this.props.storeKey}_${i}`} value={o.value}>
              {o.text}
            </option>
          );
        });
        return (
          <select
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
        );
      case PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE:
        return (
          <NumberRangeSelector
            min={this.props.min}
            max={this.props.max}
            currentValue={this.props.store.state.preferences[this.props.storeKey]}
            onChange={(value, playSound) => {
              this.props.store.update({
                preferences: { [this.props.storeKey]: value }
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
    const controls = this.renderControls();
    return (
      <div
        className={classNames({ [styles.hovered]: this.state.hovered }, styles.preferenceListItem)}
        onMouseEnter={() => {
          this.setState({ hovered: true });
        }}
        onMouseLeave={() => {
          this.setState({ hovered: false });
        }}
      >
        <div className={classNames(styles.part, styles.left, styles.label)}>
          <FormattedMessage id={`preferences.${this.props.storeKey}`} />
        </div>
        <div className={classNames(styles.part, styles.right)}>{controls}</div>
      </div>
    );
  }
}
