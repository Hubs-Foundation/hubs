import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";

export const presets = ["basic", "accept", "cancel", "red", "orange", "green", "blue", "purple"];

export const Button = memo(
  forwardRef(({ preset, className, children, ...rest }, ref) => {
    return (
      <button className={classNames(styles.button, styles[preset], className)} {...rest} ref={ref}>
        {children}
      </button>
    );
  })
);

Button.propTypes = {
  preset: PropTypes.oneOf(presets),
  className: PropTypes.string,
  children: PropTypes.node
};

Button.defaultProps = {
  preset: "basic"
};
