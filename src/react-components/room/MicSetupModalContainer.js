import React from "react";
import PropTypes from "prop-types";
import { MicSetupModal } from "./MicSetupModal";
import { useMicrophone } from "./useMicrophone";
import { useSound } from "./useSound";
import { SOUND_SPEAKER_TONE } from "../../systems/sound-effects-system";
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
  const { playSound, soundVolume } = useSound({
    scene,
    sound: SOUND_SPEAKER_TONE
  });

  return (
    <MicSetupModal
      micLevel={micVolume}
      speakerLevel={soundVolume}
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
