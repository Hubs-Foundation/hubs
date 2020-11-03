import { useEffect, useCallback, useState, useRef } from "react";

const browserSupport =
  "relList" in HTMLLinkElement.prototype &&
  document.createElement("link").relList.supports("manifest") &&
  "onbeforeinstallprompt" in window;

export function useInstallPWA() {
  const installEventRef = useRef();

  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = event => {
      event.preventDefault();
      installEventRef.current = event;
      setAvailable(true);
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

  return [browserSupport && available && !installed, installPWA];
}
