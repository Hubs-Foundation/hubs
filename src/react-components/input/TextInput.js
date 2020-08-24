import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./TextInput.scss";
import { ReactComponent as WarningIcon } from "../icons/Warning.svg";

export const TextInput = memo(
  forwardRef(({ id, disabled, invalid, label, hideLabel, className, ...rest }, ref) => {
    return (
      <div className={styles.inputField}>
        {label && (
          <label className={classNames(hideLabel)} htmlFor={id}>
            {label}
          </label>
        )}
        <div
          className={classNames(
            styles.inputWrapper,
            { [styles.invalid]: invalid, [styles.disabled]: disabled },
            className
          )}
        >
          <input id={id} className={styles.textInput} disabled={disabled} {...rest} ref={ref} />
          {invalid && <WarningIcon className={styles.invalidIcon} />}
        </div>
      </div>
    );
  })
);

TextInput.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
  label: PropTypes.string,
  hideLabel: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func
};

TextInput.defaultProps = {
  onChange: () => {}
};
