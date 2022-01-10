import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ToolbarButton } from "../input/ToolbarButton";
import { useMicrophone } from "./useMicrophone";
import { FormattedMessage } from "react-intl";

export function VoiceButtonContainer({ scene }) {
  const buttonRef = useRef();

  const { isMicMuted, micVolume, toggleMute, isMicEnabled } = useMicrophone(scene);

  useEffect(
    () => {
      const rect = buttonRef.current.querySelector("rect");

      if (micVolume < 0.05) {
        rect.setAttribute("height", 0);
      } else if (micVolume < 0.3) {
        rect.setAttribute("y", 8);
        rect.setAttribute("height", 4);
      } else {
        rect.setAttribute("y", 4);
        rect.setAttribute("height", 8);
      }
    },
    [micVolume, isMicMuted]
  );

  return (
    <ToolbarButton
      ref={buttonRef}
      icon={isMicMuted || !isMicEnabled ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
      label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
      preset="basic"
      onClick={toggleMute}
      statusColor={isMicMuted || !isMicEnabled ? "disabled" : "enabled"}
    />
  );
}

VoiceButtonContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
