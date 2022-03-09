import React from "react";
import PropTypes from "prop-types";
import { MicSetupModal } from "./MicSetupModal";
import { useMicrophoneStatus } from "./useMicrophoneStatus";
import { useMicrophone } from "./useMicrophone";
import { useSound } from "./useSound";
import { SOUND_SPEAKER_TONE } from "../../systems/sound-effects-system";
import { useSpeakers } from "./useSpeakers";
import { useCallback } from "react";
import { useVolumeMeter } from "../misc/useVolumeMeter";

export function MicSetupModalContainer({ scene, ...rest }) {
  const { volume: micVolume } = useVolumeMeter({
    analyser: scene.systems["hubs-systems"].audioSystem.outboundAnalyser
  });
  const { onMicMuted } = rest;
  const { isMicEnabled, isMicMuted, toggleMute, permissionStatus } = useMicrophoneStatus(scene);
  const { micDeviceChanged, selectedMicDeviceId, micDevices } = useMicrophone(scene);
  const { speakerDeviceChanged, selectedSpeakersDeviceId, speakerDevices } = useSpeakers(scene);
  const { playSound, soundVolume } = useSound({
    scene,
    sound: SOUND_SPEAKER_TONE
  });
  const onChangeMicrophoneMuted = useCallback(
    () => {
      toggleMute();
      onMicMuted();
    },
    [toggleMute, onMicMuted]
  );

  return (
    <MicSetupModal
      micLevel={micVolume}
      speakerLevel={soundVolume}
      onPlaySound={playSound}
      isMicrophoneEnabled={isMicEnabled}
      isMicrophoneMuted={isMicMuted}
      permissionStatus={permissionStatus}
      selectedMicrophone={selectedMicDeviceId}
      selectedSpeaker={selectedSpeakersDeviceId}
      microphoneOptions={micDevices}
      speakerOptions={speakerDevices}
      onChangeMicrophone={micDeviceChanged}
      onChangeSpeaker={speakerDeviceChanged}
      onChangeMicrophoneMuted={onChangeMicrophoneMuted}
      {...rest}
    />
  );
}

MicSetupModalContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
