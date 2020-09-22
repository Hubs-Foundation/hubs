import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { IconButton } from "../input/IconButton";
import { AvatarSettingsContent } from "./AvatarSettingsContent";

export function AvatarSetupModal({ className, onBack, ...rest }) {
  return (
    <Modal
      title="Avatar Setup"
      beforeTitle={
        <IconButton onClick={onBack}>
          <ChevronBackIcon />
          <span>Back</span>
        </IconButton>
      }
      className={className}
    >
      <AvatarSettingsContent {...rest} />
    </Modal>
  );
}

AvatarSetupModal.propTypes = {
  className: PropTypes.string,
  onBack: PropTypes.func
};
