import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverButton } from "./AudioPopoverButton";
import { useMicrophoneStatus } from "./useMicrophoneStatus";
import { useVolumeMeter } from "../misc/useVolumeMeter";

export const AudioPopoverButtonContainer = ({ scene, initiallyVisible, content }) => {
  const { isMicMuted, toggleMute, isMicEnabled } = useMicrophoneStatus(scene);
  const { volume } = useVolumeMeter({
    analyser: scene.systems["hubs-systems"].audioSystem.outboundAnalyser
  });
  return (
    <AudioPopoverButton
      initiallyVisible={initiallyVisible}
      content={content}
      isMicrophoneMuted={isMicMuted}
      isMicrophoneEnabled={isMicEnabled}
      micLevel={volume}
      onChangeMicrophoneMuted={toggleMute}
    />
  );
};

AudioPopoverButtonContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  initiallyVisible: PropTypes.bool,
  content: PropTypes.element
};
