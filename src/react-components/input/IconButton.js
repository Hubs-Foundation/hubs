import React, { forwardRef, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./IconButton.scss";

export const IconButton = memo(
  forwardRef(({ className, children, ...rest }, ref) => {
    return (
      <button className={classNames(styles.iconButton, className)} {...rest} ref={ref}>
        {children}
      </button>
    );
  })
);

IconButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
