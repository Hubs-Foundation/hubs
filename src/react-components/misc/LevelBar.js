import React, { useMemo } from "react";
import PropTypes from "prop-types";
import styles from "./LevelBar.scss";

export function LevelBar({ width, height, level }) {
  const clip = useMemo(
    () => {
      if (height > width) {
        return `rect(${height - level * height}px, ${width}px, ${height}px, 0px)`;
      } else {
        return `rect(0, ${level * width}px, ${height}px, 0px)`;
      }
    },
    [width, height, level]
  );
  return (
    <div className={styles.levelBarContainer}>
      <div className={styles.levelBarBorder} style={{ width: `${width}px`, height: `${height}px` }} />
      <div
        className={styles.levelBar}
        style={{
          height: `${height}px`,
          width: `${width}px`,
          clip: `${clip}`
        }}
      />
    </div>
  );
}

LevelBar.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  level: PropTypes.number
};
