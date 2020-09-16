import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { EnterOnDeviceModal } from "./EnterOnDeviceModal";

export function EnterOnDeviceUI({ linkChannel, onBack, onEnter }) {
  const [{ loading, code }, setState] = useState({ loading: true, code: null });

  useEffect(
    () => {
      let disconnect;

      linkChannel.generateCode().then(({ code, cancel, onFinished }) => {
        disconnect = cancel;

        setState({ loading: false, code });

        onFinished().then(() => {
          onEnter();
        });
      });

      return () => {
        disconnect();
      };
    },
    [setState, onEnter, linkChannel]
  );

  return <EnterOnDeviceModal shortUrl={configs.SHORTLINK_DOMAIN} loadingCode={loading} code={code} onBack={onBack} />;
}

EnterOnDeviceUI.propTypes = {
  linkChannel: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onEnter: PropTypes.func.isRequired
};
