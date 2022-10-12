import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { IconButton } from "../input/IconButton";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";
import styles from "./CloseButton.scss";

export function CloseButton({ lg, className, ...rest }) {
  return (
    <IconButton className={classNames({ [styles.lg]: lg }, className)} {...rest}>
      <CloseIcon width={16} height={16} />
    </IconButton>
  );
}

CloseButton.propTypes = {
  className: PropTypes.string,
  lg: PropTypes.bool
};
