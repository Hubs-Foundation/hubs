import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverButton } from "./AudioPopoverButton";
import { useMicrophoneStatus } from "./hooks/useMicrophoneStatus";
import { ToolbarMicButton } from "../input/ToolbarMicButton";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { FormattedMessage, defineMessages, useIntl } from "react-intl";
import { useCan } from "./hooks/useCan";
import { PermissionStatus } from "../../utils/media-devices-utils";
import { AudioPopoverContentContainer } from "./AudioPopoverContentContainer";
import { ToolTip } from "@mozilla/lilypad-ui";

export const AudioPopoverButtonContainer = ({ scene, initiallyVisible }) => {
  const { isMicMuted, toggleMute, permissionStatus } = useMicrophoneStatus(scene);
  const micPermissionDenied = permissionStatus === PermissionStatus.DENIED;
  const canVoiceChat = useCan("voice_chat");
  const intl = useIntl();

  const muteStatuses = defineMessages({
    mute: {
      id: "mute",
      defaultMessage: "Mute"
    },
    unmute: {
      id: "unmute",
      defaultMessage: "Unmute"
    }
  });

  const description = intl.formatMessage(
    {
      id: "mute-tooltip.description",
      defaultMessage: "{muteStatus} Microphone (M)"
    },
    { muteStatus: intl.formatMessage(muteStatuses[isMicMuted ? "unmute" : "mute"]) }
  );

  return (
    <AudioPopoverButton
      initiallyVisible={initiallyVisible}
      content={<AudioPopoverContentContainer scene={scene} />}
      micButton={
        <ToolTip description={description}>
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
        </ToolTip>
      }
      onChangeMicrophoneMuted={toggleMute}
    />
  );
};

AudioPopoverButtonContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  initiallyVisible: PropTypes.bool
};
