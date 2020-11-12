import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import TextareaAutosize from "react-textarea-autosize";
import { TextInput } from "./TextInput";
import styles from "./TextAreaInput.scss";

export const TextAreaInput = forwardRef(({ className, ...rest }, ref) => (
  <TextInput className={classNames(styles.textarea, className)} {...rest} as={TextareaAutosize} ref={ref} />
));

TextAreaInput.propTypes = {
  className: PropTypes.string
};
