import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./IconButton.scss";
import textInputStyles from "./TextInput.scss";

export const IconButton = memo(
  forwardRef(({ className, as: ButtonComponent, children, ...rest }, ref) => {
    return (
      <ButtonComponent
        className={classNames(styles.iconButton, textInputStyles.iconButton, className)}
        {...rest}
        ref={ref}
      >
        {children}
      </ButtonComponent>
    );
  })
);

IconButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

IconButton.defaultProps = {
  as: "button"
};
