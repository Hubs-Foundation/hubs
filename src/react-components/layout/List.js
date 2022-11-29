import React, { forwardRef } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import styles from "./List.scss";

/* eslint-disable-next-line react/display-name */
export const List = forwardRef(({ className, children, ...rest }, ref) => {
  return (
    <ul {...rest} className={classNames(styles.list, className)} ref={ref}>
      {children}
    </ul>
  );
});

List.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export function ListItem({ className, children, ...rest }) {
  return (
    <li {...rest} className={classNames(styles.listItem, styles.listItemContent, className)}>
      {children}
    </li>
  );
}

ListItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export function ButtonListItem({ className, children, ...rest }) {
  return (
    <li className={styles.listItem}>
      <button {...rest} className={classNames(styles.listItemContent, styles.buttonListItem, className)}>
        {children}
      </button>
    </li>
  );
}

ButtonListItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
