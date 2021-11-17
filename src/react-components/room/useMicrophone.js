import { useState, useEffect, useRef, useCallback } from "react";
import MovingAverage from "moving-average";

export function useMicrophone(scene, updateRate = 50) {
  const movingAvgRef = useRef();
  const [isMicMuted, setIsMicMuted] = useState(!APP.dialog.isMicEnabled);
  const [isMicEnabled, setIsMicEnabled] = useState(window.APP.mediaDevicesManager.isMicShared);
  const [micVolume, setMicVolume] = useState(0);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);

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
        setMicVolume(prevVolume => (Math.abs(prevVolume - nextVolume) > 0.05 ? nextVolume : prevVolume));
        timeout = setTimeout(updateMicVolume, updateRate);
      };

      updateMicVolume();

      const onMicMutedStateChanged = ({ enabled }) => {
        setIsMicMuted(!enabled);
      };

      APP.dialog.on("mic-state-changed", onMicMutedStateChanged);

      const onMicEnabled = () => {
        setIsMicEnabled(true);
      };
      const onMicDisabled = () => {
        setIsMicEnabled(false);
      };

      scene.addEventListener("action_end_mic_sharing", onMicDisabled);
      scene.addEventListener("local-media-stream-created", onMicEnabled);

      setIsPermissionsGranted(window.APP.mediaDevicesManager.isPermissionsGranted);

      return () => {
        clearTimeout(timeout);
        APP.dialog.off("mic-state-changed", onMicMutedStateChanged);
        scene.removeEventListener("action_end_mic_sharing", onMicDisabled);
        scene.removeEventListener("local-media-stream-created", onMicEnabled);
      };
    },
    [setMicVolume, scene, updateRate]
  );

  const toggleMute = useCallback(() => {
    APP.dialog.toggleMicrophone();
  }, []);

  const onEnableMicrophone = useCallback(() => {
    window.APP.mediaDevicesManager.startMicShare(window.APP.mediaDevicesManager.selectedMicDeviceId);
  }, []);

  return { isMicMuted, micVolume, toggleMute, isMicEnabled, onEnableMicrophone, isPermissionsGranted };
}
