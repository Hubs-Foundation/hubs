import React from "react";
import PropTypes from "prop-types";
import { Sidebar, BackButton, CloseButton } from "../sidebar/Sidebar";
import { AvatarSettingsContent } from "./AvatarSettingsContent";

export function AvatarSettingsSidebar({ className, showBackButton, onBack, onClose, ...rest }) {
  return (
    <Sidebar
      title="Avatar Settings"
      beforeTitle={showBackButton ? <BackButton onClick={onBack} /> : <CloseButton onClick={onClose} />}
      className={className}
    >
      <AvatarSettingsContent {...rest} />
    </Sidebar>
  );
}

AvatarSettingsSidebar.propTypes = {
  showBackButton: PropTypes.bool,
  className: PropTypes.string,
  onBack: PropTypes.func,
  onClose: PropTypes.func
};
