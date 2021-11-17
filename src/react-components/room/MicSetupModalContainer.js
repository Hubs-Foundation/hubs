import React from "react";
import PropTypes from "prop-types";
import { MicSetupModal } from "./MicSetupModal";
import { useMicrophone } from "./useMicrophone";
import { useSound } from "./useSound";
import webmSrc from "../../assets/sfx/tone.webm";
import mp3Src from "../../assets/sfx/tone.mp3";
import oggSrc from "../../assets/sfx/tone.ogg";
import wavSrc from "../../assets/sfx/tone.wav";

export function MicSetupModalContainer({ scene, ...rest }) {
  const { micMutedOnEntry } = rest;
  const { micVolume, isMicEnabled, onEnableMicrophone } = useMicrophone(scene);
  const [soundPlaying, playSound, soundVolume] = useSound({ scene, webmSrc, mp3Src, oggSrc, wavSrc });

  return (
    <MicSetupModal
      micLevel={micVolume}
      speakerLevel={soundVolume}
      soundPlaying={soundPlaying}
      onPlaySound={playSound}
      microphoneEnabled={isMicEnabled}
      microphoneMuted={micMutedOnEntry}
      onEnableMicrophone={onEnableMicrophone}
      {...rest}
    />
  );
}

MicSetupModalContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
