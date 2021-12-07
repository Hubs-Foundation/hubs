import React from "react";
import PropTypes from "prop-types";
import { MicSetupModal } from "./MicSetupModal";
import { useMicrophone } from "./useMicrophone";
import { useSound } from "./useSound";
import webmSrc from "../../assets/sfx/tone.webm";
import mp3Src from "../../assets/sfx/tone.mp3";
import oggSrc from "../../assets/sfx/tone.ogg";
import wavSrc from "../../assets/sfx/tone.wav";
import { useSpeakers } from "./useSpeakers";

export function MicSetupModalContainer({ scene, ...rest }) {
  const { micMutedOnEntry } = rest;
  const {
    micVolume,
    isMicEnabled,
    permissionStatus,
    micDeviceChanged,
    selectedMicDeviceId,
    micDevices
  } = useMicrophone(scene);
  const { speakerDeviceChanged, selectedSpeakersDeviceId, speakerDevices } = useSpeakers(scene);
  const [isSoundPlaying, playSound, soundVolume] = useSound({ scene, webmSrc, mp3Src, oggSrc, wavSrc });

  return (
    <MicSetupModal
      micLevel={micVolume}
      speakerLevel={soundVolume}
      isSoundPlaying={isSoundPlaying}
      onPlaySound={playSound}
      isMicrophoneEnabled={isMicEnabled}
      isMicrophoneMuted={micMutedOnEntry}
      permissionStatus={permissionStatus}
      selectedMicrophone={selectedMicDeviceId}
      selectedSpeaker={selectedSpeakersDeviceId}
      microphoneOptions={micDevices}
      speakerOptions={speakerDevices}
      onChangeMicrophone={micDeviceChanged}
      onChangeSpeaker={speakerDeviceChanged}
      {...rest}
    />
  );
}

MicSetupModalContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
