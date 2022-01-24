import { useState, useEffect, useCallback } from "react";
import { MediaDevices, MediaDevicesEvents } from "../../utils/media-devices-utils";

export function useMicrophone(scene) {
  const mediaDevicesManager = window.APP.mediaDevicesManager;
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState(mediaDevicesManager.selectedMicDeviceId);
  const [micDevices, setMicDevices] = useState(mediaDevicesManager.micDevices);

  useEffect(
    () => {
      const onMicEnabled = () => {
        setSelectedMicDeviceId(mediaDevicesManager.selectedMicDeviceId);
        setMicDevices(mediaDevicesManager.micDevices);
      };
      const onMicDisabled = () => {
        setSelectedMicDeviceId(mediaDevicesManager.selectedMicDeviceId);
        setMicDevices(mediaDevicesManager.micDevices);
      };
      scene.addEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, onMicDisabled);
      scene.addEventListener(MediaDevicesEvents.MIC_SHARE_STARTED, onMicEnabled);

      const onPermissionsChanged = ({ mediaDevice }) => {
        if (mediaDevice === MediaDevices.MICROPHONE) {
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
        scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, onMicDisabled);
        scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_STARTED, onMicEnabled);
        mediaDevicesManager.off(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);
        mediaDevicesManager.off(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);
      };
    },
    [setSelectedMicDeviceId, setMicDevices, scene, mediaDevicesManager]
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
    micDeviceChanged,
    selectedMicDeviceId,
    micDevices
  };
}
