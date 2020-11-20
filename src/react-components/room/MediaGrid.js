import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./MediaGrid.scss";

export function MediaGrid({ children, className, center, isVariableWidth, ...rest }) {
  return (
    <div
      className={classNames(
        styles.mediaGrid,
        { [styles.center]: center, [styles.variableWidth]: isVariableWidth },
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

MediaGrid.propTypes = {
  center: PropTypes.bool,
  isVariableWidth: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node
};
