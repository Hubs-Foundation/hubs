import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./TextInput.scss";

export const TextInput = memo(
  forwardRef(({ className, ...rest }, ref) => {
    return <input className={classNames(styles.textInput, className)} {...rest} ref={ref} />;
  })
);

TextInput.propTypes = {
  className: PropTypes.string
};
