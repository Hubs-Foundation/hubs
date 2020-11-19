import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./IconButton.scss";
import textInputStyles from "./TextInput.scss";

export const IconButton = memo(
  forwardRef(({ className, as: ButtonComponent, compactSm, lg, children, ...rest }, ref) => {
    const buttonProps = ButtonComponent === "button" ? { type: "button" } : {};

    return (
      <ButtonComponent
        className={classNames(
          styles.iconButton,
          textInputStyles.iconButton,
          { [styles.compactSm]: compactSm, [styles.lg]: lg },
          className
        )}
        {...buttonProps}
        {...rest}
        ref={ref}
      >
        {children}
      </ButtonComponent>
    );
  })
);

IconButton.propTypes = {
  // compactSm makes the icon button shift to a vertical layout in the "sm" (mobile) breakpoint
  compactSm: PropTypes.bool,
  lg: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node
};

IconButton.defaultProps = {
  as: "button"
};
