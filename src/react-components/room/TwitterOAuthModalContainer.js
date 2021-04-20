import React, { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { TwitterOAuthModal } from "./TwitterOAuthModal";
import configs from "../../utils/configs";

export function TwitterOAuthModalContainer({ hubChannel, onConnected, onClose }) {
  const popupRef = useRef();

  const onConnect = useCallback(
    async () => {
      try {
        if (popupRef.current) {
          popupRef.current.close();
        }

        const url = await hubChannel.getTwitterOAuthURL();

        const width = 600;
        const height = 760;
        const left = (window.innerWidth - width) / 2 + window.screenLeft;
        const top = (window.innerHeight - height) / 2 + window.screenTop;

        window.doingTwitterOAuth = true;

        const popup = window.open(
          url,
          "_blank",
          `resizable=yes,width=${width},height=${height},left=${left},top=${top}toolbar=no,titlebar=no,menubar=no,scrollbars=yes`
        );
        popup.focus();
        popupRef.current = popup;
      } catch (error) {
        console.error(error);
      }
    },
    [hubChannel]
  );

  useEffect(
    () => {
      function onMessage({ data }) {
        if (data === "oauth-successful") {
          onConnected();
          popupRef.current.close();
          popupRef.current = null;
          delete window.doingTwitterOAuth;
          window.removeEventListener("message", onMessage);
        }
      }

      window.addEventListener("message", onMessage);

      return () => {
        if (popupRef.current) {
          popupRef.current.close();
        }

        delete window.doingTwitterOAuth;
        window.removeEventListener("message", onMessage);
      };
    },
    [onConnected]
  );

  return <TwitterOAuthModal appName={configs.translation("app-name")} onConnect={onConnect} onClose={onClose} />;
}

TwitterOAuthModalContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  onConnected: PropTypes.func.isRequired,
  onClose: PropTypes.func
};
