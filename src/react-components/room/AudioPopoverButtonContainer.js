import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverButton } from "./AudioPopoverButton";
import { useMicrophoneStatus } from "./useMicrophoneStatus";
import { ToolbarMicButton } from "../input/ToolbarMicButton";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { FormattedMessage } from "react-intl";
import { usePermission } from "./usePermission";

export const AudioPopoverButtonContainer = ({ scene, initiallyVisible, content }) => {
  const { isMicMuted, toggleMute, isMicEnabled } = useMicrophoneStatus(scene);
  const { canDo: canVoiceChat } = usePermission("voice_chat");
  return (
    <AudioPopoverButton
      initiallyVisible={initiallyVisible}
      content={content}
      micButton={
        <ToolbarMicButton
          scene={scene}
          icon={isMicMuted || !isMicEnabled || !canVoiceChat ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
          label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
          preset="basic"
          onClick={toggleMute}
          statusColor={isMicMuted || !isMicEnabled || !canVoiceChat ? "disabled" : "enabled"}
          type={"right"}
          disabled={!canVoiceChat}
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
