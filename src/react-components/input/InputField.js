import React, { memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./InputField.scss";

/* eslint-disable-next-line react/display-name */
export const InputField = memo(
  ({ id, htmlFor, label, error, description, className, fullWidth, children, ...rest }) => {
    return (
      <div className={classNames(styles.inputField, { [styles.fullWidth]: fullWidth }, className)} {...rest}>
        {label && (
          <label id={id} className={styles.label} htmlFor={htmlFor}>
            {label}
          </label>
        )}
        {children}
        {error ? (
          <small className={styles.error}>{error}</small>
        ) : description ? (
          <small className={styles.info}>{description}</small>
        ) : undefined}
      </div>
    );
  }
);

InputField.propTypes = {
  id: PropTypes.string,
  htmlFor: PropTypes.string,
  label: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
  error: PropTypes.node,
  description: PropTypes.node,
  fullWidth: PropTypes.bool
};
