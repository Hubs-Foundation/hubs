import React, { useRef, useCallback } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./LevelBar.scss";
import { LevelBar } from "./LevelBar";
import { useVolumeMeter } from "../misc/useVolumeMeter";

export const types = ["mic", "mixer"];

export function VolumeLevelBar({ scene, type, className }) {
  const ref = useRef();

  const update = useCallback(level => {
    const node = ref.current;
    if (node) {
      const pct = level * 100;
      if (node.clientWidth > node.clientHeight) {
        node.style.clipPath = `polygon(0% 100%, ${pct}% 100%, ${pct}% 0%, 0% 0%)`;
      } else {
        node.style.clipPath = `polygon(0% 100%, 100% 100%, 100% ${100 - pct}%, 0% ${100 - pct}%)`;
      }
    }
  }, []);

  useVolumeMeter({
    analyser:
      type == "mic"
        ? scene.systems["hubs-systems"].audioSystem.outboundAnalyser
        : scene.systems["hubs-systems"].audioSystem.mixerAnalyser,
    update
  });

  return <LevelBar ref={ref} className={classNames(styles.levelBarContainer, className)} />;
}

VolumeLevelBar.propTypes = {
  scene: PropTypes.object.isRequired,
  type: PropTypes.oneOf(types),
  className: PropTypes.string
};
