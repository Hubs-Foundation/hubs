import React from "react";
import PropTypes from "prop-types";
import styles from "./SpectatingLabel.scss";
import { FormattedMessage } from "react-intl";

export function SpectatingLabel({ name }) {
  return (
    <div className={styles.label}>
      <b>
        <FormattedMessage id="spectating-label.label" defaultMessage="Spectating" />
      </b>
      <p>{name}</p>
    </div>
  );
}

SpectatingLabel.propTypes = {
  name: PropTypes.string
};
