import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";

export const presets = ["transparent", "basic", "accept", "cancel", "red", "orange", "green", "blue", "purple"];

export const Button = memo(
  forwardRef(({ as, preset, className, children, ...rest }, ref) => {
    const ButtonComponent = as;

    return (
      <ButtonComponent className={classNames(styles.button, styles[preset], className)} {...rest} ref={ref}>
        {children}
      </ButtonComponent>
    );
  })
);

Button.propTypes = {
  as: PropTypes.elementType,
  preset: PropTypes.oneOf(presets),
  className: PropTypes.string,
  children: PropTypes.node
};

Button.defaultProps = {
  as: "button",
  preset: "basic"
};
