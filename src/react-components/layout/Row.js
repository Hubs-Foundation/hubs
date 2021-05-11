import React from "react";
import PropTypes from "prop-types";
import styles from "./Row.scss";
import classNames from "classnames";

export const Row = ({ children, padding, gap, spaceBetween, className }) => {
  const paddingClass = padding === true ? styles.lgPadding : styles[`${padding}Padding`];
  const gapClass = gap === true ? styles.mdGap : styles[`${gap}Gap`];

  return (
    <div
      className={classNames(
        styles.flexRowSpaceBetween,
        paddingClass,
        gapClass,
        {
          [styles.spaceBetween]: spaceBetween
        },
        className
      )}
    >
      {children}
    </div>
  );
};

Row.propTypes = {
  children: PropTypes.node,
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  gap: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  spaceBetween: PropTypes.bool,
  className: PropTypes.string
};
