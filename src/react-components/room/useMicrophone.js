import { useState, useEffect, useRef, useCallback } from "react";
import MovingAverage from "moving-average";
import { MediaDevices, MediaDevicesEvents } from "../../utils/media-devices-utils";
import { useVolumeMeter } from "../misc/useVolumeMeter";

export function useMicrophone(scene, updateRate = 50) {
  const audioSystem = scene.systems["hubs-systems"].audioSystem;
  const mediaDevicesManager = window.APP.mediaDevicesManager;
  const movingAvgRef = useRef();
  const [isMicMuted, setIsMicMuted] = useState(!mediaDevicesManager.isMicEnabled);
  const [isMicEnabled, setIsMicEnabled] = useState(window.APP.mediaDevicesManager.isMicShared);
  const [permissionStatus, setPermissionsStatus] = useState(
    mediaDevicesManager.getPermissionsStatus(MediaDevices.MICROPHONE)
  );
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState(mediaDevicesManager.selectedMicDeviceId);
  const [micDevices, setMicDevices] = useState(mediaDevicesManager.micDevices);
  const { volume } = useVolumeMeter({
    analyser: audioSystem.outboundAnalyser,
    updateRate
  });

  useEffect(
    () => {
      if (!movingAvgRef.current) {
        movingAvgRef.current = MovingAverage(updateRate * 2);
      }

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
        APP.dialog.off("mic-state-changed", onMicMutedStateChanged);
        scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, onMicDisabled);
        scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_STARTED, onMicEnabled);
        mediaDevicesManager.off(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);
        mediaDevicesManager.off(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);
      };
    },
    [
      setIsMicMuted,
      setIsMicEnabled,
      setSelectedMicDeviceId,
      setMicDevices,
      setPermissionsStatus,
      scene,
      updateRate,
      mediaDevicesManager,
      volume
    ]
  );

  const toggleMute = useCallback(
    () => {
      if (mediaDevicesManager.isMicShared) {
        mediaDevicesManager.toggleMic();
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
    micVolume: volume,
    toggleMute,
    isMicEnabled,
    permissionStatus,
    micDeviceChanged,
    selectedMicDeviceId,
    micDevices
  };
}
