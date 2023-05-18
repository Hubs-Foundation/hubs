import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverContent } from "./AudioPopoverContent";
import { useMicrophone } from "./hooks/useMicrophone";
import { useSpeakers } from "./hooks/useSpeakers";
import { useSound } from "./hooks/useSound";
import { SOUND_SPEAKER_TONE } from "../../systems/sound-effects-system";
import { useMicrophoneStatus } from "./hooks/useMicrophoneStatus";
import MediaDevicesManager from "../../utils/media-devices-manager";
import { VolumeLevelBar } from "../misc/VolumeLevelBar";
import styles from "./AudioPopover.scss";
import { useCan } from "./hooks/useCan";

export const AudioPopoverContentContainer = ({ scene }) => {
  const { isMicMuted, toggleMute, isMicEnabled, permissionStatus } = useMicrophoneStatus(scene);
  const { micDeviceChanged, micDevices } = useMicrophone(scene);
  const canVoiceChat = useCan("voice_chat");
  const { speakerDeviceChanged, speakerDevices } = useSpeakers();
  const { playSound } = useSound({
    scene,
    sound: SOUND_SPEAKER_TONE
  });
  return (
    <AudioPopoverContent
      micLevelBar={<VolumeLevelBar scene={scene} type="mic" className={styles.levelBar} />}
      speakerLevelBar={<VolumeLevelBar scene={scene} type="mixer" className={styles.levelBar} />}
      microphoneOptions={micDevices}
      onChangeMicrophone={micDeviceChanged}
      isMicrophoneEnabled={isMicEnabled}
      isMicrophoneMuted={isMicMuted}
      onChangeMicrophoneMuted={toggleMute}
      speakerOptions={speakerDevices}
      onChangeSpeaker={speakerDeviceChanged}
      onPlaySound={playSound}
      isAudioInputSelectAvailable={MediaDevicesManager.isAudioInputSelectEnabled}
      isAudioOutputSelectAvailable={MediaDevicesManager.isAudioOutputSelectEnabled}
      canVoiceChat={canVoiceChat}
      permissionStatus={permissionStatus}
    />
  );
};

AudioPopoverContentContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
