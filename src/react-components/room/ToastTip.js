import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Tip.scss";

export function ToastTip({ className, children, ...rest }) {
  return (
    <div className={classNames(styles.tip, styles.toast, className)} {...rest}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

ToastTip.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
