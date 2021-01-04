import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Modal.scss";

export function Modal({ title, beforeTitle, afterTitle, children, contentClassName, className, disableFullscreen }) {
  return (
    <div className={classNames(styles.modal, { [styles.smFullscreen]: !disableFullscreen }, className)}>
      {(title || beforeTitle || afterTitle) && (
        <div className={styles.header}>
          <div className={styles.beforeTitle}>{beforeTitle}</div>
          <h5>{title}</h5>
          <div className={styles.afterTitle}>{afterTitle}</div>
        </div>
      )}
      <div className={classNames(styles.content, contentClassName)}>{children}</div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.node,
  beforeTitle: PropTypes.node,
  afterTitle: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  disableFullscreen: PropTypes.bool
};
