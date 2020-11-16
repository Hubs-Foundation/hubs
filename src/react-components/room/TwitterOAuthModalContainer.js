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

        const popupWidth = 600;
        const popupHeight = 400;
        const screenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        const screenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

        const width = window.innerWidth
          ? window.innerWidth
          : document.documentElement.clientWidth
            ? document.documentElement.clientWidth
            : screen.width;
        const height = window.innerHeight
          ? window.innerHeight
          : document.documentElement.clientHeight
            ? document.documentElement.clientHeight
            : screen.height;

        const systemZoom = width / window.screen.availWidth;
        const left = (width - popupWidth) / 2 / systemZoom + screenLeft;
        const top = (height - popupHeight) / 2 / systemZoom + screenTop;

        const popup = window.open(
          url,
          "_blank",
          `resizable=yes,width=${popupWidth},height=${popupHeight},left=${left},top=${top}toolbar=no,titlebar=no,menubar=no,scrollbars=yes`
        );

        popup.addEventListener("message", () => {
          popup.close();
          onConnected();
        });

        popup.focus();
        popupRef.current = popup;
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
    };
  }, []);

  return <TwitterOAuthModal onConnect={onConnect} onClose={onClose} />;
}

TwitterOAuthModalContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  onConnected: PropTypes.func.isRequired,
  onClose: PropTypes.func
};
