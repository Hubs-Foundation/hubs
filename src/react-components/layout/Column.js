import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Column.scss";

export const Column = forwardRef(
  (
    { as: Component, lastChildMargin, className, gap, padding, center, centerMd, grow, overflow, children, ...rest },
    ref
  ) => {
    const gapClass = gap === true ? styles.mdGap : styles[`${gap}Gap`];
    const paddingClass = padding === true ? styles.lgPadding : styles[`${padding}Padding`];

    return (
      <Component
        {...rest}
        ref={ref}
        className={classNames(
          styles.column,
          gapClass,
          paddingClass,
          {
            [styles.center]: center === true || center === "horizontal" || center === "both",
            [styles.centerVertical]: center === "vertical" || center === "both",
            [styles.centerMd]: centerMd === true || centerMd === "horizontal" || centerMd === "both",
            [styles.centerVerticalMd]: centerMd === "vertical" || centerMd === "both",
            [styles.grow]: grow,
            [styles.overflow]: overflow,
            [styles.margin0LastChild]: lastChildMargin
          },
          className
        )}
      >
        {children}
      </Component>
    );
  }
);

Column.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
  gap: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  centerMd: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  center: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  grow: PropTypes.bool,
  lastChildMargin: PropTypes.bool,
  overflow: PropTypes.bool
};

Column.defaultProps = {
  as: "div",
  gap: "md",
  center: false,
  centerMd: false,
  padding: false,
  grow: false,
  overflow: false,
  lastChildMargin: true
};
