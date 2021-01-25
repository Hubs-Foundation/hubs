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
  const { volume } = useMicrophone(scene);
  const [soundPlaying, playSound] = useSound({ webmSrc, mp3Src, oggSrc, wavSrc });
  return <MicSetupModal micLevel={volume} soundPlaying={soundPlaying} onPlaySound={playSound} {...rest} />;
}

MicSetupModalContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
