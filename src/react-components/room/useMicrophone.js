import { useState, useEffect, useRef, useCallback } from "react";
import MovingAverage from "moving-average";
import { MediaDevices, MediaDevicesEvents } from "../../utils/media-devices-utils";

export function useMicrophone(scene, updateRate = 50) {
  const mediaDevicesManager = window.APP.mediaDevicesManager;
  const movingAvgRef = useRef();
  const [isMicMuted, setIsMicMuted] = useState(!APP.dialog.isMicEnabled);
  const [isMicEnabled, setIsMicEnabled] = useState(window.APP.mediaDevicesManager.isMicShared);
  const [micVolume, setMicVolume] = useState(0);
  const [permissionStatus, setPermissionsStatus] = useState(
    mediaDevicesManager.getPermissionsStatus(MediaDevices.MICROPHONE)
  );
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState(mediaDevicesManager.selectedMicDeviceId);
  const [micDevices, setMicDevices] = useState(mediaDevicesManager.micDevices);

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
        setMicVolume(prevVolume => Math.max(0.15, Math.abs(prevVolume - nextVolume) > 0.05 ? nextVolume : prevVolume));
        timeout = setTimeout(updateMicVolume, updateRate);
      };

      updateMicVolume();

      const onMicMutedStateChanged = ({ enabled }) => {
        setIsMicMuted(!enabled);
      };
      APP.dialog.on("mic-state-changed", onMicMutedStateChanged);

      const onMicEnabled = () => {
        setIsMicEnabled(true);
        setSelectedMicDeviceId(mediaDevicesManager.selectedMicDeviceId);
        setMicDevices(mediaDevicesManager.micDevices);
      };
      const onMicDisabled = () => {
        setIsMicEnabled(false);
        setSelectedMicDeviceId(mediaDevicesManager.selectedMicDeviceId);
        setMicDevices(mediaDevicesManager.micDevices);
      };
      scene.addEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, onMicDisabled);
      scene.addEventListener(MediaDevicesEvents.MIC_SHARE_STARTED, onMicEnabled);

      const onPermissionsChanged = ({ mediaDevice, status }) => {
        if (mediaDevice === MediaDevices.MICROPHONE) {
          setPermissionsStatus(status);
          setSelectedMicDeviceId(mediaDevicesManager.selectedMicDeviceId);
          setMicDevices(mediaDevicesManager.micDevices);
        }
      };
      mediaDevicesManager.on(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);

      const onDeviceChange = () => {
        setSelectedMicDeviceId(mediaDevicesManager.selectedMicDeviceId);
        setMicDevices(mediaDevicesManager.micDevices);
      };
      mediaDevicesManager.on(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);

      setSelectedMicDeviceId(mediaDevicesManager.selectedMicDeviceId);
      setMicDevices(mediaDevicesManager.micDevices);

      return () => {
        clearTimeout(timeout);
        APP.dialog.off("mic-state-changed", onMicMutedStateChanged);
        scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, onMicDisabled);
        scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_STARTED, onMicEnabled);
        mediaDevicesManager.off(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);
        mediaDevicesManager.off(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);
      };
    },
    [
      setIsMicMuted,
      setMicVolume,
      setIsMicEnabled,
      setSelectedMicDeviceId,
      setMicDevices,
      setPermissionsStatus,
      scene,
      updateRate,
      mediaDevicesManager
    ]
  );

  const toggleMute = useCallback(
    () => {
      if (mediaDevicesManager.isMicShared) {
        APP.dialog.toggleMicrophone();
      } else {
        mediaDevicesManager.startMicShare({ unmute: true });
      }
    },
    [mediaDevicesManager]
  );

  const micDeviceChanged = useCallback(
    deviceId => {
      setSelectedMicDeviceId(deviceId);
      setMicDevices(mediaDevicesManager.micDevices);
      mediaDevicesManager.startMicShare({ deviceId });
    },
    [mediaDevicesManager]
  );

  return {
    isMicMuted,
    micVolume,
    toggleMute,
    isMicEnabled,
    permissionStatus,
    micDeviceChanged,
    selectedMicDeviceId,
    micDevices
  };
}
