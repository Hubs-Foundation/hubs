import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Toolbar.scss";
import styleUtils from "../styles/style-utils.scss";

export function Toolbar({ className, left, center, right, ...rest }) {
  return (
    <div className={classNames(styles.toolbar, className)} {...rest}>
      <div className={classNames(styles.content, styles.left_content, styleUtils.showLg)}>{left}</div>
      <div className={classNames(styles.content, styles.center_content)}>{center}</div>
      <div className={classNames(styles.content, styles.right_content, styleUtils.showLg)}>{right}</div>
    </div>
  );
}

Toolbar.propTypes = {
  className: PropTypes.string,
  left: PropTypes.node,
  center: PropTypes.node,
  right: PropTypes.node,
  hideLeft: PropTypes.string,
  hideRight: PropTypes.string
};
