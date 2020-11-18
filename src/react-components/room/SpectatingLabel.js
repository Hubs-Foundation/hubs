import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./SpectatingLabel.scss";
import { FormattedMessage } from "react-intl";

export function SpectatingLabel({ name }) {
  return (
    <div className={styles.label}>
      <b><FormattedMessage id="lobby.watching" /></b>
      <p>{name}</p>
    </div>
  );
}

SpectatingLabel.propTypes = {
  name: PropTypes.string
};
