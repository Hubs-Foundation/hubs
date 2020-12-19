import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { CreatePropsFromData } from "./Prop.js";
import styles from "./CollapsiblePanel.scss";

function collapse(evt) {
  evt.target.classList.toggle("collapsed");
  evt.target.parentElement?.nextSibling?.classList.toggle("collapsed");
  return evt.target.parentElement?.nextSibling?.classList.contains("collapsed");
}

function openLink(url) {
  const win = window.open(url, "_blank");
  win.focus();
}

export function CollapsiblePanel({
  title,
  border,
  row,
  wrap,
  grow,
  url,
  isRoot,
  children,
  data,
  collapsed,
  onCollapse
}) {
  const rootClassName = classNames(border ? styles.borderTile : styles.borderlessTile);
  const rootStyle = {
    flexGrow: grow ? 1 : 0
  };
  const contentClassName = classNames(
    isRoot
      ? `${styles.collapsibleContentRoot} ${(!!collapsed && "collapsed") || ""}`
      : `${styles.collapsibleContent} ${(!!collapsed && "collapsed") || ""}`
  );
  const buttonClassName = classNames(`${styles.collapseButton} ${(!!collapsed && "collapsed") || ""}`);
  const contentStyle = {
    flexFlow: (row ? "row " : "column ") + (wrap ? "wrap" : "nowrap")
  };
  return (
    <div className={rootClassName} style={rootStyle}>
      <div className={styles.collapsibleHeader}>
        {title && (
          <button
            className={classNames(buttonClassName)}
            onClick={evt => {
              const isCollapsed = collapse(evt);
              onCollapse && onCollapse(title, isCollapsed);
            }}
          >
            {title}
          </button>
        )}
        {url && (
          <button className={classNames(styles.helpButton)} onClick={() => openLink(url)}>
            ?
          </button>
        )}
      </div>
      <div className={contentClassName} style={contentStyle}>
        {CreatePropsFromData(data)}
        {children}
      </div>
    </div>
  );
}

CollapsiblePanel.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  border: PropTypes.bool,
  row: PropTypes.bool,
  grow: PropTypes.bool,
  wrap: PropTypes.bool,
  url: PropTypes.string,
  isRoot: PropTypes.bool,
  data: PropTypes.object,
  collapsed: PropTypes.bool,
  onCollapse: PropTypes.func
};
