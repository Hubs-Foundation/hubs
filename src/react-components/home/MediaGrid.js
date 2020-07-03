import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./MediaGrid.scss";

export function MediaGrid({ children, className, ...rest }) {
  return (
    <div className={classNames(styles.mediaGrid, className)} {...rest}>
      {children}
    </div>
  );
}

MediaGrid.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
