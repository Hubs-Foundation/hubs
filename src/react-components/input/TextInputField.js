import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./TextInput.scss";
import { TextInput } from "./TextInput";

export const TextInputField = memo(
  forwardRef(({ className, ...rest }, ref) => {
    return (
      <fieldset className={classNames(styles.textInputField, className)}>
        <TextInput {...rest} ref={ref} />
      </fieldset>
    );
  })
);

TextInputField.propTypes = {
  className: PropTypes.string
};
