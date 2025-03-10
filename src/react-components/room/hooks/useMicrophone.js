import { useState, useEffect, useCallback } from "react";
import { MediaDevices, MediaDevicesEvents } from "../../../utils/media-devices-utils";

export function useMicrophone(scene) {
  const mediaDevicesManager = APP.mediaDevicesManager;
  const [micDevices, setMicDevices] = useState({
    value: mediaDevicesManager.selectedMicDeviceId,
    options: mediaDevicesManager.micDevicesOptions
  });

  useEffect(() => {
    const onMicEnabled = () => {
      setMicDevices({
        value: mediaDevicesManager.selectedMicDeviceId,
        options: mediaDevicesManager.micDevicesOptions
      });
    };
    const onMicDisabled = () => {
      setMicDevices({
        value: mediaDevicesManager.selectedMicDeviceId,
        options: mediaDevicesManager.micDevicesOptions
      });
    };
    scene.addEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, onMicDisabled);
    scene.addEventListener(MediaDevicesEvents.MIC_SHARE_STARTED, onMicEnabled);

    const onPermissionsChanged = ({ mediaDevice }) => {
      if (mediaDevice === MediaDevices.MICROPHONE) {
        setMicDevices({
          value: mediaDevicesManager.selectedMicDeviceId,
          options: mediaDevicesManager.micDevicesOptions
        });
      }
    };
    mediaDevicesManager.on(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);

    const onDeviceChange = () => {
      setMicDevices({
        value: mediaDevicesManager.selectedMicDeviceId,
        options: mediaDevicesManager.micDevicesOptions
      });
    };
    mediaDevicesManager.on(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);

    setMicDevices({
      value: mediaDevicesManager.selectedMicDeviceId,
      options: mediaDevicesManager.micDevicesOptions
    });

    return () => {
      scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, onMicDisabled);
      scene.removeEventListener(MediaDevicesEvents.MIC_SHARE_STARTED, onMicEnabled);
      mediaDevicesManager.off(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);
      mediaDevicesManager.off(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);
    };
  }, [setMicDevices, scene, mediaDevicesManager]);

  const micDeviceChanged = useCallback(
    deviceId => {
      setMicDevices({
        value: mediaDevicesManager.selectedMicDeviceId,
        options: mediaDevicesManager.micDevicesOptions
      });
      mediaDevicesManager.startMicShare({ deviceId });
    },
    [mediaDevicesManager]
  );

  return {
    micDeviceChanged,
    micDevices
  };
}
