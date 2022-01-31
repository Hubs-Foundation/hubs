import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverButton } from "./AudioPopoverButton";
import { useMicrophoneStatus } from "./useMicrophoneStatus";

export const AudioPopoverButtonContainer = ({ scene, initiallyVisible, content }) => {
  const { isMicMuted, toggleMute, isMicEnabled } = useMicrophoneStatus(scene);
  return (
    <AudioPopoverButton
      initiallyVisible={initiallyVisible}
      content={content}
      isMicrophoneMuted={isMicMuted}
      isMicrophoneEnabled={isMicEnabled}
      onChangeMicrophoneMuted={toggleMute}
    />
  );
};

AudioPopoverButtonContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  initiallyVisible: PropTypes.bool,
  content: PropTypes.element
};
