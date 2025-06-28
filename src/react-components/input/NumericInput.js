import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./NumericInput.scss";
import { TextInput } from "./TextInput";

export const NumericInput = memo(
  forwardRef(({ className, afterInput, ...rest }, ref) => {
    return (
      <TextInput
        inputMode="numeric"
        {...rest}
        type="number"
        className={classNames(styles.numericInput, className)}
        ref={ref}
        afterInput={afterInput}
      />
    );
  })
);

NumericInput.propTypes = {
  afterInput: PropTypes.node,
  className: PropTypes.string
};
