import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ToolbarAdmin.scss";
import styleUtils from "../styles/style-utils.scss";

export function ToolbarAdmin({ className, rightadmin, ...rest }) {
  return (
    <div className={classNames(styles.toolbaradmin, className)} {...rest}>
      <div className={classNames(styles.content, styles.rightadminContent, styleUtils.showLg)}>{rightadmin}</div>
    </div>
  );
}

ToolbarAdmin.propTypes = {
  className: PropTypes.string,
  left: PropTypes.node,
  center: PropTypes.node,
  right: PropTypes.node,
  hideLeft: PropTypes.string,
  hideRight: PropTypes.string
};
