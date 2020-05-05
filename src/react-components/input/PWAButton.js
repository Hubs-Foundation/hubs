import React, { useEffect, useCallback, useState, useRef } from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./Button.scss";
import checkIsMobile from "../../utils/is-mobile";

const isMobile = checkIsMobile();

export function PWAButton() {
  const installEventRef = useRef();

  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = event => {
      event.preventDefault();
      installEventRef.current = event;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const onInstallPWA = useCallback(async () => {
    installEventRef.current.prompt();

    const choiceResult = await installEventRef.current.userChoice;

    if (choiceResult.outcome === "accepted") {
      setInstalled(true);
    }
  }, []);

  return (
    <button
      className={classNames(styles.secondaryButton)}
      style={installEventRef.current || installed ? {} : { visibility: "hidden" }}
      onClick={onInstallPWA}
    >
      <i>
        <FontAwesomeIcon icon={faPlus} />
      </i>
      <FormattedMessage id={`home.${isMobile ? "mobile" : "desktop"}.add_pwa`} />
    </button>
  );
}
