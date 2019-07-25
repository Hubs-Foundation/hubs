import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/spectating-label.scss";
import { FormattedMessage } from "react-intl";

export class SpectatingLabel extends Component {
  static propTypes = {
    name: PropTypes.string
  };

  render() {
    return (
      <div className={styles.label}>
        <FormattedMessage id="lobby.watching" />
        <b>{this.props.name}</b>
      </div>
    );
  }
}
