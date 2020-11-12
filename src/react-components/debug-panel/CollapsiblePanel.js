import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { CreatePropsFromData } from "./Prop.js";
import styles from "./CollapsiblePanel.scss";

function collapse(evt) {
  evt.target.classList.toggle("collapsed");
  evt.target.parentElement?.nextSibling?.classList.toggle("collapsed");
}

function openLink(url) {
  const win = window.open(url, "_blank");
  win.focus();
}

export function CollapsiblePanel({ title, border, row, wrap, grow, url, isRoot, children, data }) {
  const rootClassName = classNames(border ? styles.borderTile : styles.borderlessTile);
  const contentClassName = classNames(isRoot ? styles.collapsibleContentRoot : styles.collapsibleContent);
  const flow = { flexFlow: (row ? "row " : "column ") + (wrap ? "wrap" : "nowrap") };
  const flexGrow = { flexGrow: grow ? 1 : 0 };
  return (
    <div className={rootClassName} style={flexGrow}>
      <div className={styles.collapsibleHeader}>
        {title && (
          <button className={classNames(styles.collapseButton)} onClick={evt => collapse(evt)}>
            {title}
          </button>
        )}
        {url && (
          <button className={classNames(styles.helpButton)} onClick={() => openLink(url)}>
            ?
          </button>
        )}
      </div>
      <div className={contentClassName} style={flow}>
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
  data: PropTypes.object
};
