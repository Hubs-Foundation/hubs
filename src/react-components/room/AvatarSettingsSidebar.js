import React from "react";
import PropTypes from "prop-types";
import { Sidebar } from "../sidebar/Sidebar";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { IconButton } from "../input/IconButton";
import { AvatarSettingsContent } from "./AvatarSettingsContent";

export function AvatarSettingsSidebar({ className, onBack, ...rest }) {
  return (
    <Sidebar
      title="Avatar Settings"
      beforeTitle={
        <IconButton onClick={onBack}>
          <ChevronBackIcon />
          <span>Back</span>
        </IconButton>
      }
      className={className}
    >
      <AvatarSettingsContent {...rest} />
    </Sidebar>
  );
}

AvatarSettingsSidebar.propTypes = {
  className: PropTypes.string,
  onBack: PropTypes.func
};
