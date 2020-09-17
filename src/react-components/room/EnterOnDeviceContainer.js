import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { EnterOnDeviceModal } from "./EnterOnDeviceModal";
import { getAvailableVREntryTypes, VR_DEVICE_AVAILABILITY } from "../../utils/vr-caps-detect";

export function EnterOnDeviceContainer({ linkChannel, onBack, onConnectedOnDevice, onEnterOnConnectedHeadset }) {
  const [{ loading, code, headsetConnected, unsupportedBrowser }, setState] = useState({ loading: true, code: null });

  useEffect(
    () => {
      let disconnect;

      Promise.all([linkChannel.generateCode(), getAvailableVREntryTypes()]).then(
        ([{ code, cancel, onFinished }, devices]) => {
          disconnect = cancel;

          setState({
            loading: false,
            code,
            headsetConnected: devices.generic !== VR_DEVICE_AVAILABILITY.no,
            unsupportedBrowser: devices.generic === VR_DEVICE_AVAILABILITY.maybe
          });

          // Wait for user to join the room on the other device.
          onFinished().then(() => {
            onConnectedOnDevice();
          });
        }
      );

      return () => {
        disconnect();
      };
    },
    [setState, onConnectedOnDevice, linkChannel]
  );

  return (
    <EnterOnDeviceModal
      shortUrl={configs.SHORTLINK_DOMAIN}
      headsetConnected={headsetConnected}
      unsupportedBrowser={unsupportedBrowser}
      loadingCode={loading}
      code={code}
      onEnterOnConnectedHeadset={onEnterOnConnectedHeadset}
      onBack={onBack}
    />
  );
}

EnterOnDeviceContainer.propTypes = {
  linkChannel: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onConnectedOnDevice: PropTypes.func.isRequired,
  onEnterOnConnectedHeadset: PropTypes.func.isRequired
};
