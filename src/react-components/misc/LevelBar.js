import React from "react";
import PropTypes from "prop-types";
import styles from "./LevelBar.scss";

export function LevelBar({ width, height, level }) {
  return (
    <div className={styles.levelBarContainer}>
      <div className={styles.levelBarBorder} style={{ height: `${height}px` }} />
      <div
        className={styles.levelBar}
        style={{
          height: `${height}px`,
          clip: `rect(${height - Math.floor(level * height)}px, ${width}px, ${width}px, 0px)`
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
