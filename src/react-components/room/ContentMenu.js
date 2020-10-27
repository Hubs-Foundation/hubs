import React from "react";
import className from "classnames";
import PropTypes from "prop-types";
import { joinChildren } from "../misc/joinChildren";
import styles from "./ContentMenu.scss";

export function ContentMenuButton({ active, children, ...props }) {
  return (
    <button className={className(styles.contentMenuButton, { [styles.active]: active })} {...props}>
      {children}
    </button>
  );
}

ContentMenuButton.propTypes = {
  children: PropTypes.node,
  active: PropTypes.bool
};

export function ContentMenu({ children }) {
  return <div className={styles.contentMenu}>{joinChildren(children, () => <div className={styles.separator} />)}</div>;
}

ContentMenu.propTypes = {
  children: PropTypes.node
};
