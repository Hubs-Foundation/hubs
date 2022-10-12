import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./LevelBar.scss";

export const LevelBar = forwardRef(({ className }, ref) => {
  return (
    <div className={classNames(styles.levelBarContainer, className)}>
      <div className={styles.levelBarBorder} />
      <div ref={ref} className={styles.levelBar} />
    </div>
  );
});

LevelBar.propTypes = {
  className: PropTypes.string
};
