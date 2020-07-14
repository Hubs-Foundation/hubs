import React from "react";
import { FormattedMessage } from "react-intl";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../input/Button";
import checkIsMobile from "../../utils/is-mobile";
import { useInstallPWA } from "./useInstallPWA";

const isMobile = checkIsMobile();

export function PWAButton() {
  const [pwaAvailable, installPWA] = useInstallPWA();

  return (
    <>
      {pwaAvailable && (
        <Button secondary onClick={installPWA}>
          <i>
            <FontAwesomeIcon icon={faPlus} />
          </i>
          <FormattedMessage id={`home.${isMobile ? "mobile" : "desktop"}.add_pwa`} />
        </Button>
      )}
    </>
  );
}
