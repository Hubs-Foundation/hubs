import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./RadioInput.scss";

export function RadioInputContainer({ className, children, ...rest }) {
  return (
    <div className={classNames(styles.radioInput, className)} {...rest}>
      {children}
    </div>
  );
}

RadioInputContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

/* eslint-disable-next-line react/display-name */
export const RadioInputOption = forwardRef(({ label, description, className, labelClassName, ...rest }, ref) => (
  <label className={classNames(styles.option, className)}>
    <input className={styles.input} type="radio" ref={ref} {...rest} />
    <div className={classNames(styles.content, labelClassName)}>
      <span className={styles.label}>{label}</span>
      {description && <span className={styles.description}>{description}</span>}
    </div>
  </label>
));

RadioInputOption.propTypes = {
  className: PropTypes.string,
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  labelClassName: PropTypes.string
};
