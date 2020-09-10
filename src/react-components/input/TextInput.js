import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./TextInput.scss";
import { ReactComponent as WarningIcon } from "../icons/Warning.svg";
import buttonStyles from "./Button.scss";
import iconButtonStyles from "./IconButton.scss";

export const TextInput = memo(
  forwardRef(({ id, disabled, invalid, className, beforeInput, afterInput, ...rest }, ref) => {
    return (
      <div
        className={classNames(
          styles.outerWrapper,
          buttonStyles.inputGroup,
          iconButtonStyles.inputGroup,
          { [styles.invalid]: invalid, [styles.disabled]: disabled },
          className
        )}
      >
        {beforeInput}
        <div className={styles.inputWrapper}>
          <input id={id} className={styles.textInput} disabled={disabled} {...rest} ref={ref} />
        </div>
        {invalid && <WarningIcon className={styles.invalidIcon} />}
        {afterInput}
      </div>
    );
  })
);

TextInput.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
  beforeInput: PropTypes.node,
  afterInput: PropTypes.node
};

TextInput.defaultProps = {
  onChange: () => {}
};
