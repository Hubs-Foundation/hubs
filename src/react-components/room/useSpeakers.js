import { useState, useEffect, useCallback } from "react";
import { MediaDevices, MediaDevicesEvents } from "../../utils/media-devices-utils";

export function useSpeakers() {
  const mediaDevicesManager = window.APP.mediaDevicesManager;
  const [selectedSpeakersDeviceId, setSelectedSpeakersDeviceId] = useState(
    mediaDevicesManager.selectedSpeakersDeviceId
  );
  const [speakerDevices, setSpeakerDevices] = useState(mediaDevicesManager.outputDevicesOptions);

  useEffect(
    () => {
      const onPermissionsChanged = ({ mediaDevice }) => {
        if (mediaDevice === MediaDevices.MICROPHONE) {
          setSelectedSpeakersDeviceId(mediaDevicesManager.selectedSpeakersDeviceId);
          setSpeakerDevices(mediaDevicesManager.outputDevicesOptions);
        }
      };
      mediaDevicesManager.on(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);

      const onDeviceChange = () => {
        setSelectedSpeakersDeviceId(mediaDevicesManager.selectedSpeakersDeviceId);
        setSpeakerDevices(mediaDevicesManager.outputDevicesOptions);
      };
      mediaDevicesManager.on(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);

      setSelectedSpeakersDeviceId(mediaDevicesManager.selectedSpeakersDeviceId);
      setSpeakerDevices(mediaDevicesManager.outputDevicesOptions);

      return () => {
        mediaDevicesManager.off(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, onPermissionsChanged);
        mediaDevicesManager.off(MediaDevicesEvents.DEVICE_CHANGE, onDeviceChange);
      };
    },
    [setSelectedSpeakersDeviceId, setSpeakerDevices, mediaDevicesManager]
  );

  const speakerDeviceChanged = useCallback(
    deviceId => {
      mediaDevicesManager.changeAudioOutput(deviceId);
      setSpeakerDevices(mediaDevicesManager.outputDevicesOptions);
      setSelectedSpeakersDeviceId(deviceId);
    },
    [mediaDevicesManager]
  );

  return {
    speakerDeviceChanged,
    selectedSpeakersDeviceId,
    speakerDevices
  };
}
