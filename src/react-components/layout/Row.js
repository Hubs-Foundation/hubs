import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Row.scss";

export const Row = forwardRef(({ as: Component, className, gap, padding, center, children, ...rest }, ref) => {
  const gapClass = gap === true ? styles.mdGap : styles[`${gap}Gap`];
  const paddingClass = padding === true ? styles.lgPadding : styles[`${padding}Padding`];

  return (
    <Component
      {...rest}
      ref={ref}
      className={classNames(
        styles.row,
        gapClass,
        paddingClass,
        {
          [styles.center]: center === true || center === "horizontal" || center === "both"
        },
        className
      )}
    >
      {children}
    </Component>
  );
});

Row.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
  gap: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  center: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
};

Row.defaultProps = {
  as: "div",
  gap: "md",
  center: false,
  padding: false
};
