import React from "react";
import PropTypes from "prop-types";
import { MicSetupModal } from "./MicSetupModal";
import { useMicrophoneStatus } from "./hooks/useMicrophoneStatus";
import { useMicrophone } from "./hooks/useMicrophone";
import { useSound } from "./hooks/useSound";
import { SOUND_SPEAKER_TONE } from "../../systems/sound-effects-system";
import { useSpeakers } from "./hooks/useSpeakers";
import { useCallback } from "react";
import { useState } from "react";
import { VolumeLevelBar } from "../misc/VolumeLevelBar";
import styles from "./MicSetupModal.scss";
import { LanguageSetupModal } from "./LanguageSetupModal";
import { useLanguage } from "./hooks/useLanugage";

export function LanguageSetupModalContainer({ scene, ...rest }) {
  const { languageChanged, languages } = useLanguage(scene);

  return <LanguageSetupModal languageOptions={languages} onChangeLanguage={languageChanged} {...rest} />;
}

LanguageSetupModalContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
