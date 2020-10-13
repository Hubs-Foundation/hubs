import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { joinChildren } from "../misc/joinChildren";
import styles from "./ObjectMenu.scss";
import { IconButton } from "../input/IconButton";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";

export function ObjectMenuButton({ children, className, ...rest }) {
  return (
    <IconButton className={classNames(styles.objectMenuButton, className)} {...rest}>
      {children}
    </IconButton>
  );
}
ObjectMenuButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export function ObjectMenu({ children, title }) {
  return (
    <div className={styles.objectMenu}>
      <div className={styles.header}>
        <IconButton className={styles.closeButton}>
          <CloseIcon width={16} height={16} />
        </IconButton>
        <h1>{title}</h1>
      </div>
      <div className={styles.menu}>{joinChildren(children, () => <div className={styles.separator} />)}</div>
    </div>
  );
}

ObjectMenu.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node
};
