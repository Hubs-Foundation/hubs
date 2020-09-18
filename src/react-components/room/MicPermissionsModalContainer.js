import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { MicPermissionsModal } from "./MicPermissionsModal";

export function MicPermissionsModalContainer({
  store,
  isFirefoxReality,
  onMicrophoneAccessGranted,
  onMicrophoneAccessDenied,
  ...rest
}) {
  const [errorMessage, setErrorMessage] = useState();

  useEffect(
    () => {
      const { lastUsedMicDeviceId } = store.state.settings;

      const constraints = { audio: {} };

      // Try to fetch last used mic, if there was one.
      if (lastUsedMicDeviceId) {
        constraints.audio.deviceId = { ideal: lastUsedMicDeviceId };
      }

      constraints.audio.echoCancellation = store.state.preferences.disableEchoCancellation === true ? false : true;
      constraints.audio.noiseSuppression = store.state.preferences.disableNoiseSuppression === true ? false : true;
      constraints.audio.autoGainControl = store.state.preferences.disableAutoGainControl === true ? false : true;

      if (isFirefoxReality) {
        // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1626081
        // TODO: Looks like this issue is resolved so we can probably remove this.
        constraints.audio.echoCancellation = store.state.preferences.disableEchoCancellation === false ? true : false;
        constraints.audio.noiseSuppression = store.state.preferences.disableNoiseSuppression === false ? true : false;
        constraints.audio.autoGainControl = store.state.preferences.disableAutoGainControl === false ? true : false;

        store.update({
          preferences: {
            disableEchoCancellation: !constraints.audio.echoCancellation,
            disableNoiseSuppression: !constraints.audio.noiseSuppression,
            disableAutoGainControl: !constraints.audio.autoGainControl
          }
        });
      }

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(onMicrophoneAccessGranted)
        .catch(error => {
          console.error(error);

          if (error.name === "NotAllowedError") {
            setErrorMessage("Microphone access is not allowed.");
          } else if (error.name === "NotFoundError") {
            setErrorMessage(
              "A microphone device was requested but was not found. Plug in your microphone or re-enable it and refresh the page."
            );
          } else if (error.name === "NotReadableError") {
            setErrorMessage(
              "Another application is currently using your microphone. Close this application and refresh the page."
            );
          } else {
            // TODO: Add sentry error logging here.
            setErrorMessage("An unknown error occurred while trying to request microphone permissions.");
          }
        });
    },
    [isFirefoxReality, store, setErrorMessage, onMicrophoneAccessGranted]
  );

  return <MicPermissionsModal error={errorMessage} errorButtonLabel="Help" {...rest} />;
}

MicPermissionsModalContainer.propTypes = {
  store: PropTypes.object.isRequired,
  isFirefoxReality: PropTypes.bool,
  onMicrophoneAccessGranted: PropTypes.func.isRequired,
  onMicrophoneAccessDenied: PropTypes.func.isRequired
};
