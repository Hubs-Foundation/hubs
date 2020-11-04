import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./BackButton.scss";
import { IconButton } from "../input/IconButton";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";

export function BackButton({ children, className, ...rest }) {
  return (
    <IconButton className={classNames(styles.backButton, className)} {...rest}>
      <ChevronBackIcon />
      <span>{children}</span>
    </IconButton>
  );
}

BackButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

BackButton.defaultProps = {
  children: "Back"
};
