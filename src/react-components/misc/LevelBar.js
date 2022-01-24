import React, { useCallback } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./LevelBar.scss";

export function LevelBar({ className, level }) {
  const ref = useCallback(
    node => {
      if (node) {
        const pct = level * 100;
        if (node.clientWidth > node.clientHeight) {
          node.style.clipPath = `polygon(0% 100%, ${pct}% 100%, ${pct}% 0%, 0% 0%)`;
        } else {
          node.style.clipPath = `polygon(0% 100%, 100% 100%, 100% ${100 - pct}%, 0% ${100 - pct}%)`;
        }
      }
    },
    [level]
  );

  return (
    <div className={classNames(styles.levelBarContainer, className)}>
      <div className={styles.levelBarBorder} />
      <div ref={ref} className={styles.levelBar} />
    </div>
  );
}

LevelBar.propTypes = {
  className: PropTypes.string,
  level: PropTypes.number
};
