import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ReactComponent as Dutch } from "../icons/nl.svg";
import { ReactComponent as German } from "../icons/de.svg";
import { ReactComponent as English } from "../icons/en.svg";
import { ReactComponent as Greek } from "../icons/gr.svg";
import { ReactComponent as Italian } from "../icons/it.svg";
import { ReactComponent as Spanish } from "../icons/es.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { SharePopoverButton } from "./SharePopover";
import { FormattedMessage } from "react-intl";
import useAvatar from "./hooks/useAvatar";
import { MediaDevicesEvents, MediaDevices } from "../../utils/media-devices-utils";
import { TranslatePopover } from "./TranslatePopover";

function useTranslate(scene) {
  const [language, setLanguage] = useState(null);

  useEffect(() => {
    const onLanguageUpdate = event => {
      setLanguage(event.detail.language);
    };

    scene.addEventListener("language_updated", onLanguageUpdate);
    return () => {
      scene.removeEventListener("language_updated", onLanguageUpdate);
    };
  }, [scene, language]);

  const toggleDutch = useCallback(() => {
    if (language === "du") {
      scene.emit("language_available", { language: null });
    } else {
      scene.emit("language_available", { language: "nl" });
    }
  });
  const toggleGerman = useCallback(() => {
    if (language === "de") {
      scene.emit("language_available", { language: null });
    } else {
      scene.emit("language_available", { language: "de" });
    }
  });
  const toggleGreek = useCallback(() => {
    if (language === "el") {
      scene.emit("language_available", { language: null });
    } else {
      scene.emit("language_available", { language: "el" });
    }
  });
  const toggleItalian = useCallback(() => {
    if (language === "it") {
      scene.emit("language_available", { language: null });
    } else {
      scene.emit("language_available", { language: "it" });
    }
  });
  const toggleSpanish = useCallback(() => {
    if (language === "es") {
      scene.emit("language_available", { language: null });
    } else {
      scene.emit("language_available", { language: "es" });
    }
  });

  const toggleEnglish = useCallback(() => {
    if (language === "en") {
      scene.emit("language_available", { language: null });
    } else {
      scene.emit("language_available", { language: "en" });
    }
  });

  return {
    language,
    toggleDutch,
    toggleGerman,
    toggleGreek,
    toggleItalian,
    toggleSpanish,
    toggleEnglish
  };
}

export function TranslatePopoverContainer({ scene }) {
  const { language, toggleDutch, toggleGerman, toggleGreek, toggleItalian, toggleSpanish, toggleEnglish } =
    useTranslate(scene);

  const items = [
    {
      id: "nl",
      icon: Dutch,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.nl" defaultMessage="Dutch" />,
      onSelect: toggleDutch,
      active: language === "nl"
    },
    {
      id: "de",
      icon: German,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.de" defaultMessage="German" />,
      onSelect: toggleGerman,
      active: language === "de"
    },
    {
      id: "el",
      icon: Greek,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.gr" defaultMessage="Greek" />,
      onSelect: toggleGreek,
      active: language === "el"
    },
    {
      id: "it",
      icon: Italian,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.it" defaultMessage="Italian" />,
      onSelect: toggleItalian,
      active: language === "it"
    },
    {
      id: "en",
      icon: English,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.en" defaultMessage="English" />,
      onSelect: toggleEnglish,
      active: language === "en"
    },
    {
      id: "es",
      icon: Spanish,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.es" defaultMessage="Spanish" />,
      onSelect: toggleSpanish,
      active: language === "es"
    }
  ];

  return <TranslatePopover items={items} />;
}
