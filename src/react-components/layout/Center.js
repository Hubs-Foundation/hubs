import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Center.scss";

export function Center({ children, className, ...rest }) {
  return (
    <div className={classNames(styles.center, className)} {...rest}>
      {children}
    </div>
  );
}

Center.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};
