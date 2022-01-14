import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./LevelBar.scss";

export function LevelBar({ className, level }) {
  const ref = useRef();

  useEffect(
    () => {
      const pct = level * 100;
      if (ref.current.clientWidth > ref.current.clientHeight) {
        ref.current.style.clipPath = `polygon(0% 100%, ${pct}% 100%, ${pct}% 0%, 0% 0%)`;
      } else {
        ref.current.style.clipPath = `polygon(0% 100%, 100% 100%, 100% ${100 - pct}%, 0% ${100 - pct}%)`;
      }
    },
    [ref, level]
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
