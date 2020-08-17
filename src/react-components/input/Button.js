import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";

export function Button({ preset, className, children, ...rest }) {
  return (
    <button className={classNames(styles.button, styles[preset], className)} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  preset: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node
};

Button.defaultProps = {
  preset: "basic"
};
