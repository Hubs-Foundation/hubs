import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./CheckboxInput.scss";

export const CheckboxInput = memo(
  forwardRef(({ className, labelClassName, label, description, disabled, checked, ...rest }, ref) => {
    return (
      <label className={classNames(styles.checkboxInput, { [styles.disabled]: disabled }, className)}>
        <input type="checkbox" disabled={disabled} checked={checked} ref={ref} {...rest} />
        <div className={classNames(styles.checkmark)} />
        {label && (
          <div className={classNames(styles.labelContainer, labelClassName)}>
            <p className={styles.label}>{label}</p>
            {description && <p className={styles.description}>{description}</p>}
          </div>
        )}
      </label>
    );
  })
);

CheckboxInput.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  labelClassName: PropTypes.string
};
