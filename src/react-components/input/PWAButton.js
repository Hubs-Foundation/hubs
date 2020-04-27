import React, { useEffect, useCallback, useState, useRef } from "react";

export function PWAButton() {
  const pwaInstallEventRef = useRef();
  const [pwaInstalled, setPWAInstalled] = useState();

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      pwaInstallEventRef.current = event;
    });
  }, []);

  const onInstallPWA = useCallback(() => {
    installEvent.prompt();

    installEvent.userChoice.then(choiceResult => {
      if (choiceResult.outcome === "accepted") {
        this.setState({ installed: true });
      }
    });
  });

  return (
    <button
      className={classNames(styles.secondaryButton)}
      style={onInstallPWA || pwaInstalled ? {} : { visibility: "hidden" }}
      onClick={onInstallPWA}
    >
      <i>
        <FontAwesomeIcon icon={faPlus} />
      </i>
      <FormattedMessage id={`home.${isMobile ? "mobile" : "desktop"}.add_pwa`} />
    </button>
  );
}
