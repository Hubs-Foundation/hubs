import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/scene-ui.scss";
import { FormattedMessage } from "react-intl";

export class SpectatingLabel extends Component {
  static propTypes = {
    name: PropTypes.string
  };

  render() {
    return (
      <div className={styles.info}>
        <div className={styles.name}>
          <FormattedMessage id="spectating" />
          {this.props.name}
        </div>
      </div>
    );
  }
}
