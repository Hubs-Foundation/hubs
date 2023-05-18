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
import MediaDevicesManager from "../../utils/media-devices-manager";
import { VolumeLevelBar } from "../misc/VolumeLevelBar";
import styles from "./MicSetupModal.scss";
import { useCan } from "./hooks/useCan";

export function MicSetupModalContainer({ scene, ...rest }) {
  const { isMicEnabled, permissionStatus } = useMicrophoneStatus(scene);
  const { micDeviceChanged, micDevices } = useMicrophone(scene);
  const canVoiceChat = useCan("voice_chat");
  const { speakerDeviceChanged, speakerDevices } = useSpeakers();
  const { playSound } = useSound({
    scene,
    sound: SOUND_SPEAKER_TONE
  });
  const [isMicMutedOnEntry, setIsMicMutedOnEntry] = useState(APP.store.state.preferences["muteMicOnEntry"]);
  const onChangeMicrophoneMuted = useCallback(({ target: { checked: muted } }) => {
    setIsMicMutedOnEntry(muted);
    APP.store.update({
      preferences: { muteMicOnEntry: muted }
    });
  }, []);

  return (
    <MicSetupModal
      micLevelBar={<VolumeLevelBar scene={scene} type="mic" className={styles.levelBar} />}
      speakerLevelBar={<VolumeLevelBar scene={scene} type="mixer" className={styles.levelBar} />}
      onPlaySound={playSound}
      isMicrophoneEnabled={isMicEnabled}
      isMicrophoneMuted={isMicMutedOnEntry}
      permissionStatus={permissionStatus}
      microphoneOptions={micDevices}
      speakerOptions={speakerDevices}
      onChangeMicrophone={micDeviceChanged}
      onChangeSpeaker={speakerDeviceChanged}
      onChangeMicrophoneMuted={onChangeMicrophoneMuted}
      isAudioInputSelectAvailable={MediaDevicesManager.isAudioInputSelectEnabled}
      isAudioOutputSelectAvailable={MediaDevicesManager.isAudioOutputSelectEnabled}
      canVoiceChat={canVoiceChat}
      {...rest}
    />
  );
}

MicSetupModalContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
