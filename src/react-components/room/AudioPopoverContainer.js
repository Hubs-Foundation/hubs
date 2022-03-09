import React from "react";
import PropTypes from "prop-types";
import { AudioPopoverContentContainer } from "./AudioPopoverContentContainer";
import { AudioPopoverButtonContainer } from "./AudioPopoverButtonContainer";

export const AudioPopoverContainer = ({ scene }) => {
  return <AudioPopoverButtonContainer scene={scene} content={<AudioPopoverContentContainer scene={scene} />} />;
};

AudioPopoverContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
