import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import styles from "./Grid.scss";

export function Grid({ className, gap, children, ...rest }) {
  return (
    <div className={classNames(styles.grid, styles["gap-" + gap], className)} {...rest}>
      {children}
    </div>
  );
}

Grid.propTypes = {
  gap: PropTypes.string,
  padding: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node
};

Grid.defaultProps = {
  gap: "md"
};
