import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/preferences-screen.scss";
import classNames from "classnames";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import { CheckBox } from "./checkbox.js";
addLocaleData([...en]);
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
    currentValue: PropTypes.number,
    onChange: PropTypes.func,
    options: PropTypes.array
  };
  state = {
    hovered: false
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
            onChange={e => {
              this.props.store.update({ preferences: { [this.props.storeKey]: e.target.value } });
            }}
          >
            {options}
          </select>
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
