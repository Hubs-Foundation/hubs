import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Sidebar.scss";
import { IconButton } from "../input/IconButton";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";

export function BackButton({ children, ...rest }) {
  return (
    <IconButton {...rest} className={styles.backButton}>
      <ChevronBackIcon />
      <span>{children}</span>
    </IconButton>
  );
}

BackButton.propTypes = {
  children: PropTypes.node
};

BackButton.defaultProps = {
  children: "Back"
};

export function CloseButton(props) {
  return (
    <IconButton {...props} className={styles.sidebarButton}>
      <CloseIcon width={16} height={16} />
    </IconButton>
  );
}

export function SidebarButton({ children, ...rest }) {
  return (
    <IconButton {...rest} className={styles.sidebarButton}>
      {children}
    </IconButton>
  );
}

SidebarButton.propTypes = {
  children: PropTypes.node
};

export function Sidebar({ title, beforeTitle, afterTitle, children, contentClassName, className }) {
  return (
    <div className={classNames(styles.sidebar, className)}>
      {(title || beforeTitle || afterTitle) && (
        <div className={styles.header}>
          <div className={styles.beforeTitle}>{beforeTitle}</div>
          <h1>{title}</h1>
          <div className={styles.afterTitle}>{afterTitle}</div>
        </div>
      )}
      <div className={classNames(styles.content, contentClassName)}>{children}</div>
    </div>
  );
}

Sidebar.propTypes = {
  title: PropTypes.string,
  beforeTitle: PropTypes.node,
  afterTitle: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  disableFullscreen: PropTypes.bool
};
