import React, { useEffect, useCallback, useState, useRef } from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./Button.scss";
import checkIsMobile from "../../utils/is-mobile";

const isMobile = checkIsMobile();

const supported =
  "relList" in HTMLLinkElement.prototype &&
  document.createElement("link").relList.supports("manifest") &&
  "onbeforeinstallprompt" in window;

function useInstallPWA() {
  const installEventRef = useRef();

  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = event => {
      console.log("beforeinstallprompt", event);
      event.preventDefault();
      installEventRef.current = event;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const installPWA = useCallback(async () => {
    installEventRef.current.prompt();

    const choiceResult = await installEventRef.current.userChoice;

    if (choiceResult.outcome === "accepted") {
      setInstalled(true);
    }
  }, []);

  return { supported, installed, installPWA };
}

export function PWAButton() {
  const { supported, installed, installPWA } = useInstallPWA();

  return (
    <>
      {supported &&
        !installed && (
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
