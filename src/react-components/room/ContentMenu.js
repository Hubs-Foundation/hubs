import React, { Children } from "react";
import className from "classnames";
import PropTypes from "prop-types";
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
  return (
    <div className={styles.contentMenu}>
      {Children.toArray(children).reduce(
        (acc, child) =>
          acc === null ? (
            child
          ) : (
            <>
              {acc}
              {<div className={styles.separator} />}
              {child}
            </>
          ),
        null
      )}
    </div>
  );
}

ContentMenu.propTypes = {
  children: PropTypes.node
};
