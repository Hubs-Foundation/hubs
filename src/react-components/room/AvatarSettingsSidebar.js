import React from "react";
import PropTypes from "prop-types";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { BackButton } from "../input/BackButton";
import { AvatarSettingsContent } from "./AvatarSettingsContent";
import { FormattedMessage } from "react-intl";

export function AvatarSettingsSidebar({ className, showBackButton, onBack, onClose, ...rest }) {
  return (
    <Sidebar
      title={<FormattedMessage id="avatar-settings-sidebar.title" defaultMessage="Avatar Settings" />}
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
