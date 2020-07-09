import React from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./Button.scss";
import checkIsMobile from "../../utils/is-mobile";
import { useInstallPWA } from "./useInstallPWA";

const isMobile = checkIsMobile();

export function PWAButton() {
  const [pwaAvailable, installPWA] = useInstallPWA();

  return (
    <>
      {pwaAvailable && (
        <button className={classNames(styles.secondaryButton)} onClick={installPWA}>
          <i>
            <FontAwesomeIcon icon={faPlus} />
          </i>
          <FormattedMessage id={`home.${isMobile ? "mobile" : "desktop"}.add_pwa`} />
        </button>
      )}
    </>
  );
}
