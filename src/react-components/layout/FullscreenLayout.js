import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./FullscreenLayout.scss";

export function FullscreenLayout({ className, headerLeft, headerCenter, headerRight, contentClassName, children }) {
  return (
    <div className={classNames(styles.fullscreenLayout, className)}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>{headerLeft}</div>
        <div className={styles.headerCenter}>{headerCenter}</div>
        <div className={styles.headerRight}>{headerRight}</div>
      </div>
      <div className={classNames(styles.content, contentClassName)}>{children}</div>
    </div>
  );
}

FullscreenLayout.propTypes = {
  className: PropTypes.string,
  headerLeft: PropTypes.node,
  headerCenter: PropTypes.node,
  headerRight: PropTypes.node,
  contentClassName: PropTypes.string,
  children: PropTypes.node
};
