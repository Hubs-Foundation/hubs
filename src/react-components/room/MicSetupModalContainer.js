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
  const { micDeviceChanged, micDevices } = useMicrophone(scene);
  const { speakerDeviceChanged, speakerDevices } = useSpeakers();
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
