import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./TextInput.scss";
import { ReactComponent as WarningIcon } from "../icons/Warning.svg";

export const TextInput = memo(
  forwardRef(({ id, disabled, invalid, className, ...rest }, ref) => {
    return (
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
    );
  })
);

TextInput.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func
};

TextInput.defaultProps = {
  onChange: () => {}
};
