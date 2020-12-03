import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Sidebar.scss";
import useFocusLock from "focus-layers";

export function Sidebar({ title, beforeTitle, afterTitle, children, contentClassName, onEscape, className }) {
  const sidebarRef = useRef();

  useFocusLock(sidebarRef);

  useEffect(
    () => {
      const onKeyDown = e => {
        if (e.key === "Escape" && onEscape && sidebarRef.current.contains(document.activeElement)) {
          onEscape();
        }
      };

      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    },
    [onEscape]
  );

  return (
    <div className={classNames(styles.sidebar, className)} ref={sidebarRef} tabIndex={-1}>
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

Sidebar.propTypes = {
  title: PropTypes.node,
  beforeTitle: PropTypes.node,
  afterTitle: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  disableFullscreen: PropTypes.bool,
  onEscape: PropTypes.func
};
