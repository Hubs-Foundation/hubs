export const MediaDevicesEvents = Object.freeze({
  PERMISSIONS_STATUS_CHANGED: "permissions_status_changed",
  MIC_SHARE_STARTED: "mic_share_started",
  MIC_SHARE_ENDED: "mic_share_ended",
  VIDEO_SHARE_STARTED: "video_share_started",
  VIDEO_SHARE_ENDED: "video_share_ended",
  DEVICE_CHANGE: "devicechange"
});

export const PermissionStatus = Object.freeze({
  GRANTED: "granted",
  DENIED: "denied",
  PROMPT: "prompt"
});

export const MediaDevices = Object.freeze({
  MICROPHONE: "microphone",
  SPEAKERS: "speakers",
  CAMERA: "camera",
  SCREEN: "screen"
});

export const NO_DEVICE_ID = "none";

type MediaDeviceOption = {
  value: string;
  label: string;
};

const labelPrefix: Required<{ [K in MediaDeviceKind]: string }> = {
  audioinput: "Mic Device",
  videoinput: "Camera Device",
  audiooutput: "Audio Output"
};

function labelFor(device: MediaDeviceInfo) {
  return device.label || `${labelPrefix[device.kind]} ${device.deviceId.substring(0, 9)}`;
}

export function optionFor(device: MediaDeviceInfo): MediaDeviceOption {
  return {
    value: device.deviceId,
    label: labelFor(device)
  };
}

export async function getValidMediaDevices() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  // Some mediaDevices seem to be invalid. For example,
  // {
  //   deviceId : ""
  //   groupId : ""
  //   kind : "videoinput"
  //   label : ""
  // }
  // was returned when testing Chrome Version 111.0.5563.19 (Official Build) beta (64-bit)
  // Ignore these entries that lack a deviceId.
  // Also ignore default devices. Default devices are handled separately.
  return mediaDevices.filter(d => d.deviceId && d.deviceId !== "default");
}
