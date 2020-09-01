import React from "react";
import PropTypes from "prop-types";
import { Sidebar } from "../sidebar/Sidebar";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { IconButton } from "../input/IconButton";
import { AvatarSettingsContent } from "./AvatarSettingsContent";

export function AvatarSettingsSidebar({
  className,
  displayName,
  onChangeDisplayName,
  avatarPreviewCanvasRef,
  onChangeAvatar,
  onAccept,
  onBack,
  ...rest
}) {
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
      {...rest}
    >
      <AvatarSettingsContent
        displayName={displayName}
        onChangeDisplayName={onChangeDisplayName}
        avatarPreviewCanvasRef={avatarPreviewCanvasRef}
        onChangeAvatar={onChangeAvatar}
        onAccept={onAccept}
      />
    </Sidebar>
  );
}

AvatarSettingsSidebar.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string,
  onChangeDisplayName: PropTypes.func,
  avatarPreviewCanvasRef: PropTypes.object,
  onChangeAvatar: PropTypes.func,
  onAccept: PropTypes.func,
  onBack: PropTypes.func
};
