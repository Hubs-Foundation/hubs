import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ToggleInput.scss";

/* eslint-disable-next-line react/display-name */
export const ToggleInput = memo(
  forwardRef(({ className, label, description, disabled, ...rest }, ref) => {
    return (
      <label className={classNames(styles.toggleInput, { [styles.disabled]: disabled }, className)}>
        <input type="checkbox" disabled={disabled} ref={ref} {...rest} />
        <div className={classNames(styles.track)}>
          <div className={styles.button} />
        </div>
        {label && (
          <div className={styles.labelContainer}>
            <p className={styles.label}>{label}</p>
            {description && <p className={styles.description}>{description}</p>}
          </div>
        )}
      </label>
    );
  })
);

ToggleInput.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string
};
