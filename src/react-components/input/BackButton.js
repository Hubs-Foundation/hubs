import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./BackButton.scss";
import { IconButton } from "../input/IconButton";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { FormattedMessage } from "react-intl";

export function BackButton({ className, ...rest }) {
  return (
    <IconButton className={classNames(styles.backButton, className)} {...rest}>
      <ChevronBackIcon />
      <span>
        <FormattedMessage id="back-button" defaultMessage="Back" />
      </span>
    </IconButton>
  );
}

BackButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
