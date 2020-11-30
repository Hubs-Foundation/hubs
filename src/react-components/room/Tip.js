import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Tip.scss";

export function Tip({ className, children, onDismiss, dismissLabel, ...rest }) {
  return (
    <div className={classNames(styles.tip, className)} {...rest}>
      <div className={styles.content}>{children}</div>
      {onDismiss && (
        <button className={styles.dismissButton} onClick={onDismiss}>
          {dismissLabel}
        </button>
      )}
    </div>
  );
}

Tip.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  onDismiss: PropTypes.func,
  dismissLabel: PropTypes.node
};
