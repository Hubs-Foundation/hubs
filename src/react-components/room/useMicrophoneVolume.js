import { useState, useEffect, useRef } from "react";
import MovingAverage from "moving-average";

const MOVING_AVG_TIMESPAN = 100;
const UPDATE_RATE = 50;

export function useMicrophoneVolume(scene) {
  const movingAvgRef = useRef();
  const [volume, setVolume] = useState(0);

  useEffect(
    () => {
      if (!movingAvgRef.current) {
        movingAvgRef.current = MovingAverage(MOVING_AVG_TIMESPAN);
      }

      let max = 0;
      let timeout;

      const updateMicVolume = () => {
        const analyser = scene.systems["local-audio-analyser"];
        max = Math.max(analyser.volume, max);
        // We use a moving average to smooth out the visual animation or else it would twitch too fast for
        // the css renderer to keep up.
        movingAvgRef.current.push(Date.now(), analyser.volume);
        const average = movingAvgRef.current.movingAverage();
        const nextVolume = max === 0 ? 0 : average / max;
        setVolume(prevVolume => (Math.abs(prevVolume - nextVolume) > 0.05 ? nextVolume : prevVolume));
        timeout = setTimeout(updateMicVolume, UPDATE_RATE);
      };

      updateMicVolume();

      return () => {
        clearTimeout(timeout);
      };
    },
    [setVolume, scene]
  );

  return volume;
}
