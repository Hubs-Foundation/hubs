import { useState, useEffect, useRef, useCallback } from "react";
import MovingAverage from "moving-average";

const UPDATE_RATE = 50;

export function useMicrophone(scene, updateRate = UPDATE_RATE) {
  const movingAvgRef = useRef();
  const [isMuted, setIsMuted] = useState(scene.is("muted"));
  const [volume, setVolume] = useState(0);

  useEffect(
    () => {
      if (!movingAvgRef.current) {
        movingAvgRef.current = MovingAverage(updateRate * 2);
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

      function onSceneStateChange(event) {
        if (event.detail === "muted") {
          setIsMuted(scene.is("muted"));
        }
      }

      scene.addEventListener("stateadded", onSceneStateChange);
      scene.addEventListener("stateremoved", onSceneStateChange);

      return () => {
        clearTimeout(timeout);
        scene.removeEventListener("stateadded", onSceneStateChange);
        scene.removeEventListener("stateremoved", onSceneStateChange);
      };
    },
    [setVolume, scene, updateRate]
  );

  const toggleMute = useCallback(
    () => {
      scene.emit("action_mute");
    },
    [scene]
  );

  return { isMuted, volume, toggleMute };
}
