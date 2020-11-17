import React, { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { TwitterOAuthModal } from "./TwitterOAuthModal";

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

        const popup = window.open(
          url,
          "_blank",
          `resizable=yes,width=${width},height=${height},left=${left},top=${top}toolbar=no,titlebar=no,menubar=no,scrollbars=yes`
        );

        window.doingTwitterOAuth = true;

        popup.addEventListener("message", () => {
          popup.close();
          onConnected();
        });

        popup.focus();
        popupRef.current = popup;

        window.popup = popup;
      } catch (error) {
        console.error(error);
      }
    },
    [hubChannel, onConnected]
  );

  useEffect(() => {
    return () => {
      if (popupRef.current) {
        popupRef.current.close();
      }

      delete window.doingTwitterOAuth;
    };
  }, []);

  return <TwitterOAuthModal onConnect={onConnect} onClose={onClose} />;
}

TwitterOAuthModalContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  onConnected: PropTypes.func.isRequired,
  onClose: PropTypes.func
};
