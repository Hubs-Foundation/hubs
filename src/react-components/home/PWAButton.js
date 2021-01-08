import React from "react";
import { FormattedMessage } from "react-intl";
import { ReactComponent as AddIcon } from "../icons/Add.svg";
import { IconButton } from "../input/IconButton";
import checkIsMobile from "../../utils/is-mobile";
import { useInstallPWA } from "./useInstallPWA";

const isMobile = checkIsMobile();

export function PWAButton() {
  const [pwaAvailable, installPWA] = useInstallPWA();

  return (
    <>
      {pwaAvailable && (
        <IconButton lg onClick={installPWA}>
          <AddIcon />
          {isMobile ? (
            <FormattedMessage id="pwa-button.mobile" defaultMessage="Add to Home Screen" />
          ) : (
            <FormattedMessage id="pwa-button.desktop" defaultMessage="Install Desktop App" />
          )}
        </IconButton>
      )}
    </>
  );
}
