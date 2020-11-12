import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Column.scss";

export function Column({ as: Component, className, gap, padding, center, grow, overflow, children, ...rest }) {
  const gapClass = gap === true ? styles.mdGap : styles[`${gap}Gap`];
  const paddingClass = padding === true ? styles.lgPadding : styles[`${padding}Padding`];

  return (
    <Component
      {...rest}
      className={classNames(
        styles.column,
        gapClass,
        paddingClass,
        { [styles.center]: center, [styles.grow]: grow, [styles.overflow]: overflow },
        className
      )}
    >
      {children}
    </Component>
  );
}

Column.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
  gap: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  center: PropTypes.bool,
  grow: PropTypes.bool,
  overflow: PropTypes.bool
};

Column.defaultProps = {
  as: "div",
  gap: "md",
  center: false,
  padding: false,
  grow: false,
  overflow: false
};
