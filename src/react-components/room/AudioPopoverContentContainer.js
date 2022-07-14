import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverContent } from "./AudioPopoverContent";
import { useMicrophone } from "./useMicrophone";
import { useSpeakers } from "./useSpeakers";
import { useSound } from "./useSound";
import { SOUND_SPEAKER_TONE } from "../../systems/sound-effects-system";
import { useVolumeMeter } from "../misc/useVolumeMeter";
import { useMicrophoneStatus } from "./useMicrophoneStatus";

export const AudioPopoverContentContainer = ({ scene }) => {
  const { isMicMuted, toggleMute, isMicEnabled } = useMicrophoneStatus(scene);
  const { micDeviceChanged, micDevices } = useMicrophone(scene);
  const { volume: micVolume } = useVolumeMeter({
    analyser: scene.systems["hubs-systems"].audioSystem.outboundAnalyser
  });
  const { speakerDeviceChanged, speakerDevices } = useSpeakers();
  const { playSound, soundVolume } = useSound({
    scene,
    sound: SOUND_SPEAKER_TONE
  });
  return (
    <AudioPopoverContent
      micLevel={micVolume}
      microphoneOptions={micDevices}
      onChangeMicrophone={micDeviceChanged}
      isMicrophoneEnabled={isMicEnabled}
      isMicrophoneMuted={isMicMuted}
      onChangeMicrophoneMuted={toggleMute}
      speakerOptions={speakerDevices}
      onChangeSpeaker={speakerDeviceChanged}
      speakerLevel={soundVolume}
      onPlaySound={playSound}
    />
  );
};

AudioPopoverContentContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
