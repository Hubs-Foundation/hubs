import { useState, useEffect, useCallback } from "react";
import { translationSystem } from "../../../bit-systems/translation-system";
import { setLocale } from "../../../utils/i18n";

export function useLanguage(scene) {
  const [languages, SetLanguage] = useState({
    value: translationSystem.SelectedLanguage,
    options: translationSystem.AvailableLanguage
  });

  useEffect(() => {
    const onLanguageUpdated = _ => {
      SetLanguage({
        value: translationSystem.SelectedLanguage,
        options: translationSystem.AvailableLanguage
      });
    };

    scene.addEventListener("language_updated", onLanguageUpdated);

    return () => {
      scene.removeEventListener("language_updated", onLanguageUpdated);
    };
  }, [SetLanguage, scene, translationSystem]);

  const languageChanged = useCallback(
    language => {
      translationSystem.updateMyLanguage(language);
    },
    [translationSystem]
  );

  return {
    languageChanged,
    languages: languages
  };
}
