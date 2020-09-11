import React, { memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./InputField.scss";

export const InputField = memo(({ id, htmlFor, label, error, description, className, children, ...rest }) => {
  return (
    <div className={classNames(styles.inputField, className)} {...rest}>
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
      ) : (
        undefined
      )}
    </div>
  );
});

InputField.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  error: PropTypes.node,
  description: PropTypes.node
};
