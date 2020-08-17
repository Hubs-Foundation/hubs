import React from "react";
import classNames from "classnames";
import styles from "./Button.scss";

export function Button({ preset, className, children, ...rest }) {
  return (
    <button className={classNames(styles.button, styles[preset], className)} {...rest}>
      {children}
    </button>
  );
}

Button.defaultProps = {
  preset: "basic"
};
