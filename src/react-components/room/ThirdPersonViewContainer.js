import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { ReactComponent as ThirdPersonOnIcon } from "../icons/radio-checked.svg";
import { ReactComponent as ThirdPersonOffIcon } from "../icons/radio-check.svg";
import { ToolbarButton } from "../input/ToolbarButton";
import { FormattedMessage } from "react-intl";

export function ThirdPersonViewContainer({ scene, isThirdPerson, toggleMute }) {
  const buttonRef = useRef();

  return (
    <ToolbarButton
      ref={buttonRef}
      icon={isThirdPerson ? <ThirdPersonOnIcon /> : <ThirdPersonOffIcon />}
      //statusColor={isThirdPerson ? "green" : "red"}
      label={<FormattedMessage id="third-person-button-container.label" defaultMessage="視点切替" />}
      preset="basic"
      onClick={toggleMute}
    />
  );
}

ThirdPersonViewContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  isThirdPerson: PropTypes.bool,
  toggleThirdPerson: PropTypes.func
};
