import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./TextInput.scss";
import { ReactComponent as WarningIcon } from "../icons/Warning.svg";

export const TextInput = memo(
  forwardRef(({ className, invalid, ...rest }, ref) => {
    return (
      <div className={styles.inputWrapper}>
        <input className={classNames(styles.textInput, { [styles.invalid]: invalid }, className)} {...rest} ref={ref} />
        {invalid && <WarningIcon className={styles.invalidIcon} />}
      </div>
    );
  })
);

TextInput.propTypes = {
  invalid: PropTypes.bool,
  className: PropTypes.string
};
