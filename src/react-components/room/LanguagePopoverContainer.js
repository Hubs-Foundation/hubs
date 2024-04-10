import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ReactComponent as Dutch } from "../icons/nl.svg";
import { ReactComponent as German } from "../icons/de.svg";
import { ReactComponent as English } from "../icons/en.svg";
import { ReactComponent as Greek } from "../icons/gr.svg";
import { ReactComponent as Italian } from "../icons/it.svg";
import { ReactComponent as Spanish } from "../icons/es.svg";
import { FormattedMessage } from "react-intl";
import { LanguagePopover } from "./LanguagePopover";
import { translationSystem } from "../../bit-systems/translation-system";

function useTranslate(scene) {
  const [language, setLanguage] = useState(translationSystem.mylanguage);

  useEffect(() => {
    const onLanguageUpdate = event => {
      setLanguage(event.detail.language);
    };

    scene.addEventListener("language_updated", onLanguageUpdate);
    return () => {
      scene.removeEventListener("language_updated", onLanguageUpdate);
    };
  }, [scene, language]);

  const togglePanel = useCallback(() => {
    scene.emit("lang-toggle");
  });

  return {
    language,
    togglePanel
  };
}

export function LanguagePopoverContainer({ scene }) {
  const { language, togglePanel } = useTranslate(scene);

  const items = [
    {
      id: "nl",
      icon: Dutch,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.nl" defaultMessage="Dutch" />,
      onSelect: togglePanel,
      active: language === "dutch"
    },
    {
      id: "de",
      icon: German,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.de" defaultMessage="German" />,
      onSelect: togglePanel,
      active: language === "german"
    },
    {
      id: "el",
      icon: Greek,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.gr" defaultMessage="Greek" />,
      onSelect: togglePanel,
      active: language === "greek"
    },
    {
      id: "it",
      icon: Italian,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.it" defaultMessage="Italian" />,
      onSelect: togglePanel,
      active: language === "italian"
    },
    {
      id: "en",
      icon: English,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.en" defaultMessage="English" />,
      onSelect: togglePanel,
      active: language === "english"
    },
    {
      id: "es",
      icon: Spanish,
      color: "accent5",
      label: <FormattedMessage id="translate-popover.lang.es" defaultMessage="Spanish" />,
      onSelect: togglePanel,
      active: language === "spanish"
    }
  ];

  return <LanguagePopover items={items} />;
}
