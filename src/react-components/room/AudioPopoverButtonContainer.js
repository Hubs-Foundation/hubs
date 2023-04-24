import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverButton } from "./AudioPopoverButton";
import { useMicrophoneStatus } from "./hooks/useMicrophoneStatus";
import { ToolbarMicButton } from "../input/ToolbarMicButton";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { FormattedMessage } from "react-intl";
import { useCan } from "./hooks/useCan";
import { PermissionStatus } from "../../utils/media-devices-utils";
import { AudioPopoverContentContainer } from "./AudioPopoverContentContainer";

export const AudioPopoverButtonContainer = ({ scene, initiallyVisible, content }) => {
  const { isMicMuted, toggleMute, permissionStatus } = useMicrophoneStatus(scene);
  const micPermissionDenied = permissionStatus === PermissionStatus.DENIED;
  const canVoiceChat = useCan("voice_chat");

  return (
    <AudioPopoverButton
      initiallyVisible={initiallyVisible}
      content={<AudioPopoverContentContainer scene={scene} />}
      micButton={
        <ToolbarMicButton
          scene={scene}
          icon={isMicMuted || !canVoiceChat || micPermissionDenied ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
          label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
          preset="basic"
          onClick={toggleMute}
          statusColor={!micPermissionDenied && canVoiceChat ? (isMicMuted ? "disabled" : "enabled") : undefined}
          type={"right"}
          disabled={!canVoiceChat || micPermissionDenied}
        />
      }
      onChangeMicrophoneMuted={toggleMute}
    />
  );
};

AudioPopoverButtonContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  initiallyVisible: PropTypes.bool,
  content: PropTypes.element
};
