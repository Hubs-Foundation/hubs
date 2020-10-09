import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import TextareaAutosize from "react-textarea-autosize";
import { TextInput } from "./TextInput";
import styles from "./TextAreaInput.scss";

export function TextAreaInput({ className, ...rest }) {
  return <TextInput className={classNames(styles.textarea, className)} {...rest} as={TextareaAutosize} />;
}

TextAreaInput.propTypes = {
  className: PropTypes.string
};
