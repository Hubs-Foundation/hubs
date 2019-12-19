import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "../assets/stylesheets/preferences-screen.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare } from "@fortawesome/free-solid-svg-icons/faCheckSquare";
import { faSquare } from "@fortawesome/free-solid-svg-icons/faSquare";
export class CheckBox extends Component {
  static propTypes = {
    checked: PropTypes.bool,
    onChange: PropTypes.func,
    onHover: PropTypes.func
  };
  state = {
    hovered: false
  };
  render() {
    return (
      <i
        className={classNames(styles.checkBox)}
        onClick={e => {
          e.preventDefault();
          this.props.onChange();
        }}
      >
        <FontAwesomeIcon
          onMouseEnter={() => {
            this.setState({ hovered: true });
            this.props.onHover && this.props.onHover();
          }}
          onMouseLeave={() => {
            this.setState({ hovered: false });
          }}
          className={classNames({ [styles.hovered]: this.state.hovered })}
          icon={this.props.checked ? faCheckSquare : faSquare}
        />
      </i>
    );
  }
}
